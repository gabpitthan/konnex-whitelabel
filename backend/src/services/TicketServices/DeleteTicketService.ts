import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import CreateLogTicketService from "./CreateLogTicketService";

/**
 * O `companyId` chegava aqui e não era usado: a busca era só por `id`, então
 * qualquer usuário autenticado apagava o ticket de outra empresa — junto com o
 * histórico de mensagens, por cascata. Comprovado em 2026-08-07 com duas
 * empresas reais: a empresa B recebeu `{"message":"ticket deleted"}` ao apagar
 * o ticket da empresa A.
 *
 * Exclusão é irreversível e cascateia. O filtro por tenant vai na consulta, não
 * numa verificação separada que alguém pode comentar — havia exatamente isso no
 * controller, um `ShowTicketService(ticketId, companyId)` comentado.
 */
const DeleteTicketService = async (
  id: string,
  userId: string,
  companyId: number
): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: { id, companyId }
  });

  if (!ticket) {
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  await ticket.destroy();

  return ticket;
};

export default DeleteTicketService;
