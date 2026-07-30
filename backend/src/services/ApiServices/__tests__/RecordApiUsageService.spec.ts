import sequelize from "../../../database";
import RecordApiUsageService from "../RecordApiUsageService";

jest.mock("../../../database", () => ({
  query: jest.fn()
}));

const query = sequelize.query as jest.Mock;

describe("RecordApiUsageService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("records all counters in one atomic upsert", async () => {
    query.mockResolvedValue([1, 1]);
    await RecordApiUsageService(9, "29/07/2026", {
      usedText: 2,
      usedImage: 3
    });

    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain('ON CONFLICT ("companyId", "dateUsed")');
    expect(sql).toContain('"ApiUsages"."usedImage" + EXCLUDED."usedImage"');
    expect(options.replacements).toMatchObject({
      companyId: 9,
      dateUsed: "29/07/2026",
      usedOnDay: 5,
      usedText: 2,
      usedImage: 3,
      usedPDF: 0,
      usedVideo: 0,
      usedOther: 0,
      usedCheckNumber: 0
    });
  });

  it.each([
    [0, "29/07/2026", { usedText: 1 }],
    [1, "2026-07-29", { usedText: 1 }],
    [1, "29/07/2026", {}],
    [1, "29/07/2026", { usedText: -1 }],
    [1, "29/07/2026", { usedText: 1.5 }],
    [1, "29/07/2026", { usedText: 1001 }]
  ])("rejects invalid ownership or counters", async (companyId, date, values) => {
    await expect(
      RecordApiUsageService(companyId as number, date as string, values)
    ).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
});
