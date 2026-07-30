import {
  createApiTokenMaterial,
  digestApiToken,
  parseApiTokenPrefix,
  safelyMatchesDigest
} from "../ApiTokenCryptoService";

describe("ApiTokenCryptoService", () => {
  beforeEach(() => {
    process.env.API_TOKEN_PEPPER = "p".repeat(64);
  });

  it("creates a prefixed credential and verifies its HMAC safely", () => {
    const material = createApiTokenMaterial();
    expect(parseApiTokenPrefix(material.token)).toBe(material.prefix);
    expect(material.digest).toHaveLength(64);
    expect(safelyMatchesDigest(digestApiToken(material.token), material.digest))
      .toBe(true);
    expect(safelyMatchesDigest("0".repeat(64), material.digest)).toBe(false);
  });

  it("fails closed when a dedicated pepper is unavailable", () => {
    delete process.env.API_TOKEN_PEPPER;
    delete process.env.MASTER_KEY;
    expect(() => digestApiToken("token")).toThrow(
      "ERR_API_TOKEN_PEPPER_UNAVAILABLE"
    );
  });

  it("derives a domain-separated pepper from the production master key", () => {
    delete process.env.API_TOKEN_PEPPER;
    process.env.MASTER_KEY = "m".repeat(64);
    expect(digestApiToken("token")).toHaveLength(64);
  });
});
