import pino from "pino";

export const LOG_TRANSLATE_TIME = "UTC:yyyy-mm-dd HH:MM:ss.l o";
export const logTimestamp = pino.stdTimeFunctions.isoTime;

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: LOG_TRANSLATE_TIME,
      ignore: "pid,hostname"
    }
  },
  timestamp: logTimestamp
});

export default logger;
