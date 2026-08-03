const query = jest.fn();
const findOne = jest.fn();

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query }
}));
jest.mock("../../../models/Schedule", () => ({
  __esModule: true,
  default: { findOne }
}));

import BeginScheduleDispatchService from "../BeginScheduleDispatchService";

describe("BeginScheduleDispatchService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows exactly one AGENDADA claim to enter PROCESSANDO", async () => {
    query.mockResolvedValueOnce([{ id: 9 }]);
    findOne.mockResolvedValueOnce({ id: 9 });

    await expect(
      BeginScheduleDispatchService({
        id: 9,
        companyId: 7,
        dispatchKey: "claim"
      })
    ).resolves.toEqual({ id: 9 });

    const [sql] = query.mock.calls[0];
    expect(sql).toContain("status = 'PROCESSANDO'");
    expect(sql).toContain('"companyId" = :companyId');
    expect(sql).toContain('"dispatchKey" = :dispatchKey');
    expect(sql).toContain("status = 'AGENDADA'");
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 9,
          companyId: 7,
          dispatchKey: "claim",
          status: "PROCESSANDO"
        })
      })
    );
  });

  it("skips a duplicate or stale job without loading customer data", async () => {
    query.mockResolvedValueOnce([]);
    await expect(
      BeginScheduleDispatchService({
        id: 9,
        companyId: 7,
        dispatchKey: "stale"
      })
    ).resolves.toBeNull();
    expect(findOne).not.toHaveBeenCalled();
  });
});
