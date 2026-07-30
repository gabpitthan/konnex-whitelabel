import ApiCredential from "../../../models/ApiCredential";
import {
  createApiTokenMaterial,
  digestApiToken
} from "../ApiTokenCryptoService";
import ResolveApiCredentialService from "../ResolveApiCredentialService";

jest.mock("../../../models/ApiCredential");

describe("ResolveApiCredentialService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_TOKEN_PEPPER = "p".repeat(64);
  });

  it("rejects malformed tokens without querying the database", async () => {
    await expect(ResolveApiCredentialService("legacy-token")).resolves.toBeNull();
    expect(ApiCredential.findAll).not.toHaveBeenCalled();
  });

  it("resolves only the candidate whose digest matches", async () => {
    const material = createApiTokenMaterial();
    const credential = {
      id: 9,
      companyId: 4,
      whatsappId: 7,
      digest: material.digest,
      expiresAt: null
    };
    (ApiCredential.findAll as jest.Mock).mockResolvedValue([
      { ...credential, id: 8, digest: digestApiToken(`${material.token}x`) },
      credential
    ]);

    await expect(
      ResolveApiCredentialService(material.token)
    ).resolves.toBe(credential);
    expect(ApiCredential.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ prefix: material.prefix })
      })
    );
  });

  it("returns null when no stored digest matches", async () => {
    const material = createApiTokenMaterial();
    (ApiCredential.findAll as jest.Mock).mockResolvedValue([
      { digest: "0".repeat(64) }
    ]);
    await expect(
      ResolveApiCredentialService(material.token)
    ).resolves.toBeNull();
  });
});
