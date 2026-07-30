const migration = require("../20260729190000-enforce-api-credential-integrity");

describe("API credential integrity migration", () => {
  it("aborts before DDL when tokens are duplicated", async () => {
    const query = jest.fn().mockResolvedValueOnce([{ duplicate: true }]);
    await expect(
      migration.up({ sequelize: { query } } as any)
    ).rejects.toThrow("DUPLICATE_API_TOKENS_REQUIRE_MANUAL_ROTATION");
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("aborts before DDL when daily usage rows are duplicated", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ duplicate: true }]);
    await expect(
      migration.up({ sequelize: { query } } as any)
    ).rejects.toThrow("DUPLICATE_API_USAGE_REQUIRES_MANUAL_RECONCILIATION");
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("creates both partial unique indexes after clean checks", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue(undefined);
    await migration.up({ sequelize: { query } } as any);
    expect(query.mock.calls[2][0]).toContain("whatsapps_api_token_unique");
    expect(query.mock.calls[3][0]).toContain(
      "api_usages_company_date_unique"
    );
  });

  it("drops only the two indexes owned by this migration", async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await migration.down({ sequelize: { query } } as any);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'DROP INDEX IF EXISTS "api_usages_company_date_unique"'
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DROP INDEX IF EXISTS "whatsapps_api_token_unique"'
    );
  });
});
