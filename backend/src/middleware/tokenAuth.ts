import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import { Op } from "sequelize";
import { parseApiTokenPrefix } from "../services/ApiServices/ApiTokenCryptoService";
import ResolveApiCredentialService from "../services/ApiServices/ResolveApiCredentialService";

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
  if (parseApiTokenPrefix(token)) {
    const credential = await ResolveApiCredentialService(token);
    if (!credential) throw new AppError("ERR_SESSION_EXPIRED", 401);
    req.apiConnection = {
      whatsappId: credential.whatsappId,
      companyId: credential.companyId,
      channel: "whatsapp"
    };
    return next();
  }

  const whatsapp = await Whatsapp.findOne({
    where: {
      token,
      channel: "whatsapp",
      [Op.or]: [
        { apiTokenLegacyExpiresAt: null },
        { apiTokenLegacyExpiresAt: { [Op.gt]: new Date() } }
      ]
    },
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
