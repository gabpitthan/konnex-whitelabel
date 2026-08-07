import 'dotenv/config';
import validarSegredos from "./config/requiredSecrets";

// Antes de qualquer import que leia configuração: uma instalação com segredo
// de exemplo não deve subir. Ver config/requiredSecrets.ts.
validarSegredos();

import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import cron from "node-cron";
import { closeIO, initIO } from "./libs/socket";
import logger from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import Company from "./models/Company";
import BullQueue from './libs/queue';

import { closeApplicationQueues, startQueueProcess } from "./queues";
import {
  beginApplicationDrain,
  completeApplicationShutdown
} from "./libs/shutdownState";
import { shutdownWbots } from "./libs/wbot";
import cacheLayer from "./libs/cache";
// import { ScheduledMessagesJob, ScheduleMessagesGenerateJob, ScheduleMessagesEnvioJob, ScheduleMessagesEnvioForaHorarioJob } from "./wbotScheduledMessages";

const server = app.listen(process.env.PORT, async () => {
  try {
    await cacheLayer.waitUntilReady();
  } catch (error) {
    logger.error({
      event: "redis_not_ready_at_boot",
      errorClass: error instanceof Error ? error.name : "UnknownError"
    });
  }
  const companies = await Company.findAll({
    where: { status: true },
    attributes: ["id"]
  });

  const allPromises: any[] = [];
  companies.map(async c => {
    const promise = StartAllWhatsAppsSessions(c.id);
    allPromises.push(promise);
  });

  Promise.all(allPromises).then(async () => {

    await startQueueProcess();
  });

  if (process.env.REDIS_URI_ACK && process.env.REDIS_URI_ACK !== '') {
    BullQueue.process();
  }

  logger.info(`Server started on port: ${process.env.PORT}`);
});

process.on("uncaughtException", err => {
  console.error(`${new Date().toUTCString()} uncaughtException:`, err.message);
  console.error(err.stack);
  
});

process.on("unhandledRejection", (reason, p) => {
  console.error(
    `${new Date().toUTCString()} unhandledRejection:`,
    reason,
    p
  );  
});

// cron.schedule("* * * * * *", async () => {

//   try {
//     // console.log("Running a job at 5 minutes at America/Sao_Paulo timezone")
//     await ScheduledMessagesJob();
//     await ScheduleMessagesGenerateJob();
//   }
//   catch (error) {
//     logger.error(error);
//   }

// });

// cron.schedule("* * * * * *", async () => {

//   try {
//     // console.log("Running a job at 01:00 at America/Sao_Paulo timezone")
//     console.log("Running a job at 2 minutes at America/Sao_Paulo timezone")
//     await ScheduleMessagesEnvioJob();
//     await ScheduleMessagesEnvioForaHorarioJob()
//   }
//   catch (error) {
//     logger.error(error);
//   }

// });

initIO(server);
gracefulShutdown(server, {
  signals: "SIGINT SIGTERM",
  timeout: 30000,
  forceExit: true,
  preShutdown: async signal => {
    const started = beginApplicationDrain();
    logger.info({
      event: "application_shutdown_started",
      signal,
      firstRequest: started
    });
  },
  onShutdown: async signal => {
    const startedAt = Date.now();
    await shutdownWbots();
    await closeIO();
    await closeApplicationQueues();
    await BullQueue.close();
    completeApplicationShutdown();
    logger.info({
      event: "application_shutdown_resources_closed",
      signal,
      durationMs: Date.now() - startedAt
    });
  },
  finally: () => {
    logger.info({ event: "application_shutdown_completed" });
  }
});
