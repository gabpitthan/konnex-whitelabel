import Redis from "ioredis";

const RATE_LIMIT_SCRIPT = `
  local current = redis.call("INCR", KEYS[1])
  if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
  end
  local ttl = redis.call("TTL", KEYS[1])
  return { current, ttl }
`;

interface ApiRateLimitOwner {
  companyId: number;
  whatsappId: number;
}

export const apiRateLimitKey = ({
  companyId,
  whatsappId
}: ApiRateLimitOwner): string =>
  `api-rate:v1:${companyId}:${whatsappId}`;

export const consumeApiRateLimit = async (
  redis: Pick<Redis, "eval">,
  owner: ApiRateLimitOwner,
  windowSeconds: number
): Promise<{ current: number; ttl: number }> => {
  const result = (await redis.eval(
    RATE_LIMIT_SCRIPT,
    1,
    apiRateLimitKey(owner),
    windowSeconds
  )) as [number, number];
  return {
    current: Number(result[0]),
    ttl: Math.max(1, Number(result[1]))
  };
};
