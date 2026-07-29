import { randomUUID } from "crypto";
import Redis from "ioredis";
import {
  WhatsAppLeaseUnavailableError,
  createWhatsAppLeaseManager,
  whatsappLeaseKey
} from "../whatsappLease";

const redisUri = process.env.TEST_REDIS_URI;
const describeIntegration = redisUri ? describe : describe.skip;

describeIntegration("distributed WhatsApp lease with Redis 7", () => {
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(redisUri!, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1
    });
    if (redis.status !== "ready") {
      await new Promise<void>((resolve, reject) => {
        redis.once("ready", resolve);
        redis.once("error", reject);
      });
    }
  });

  afterAll(async () => {
    if (redis?.status === "ready") await redis.quit();
    else redis?.disconnect();
  });

  it("prevents ABA after TTL expiry and keeps guarded auth writes atomic", async () => {
    const suffix = Date.now() % 1_000_000_000;
    const owner = {
      companyId: 1_000_000_000 + suffix,
      whatsappId: 1_000_000_001 + suffix
    };
    let fence = 0;
    const manager = createWhatsAppLeaseManager({
      redis,
      fenceRepository: { nextFence: async () => String(++fence) },
      createToken: randomUUID,
      ttlMs: 200,
      heartbeatIntervalMs: 100
    });
    const authKey = `baileys:v2:{${owner.companyId}:${owner.whatsappId}}:test`;

    const first = await manager.acquire(owner);
    await expect(manager.acquire(owner)).rejects.toBeInstanceOf(
      WhatsAppLeaseUnavailableError
    );

    await first.setIfOwned(authKey, "first");
    expect(await redis.get(authKey)).toBe("first");

    await new Promise(resolve => setTimeout(resolve, 260));
    const second = await manager.acquire(owner);
    await second.setIfOwned(authKey, "second");

    await expect(first.release()).resolves.toBe(false);
    await expect(second.assertOwned()).resolves.toBeUndefined();
    expect(await redis.get(authKey)).toBe("second");

    await second.deleteIfOwned(authKey);
    await second.release();
    await redis.del(whatsappLeaseKey(owner), authKey);
  });
});
