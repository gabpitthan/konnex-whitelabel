import * as Sentry from "@sentry/node";
import makeWASocket, {
  AuthenticationState,
  Browsers,
  DisconnectReason,
  WAMessage,
  WAMessageKey,
  WASocket,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { FindOptions } from "sequelize/types";
import Whatsapp from "../models/Whatsapp";
import logger from "../utils/logger";
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger";
import { useMultiFileAuthState } from "../helpers/useMultiFileAuthState";
import { Boom } from "@hapi/boom";
import AppError from "../errors/AppError";
import { getIO } from "./socket";
import {
  iniciarSessaoWhatsapp,
  importarMensagensWhatsapp
} from "./sessionHooks";
import { add } from "date-fns";
import moment from "moment";
import { getTypeMessage, isValidMsg } from "../helpers/WhatsappMessageType";
import { addLogs } from "../helpers/addLogs";
import NodeCache from 'node-cache';
import { Store } from "./store";
import {
  activateSessionGeneration,
  invalidateSessionGeneration,
  isCurrentSessionGeneration
} from "./sessionStartRegistry";
import {
  assertApplicationRunning,
  isApplicationDraining
} from "./shutdownState";
import { WhatsAppLease } from "./whatsappLease";
import { updateWhatsappLifecycleWithFence } from "./whatsappFence";

const msgRetryCounterCache = new NodeCache({
  stdTTL: 600,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});
const msgCache = new NodeCache({
  stdTTL: 60,
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false
});

const loggerBaileys = MAIN_LOGGER.child({});
// Upstream warns that even default error/debug payloads may include JIDs,
// message metadata or auth-adjacent details. Application logs below emit only
// sanitized lifecycle fields.
loggerBaileys.level = "silent";

type Session = WASocket & {
  id?: number;
  companyId?: number;
  store?: Store;
  lease?: WhatsAppLease;
};

const sessions: Session[] = [];

const retriesQrCodeMap = new Map<number, number>();
const reconnectAttemptsMap = new Map<number, number>();
const reconnectTimersMap = new Map<number, NodeJS.Timeout>();
let baileysVersionPromise: ReturnType<typeof fetchLatestBaileysVersion> | null =
  null;

const getBaileysVersion = (): ReturnType<typeof fetchLatestBaileysVersion> => {
  if (!baileysVersionPromise) {
    baileysVersionPromise = fetchLatestBaileysVersion().catch(error => {
      baileysVersionPromise = null;
      throw error;
    });
  }
  return baileysVersionPromise;
};

export default function msg() {
  return {
    get: (key: WAMessageKey) => {
      const { id } = key;
      if (!id) return;
      let data = msgCache.get(id);
      if (data) {
        try {
          let msg = JSON.parse(data as string);
          return msg?.message;
        } catch (error) {
          logger.error(error);
        }
      }
    },
    save: (msg: WAMessage) => {
      const { id } = msg.key;
      const msgtxt = JSON.stringify(msg);
      try {
        msgCache.set(id as string, msgtxt);
      } catch (error) {
        logger.error(error);
      }
    }
  }
}

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }
  return sessions[sessionIndex];
};

export const hasWbot = (whatsappId: number): boolean =>
  sessions.some(session => session.id === whatsappId);

