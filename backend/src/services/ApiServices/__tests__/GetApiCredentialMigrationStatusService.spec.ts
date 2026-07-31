import sequelize from "../../../database";
import GetApiCredentialMigrationStatusService from "../GetApiCredentialMigrationStatusService";

jest.mock("../../../database", () => ({
  query: jest.fn()
}));

const query = sequelize.query as jest.Mock;

describe("GetApiCredentialMigrationStatusService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns tenant-scoped, low-cardinality migration evidence", async () => {
    query.mockResolvedValue([
      {
        observationStartedOn: "2026-07-01",
        lastLegacyUseOn: "2026-07-01",
        legacyRequestsLast30Days: "0",
        digestRequestsLast30Days: "42",
        activeLegacyCredentials: "0",
        readyToRemoveLegacy: true
      }
    ]);
    await expect(
      GetApiCredentialMigrationStatusService(9)
    ).resolves.toEqual({
      observationStartedOn: "2026-07-01",
      lastLegacyUseOn: "2026-07-01",
      legacyRequestsLast30Days: 0,
      digestRequestsLast30Days: 42,
      activeLegacyCredentials: 0,
      readyToRemoveLegacy: true
    });
    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain('"companyId" = :companyId');
    expect(sql).not.toContain("SELECT token");
    expect(options.replacements).toEqual({ companyId: 9 });
  });

  it("rejects an invalid tenant before querying", async () => {
    await expect(
      GetApiCredentialMigrationStatusService(0)
    ).rejects.toThrow("ERR_API_CREDENTIAL_STATUS_INVALID_OWNER");
    expect(query).not.toHaveBeenCalled();
  });
});
