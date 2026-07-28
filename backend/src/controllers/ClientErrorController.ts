import { Request, Response } from "express";
import logger from "../utils/logger";

const clean = (value: unknown, maxLength: number): string =>
  String(value || "")
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/[\r\n\t]/g, " ")
    .slice(0, maxLength);

export const store = async (req: Request, res: Response): Promise<Response> => {
  const payload = req.body || {};

  logger.error(
    {
      event: "frontend_client_error",
      errorId: clean(payload.errorId, 80),
      kind: clean(payload.kind, 30),
      message: clean(payload.message, 240),
      route: clean(payload.route, 180),
      version: clean(payload.version, 30),
      viewport: clean(payload.viewport, 30),
      userAgent: clean(payload.userAgent, 100),
      component: clean(payload.component, 300)
    },
    "Frontend client error"
  );

  return res.status(202).json({ received: true });
};

