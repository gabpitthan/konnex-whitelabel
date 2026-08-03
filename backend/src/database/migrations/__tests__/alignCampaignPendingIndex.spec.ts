const migration = require("../20260803184500-align-campaign-pending-index");

export {};

describe("campaign pending scanner index migration", () => {
  const createQueryInterface = () => {
    const query = jest.fn().mockResolvedValue(undefined);
    return {
      queryInterface: {
        sequelize: {
          query,
          transaction: jest.fn(async callback => callback("tx"))
        }
      } as any,
      query
    };
  };

  it("matches the global scanner order and covers returned metadata", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.up(queryInterface);
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain('ON "CampaignShipping" ("updatedAt", id)');
    expect(ddl).toContain('INCLUDE ("companyId", "campaignId", "dispatchKey")');
    expect(ddl).toContain('WHERE "dispatchStatus" = \'PENDING\'');
  });

  it("restores the original tenant-leading index on rollback", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.down(queryInterface);
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain('("companyId", "updatedAt", id)');
  });
});
