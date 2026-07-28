import { Request, Response, NextFunction } from "express";

interface RateEntry {
  count: number;
  expiresAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REPORTS = 12;
const clients = new Map<string, RateEntry>();

const clientErrorRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const now = Date.now();
  const cloudflareIp = req.headers["cf-connecting-ip"];
  const key = String(Array.isArray(cloudflareIp) ? cloudflareIp[0] : cloudflareIp || req.ip)
    .split(",")[0]
    .trim()
    .slice(0, 80);
  const current = clients.get(key);

  if (!current || current.expiresAt <= now) {
    clients.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    if (clients.size > 5000) {
      clients.forEach((entry, client) => {
        if (entry.expiresAt <= now) clients.delete(client);
      });
    }
    next();
    return;
  }

  if (current.count >= MAX_REPORTS) {
    res.status(429).json({ error: "Too many client error reports" });
    return;
  }

  current.count += 1;
  next();
};

export default clientErrorRateLimit;
