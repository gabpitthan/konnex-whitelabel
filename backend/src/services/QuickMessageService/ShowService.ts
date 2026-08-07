import QuickMessage from "../../models/QuickMessage";
import AppError from "../../errors/AppError";

/**
 * Consulta escopada pelo tenant. Sem o `companyId` no `where`, `findByPk(id)`
 * devolvia o registro de qualquer empresa a qualquer usuário autenticado —
 * comprovado em 2026-08-07 com duas empresas reais.
 */
const ShowService = async (
  id: string | number,
  companyId: number
): Promise<QuickMessage> => {
  const record = await QuickMessage.findOne({ where: { id, companyId } });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  return record;
};

export default ShowService;
