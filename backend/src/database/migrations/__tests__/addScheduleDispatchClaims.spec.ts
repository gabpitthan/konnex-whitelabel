const migration = require("../20260803160000-add-schedule-dispatch-claims");

export {};

describe("schedule dispatch claims migration", () => {
  const createQueryInterface = () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValue(undefined);
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

  it("adds nullable claim columns and workload-backed partial indexes", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.up(queryInterface);

    expect(queryInterface.addColumn).toHaveBeenCalledTimes(3);
    expect(queryInterface.addColumn).toHaveBeenCalledWith(
      "Schedules",
      "dispatchKey",
      expect.objectContaining({ allowNull: true }),
      { transaction: "tx" }
    );
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain('ALTER COLUMN "companyId" SET NOT NULL');
    expect(ddl).toContain("CREATE UNIQUE INDEX");
    expect(ddl).toContain('WHERE "dispatchKey" IS NOT NULL');
    expect(ddl).toContain("status = 'PENDENTE'");
    expect(ddl).toContain("status = 'AGENDADA'");
  });

  it("drops only its indexes and columns on rollback", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.down(queryInterface);

    expect(query).toHaveBeenCalledTimes(4);
    expect(queryInterface.removeColumn).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0][0]).toContain("schedules_claim_recovery_idx");
    expect(query.mock.calls[2][0]).toContain("schedules_dispatch_key_unique");
  });

  it("fails before DDL when a schedule has no tenant owner", async () => {
    const { queryInterface } = createQueryInterface();
    queryInterface.sequelize.query.mockReset();
    queryInterface.sequelize.query.mockResolvedValueOnce([{ ownerless: true }]);

    await expect(migration.up(queryInterface)).rejects.toThrow(
      "SCHEDULE_WITHOUT_COMPANY_REQUIRES_RECONCILIATION"
    );
    expect(queryInterface.addColumn).not.toHaveBeenCalled();
  });
});
