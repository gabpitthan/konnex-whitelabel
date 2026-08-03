import { QueryTypes } from "sequelize";
import sequelize from "../../database";

export interface PendingCampaignDispatch {
  id: number;
  campaignId: number;
  companyId: number;
  dispatchKey: string;
}

const ListPendingCampaignDispatchesService = async (
  limit = 100
): Promise<PendingCampaignDispatch[]> => {
  const boundedLimit = Math.max(1, Math.min(500, Math.trunc(limit)));

  return sequelize.query<PendingCampaignDispatch>(
    `
      SELECT shipping.id,
             shipping."campaignId" AS "campaignId",
             shipping."companyId" AS "companyId",
             shipping."dispatchKey" AS "dispatchKey"
        FROM "CampaignShipping" shipping
        JOIN "Campaigns" campaign
          ON campaign.id = shipping."campaignId"
         AND campaign."companyId" = shipping."companyId"
       WHERE shipping."dispatchStatus" = 'PENDING'
         AND shipping."dispatchKey" IS NOT NULL
         AND campaign.status = 'EM_ANDAMENTO'
       ORDER BY shipping."updatedAt" ASC, shipping.id ASC
       LIMIT :limit
    `,
    { replacements: { limit: boundedLimit }, type: QueryTypes.SELECT }
  );
};

export default ListPendingCampaignDispatchesService;
