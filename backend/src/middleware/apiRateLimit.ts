import { NextFunction, Request, Response } from "express";

import AppError from "../errors/AppError";
import { consumeApiRateLimit } from "../libs/apiRateLimit";
import cacheLayer from "../libs/cache";

const boundedInteger = (
  value: string | undefined,
  fallback: number,
  maximum: number
): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= maximum
    ? parsed
    : fallback;
};

export const apiRateLimitConfig = {
  maximum: boundedInteger(process.env.API_RATE_LIMIT_MAX, 60, 10_000),
  windowSeconds: boundedInteger(
    process.env.API_RATE_LIMIT_WINDOW_SECONDS,
    60,
    3_600
  )
};

const apiRateLimit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const context = req.apiConnection;
  if (!context) throw new AppError("ERR_SESSION_EXPIRED", 401);

  let result: { current: number; ttl: number };
  try {
    result = await consumeApiRateLimit(
      cacheLayer.getRedisInstance(),
      context,
      apiRateLimitConfig.windowSeconds
    );
  } catch {
    throw new AppError("ERR_API_RATE_LIMIT_UNAVAILABLE", 503);
  }

  const { current, ttl } = result;
  if (!Number.isFinite(current) || !Number.isFinite(ttl)) {
    throw new AppError("ERR_API_RATE_LIMIT_UNAVAILABLE", 503);
  }

  res.setHeader("RateLimit-Limit", apiRateLimitConfig.maximum);
  res.setHeader(
    "RateLimit-Remaining",
    Math.max(0, apiRateLimitConfig.maximum - current)
  );
  res.setHeader("RateLimit-Reset", ttl);

  if (current > apiRateLimitConfig.maximum) {
    res.setHeader("Retry-After", ttl);
    return res.status(429).json({ error: "ERR_API_RATE_LIMIT_EXCEEDED" });
  }

  next();
};

export default apiRateLimit;
