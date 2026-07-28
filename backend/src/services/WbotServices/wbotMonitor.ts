import {
  WASocket,
  BinaryNode,
  Contact as BContact,
  isJidBroadcast,
  isJidStatusBroadcast,
  isJidUser,
} from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import path from "path";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import logger from "../../utils/logger";
import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import CompaniesSettings from "../../models/CompaniesSettings";
import { verifyMessage } from "./wbotMessageListener";

let i = 0;

setInterval(() => {
  i = 0;
}, 5000);

type Session = WASocket & {
  id?: number;
};

interface IContact {
  contacts: BContact[];
}

const wbotMonitor = async (
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  try {
    wbot.ws.on("CB:call", async (node: BinaryNode) => {
      const content = node.content[0] as any;

      await new Promise((r) => setTimeout(r, i * 650));
      i++;

      if (content.tag === "terminate" && !node.attrs.from.includes("@call")) {
        const settings = await CompaniesSettings.findOne({
          where: { companyId },
        });

        if (settings?.acceptCallWhatsapp === "enabled") {
          const sentMessage = await wbot.sendMessage(node.attrs.from, {
            text: `\u200e ${settings.AcceptCallWhatsappMessage}`,
          });
          const number = node.attrs.from.split(":")[0].replace(/\D/g, "");

          const contact = await Contact.findOne({
            where: { companyId, number },
          });

          if (!contact) return;

          const [ticket] = await Ticket.findOrCreate({
            where: {
              contactId: contact.id,
              whatsappId: wbot.id,
              status: ["open", "pending", "nps", "lgpd"],
              companyId,
            },
            defaults: {
              companyId,
              contactId: contact.id,
              whatsappId: wbot.id,
              isGroup: contact.isGroup,
              status: "pending",
            },
          });

          if (!ticket) return;

          await verifyMessage(sentMessage, ticket, contact);

          const date = new Date();
          const hours = date.getHours();
          const minutes = date.getMinutes();

          const body = `Chamada de voz/vídeo perdida às ${hours}:${minutes}`;
          const messageData = {
            wid: content.attrs["call-id"],
            ticketId: ticket.id,
            contactId: contact.id,
            body,
            fromMe: false,
            mediaType: "call_log",
            read: true,
            quotedMsgId: null,
            ack: 1,
          };

          await ticket.update({
            lastMessage: body,
          });

          if (ticket.status === "closed") {
            await ticket.update({
              status: "pending",
            });
          }

          return CreateMessageService({ messageData, companyId });
        }
      }
    });

    function cleanStringForJSON(str: string | undefined): string {
      if (!str) return "";
      // Remove control characters, quotes, backslashes, and invalid Unicode
      return str
        .replace(/[\x00-\x1F"\\']/g, "")
        .replace(/[\uD800-\uDFFF]/g, "") // Remove unpaired surrogates
        .replace(/\uFFFD/g, ""); // Remove replacement characters
    }

    wbot.ev.on("contacts.upsert", async (contacts: BContact[]) => {
      const filteredContacts: BContact[] = [];

      try {
        // Await the Promise.all to ensure all contacts are processed
        await Promise.all(
          contacts.map(async (contact) => {
            if (
              !isJidBroadcast(contact.id) &&
              !isJidStatusBroadcast(contact.id) &&
              isJidUser(contact.id)
            ) {
              const contactArray: BContact = {
                id: contact.id,
                name: contact.name
                  ? cleanStringForJSON(contact.name)
                  : contact.id.split("@")[0].split(":")[0],
              };
              filteredContacts.push(contactArray);
            }
          })
        );

        // Validate that filteredContacts is serializable
        try {
          JSON.stringify(filteredContacts);
        } catch (err) {
          logger.error(`Failed to serialize filteredContacts: ${err.message}`);
          Sentry.captureException(err);
          return;
        }

        // Write to file
        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
        const companyFolder = path.join(publicFolder, `company${companyId}`);
        const contactJson = path.join(companyFolder, "contactJson.txt");

        try {
          if (!fs.existsSync(companyFolder)) {
            fs.mkdirSync(companyFolder, { recursive: true });
            fs.chmodSync(companyFolder, 0o777);
          }
          if (fs.existsSync(contactJson)) {
            await fs.promises.unlink(contactJson);
          }
          await fs.promises.writeFile(contactJson, JSON.stringify(filteredContacts, null, 2));
        } catch (err) {
          logger.error(`Failed to write contactJson.txt: ${err.message}`);
          Sentry.captureException(err);
        }

        // Pass filteredContacts as an array to createOrUpdateBaileysService
        try {
          await createOrUpdateBaileysService({
            whatsappId: whatsapp.id,
            contacts: filteredContacts,
          });
        } catch (err) {
          logger.error(`Error in createOrUpdateBaileysService: ${err.message}`);
          Sentry.captureException(err);
          console.log("Filtered Contacts:", filteredContacts); // Debug output
        }
      } catch (err) {
        logger.error(`Error in contacts.upsert: ${err.message}`);
        Sentry.captureException(err);
      }
    });
  } catch (err) {
    logger.error(`Error in wbotMonitor: ${err.message}`);
    Sentry.captureException(err);
  }
};

export default wbotMonitor;