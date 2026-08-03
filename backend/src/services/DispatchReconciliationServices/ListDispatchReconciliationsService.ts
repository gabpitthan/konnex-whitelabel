import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import { getDispatchReconciliationStaleMs } from "./config";

export interface DispatchReconciliationItem {
  entityType: "SCHEDULE" | "CAMPAIGN_SHIPPING";
  entityId: number;
  parentId: number | null;
  contactId: number | null;
  phase: "MESSAGE" | "CONFIRMATION" | "CONTENT";
  startedAt: Date;
  reconciliationToken: string;
  parentStatus: string;
}

interface Request {
  companyId: number;
  limit?: number;
  now?: Date;
}

const ListDispatchReconciliationsService = async ({
  companyId,
  limit = 100,
  now = new Date()
}: Request): Promise<{
  items: DispatchReconciliationItem[];
  staleBefore: Date;
}> => {
  const normalizedLimit = Number.isFinite(limit) ? Math.trunc(limit) : 100;
  const boundedLimit = Math.max(1, Math.min(200, normalizedLimit));
  const staleBefore = new Date(
    now.getTime() - getDispatchReconciliationStaleMs()
  );

  const items = await sequelize.query<DispatchReconciliationItem>(
    `
      SELECT candidate."entityType" AS "entityType",
             candidate."entityId" AS "entityId",
             candidate."parentId" AS "parentId",
             candidate."contactId" AS "contactId",
             candidate.phase,
             candidate."startedAt" AS "startedAt",
             candidate."reconciliationToken" AS "reconciliationToken",
             candidate."parentStatus" AS "parentStatus"
        FROM (
          SELECT 'SCHEDULE'::text AS "entityType",
                 schedule.id AS "entityId",
                 NULL::integer AS "parentId",
                 schedule."contactId" AS "contactId",
                 'MESSAGE'::text AS phase,
                 schedule."dispatchStartedAt" AS "startedAt",
                 schedule."dispatchKey" AS "reconciliationToken",
                 schedule.status AS "parentStatus"
            FROM "Schedules" schedule
           WHERE schedule."companyId" = :companyId
             AND schedule.status = 'PROCESSANDO'
             AND schedule."dispatchStartedAt" <= :staleBefore
          UNION ALL
          SELECT 'CAMPAIGN_SHIPPING'::text AS "entityType",
                 shipping.id AS "entityId",
                 shipping."campaignId" AS "parentId",
                 shipping."contactId" AS "contactId",
                 CASE
                   WHEN campaign.confirmation = TRUE
                        AND shipping.confirmation IS NULL
                     THEN 'CONFIRMATION'
                   ELSE 'CONTENT'
                 END AS phase,
                 shipping."dispatchStartedAt" AS "startedAt",
                 shipping."dispatchKey" AS "reconciliationToken",
                 campaign.status AS "parentStatus"
            FROM "CampaignShipping" shipping
            JOIN "Campaigns" campaign
              ON campaign.id = shipping."campaignId"
             AND campaign."companyId" = shipping."companyId"
           WHERE shipping."companyId" = :companyId
             AND shipping."dispatchStatus" = 'PROCESSING'
             AND shipping."dispatchStartedAt" <= :staleBefore
        ) candidate
       ORDER BY candidate."startedAt" ASC,
                candidate."entityType" ASC,
                candidate."entityId" ASC
       LIMIT :limit
    `,
    {
      replacements: { companyId, staleBefore, limit: boundedLimit },
      type: QueryTypes.SELECT
    }
  );

  return { items, staleBefore };
};

export default ListDispatchReconciliationsService;
