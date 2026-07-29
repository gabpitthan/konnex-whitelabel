const query = jest.fn();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query }
}));

import GetMessageRangeService from "../GetMessageRangeService";

describe("GetMessageRangeService", () => {
  beforeEach(() => query.mockReset());

  it("binds tenant and date values instead of interpolating SQL", async () => {
    query.mockResolvedValue([]);

    await GetMessageRangeService({
      companyId: 7,
      startDate: "2026-07-01",
      lastDate: "2026-07-31"
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"companyId" = :companyId'),
      expect.objectContaining({
        replacements: {
          companyId: 7,
          startDate: "2026-07-01",
          lastDate: "2026-07-31"
        }
      })
    );
    expect(query.mock.calls[0][0]).not.toContain("2026-07-01");
  });

  it.each([
    { companyId: 0, startDate: "2026-07-01", lastDate: "2026-07-31" },
    { companyId: 7, startDate: "invalid", lastDate: "2026-07-31" },
    { companyId: 7, startDate: "2026-02-30", lastDate: "2026-07-31" },
    { companyId: 7, startDate: "2026-08-01", lastDate: "2026-07-31" }
  ])("rejects an invalid range without querying", async request => {
    await expect(GetMessageRangeService(request)).rejects.toMatchObject({
      message: "INVALID_MESSAGE_RANGE",
      statusCode: 400
    });
    expect(query).not.toHaveBeenCalled();
  });
});
