const query = jest.fn();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query }
}));

import ClaimDueSchedulesService from "../ClaimDueSchedulesService";

describe("ClaimDueSchedulesService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("claims due and stale rows atomically with skip locked", async () => {
    query.mockResolvedValueOnce([
      { id: 1, companyId: 7, dispatchKey: "claim-1" }
    ]);
    const horizon = new Date("2026-08-03T12:00:30Z");
    const staleBefore = new Date("2026-08-03T11:58:00Z");

    const result = await ClaimDueSchedulesService({
      horizon,
      staleBefore,
      limit: 1000
    });

    expect(result).toHaveLength(1);
    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain("FOR UPDATE SKIP LOCKED");
    expect(sql).toContain("gen_random_uuid()");
    expect(sql).toContain("status = 'PENDENTE'");
    expect(sql).toContain("status = 'AGENDADA'");
    expect(sql).toContain('ORDER BY "sendAt" ASC, id ASC');
    expect(options.replacements).toEqual({
      horizon,
      staleBefore,
      limit: 500
    });
  });
});
