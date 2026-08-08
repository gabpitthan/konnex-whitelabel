import { Request } from "express";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import CheckContactNumber from "../WbotServices/CheckNumber";

/**
 * Envio de mensagem por fluxo (FlowBuilder e webhooks).
 *
 * Morava em `controllers/MessageController.ts` e era importado por
 * `ActionsWebhookService` e `DispatchWebHookService` — dois serviços
 * dependendo de um controller. Essas duas importações estavam entre as **nove**
 * que prendiam 133 arquivos do backend num único ciclo mútuo, medido pelo grafo
 * de dependências em 2026-08-08 (ver ISSUES HEALTH-003).
 *
 * A função nunca foi de controller: não lê `req.params`, não responde nada.
 * Recebe `req` apenas para alcançar as filas em `req.app.get("queues")` —
 * acoplamento que fica registrado como próximo passo, e que não foi mexido
 * aqui para a movimentação não mudar comportamento nenhum.
 */
export const sendMessageFlow = async (
  whatsappId: number,
  body: any,
  req: Request,
  files?: Express.Multer.File[]
): Promise<string> => {
  const messageData = body;
  const medias = files;

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    if (!whatsapp) {
      throw new AppError("Não foi possível realizar a operação", 404);
    }

    if (messageData.number === undefined) {
      throw new AppError("O número é obrigatório", 400);
    }

    const numberToTest = messageData.number;
    const body = messageData.body;
    const companyId = messageData.companyId;

    const CheckValidNumber = await CheckContactNumber(numberToTest, companyId);
    const number = CheckValidNumber.replace(/\D/g, "");

    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await req.app.get("queues").messageQueue.add(
            "SendMessage",
            {
              whatsappId,
              data: {
                number,
                body: media.originalname,
                mediaPath: media.path,
              },
            },
            { removeOnComplete: true, attempts: 3 }
          );
        })
      );
    } else {
      await req.app.get("queues").messageQueue.add(
        "SendMessage",
        {
          whatsappId,
          data: {
            number,
            body,
          },
        },
        { removeOnComplete: false, attempts: 3 }
      );
    }

    return "Mensagem enviada";
  } catch (err) {
    console.error("Erro ao enviar mensagem no fluxo:", err);
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError("Não foi possível enviar a mensagem, tente novamente em alguns instantes", 500);
  }
};
