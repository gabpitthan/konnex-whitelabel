const migration = require("../20260803200000-create-dispatch-reconciliation-audits");

export {};

describe("dispatch reconciliation audit migration", () => {
  const createQueryInterface = () => {
    const query = jest.fn().mockResolvedValue(undefined);
    return {
      queryInterface: {
        createTable: jest.fn().mockResolvedValue(undefined),
        dropTable: jest.fn().mockResolvedValue(undefined),
        addIndex: jest.fn().mockResolvedValue(undefined),
        sequelize: {
          query,
          transaction: jest.fn(async callback => callback("tx"))
        }
      } as any,
      query
    };
  };

  it("creates append-only audit fields and stale partial indexes", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.up(queryInterface);
    expect(queryInterface.createTable).toHaveBeenCalledWith(
      "DispatchReconciliationAudits",
      expect.objectContaining({
        companyId: expect.objectContaining({ allowNull: false }),
        actorUserId: expect.objectContaining({ allowNull: true }),
        reason: expect.objectContaining({ allowNull: false })
      }),
      { transaction: "tx" }
    );
    expect(queryInterface.addIndex).toHaveBeenCalledTimes(2);
    const ddl = query.mock.calls.map(call => call[0]).join("\n");
    expect(ddl).toContain("char_length(btrim(reason)) BETWEEN 10 AND 500");
    expect(ddl).toContain('"nextStatus" = \'AWAITING_CONFIRMATION\'');
    expect(ddl).toContain('"nextStatus" IN (\'ENVIADA\', \'PENDENTE\')');
    expect(ddl).toContain("status = 'PROCESSANDO'");
    expect(ddl).toContain('"dispatchStatus" = \'PROCESSING\'');
    expect(ddl).toContain('("companyId", "dispatchStartedAt", id)');
  });

  it("drops only reconciliation indexes and table on rollback", async () => {
    const { queryInterface, query } = createQueryInterface();
    await migration.down(queryInterface);
    expect(query).toHaveBeenCalledTimes(2);
    expect(queryInterface.dropTable).toHaveBeenCalledWith(
      "DispatchReconciliationAudits",
      { transaction: "tx" }
    );
  });
});
