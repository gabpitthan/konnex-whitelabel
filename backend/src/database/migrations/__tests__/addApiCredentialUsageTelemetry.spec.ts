const migration = require(
  "../20260731200000-add-api-credential-usage-telemetry"
);

export {};

const transaction = {};
const queryInterface = () => ({
  sequelize: {
    transaction: jest.fn((callback: any) => callback(transaction))
  },
  addColumn: jest.fn().mockResolvedValue(undefined),
  removeColumn: jest.fn().mockResolvedValue(undefined)
});

describe("API credential usage telemetry migration", () => {
  it("adds both zero-default counters atomically", async () => {
    const qi = queryInterface();
    await migration.up(qi as any);
    expect(qi.addColumn).toHaveBeenCalledTimes(2);
    for (const name of ["legacyAuthCount", "digestAuthCount"]) {
      expect(qi.addColumn).toHaveBeenCalledWith(
        "ApiUsages",
        name,
        expect.objectContaining({ allowNull: false, defaultValue: 0 }),
        { transaction }
      );
    }
  });

  it("removes only the telemetry counters on rollback", async () => {
    const qi = queryInterface();
    await migration.down(qi as any);
    expect(qi.removeColumn.mock.calls).toEqual([
      ["ApiUsages", "digestAuthCount", { transaction }],
      ["ApiUsages", "legacyAuthCount", { transaction }]
    ]);
  });
});
