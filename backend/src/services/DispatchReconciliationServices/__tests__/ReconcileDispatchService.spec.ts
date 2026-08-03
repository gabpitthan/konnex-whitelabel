const query = jest.fn();
const transaction = jest.fn(async callback => callback("tx"));

jest.mock("../../../database", () => ({
  __esModule: true,
  default: { query, transaction }
}));

import ReconcileDispatchService from "../ReconcileDispatchService";

const base = {
  companyId: 7,
  actorUserId: 3,
  entityId: 9,
  expectedDispatchKey: "00000000-0000-4000-8000-000000000009",
  reason: "Confirmação operacional documentada",
  now: new Date("2026-08-03T20:00:00Z")
};

describe("ReconcileDispatchService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.DISPATCH_RECONCILIATION_STALE_MS;
    query.mockResolvedValueOnce([{ id: 3 }]);
  });

  it("acknowledges an exact stale schedule and writes audit atomically", async () => {
    query
      .mockResolvedValueOnce([{
        entityId: 9,
        parentId: null,
        previousStatus: "PROCESSANDO",
        previousStartedAt: new Date("2026-08-03T19:00:00Z"),
        phase: "MESSAGE",
        parentStatus: "PROCESSANDO"
      }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(ReconcileDispatchService({
      ...base,
      entityType: "SCHEDULE",
      action: "ACKNOWLEDGE"
    })).resolves.toEqual({ nextStatus: "ENVIADA", phase: "MESSAGE" });

    expect(query.mock.calls[1][0]).toContain("FOR UPDATE");
    expect(query.mock.calls[1][1].replacements.staleBefore).toEqual(
      new Date("2026-08-03T19:45:00Z")
    );
    expect(query.mock.calls[2][0]).toContain("status = 'ENVIADA'");
    expect(query.mock.calls[2][0]).toContain('"dispatchKey" = :expectedDispatchKey');
    expect(query.mock.calls[3][0]).toContain('INSERT INTO "DispatchReconciliationAudits"');
    expect(query.mock.calls.every(call => call[1].transaction === "tx")).toBe(true);
  });

  it("acknowledges a confirmation phase without marking content delivered", async () => {
    query
      .mockResolvedValueOnce([{
        entityId: 9,
        parentId: 5,
        previousStatus: "PROCESSING",
        previousStartedAt: new Date("2026-08-03T19:00:00Z"),
        phase: "CONFIRMATION",
        parentStatus: "EM_ANDAMENTO"
      }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(ReconcileDispatchService({
      ...base,
      entityType: "CAMPAIGN_SHIPPING",
      action: "ACKNOWLEDGE"
    })).resolves.toEqual({
      nextStatus: "AWAITING_CONFIRMATION",
      phase: "CONFIRMATION"
    });
    expect(query.mock.calls[2][0]).toContain("'AWAITING_CONFIRMATION'");
    expect(query.mock.calls[2][0]).not.toContain('"deliveredAt"');
  });

  it("acknowledges content and conditionally finalizes the tenant campaign", async () => {
    query
      .mockResolvedValueOnce([{
        entityId: 9,
        parentId: 5,
        previousStatus: "PROCESSING",
        previousStartedAt: new Date("2026-08-03T19:00:00Z"),
        phase: "CONTENT",
        parentStatus: "EM_ANDAMENTO"
      }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await expect(ReconcileDispatchService({
      ...base,
      entityType: "CAMPAIGN_SHIPPING",
      action: "ACKNOWLEDGE"
    })).resolves.toEqual({ nextStatus: "DONE", phase: "CONTENT" });
    expect(query.mock.calls[2][0]).toContain('"dispatchStatus" = \'DONE\'');
    expect(query.mock.calls[3][0]).toContain("status = 'FINALIZADA'");
    expect(query.mock.calls[3][0]).toContain('done."companyId" = campaign."companyId"');
    expect(query.mock.calls[4][0]).toContain('INSERT INTO "DispatchReconciliationAudits"');
  });

  it("rejects rearm when the parent campaign is no longer active", async () => {
    query.mockResolvedValueOnce([{
      entityId: 9,
      parentId: 5,
      previousStatus: "PROCESSING",
      previousStartedAt: new Date("2026-08-03T19:00:00Z"),
      phase: "CONTENT",
      parentStatus: "CANCELADA"
    }]);

    await expect(ReconcileDispatchService({
      ...base,
      entityType: "CAMPAIGN_SHIPPING",
      action: "REARM"
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects a stale UI decision after another actor changed the row", async () => {
    query.mockResolvedValueOnce([]);
    await expect(ReconcileDispatchService({
      ...base,
      entityType: "SCHEDULE",
      action: "REARM"
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects short reasons before opening a transaction", async () => {
    await expect(ReconcileDispatchService({
      ...base,
      entityType: "SCHEDULE",
      action: "REARM",
      reason: "curto"
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("requires the actor to remain an admin in the current tenant", async () => {
    query.mockReset();
    query.mockResolvedValueOnce([]);
    await expect(ReconcileDispatchService({
      ...base,
      entityType: "SCHEDULE",
      action: "ACKNOWLEDGE"
    })).rejects.toMatchObject({ statusCode: 403 });
    expect(query.mock.calls[0][0]).toContain("profile = 'admin'");
    expect(query).toHaveBeenCalledTimes(1);
  });
});
