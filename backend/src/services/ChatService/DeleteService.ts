import Chat from "../../models/Chat";
import AppError from "../../errors/AppError";

/**
 * Consulta escopada pelo tenant. Sem `companyId` no `where`, qualquer usuario
 * autenticado alcancava o registro de outra empresa por ID — comprovado em
 * 2026-08-07 com duas empresas reais (leitura, alteracao e exclusao).
 */
const DeleteService = async (id: string,
  companyId: number): Promise<void> => {
  const record = await Chat.findOne({ where: { id, companyId } });

  if (!record) {
    throw new AppError("ERR_NO_CHAT_FOUND", 404);
  }

  await record.destroy();
};

export default DeleteService;
