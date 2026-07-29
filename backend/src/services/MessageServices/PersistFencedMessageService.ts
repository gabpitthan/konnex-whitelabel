import { Transaction } from "sequelize";

import Ticket from "../../models/Ticket";
import {
  WhatsappSessionOwner,
  withWhatsappSessionFenceTransaction
} from "../../libs/whatsappFence";
import CreateMessageService, {
  MessageData
} from "./CreateMessageService";
import Message from "../../models/Message";

interface Request {
  owner: WhatsappSessionOwner;
  fence: string;
  ticket: Ticket;
  messageData: MessageData;
  ticketValues: Partial<Pick<Ticket, "lastMessage" | "status">>;
}

const PersistFencedMessageService = async ({
  owner,
  fence,
  ticket,
  messageData,
  ticketValues
}: Request): Promise<Message> =>
  withWhatsappSessionFenceTransaction(
    owner,
    fence,
    async (transaction: Transaction) => {
      const currentTicket = await Ticket.findOne({
        where: {
          id: ticket.id,
          companyId: owner.companyId,
          whatsappId: owner.whatsappId
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!currentTicket || messageData.ticketId !== currentTicket.id) {
        throw new Error("ERR_MESSAGE_TICKET_INVALID_OWNER");
      }

      await currentTicket.update(ticketValues, { transaction });

      const message = await CreateMessageService({
        messageData,
        companyId: owner.companyId,
        transaction
      });

      Object.assign(ticket, currentTicket.get({ plain: true }));
      return message;
    }
  );

export default PersistFencedMessageService;
