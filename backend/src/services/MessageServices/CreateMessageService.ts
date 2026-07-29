import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import Message from "../../models/Message";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import sequelize from "../../database";
import { Transaction } from "sequelize";

export interface MessageData {
  wid: string;
  ticketId: number;
  body: string;
  contactId?: number;
  fromMe?: boolean;
  read?: boolean;
  mediaType?: string;
  mediaUrl?: string;
  ack?: number;
  queueId?: number;
  channel?: string;
  ticketTrakingId?: number;
  isPrivate?: boolean;
  ticketImported?: any;
  isForwarded?: boolean;
}
interface Request {
  messageData: MessageData;
  companyId: number;
  transaction?: Transaction;
}

const CreateMessageService = async ({
  messageData,
  companyId,
  transaction: externalTransaction
}: Request): Promise<Message> => {
  if (!Number.isInteger(companyId) || companyId <= 0 || !messageData.wid) {
    throw new Error("ERR_CREATING_MESSAGE_INVALID_OWNER");
  }

  const persistMessage = async (transaction: Transaction): Promise<Message> => {
    await Message.upsert(
      { ...messageData, companyId },
      { transaction }
    );

    const persistedMessage = await Message.findOne({
      where: {
        wid: messageData.wid,
        companyId
      },
      include: [
        "contact",
        {
          model: Ticket,
          as: "ticket",
          include: [
            {
              model: Contact,
              attributes: [
                "id",
                "name",
                "number",
                "email",
                "profilePicUrl",
                "acceptAudioMessage",
                "active",
                "urlPicture",
                "companyId"
              ],
              include: ["extraInfo", "tags"]
            },
            {
              model: Queue,
              attributes: ["id", "name", "color"]
            },
            {
              model: Whatsapp,
              attributes: ["id", "name", "groupAsTicket"]
            },
            {
              model: User,
              attributes: ["id", "name"]
            },
            {
              model: Tag,
              as: "tags",
              attributes: ["id", "name", "color"]
            }
          ]
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        }
      ],
      transaction
    });

    if (!persistedMessage) {
      throw new Error("ERR_CREATING_MESSAGE");
    }

    if (
      persistedMessage.ticket.queueId !== null &&
      persistedMessage.queueId === null
    ) {
      await persistedMessage.update(
        { queueId: persistedMessage.ticket.queueId },
        { transaction }
      );
    }

    if (persistedMessage.isPrivate) {
      await persistedMessage.update(
        { wid: `PVT${persistedMessage.id}` },
        { transaction }
      );
    }

    return persistedMessage;
  };

  const emitMessage = (message: Message): void => {
    if (messageData?.ticketImported) return;

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-appMessage`, {
      action: "create",
      message,
      ticket: message.ticket,
      contact: message.ticket.contact
    });
  };

  if (externalTransaction) {
    const message = await persistMessage(externalTransaction);
    externalTransaction.afterCommit(() => emitMessage(message));
    return message;
  }

  const message = await sequelize.transaction(persistMessage);
  emitMessage(message);

  return message;
};

export default CreateMessageService;
