import GenerateApiTokenService from "../GenerateApiTokenService";

describe("GenerateApiTokenService", () => {
  it("generates independent 256-bit base64url credentials", () => {
    const tokens = new Set(
      Array.from({ length: 100 }, () => GenerateApiTokenService())
    );
    expect(tokens.size).toBe(100);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });
});
