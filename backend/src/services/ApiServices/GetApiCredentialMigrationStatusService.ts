import { QueryTypes } from "sequelize";
import sequelize from "../../database";

export interface ApiCredentialMigrationStatus {
  observationStartedOn: string | null;
  lastLegacyUseOn: string | null;
  legacyRequestsLast30Days: number;
  digestRequestsLast30Days: number;
  activeLegacyCredentials: number;
  readyToRemoveLegacy: boolean;
}

interface StatusRow {
  observationStartedOn: string | null;
  lastLegacyUseOn: string | null;
  legacyRequestsLast30Days: string | number;
  digestRequestsLast30Days: string | number;
  activeLegacyCredentials: string | number;
  readyToRemoveLegacy: boolean;
}

const GetApiCredentialMigrationStatusService = async (
  companyId: number
): Promise<ApiCredentialMigrationStatus> => {
  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("ERR_API_CREDENTIAL_STATUS_INVALID_OWNER");
  }

  const [row] = await sequelize.query<StatusRow>(
    `
      WITH usage AS (
        SELECT
          TO_DATE("dateUsed", 'DD/MM/YYYY') AS day,
          "legacyAuthCount",
          "digestAuthCount"
        FROM "ApiUsages"
        WHERE "companyId" = :companyId
      ),
      usage_summary AS (
        SELECT
          TO_CHAR(
            MIN(day) FILTER (
              WHERE "legacyAuthCount" + "digestAuthCount" > 0
            ),
            'YYYY-MM-DD'
          ) AS "observationStartedOn",
          TO_CHAR(
            MAX(day) FILTER (WHERE "legacyAuthCount" > 0),
            'YYYY-MM-DD'
          ) AS "lastLegacyUseOn",
          COALESCE(
            SUM("legacyAuthCount") FILTER (
              WHERE day >= CURRENT_DATE - 29
            ),
            0
          ) AS "legacyRequestsLast30Days",
          COALESCE(
            SUM("digestAuthCount") FILTER (
              WHERE day >= CURRENT_DATE - 29
            ),
            0
          ) AS "digestRequestsLast30Days",
          MIN(day) FILTER (
            WHERE "legacyAuthCount" + "digestAuthCount" > 0
          ) AS observation_start
        FROM usage
      ),
      legacy_credentials AS (
        SELECT COUNT(*) AS active_count
        FROM "Whatsapps"
        WHERE "companyId" = :companyId
          AND channel = 'whatsapp'
          AND token <> ''
          AND (
            "apiTokenLegacyExpiresAt" IS NULL
            OR "apiTokenLegacyExpiresAt" > NOW()
          )
      )
      SELECT
        summary."observationStartedOn",
        summary."lastLegacyUseOn",
        summary."legacyRequestsLast30Days",
        summary."digestRequestsLast30Days",
        legacy.active_count AS "activeLegacyCredentials",
        (
          summary.observation_start <= CURRENT_DATE - 30
          AND summary."legacyRequestsLast30Days" = 0
          AND summary."digestRequestsLast30Days" > 0
          AND legacy.active_count = 0
        ) AS "readyToRemoveLegacy"
      FROM usage_summary summary
      CROSS JOIN legacy_credentials legacy
    `,
    {
      replacements: { companyId },
      type: QueryTypes.SELECT
    }
  );

  return {
    observationStartedOn: row.observationStartedOn,
    lastLegacyUseOn: row.lastLegacyUseOn,
    legacyRequestsLast30Days: Number(row.legacyRequestsLast30Days),
    digestRequestsLast30Days: Number(row.digestRequestsLast30Days),
    activeLegacyCredentials: Number(row.activeLegacyCredentials),
    readyToRemoveLegacy: Boolean(row.readyToRemoveLegacy)
  };
};

export default GetApiCredentialMigrationStatusService;