export const restartWbot = async (
  companyId: number,
  session?: any
): Promise<void> => {
  try {
    const options: FindOptions = {
      where: {
        companyId,
      },
      attributes: ["id"],
    };

    const whatsapp = await Whatsapp.findAll(options);

    whatsapp.map(async c => {
      const sessionIndex = sessions.findIndex(s => s.id === c.id);
      if (sessionIndex !== -1) {
        sessions[sessionIndex].ws.close(); // Remove the `undefined` argument
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

export const removeWbot = async (
  whatsappId: number,
  isLogout = true,
  expectedSession?: Session,
  releaseLease = true
): Promise<WhatsAppLease | undefined> => {
  try {
    const sessionIndex = sessions.findIndex(
      session =>
        session.id === whatsappId &&
        (!expectedSession || session === expectedSession)
    );
    if (sessionIndex !== -1) {
      const session = sessions[sessionIndex];
      if (session.companyId) {
        invalidateSessionGeneration({
          whatsappId,
          companyId: session.companyId
        });
      }
      if (isLogout) {
        await session.logout();
        session.ws.close();
      }

      const currentIndex = sessions.indexOf(session);
      if (currentIndex !== -1) {
        sessions.splice(currentIndex, 1);
      }
      if (session.lease && releaseLease) {
        await session.lease.release().catch(() => undefined);
      }
      return session.lease;
    }
  } catch (err) {
    logger.error(err);
  }
  return undefined;
};

export const shutdownWbots = async (): Promise<void> => {
  reconnectTimersMap.forEach(timer => clearTimeout(timer));
  reconnectTimersMap.clear();
  reconnectAttemptsMap.clear();
  retriesQrCodeMap.clear();

  const activeSessions = sessions.splice(0, sessions.length);
  const closeResults = await Promise.allSettled(
    activeSessions.map(async session => {
      if (session.id && session.companyId) {
        invalidateSessionGeneration({
          whatsappId: session.id,
          companyId: session.companyId
        });
      }
      session.ev.removeAllListeners("messaging-history.set");
      session.ev.removeAllListeners("connection.update");
      session.ev.removeAllListeners("creds.update");
      session.ws.close();
      await session.lease?.release().catch(() => undefined);
    })
  );
  const failedCloses = closeResults.filter(
    result => result.status === "rejected"
  );
  msgRetryCounterCache.close();
  msgCache.close();

  if (failedCloses.length > 0) {
    logger.error({
      event: "whatsapp_shutdown_close_failed",
      failedSessions: failedCloses.length,
      totalSessions: activeSessions.length
    });
    throw new Error(
      `Failed to close ${failedCloses.length} WhatsApp session(s)`
    );
  }
};

export var dataMessages: any = {};

export const msgDB = msg();

export const initWASocket = async (
  whatsapp: Whatsapp,
  lease: WhatsAppLease,
  onSocketCreated?: (session: Session) => void
): Promise<Session> => {
  return new Promise((resolve, reject) => {
    void (async () => {
      let startTimeout: NodeJS.Timeout;
      let wsocket: Session = null;
      try {
        const io = getIO();

        const whatsappUpdate = await Whatsapp.findOne({
          where: { id: whatsapp.id, companyId: whatsapp.companyId }
        });

        if (!whatsappUpdate) {
          throw new AppError("ERR_WAPP_NOT_FOUND", 404);
        }

        const { id, name, allowGroup, companyId } = whatsappUpdate;
        const owner = { whatsappId: id, companyId };
        const generation = activateSessionGeneration(owner);
        const updateLifecycle = async (
          values: Parameters<typeof updateWhatsappLifecycleWithFence>[2]
        ): Promise<Whatsapp> => {
          await lease.assertOwned();
          return updateWhatsappLifecycleWithFence(owner, lease.fence, values);
        };

        const { version, isLatest } = await getBaileysVersion();
        logger.info(
          `Using WhatsApp Web version ${version.join(".")}; latest=${isLatest}`
        );
        logger.info(`Starting session ${name}`);
        let retriesQrCode = 0;

        const { state, saveCreds } = await useMultiFileAuthState(
          whatsappUpdate,
          lease
        );

        // This is the last asynchronous boundary before the socket is created
        // and registered. If drain began while DB/Baileys/Redis were loading,
        // fail closed so shutdown cannot miss a late session.
        assertApplicationRunning();

        wsocket = makeWASocket({
          version,
          logger: loggerBaileys,
          printQRInTerminal: false,
          // auth: state as AuthenticationState,
          auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          generateHighQualityLinkPreview: true,
          linkPreviewImageThumbnailWidth: 192,
          // shouldIgnoreJid: jid => isJidBroadcast(jid),

          shouldIgnoreJid: (jid) => {
            //   // const isGroupJid = !allowGroup && isJidGroup(jid)
            return isJidBroadcast(jid) || (!allowGroup && isJidGroup(jid)) //|| jid.includes('newsletter')
          },
          browser: Browsers.appropriate("Desktop"),
          defaultQueryTimeoutMs: undefined,
          msgRetryCounterCache,
          markOnlineOnConnect: false,
          retryRequestDelayMs: 500,
          maxMsgRetryCount: 5,
          emitOwnEvents: true,
          fireInitQueries: true,
          transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
          connectTimeoutMs: 25_000,
          // keepAliveIntervalMs: 60_000,
          getMessage: msgDB.get,
        });
        wsocket.id = whatsapp.id;
        wsocket.companyId = companyId;
        wsocket.lease = lease;
        const sendMessage = wsocket.sendMessage.bind(wsocket);
        wsocket.sendMessage = (async (...args: Parameters<WASocket["sendMessage"]>) => {
          await lease.assertOwned();
          return sendMessage(...args);
        }) as WASocket["sendMessage"];
        const relayMessage = wsocket.relayMessage.bind(wsocket);
        wsocket.relayMessage = (async (
          ...args: Parameters<WASocket["relayMessage"]>
        ) => {
          await lease.assertOwned();
          return relayMessage(...args);
        }) as WASocket["relayMessage"];
        const registerEvent = wsocket.ev.on.bind(wsocket.ev) as any;
        (wsocket.ev as any).on = (event: string, listener: (...args: any[]) => any) =>
          registerEvent(event, async (...args: any[]) => {
            try {
              await lease.assertOwned();
            } catch {
              invalidateSessionGeneration(owner, generation);
              wsocket?.ws?.close();
              return;
            }
            return listener(...args);
          });
        sessions.push(wsocket);
        onSocketCreated?.(wsocket);

        let startSettled = false;
        const completeStart = (): void => {
          if (startSettled) return;
          startSettled = true;
          clearTimeout(startTimeout);
          resolve(wsocket);
        };
        startTimeout = setTimeout(() => {
          if (startSettled) return;
          startSettled = true;
          wsocket?.ws?.close();
          reject(new AppError("ERR_WAPP_START_TIMEOUT", 504));
        }, 60_000);



        setTimeout(async () => {
          const wpp = await Whatsapp.findByPk(whatsapp.id);
          // console.log("Status:::::",wpp.status)
          if (wpp?.importOldMessages && wpp.status === "CONNECTED") {
            let dateOldLimit = new Date(wpp.importOldMessages).getTime();
            let dateRecentLimit = new Date(wpp.importRecentMessages).getTime();

            addLogs({
              fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, forceNewFile: true,
              text: `Aguardando conexão para iniciar a importação de mensagens:
  Whatsapp nome: ${wpp.name}
  Whatsapp Id: ${wpp.id}
  Criação do arquivo de logs: ${moment().format("DD/MM/YYYY HH:mm:ss")}
  Selecionado Data de inicio de importação: ${moment(dateOldLimit).format("DD/MM/YYYY HH:mm:ss")} 
  Selecionado Data final da importação: ${moment(dateRecentLimit).format("DD/MM/YYYY HH:mm:ss")} 
  `})

            const statusImportMessages = new Date().getTime();

            await wpp.update({
              statusImportMessages
            });
            wsocket.ev.on("messaging-history.set", async (messageSet: any) => {
              //if(messageSet.isLatest){

              const statusImportMessages = new Date().getTime();

              await wpp.update({
                statusImportMessages
              });
              const whatsappId = whatsapp.id;
              let filteredMessages = messageSet.messages
              let filteredDateMessages = []
              filteredMessages.forEach(msg => {
                const timestampMsg = Math.floor(msg.messageTimestamp["low"] * 1000)
                if (isValidMsg(msg) && dateOldLimit < timestampMsg && dateRecentLimit > timestampMsg) {
                  if (msg.key?.remoteJid.split("@")[1] != "g.us") {
                    addLogs({
                      fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Não é Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                    filteredDateMessages.push(msg)
                  } else {
                    if (wpp?.importOldMessagesGroups) {
                      addLogs({
                        fileName: `preparingImportMessagesWppId${whatsapp.id}.txt`, text: `Adicionando mensagem para pos processamento:
  Mensagem de GRUPO >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  Data e hora da mensagem: ${moment(timestampMsg).format("DD/MM/YYYY HH:mm:ss")}
  Contato da Mensagem : ${msg.key?.remoteJid}
  Tipo da mensagem : ${getTypeMessage(msg)}
  
  `})
                      filteredDateMessages.push(msg)
                    }
                  }
                }

              });


              if (!dataMessages?.[whatsappId]) {
                dataMessages[whatsappId] = [];

                dataMessages[whatsappId].unshift(...filteredDateMessages);
              } else {
                dataMessages[whatsappId].unshift(...filteredDateMessages);
              }

              setTimeout(async () => {
                const wpp = await Whatsapp.findByPk(whatsappId);




                io.of(String(companyId))
                  .emit(`importMessages-${wpp.companyId}`, {
                    action: "update",
                    status: { this: -1, all: -1 }
                  });



                io.of(String(companyId))
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
                //console.log(JSON.stringify(wpp, null, 2));
              }, 500);

              setTimeout(async () => {


                const wpp = await Whatsapp.findByPk(whatsappId);

                if (wpp?.importOldMessages) {
                  let isTimeStamp = !isNaN(
                    new Date(Math.floor(parseInt(wpp?.statusImportMessages))).getTime()
                  );

                  if (isTimeStamp) {
                    const ultimoStatus = new Date(
                      Math.floor(parseInt(wpp?.statusImportMessages))
                    ).getTime();
                    const dataLimite = +add(ultimoStatus, { seconds: +45 }).getTime();

                    if (dataLimite < new Date().getTime()) {
                      //console.log("Pronto para come?ar")
                      importarMensagensWhatsapp(wpp.id)
                      wpp.update({
                        statusImportMessages: "Running"
                      })

                    } else {
                      //console.log("Aguardando inicio")
                    }
                  }
                }
                io.of(String(companyId))
                  .emit(`company-${companyId}-whatsappSession`, {
                    action: "update",
                    session: wpp
                  });
              }, 1000 * 45);

            });
          }

        }, 2500);




        wsocket.ev.on(
          "connection.update",
          async ({ connection, lastDisconnect, qr }) => {
            if (!isCurrentSessionGeneration(owner, generation)) return;

            if (connection === "close" && isApplicationDraining()) {
              await removeWbot(id, false, wsocket);
              invalidateSessionGeneration(owner, generation);
              return;
            }
            if (connection === "close") {
              const statusCode = (lastDisconnect?.error as Boom)?.output
                ?.statusCode;
              logger.info({
                event: "whatsapp_connection_update",
                whatsappId: id,
                companyId,
                connection,
                statusCode: statusCode || null,
                errorClass:
                  lastDisconnect?.error instanceof Error
                    ? lastDisconnect.error.name
                    : null
              });
              const shouldStop =
                statusCode === DisconnectReason.loggedOut ||
                statusCode === DisconnectReason.badSession ||
                statusCode === 403 ||
                statusCode === 405;

              if (shouldStop) {
                reconnectAttemptsMap.delete(id);
                const pendingTimer = reconnectTimersMap.get(id);
                if (pendingTimer) {
                  clearTimeout(pendingTimer);
                  reconnectTimersMap.delete(id);
                }

                const disconnected = await updateLifecycle({
                  status: "DISCONNECTED",
                  qrcode: "",
                  session: ""
                });
                await removeWbot(id, false, wsocket);
                invalidateSessionGeneration(owner, generation);
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: disconnected
                  });
                logger.warn(
                  `Session ${name} stopped after non-recoverable disconnect (${statusCode})`
                );
                return;
              }

              const attempt = (reconnectAttemptsMap.get(id) || 0) + 1;
              reconnectAttemptsMap.set(id, attempt);

              if (attempt > 8) {
                await updateLifecycle({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                await removeWbot(id, false, wsocket);
                invalidateSessionGeneration(owner, generation);
                logger.warn(
                  `Session ${name} stopped after ${attempt - 1} reconnect attempts`
                );
                return;
              }

              await removeWbot(id, false, wsocket);
              invalidateSessionGeneration(owner, generation);

              const reconnectDelay = Math.min(
                60_000,
                2_000 * Math.pow(2, attempt - 1)
              );
              const previousTimer = reconnectTimersMap.get(id);
              if (previousTimer) clearTimeout(previousTimer);

              const timer = setTimeout(async () => {
                reconnectTimersMap.delete(id);
                if (isApplicationDraining()) return;
                const current = await Whatsapp.findOne({
                  where: { id, companyId, channel: "whatsapp" }
                });
                if (current && current.status !== "DISCONNECTED") {
                  iniciarSessaoWhatsapp(current, current.companyId);
                }
              }, reconnectDelay);
              reconnectTimersMap.set(id, timer);
            }

            if (connection === "open") {
              reconnectAttemptsMap.delete(id);
              const pendingTimer = reconnectTimersMap.get(id);
              if (pendingTimer) {
                clearTimeout(pendingTimer);
                reconnectTimersMap.delete(id);
              }
              const connected = await updateLifecycle({
                status: "CONNECTED",
                qrcode: "",
                retries: 0,
                number:
                  wsocket.type === "md"
                    ? jidNormalizedUser((wsocket as WASocket).user.id).split("@")[0]
                    : "-"
              });

              io.of(String(companyId))
                .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                  action: "update",
                  session: connected
                });

              completeStart();
            }

            if (qr !== undefined) {
              if (retriesQrCodeMap.get(id) && retriesQrCodeMap.get(id) >= 6) {
                const disconnected = await updateLifecycle({
                  status: "DISCONNECTED",
                  qrcode: ""
                });
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: disconnected
                  });
                wsocket.ev.removeAllListeners("connection.update");
                wsocket.ws.close();
                await removeWbot(id, false, wsocket);
                wsocket = null;
                retriesQrCodeMap.delete(id);
              } else {
                logger.info(`Session QRCode Generate ${name}`);
                retriesQrCodeMap.set(id, (retriesQrCode += 1));

                const pairing = await updateLifecycle({
                  qrcode: qr,
                  status: "qrcode",
                  retries: 0,
                  number: ""
                });
                io.of(String(companyId))
                  .emit(`company-${whatsapp.companyId}-whatsappSession`, {
                    action: "update",
                    session: pairing
                  });

                // Complete the start request once the QR is ready. Waiting for
                // the phone to connect made the Connections screen hang.
                completeStart();
              }
            }
          }
        );
        wsocket.ev.on("creds.update", async () => {
          try {
            await saveCreds();
          } catch (error) {
            Sentry.captureException(
              new Error("WHATSAPP_CREDS_UPDATE_FAILED_SANITIZED")
            );
            logger.error({
              event: "whatsapp_auth_persist_failed",
              whatsappId: whatsapp.id,
              companyId: whatsapp.companyId,
              errorClass: error instanceof Error ? error.name : "UnknownError"
            });
            // Continuing with credentials that were not persisted makes the
            // next restart unsafe. Close and let the bounded reconnect policy
            // retry only after storage is available again.
            wsocket?.ws?.close();
          }
        });
        // wsocket.store = store;
        // store.bind(wsocket.ev);
      } catch (error) {
        if (startTimeout) clearTimeout(startTimeout);
        if (wsocket) {
          wsocket.ev.removeAllListeners("messaging-history.set");
          wsocket.ev.removeAllListeners("connection.update");
          wsocket.ev.removeAllListeners("creds.update");
          wsocket.ws.close();
          await removeWbot(whatsapp.id, false, wsocket);
        }
        Sentry.captureException(
          new Error("WHATSAPP_SOCKET_INIT_FAILED_SANITIZED")
        );
        logger.error({
          event: "whatsapp_session_start_failed",
          whatsappId: whatsapp.id,
          companyId: whatsapp.companyId,
          errorClass: error instanceof Error ? error.name : "UnknownError"
        });
        reject(error);
      }
    })();
  });
};
