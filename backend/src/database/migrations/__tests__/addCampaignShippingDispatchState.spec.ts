const migration = require("../20260803180000-add-campaign-shipping-dispatch-state");

export {};

describe("campaign shipping dispatch state migration", () => {
  const createQueryInterface = () => {
    const query = jest.fn().mockResolvedValue([]);
    const transaction = jest.fn(async callback => callback("tx"));
    return {
      queryInterface: {
        addColumn: jest.fn().mockResolvedValue(undefined),
        removeColumn: jest.fn().mockResolvedValue(undefined),
        sequelize: { query, transaction }
      } as any,
      query
    };
  };

  it("backfills owner/state and installs tenant integrity constraints", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.up(queryInterface);
    expect(queryInterface.addColumn).toHaveBeenCalledTimes(4);
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain('ALTER COLUMN "companyId" SET NOT NULL');
    expect(ddl).toContain('ALTER COLUMN "contactId" SET NOT NULL');
    expect(ddl).toContain('FOREIGN KEY ("campaignId", "companyId")');
    expect(ddl).toContain('ON "CampaignShipping" ("companyId", "campaignId", "contactId")');
    expect(ddl).toContain('WHERE "dispatchStatus" = \'PENDING\'');
    expect(ddl).toContain('THEN NULL');
    expect(ddl).toContain('"dispatchStatus" = \'PROCESSING\'');
    expect(ddl).toContain('"dispatchStartedAt" IS NOT NULL');
  });

  it("fails closed before DDL for orphaned contacts or campaigns", async () => {
    const { queryInterface } = createQueryInterface();
    queryInterface.sequelize.query.mockResolvedValueOnce([{ invalid: true }]);
    await expect(migration.up(queryInterface)).rejects.toThrow(
      "CAMPAIGN_SHIPPING_OWNER_REQUIRES_RECONCILIATION"
    );
    expect(queryInterface.addColumn).not.toHaveBeenCalled();
  });

  it("fails closed before DDL for duplicate recipients", async () => {
    const { queryInterface } = createQueryInterface();
    queryInterface.sequelize.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ duplicate: true }]);
    await expect(migration.up(queryInterface)).rejects.toThrow(
      "CAMPAIGN_SHIPPING_DUPLICATES_REQUIRE_RECONCILIATION"
    );
    expect(queryInterface.addColumn).not.toHaveBeenCalled();
  });
});
