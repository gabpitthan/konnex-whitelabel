import { hasWbot, initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import { runSessionStartSingleFlight } from "../../libs/sessionStartRegistry";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  return runSessionStartSingleFlight(
    { whatsappId: whatsapp.id, companyId },
    async () => {
      const ownedWhatsapp = await Whatsapp.findOne({
        where: { id: whatsapp.id, companyId, channel: "whatsapp" }
      });

      if (!ownedWhatsapp) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }

      if (hasWbot(ownedWhatsapp.id)) return;

      await ownedWhatsapp.update({ status: "OPENING" });

      const io = getIO();
      io.of(String(companyId)).emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: ownedWhatsapp
      });

      try {
        const wbot = await initWASocket(ownedWhatsapp);

        if (wbot.id) {
          wbotMessageListener(wbot, companyId);
          wbotMonitor(wbot, ownedWhatsapp, companyId);
        }
      } catch (err) {
        await ownedWhatsapp.update({ status: "DISCONNECTED", qrcode: "" });
        Sentry.captureException(err);
        logger.error({
          event: "whatsapp_session_start_failed",
          whatsappId: ownedWhatsapp.id,
          companyId,
          errorClass: err instanceof Error ? err.name : "UnknownError"
        });
        throw err;
      }
    }
  );
};
