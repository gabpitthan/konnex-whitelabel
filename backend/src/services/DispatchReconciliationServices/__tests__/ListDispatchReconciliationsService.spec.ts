const query = jest.fn();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query }
}));

import ListDispatchReconciliationsService from "../ListDispatchReconciliationsService";

describe("ListDispatchReconciliationsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DISPATCH_RECONCILIATION_STALE_MS;
  });

  it("returns a bounded tenant-scoped union without message content", async () => {
    query.mockResolvedValueOnce([]);
    const now = new Date("2026-08-03T20:00:00Z");
    await ListDispatchReconciliationsService({
      companyId: 7,
      limit: 999,
      now
    });

    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain('schedule."companyId" = :companyId');
    expect(sql).toContain('shipping."companyId" = :companyId');
    expect(sql).toContain("status = 'PROCESSANDO'");
    expect(sql).toContain('"dispatchStatus" = \'PROCESSING\'');
    expect(sql).toContain('ORDER BY candidate."startedAt" ASC');
    expect(sql).toContain('schedule."dispatchKey" AS "reconciliationToken"');
    expect(sql).not.toContain("schedule.body");
    expect(sql).not.toContain("shipping.message");
    expect(options.replacements).toEqual({
      companyId: 7,
      staleBefore: new Date("2026-08-03T19:45:00Z"),
      limit: 200
    });
  });
});
