const migration = require("../20260730200000-create-api-credentials");

export {};

const transaction = {};
const queryInterface = () => ({
  sequelize: {
    transaction: jest.fn((callback: any) => callback(transaction)),
    query: jest.fn().mockResolvedValue(undefined)
  },
  addColumn: jest.fn().mockResolvedValue(undefined),
  createTable: jest.fn().mockResolvedValue(undefined),
  addIndex: jest.fn().mockResolvedValue(undefined),
  dropTable: jest.fn().mockResolvedValue(undefined),
  removeColumn: jest.fn().mockResolvedValue(undefined)
});

describe("create API credentials migration", () => {
  it("creates the additive credential table and auth/current indexes atomically", async () => {
    const qi = queryInterface();
    await migration.up(qi as any);

    expect(qi.addColumn).toHaveBeenCalledWith(
      "Whatsapps",
      "apiTokenLegacyExpiresAt",
      expect.objectContaining({ allowNull: true }),
      { transaction }
    );
    expect(qi.createTable).toHaveBeenCalledWith(
      "ApiCredentials",
      expect.objectContaining({
        digest: expect.objectContaining({ allowNull: false, unique: true }),
        expiresAt: expect.objectContaining({ allowNull: true })
      }),
      { transaction }
    );
    expect(qi.addIndex).toHaveBeenCalledWith(
      "ApiCredentials",
      ["prefix", "status", "expiresAt"],
      { name: "api_credentials_auth_lookup", transaction }
    );
    expect(qi.sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining("api_credentials_current_owner_unique"),
      { transaction }
    );
  });

  it("removes only the table and legacy-expiry column on rollback", async () => {
    const qi = queryInterface();
    await migration.down(qi as any);
    expect(qi.dropTable).toHaveBeenCalledWith("ApiCredentials", {
      transaction
    });
    expect(qi.removeColumn).toHaveBeenCalledWith(
      "Whatsapps",
      "apiTokenLegacyExpiresAt",
      { transaction }
    );
  });
});
