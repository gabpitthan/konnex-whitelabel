import { randomUUID } from "crypto";
import cacheLayer from "./cache";
import {
  createWhatsAppLeaseManager,
  WhatsAppLeaseManager
} from "./whatsappLease";
import { nextWhatsappSessionFence } from "./whatsappFence";

export const whatsappLeaseManager: WhatsAppLeaseManager =
  createWhatsAppLeaseManager({
    redis: cacheLayer.getRedisInstance(),
    fenceRepository: {
      nextFence: () => nextWhatsappSessionFence()
    },
    createToken: randomUUID,
    ttlMs: Number(process.env.WHATSAPP_LEASE_TTL_MS || 30_000),
    heartbeatIntervalMs: Number(
      process.env.WHATSAPP_LEASE_HEARTBEAT_MS || 10_000
    )
  });
