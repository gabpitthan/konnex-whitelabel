import ListWhatsAppsService from "../WhatsappService/ListWhatsAppsService";
import { StartWhatsAppSession } from "./StartWhatsAppSession";
import * as Sentry from "@sentry/node";
import logger from "../../utils/logger";
import { isApplicationDraining } from "../../libs/shutdownState";

const scheduleLeaseRetry = (
  whatsapp: any,
  companyId: number,
  attempt = 1
): void => {
  if (attempt > 3 || isApplicationDraining()) return;
  const delayMs = 31_000 + attempt * 5_000 + (whatsapp.id % 1_000);
  const timer = setTimeout(async () => {
    if (isApplicationDraining()) return;
    try {
      await StartWhatsAppSession(whatsapp, companyId);
      logger.info({
        event: "whatsapp_session_lease_retry_succeeded",
        whatsappId: whatsapp.id,
        companyId,
        attempt
      });
    } catch (error) {
      logger.warn({
        event: "whatsapp_session_lease_retry_failed",
        whatsappId: whatsapp.id,
        companyId,
        attempt,
        errorClass: error instanceof Error ? error.name : "UnknownError"
      });
      scheduleLeaseRetry(whatsapp, companyId, attempt + 1);
    }
  }, delayMs);
  timer.unref();
};

export const StartAllWhatsAppsSessions = async (
  companyId: number
): Promise<void> => {
  try {
    const whatsapps = await ListWhatsAppsService({ companyId });
    if (whatsapps.length > 0) {
      const promises = whatsapps.map(async (whatsapp) => {
        if (whatsapp.channel === "whatsapp" && whatsapp.status !== "DISCONNECTED") {
          return StartWhatsAppSession(whatsapp, companyId);
        }
      });
      const results = await Promise.allSettled(promises);
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          Sentry.captureException(result.reason);
          logger.error({
            event: "whatsapp_session_boot_failed",
            whatsappId: whatsapps[index]?.id,
            companyId,
            errorClass:
              result.reason instanceof Error
                ? result.reason.name
                : "UnknownError"
          });
          if (
            result.reason instanceof Error &&
            result.reason.message === "WHATSAPP_LEASE_UNAVAILABLE"
          ) {
            scheduleLeaseRetry(whatsapps[index], companyId);
          }
        }
      });
    }

    // fechar os tickets automaticamente
    // if (whatsapps.length > 0) {
    //   whatsapps.forEach(whatsapp => {
    //     const timeClosed = whatsapp.expiresTicket ? (((whatsapp.expiresTicket * 60) * 60) * 1000) : 500000;
    //     setInterval(() => {
    //       ClosedAllOpenTickets();
    //     }, timeClosed);
    //   });
    // }

  } catch (e) {
    Sentry.captureException(e);
  }
};
