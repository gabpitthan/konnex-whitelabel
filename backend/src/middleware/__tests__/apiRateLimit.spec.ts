import cacheLayer from "../../libs/cache";
import apiRateLimit, { apiRateLimitConfig } from "../apiRateLimit";

jest.mock("../../libs/cache", () => ({
  getRedisInstance: jest.fn()
}));

const evalCommand = jest.fn();
const request = (companyId = 11, whatsappId = 7): any => ({
  apiConnection: { companyId, whatsappId, channel: "whatsapp" }
});
const response = (): any => {
  const res: any = {
    setHeader: jest.fn(),
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

describe("apiRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cacheLayer.getRedisInstance as jest.Mock).mockReturnValue({
      eval: evalCommand
    });
  });

  it("uses tenant and connection identity without putting the token in Redis", async () => {
    evalCommand.mockResolvedValue([1, 60]);
    const res = response();
    const next = jest.fn();

    await apiRateLimit(request(), res, next);

    expect(evalCommand).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("INCR", KEYS[1])'),
      1,
      "api-rate:v1:11:7",
      apiRateLimitConfig.windowSeconds
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith(
      "RateLimit-Remaining",
      apiRateLimitConfig.maximum - 1
    );
  });

  it("returns 429 and Retry-After after the distributed limit", async () => {
    evalCommand.mockResolvedValue([apiRateLimitConfig.maximum + 1, 27]);
    const res = response();
    const next = jest.fn();

    await apiRateLimit(request(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", 27);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: "ERR_API_RATE_LIMIT_EXCEEDED"
    });
  });

  it("fails closed when Redis is unavailable", async () => {
    evalCommand.mockRejectedValue(new Error("redis unavailable"));
    await expect(
      apiRateLimit(request(), response(), jest.fn())
    ).rejects.toMatchObject({
      statusCode: 503,
      message: "ERR_API_RATE_LIMIT_UNAVAILABLE"
    });
  });

  it("requires the authenticated context", async () => {
    await expect(
      apiRateLimit({} as any, response(), jest.fn())
    ).rejects.toMatchObject({ statusCode: 401 });
    expect(evalCommand).not.toHaveBeenCalled();
  });
});
