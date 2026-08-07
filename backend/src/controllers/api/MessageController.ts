import { Request, Response } from "express";
import GetMessageRangeService from "../../services/MessageServices/GetMessageRangeService";

type IndexQuery = {
  startDate: string;
  lastDate: string;
};

/**
 * O tenant vem da credencial de API autenticada, nunca da query. Ver a
 * justificativa em `ContactController.ts` deste mesmo diretório: aceitar
 * `companyId` do cliente transformava o token global em leitura irrestrita do
 * histórico de mensagens de qualquer empresa.
 */
export const show = async (req: Request, res: Response): Promise<Response> => {
  const { startDate, lastDate } = req.query as IndexQuery;
  const { companyId } = req.apiConnection;

  const messages = await GetMessageRangeService({
    companyId,
    startDate,
    lastDate
  });

  return res.status(200).json(messages);
};
