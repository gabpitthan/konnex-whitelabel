import { hasWbot, initWASocket, removeWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import {
  runSessionLifecycleExclusive,
  runSessionStartSingleFlight
} from "../../libs/sessionStartRegistry";
import {
  assertApplicationRunning,
  isApplicationDraining
} from "../../libs/shutdownState";
import { whatsappLeaseManager } from "../../libs/whatsappLeaseRuntime";
import {
  claimWhatsappSessionFence,
  updateWhatsappLifecycleWithFence,
  WhatsappFenceLostError
} from "../../libs/whatsappFence";
import {
  WhatsAppLease,
  WhatsAppLeaseLostError,
  WhatsAppLeaseUnavailableError
} from "../../libs/whatsappLease";

const scheduleOwnershipRecovery = (
  whatsapp: Whatsapp,
  companyId: number,
  attempt = 1
): void => {
  if (attempt > 3 || isApplicationDraining()) return;
  const timer = setTimeout(async () => {
    if (isApplicationDraining()) return;
    try {
      await StartWhatsAppSession(whatsapp, companyId);
    } catch (error) {
      logger.warn({
        event: "whatsapp_session_ownership_recovery_failed",
        whatsappId: whatsapp.id,
        companyId,
        attempt,
        errorClass: error instanceof Error ? error.name : "UnknownError"
      });
      scheduleOwnershipRecovery(whatsapp, companyId, attempt + 1);
    }
  }, 31_000 + attempt * 5_000 + (whatsapp.id % 1_000));
  timer.unref();
};

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  if (isApplicationDraining()) {
    throw new AppError("APP_SHUTTING_DOWN", 503);
  }

  return runSessionStartSingleFlight(
    { whatsappId: whatsapp.id, companyId },
    () => runSessionLifecycleExclusive(
      { whatsappId: whatsapp.id, companyId },
      async () => {
      let lease: WhatsAppLease;
      let wbot: Awaited<ReturnType<typeof initWASocket>>;
      if (isApplicationDraining()) {
        throw new AppError("APP_SHUTTING_DOWN", 503);
      }
      const ownedWhatsapp = await Whatsapp.findOne({
        where: { id: whatsapp.id, companyId, channel: "whatsapp" }
      });

      if (!ownedWhatsapp) {
        throw new AppError("ERR_WAPP_NOT_FOUND", 404);
      }

      if (hasWbot(ownedWhatsapp.id)) return;

      const owner = { whatsappId: ownedWhatsapp.id, companyId };

      try {
        lease = await whatsappLeaseManager.acquire(owner);
        lease.startHeartbeat(() => {
          if (wbot) {
            (wbot.ev as any).removeAllListeners();
            wbot.ws.close();
            void removeWbot(ownedWhatsapp.id, false, wbot);
          }
          scheduleOwnershipRecovery(ownedWhatsapp, companyId);
        });
        await lease.assertOwned();
        await claimWhatsappSessionFence(owner, lease.fence);
        await lease.assertOwned();
        const openingWhatsapp = await updateWhatsappLifecycleWithFence(
          owner,
          lease.fence,
          { status: "OPENING" }
        );
        assertApplicationRunning();

        const io = getIO();
        io.of(String(companyId)).emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: openingWhatsapp
        });

        wbot = await initWASocket(openingWhatsapp, lease, created => {
          wbot = created;
        });
        assertApplicationRunning();

        if (wbot.id) {
          wbotMessageListener(wbot, companyId);
          wbotMonitor(wbot, ownedWhatsapp, companyId);
        }
      } catch (err) {
        if (lease?.isOwned()) {
          try {
            await updateWhatsappLifecycleWithFence(owner, lease.fence, {
              status: "DISCONNECTED",
              qrcode: ""
            });
          } catch (cleanupError) {
            logger.error({
              event: "whatsapp_session_start_cleanup_failed",
              whatsappId: ownedWhatsapp.id,
              companyId,
              errorClass:
                cleanupError instanceof Error
                  ? cleanupError.name
                  : "UnknownError"
            });
          } finally {
            if (wbot) {
              await removeWbot(ownedWhatsapp.id, false, wbot);
            } else {
              await lease.release().catch(() => undefined);
            }
          }
        }
        Sentry.captureException(
          new Error("WHATSAPP_SESSION_START_FAILED_SANITIZED")
        );
        logger.error({
          event: "whatsapp_session_start_failed",
          whatsappId: ownedWhatsapp.id,
          companyId,
          errorClass: err instanceof Error ? err.name : "UnknownError"
        });
        if (
          err instanceof WhatsAppLeaseUnavailableError ||
          err instanceof WhatsAppLeaseLostError ||
          err instanceof WhatsappFenceLostError
        ) {
          throw new AppError(err.message, 503);
        }
        throw err;
      }
      }
    )
  );
};
