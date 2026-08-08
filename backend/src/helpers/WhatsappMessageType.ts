import { proto } from "@whiskeysockets/baileys";
import { getContentType } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";

import logger from "../utils/logger";

/**
 * Classificação de mensagem do WhatsApp — funções puras.
 *
 * Viviam dentro de `services/WbotServices/wbotMessageListener.ts`, um arquivo
 * de 5.400 linhas, e eram importadas por `libs/wbot.ts`. Essa importação punha
 * a camada de infraestrutura dependendo da camada de serviço e era uma das seis
 * arestas que fechavam o ciclo de 133 arquivos (HEALTH-003).
 *
 * Não têm estado, não tocam banco, não dependem de sessão: só olham a mensagem
 * e dizem que tipo ela é e se é tratável. Pertencem a `helpers/`.
 */
const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  const msgType = getContentType(msg.message);
  if (msg.message?.extendedTextMessage && msg.message?.extendedTextMessage?.contextInfo && msg.message?.extendedTextMessage?.contextInfo?.externalAdReply) {
    return 'adMetaPreview'; // Adicionado para tratar mensagens de anúncios;
  }
  if (msg.message?.viewOnceMessageV2) {
    return "viewOnceMessageV2";
  }
  return msgType;
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return;
    }

    const ifType =
      msgType === "conversation" ||
      msgType === "extendedTextMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "ptvMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "interactiveMessage" ||
      msgType === "pollCreationMessageV3" ||
      msgType === "viewOnceMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "viewOnceMessageV2" ||
      msgType === "editedMessage" ||
      msgType === "advertisingMessage" ||
      msgType === "highlyStructuredMessage" ||
      msgType === "eventMessage" ||
      msgType === "adMetaPreview"; // Adicionado para tratar mensagens de anúncios

    if (!ifType) {
      logger.warn({
        event: "whatsapp_invalid_message_type",
        messageType: msgType || "unknown"
      });
      Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
    }

    return !!ifType;
  } catch (error) {
    Sentry.captureException(
      new Error("WHATSAPP_MESSAGE_VALIDATION_FAILED_SANITIZED")
    );
  }
};

export { getTypeMessage, isValidMsg };
