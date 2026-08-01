const migration = require("../20260731210000-enable-pg-stat-statements");

export {};

const transaction = {};
const queryInterface = () => ({
  sequelize: {
    transaction: jest.fn((callback: any) => callback(transaction)),
    query: jest.fn().mockResolvedValue(undefined)
  }
});

describe("pg_stat_statements migration", () => {
  it("creates the extension atomically and idempotently", async () => {
    const qi = queryInterface();
    await migration.up(qi as any);
    expect(qi.sequelize.query).toHaveBeenCalledWith(
      "CREATE EXTENSION IF NOT EXISTS pg_stat_statements",
      { transaction }
    );
  });

  it("drops only the observability extension on rollback", async () => {
    const qi = queryInterface();
    await migration.down(qi as any);
    expect(qi.sequelize.query).toHaveBeenCalledWith(
      "DROP EXTENSION IF EXISTS pg_stat_statements",
      { transaction }
    );
  });
});
