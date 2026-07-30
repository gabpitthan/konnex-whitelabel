import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";

const bearerPattern = /^Bearer ([A-Za-z0-9._~+/-]+={0,})$/i;

const isAuthApi = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const match = authHeader?.match(bearerPattern);
  if (!match) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const token = match[1];
  const whatsapp = await Whatsapp.findOne({
    where: { token, channel: "whatsapp" },
    attributes: ["id", "companyId", "channel"]
  });
  if (
    !whatsapp ||
    !Number.isInteger(whatsapp.companyId) ||
    whatsapp.companyId <= 0
  ) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  req.apiConnection = {
    whatsappId: whatsapp.id,
    companyId: whatsapp.companyId,
    channel: whatsapp.channel
  };

  return next();
};

export default isAuthApi;
