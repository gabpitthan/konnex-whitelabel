import AppError from "../../errors/AppError";
import QuickMessage from "../../models/QuickMessage";

interface Data {
  shortcode: string;
  message: string;
  userId: number | string;
  id?: number | string;
  companyId: number;
  geral: boolean;
  mediaPath?: string | null;
  visao: boolean;

}

const UpdateService = async (data: Data): Promise<QuickMessage> => {
  const { id, shortcode, message, userId, companyId, geral, mediaPath, visao } = data;

  // Escopado pelo tenant: `findByPk(id)` alcançava o registro de outra empresa.
  // A checagem de permissão logo abaixo é sobre o usuário dentro da empresa —
  // não substitui o escopo, porque só roda depois de o registro ser encontrado.
  const record = await QuickMessage.findOne({ where: { id, companyId } });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  if (!record.geral && record.visao && record.userId !== userId) {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await record.update({
    shortcode,
    message,
    // userId,
    geral,
    mediaPath,
    visao
  });

  return record;
};

export default UpdateService;
