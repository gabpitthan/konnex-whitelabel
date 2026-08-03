const migration = require("../20260803183000-align-campaign-shipping-contact-foreign-key");

export {};

describe("campaign shipping contact foreign key migration", () => {
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

  it("aligns the mandatory contact with cascading ownership", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.up(queryInterface);
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain('DROP CONSTRAINT IF EXISTS "CampaignShipping_contactId_fkey"');
    expect(ddl).toContain("ON UPDATE CASCADE ON DELETE CASCADE");
  });

  it("restores the historical nullable action before the owner migration rolls back", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.down(queryInterface);
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain("ON UPDATE SET NULL ON DELETE SET NULL");
  });
});
