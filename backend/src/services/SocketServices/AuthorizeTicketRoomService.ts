import Ticket from "../../models/Ticket";

interface Request {
  ticketId: number;
  companyId: number;
}

interface AuthorizedTicket {
  id: number;
  companyId: number;
}

const AuthorizeTicketRoomService = async ({
  ticketId,
  companyId
}: Request): Promise<AuthorizedTicket | null> => {
  const ticket = await Ticket.findOne({
    where: { id: ticketId, companyId },
    attributes: ["id", "companyId"]
  });

  if (!ticket) return null;

  return {
    id: ticket.id,
    companyId: ticket.companyId
  };
};

export default AuthorizeTicketRoomService;
