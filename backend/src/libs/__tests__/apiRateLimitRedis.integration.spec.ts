import Redis from "ioredis";

import { apiRateLimitKey, consumeApiRateLimit } from "../apiRateLimit";

const redisUri = process.env.TEST_REDIS_URI;
const describeIntegration = redisUri ? describe : describe.skip;

describeIntegration("API rate limiter with Redis 7", () => {
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

  it("increments atomically, expires and isolates connection owners", async () => {
    const suffix = Date.now() % 1_000_000_000;
    const first = {
      companyId: 1_000_000_000 + suffix,
      whatsappId: 1_100_000_000 + suffix
    };
    const second = { ...first, whatsappId: first.whatsappId + 1 };

    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        consumeApiRateLimit(redis, first, 10)
      )
    );
    expect(results.map(result => result.current).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1)
    );
    expect(results.every(result => result.ttl > 0 && result.ttl <= 10)).toBe(
      true
    );

    await expect(consumeApiRateLimit(redis, second, 10)).resolves.toMatchObject({
      current: 1
    });
    await redis.del(apiRateLimitKey(first), apiRateLimitKey(second));
  });
});
