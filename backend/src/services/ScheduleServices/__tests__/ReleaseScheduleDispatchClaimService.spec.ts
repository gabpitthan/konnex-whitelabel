const query = jest.fn();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query }
}));

import ReleaseScheduleDispatchClaimService from "../ReleaseScheduleDispatchClaimService";

describe("ReleaseScheduleDispatchClaimService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("releases only the exact tenant-owned unconsumed claim", async () => {
    query.mockResolvedValueOnce([{ id: 9 }]);
    await expect(
      ReleaseScheduleDispatchClaimService({
        id: 9,
        companyId: 7,
        dispatchKey: "claim"
      })
    ).resolves.toBe(true);

    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain('"companyId" = :companyId');
    expect(sql).toContain('"dispatchKey" = :dispatchKey');
    expect(sql).toContain("status = 'AGENDADA'");
    expect(options.replacements).toEqual({
      id: 9,
      companyId: 7,
      dispatchKey: "claim"
    });
  });
});
