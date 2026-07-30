import ApiCredential from "../../../models/ApiCredential";
import Whatsapp from "../../../models/Whatsapp";
import IssueApiCredentialService from "../IssueApiCredentialService";
import RotateApiTokenService from "../RotateApiTokenService";

const transaction = { LOCK: { UPDATE: "UPDATE" } };
jest.mock("../../../database", () => ({
  transaction: jest.fn((callback: any) => callback(transaction))
}));
jest.mock("../../../models/Whatsapp", () => ({ findOne: jest.fn() }));
jest.mock("../../../models/ApiCredential", () => ({ update: jest.fn() }));
jest.mock("../IssueApiCredentialService", () => jest.fn());

const findOne = Whatsapp.findOne as jest.Mock;
const updateCredentials = ApiCredential.update as jest.Mock;
const issue = IssueApiCredentialService as jest.Mock;

describe("RotateApiTokenService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_TOKEN_ROTATION_GRACE_SECONDS = "900";
  });

  it("serializes rotation and gives current and legacy credentials a grace period", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    findOne.mockResolvedValue({
      id: 7,
      token: "legacy",
      apiTokenLegacyExpiresAt: null,
      update
    });
    issue.mockResolvedValue("wk_new");

    await expect(RotateApiTokenService(7, 11, 3)).resolves.toBe("wk_new");

    expect(findOne).toHaveBeenCalledWith({
      where: { id: 7, companyId: 11, channel: "whatsapp" },
      transaction,
      lock: "UPDATE"
    });
    expect(updateCredentials).toHaveBeenCalledWith(
      {
        expiresAt: expect.any(Date),
        status: "grace",
        revokedBy: 3
      },
      expect.objectContaining({
        where: { whatsappId: 7, status: "active", expiresAt: null },
        transaction
      })
    );
    expect(update).toHaveBeenCalledWith(
      { apiTokenLegacyExpiresAt: expect.any(Date) },
      { transaction }
    );
    expect(issue).toHaveBeenCalledWith({
      companyId: 11,
      whatsappId: 7,
      createdBy: 3,
      transaction
    });
  });

  it("fails closed for a foreign or missing connection", async () => {
    findOne.mockResolvedValue(null);
    await expect(RotateApiTokenService(7, 11)).rejects.toMatchObject({
      statusCode: 404,
      message: "ERR_NO_WAPP_FOUND"
    });
  });
});
