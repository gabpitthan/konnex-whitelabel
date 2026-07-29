import { Transaction } from "sequelize";

import {
  WhatsappSessionOwner,
  withWhatsappSessionFenceTransaction
} from "../../libs/whatsappFence";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import UpsertWhatsappContactService, {
  WhatsappContactData
} from "../ContactServices/UpsertWhatsappContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";

interface Request {
  owner: WhatsappSessionOwner;
  fence: string;
  contactData: WhatsappContactData;
  groupContactData?: WhatsappContactData;
  whatsapp: Whatsapp;
  fromMe: boolean;
  queueId?: number;
  userId?: number;
  channel: string;
  isImported: boolean;
  isForward?: boolean;
  settings: any;
  isTransfered?: boolean;
  isCampaign?: boolean;
}

interface Response {
  contact: Contact;
  groupContact?: Contact;
  ticket: Ticket;
  previousTicket: Ticket | null;
}

const FindOrCreateFencedWhatsappContextService = async ({
  owner,
  fence,
  contactData,
  groupContactData,
  whatsapp,
  fromMe,
  queueId = null,
  userId = null,
  channel,
  isImported,
  isForward = false,
  settings,
  isTransfered,
  isCampaign = false
}: Request): Promise<Response> =>
  withWhatsappSessionFenceTransaction(
    owner,
    fence,
    async (transaction: Transaction) => {
      if (
        whatsapp.id !== owner.whatsappId ||
        whatsapp.companyId !== owner.companyId ||
        contactData.companyId !== owner.companyId ||
        contactData.whatsappId !== owner.whatsappId ||
        (groupContactData &&
          (groupContactData.companyId !== owner.companyId ||
            groupContactData.whatsappId !== owner.whatsappId))
      ) {
        throw new Error("ERR_WHATSAPP_CONTEXT_INVALID_OWNER");
      }

      const contact = await UpsertWhatsappContactService({
        contactData,
        transaction
      });
      const groupContact = groupContactData
        ? await UpsertWhatsappContactService({
            contactData: groupContactData,
            transaction
          })
        : undefined;
      const ticketContactId = groupContact?.id || contact.id;
      const previousTicket = await Ticket.findOne({
        where: {
          contactId: ticketContactId,
          companyId: owner.companyId,
          whatsappId: owner.whatsappId
        },
        order: [["id", "DESC"]],
        transaction
      });

      const ticket = await FindOrCreateTicketService(
        contact,
        whatsapp,
        fromMe ? 0 : 1,
        owner.companyId,
        queueId,
        userId,
        groupContact,
        channel,
        isImported,
        isForward,
        settings,
        isTransfered,
        isCampaign,
        {
          transaction,
          incrementUnread: !fromMe
        }
      );

      return {
        contact,
        groupContact,
        ticket,
        previousTicket
      };
    }
  );

export default FindOrCreateFencedWhatsappContextService;
