import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import tokenAuth from "../tokenAuth";

jest.mock("../../models/Whatsapp", () => ({
  findOne: jest.fn()
}));

const findOne = Whatsapp.findOne as jest.Mock;

const request = (authorization?: string): any => ({
  headers: authorization === undefined ? {} : { authorization }
});

describe("tokenAuth", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    undefined,
    "",
    "Basic abc",
    "Bearer",
    "Bearer token with spaces"
  ])("rejects a missing or malformed bearer credential: %s", async header => {
    const req = request(header);
    await expect(tokenAuth(req, {} as any, jest.fn())).rejects.toMatchObject({
      statusCode: 401
    });
    expect(findOne).not.toHaveBeenCalled();
    expect(req.apiConnection).toBeUndefined();
  });

  it("rejects an unknown token without exposing credential details", async () => {
    findOne.mockResolvedValue(null);
    await expect(
      tokenAuth(request("Bearer unknown-token-value-1234"), {} as any, jest.fn())
    ).rejects.toBeInstanceOf(AppError);
  });

  it("attaches only the authenticated connection context", async () => {
    findOne.mockResolvedValue({ id: 7, companyId: 11, channel: "whatsapp" });
    const req = request("bearer valid-token-value-12345678");
    const next = jest.fn();

    await tokenAuth(req, {} as any, next);

    expect(findOne).toHaveBeenCalledWith({
      where: { token: "valid-token-value-12345678", channel: "whatsapp" },
      attributes: ["id", "companyId", "channel"]
    });
    expect(req.apiConnection).toEqual({
      whatsappId: 7,
      companyId: 11,
      channel: "whatsapp"
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("propagates database failures to centralized error handling", async () => {
    const failure = new Error("database unavailable");
    findOne.mockRejectedValue(failure);
    await expect(
      tokenAuth(request("Bearer valid-token-value-12345678"), {} as any, jest.fn())
    ).rejects.toBe(failure);
  });
});
