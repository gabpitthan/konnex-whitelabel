import ApiCredential from "../../../models/ApiCredential";
import Whatsapp from "../../../models/Whatsapp";
import RevokeApiTokenService from "../RevokeApiTokenService";

const transaction = { LOCK: { UPDATE: "UPDATE" } };
jest.mock("../../../database", () => ({
  transaction: jest.fn((callback: any) => callback(transaction))
}));
jest.mock("../../../models/Whatsapp", () => ({ findOne: jest.fn() }));
jest.mock("../../../models/ApiCredential", () => ({ update: jest.fn() }));

const findOne = Whatsapp.findOne as jest.Mock;
const updateCredentials = ApiCredential.update as jest.Mock;

describe("RevokeApiTokenService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("revokes digest and legacy credentials in one owner-locked transaction", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    findOne.mockResolvedValue({ id: 7, update });

    await RevokeApiTokenService(7, 11, 3);

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 7, companyId: 11, channel: "whatsapp" },
      transaction,
      lock: "UPDATE"
    });
    expect(updateCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "revoked",
        revokedAt: expect.any(Date),
        revokedBy: 3,
        expiresAt: expect.any(Date)
      }),
      expect.objectContaining({ transaction })
    );
    expect(update).toHaveBeenCalledWith(
      { token: "", apiTokenLegacyExpiresAt: expect.any(Date) },
      { transaction }
    );
  });

  it("fails closed for a foreign owner", async () => {
    findOne.mockResolvedValue(null);
    await expect(RevokeApiTokenService(7, 11, 3)).rejects.toMatchObject({
      statusCode: 404
    });
  });
});
