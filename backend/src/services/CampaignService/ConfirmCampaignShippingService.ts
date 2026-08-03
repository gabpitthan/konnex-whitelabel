import { QueryTypes } from "sequelize";
import sequelize from "../../database";

export interface ConfirmedCampaignDispatch {
  id: number;
  campaignId: number;
  companyId: number;
  dispatchKey: string;
}

interface Request {
  companyId: number;
  number: string;
}

const ConfirmCampaignShippingService = async ({
  companyId,
  number
}: Request): Promise<ConfirmedCampaignDispatch | null> => {
  const rows = await sequelize.query<ConfirmedCampaignDispatch>(
    `
      WITH candidate AS (
        SELECT shipping.id
          FROM "CampaignShipping" shipping
          JOIN "Campaigns" campaign
            ON campaign.id = shipping."campaignId"
           AND campaign."companyId" = shipping."companyId"
         WHERE shipping."companyId" = :companyId
           AND shipping.number = :number
           AND shipping.confirmation IS NULL
           AND shipping."dispatchStatus" = 'AWAITING_CONFIRMATION'
           AND campaign.status = 'EM_ANDAMENTO'
           AND campaign.confirmation = TRUE
         ORDER BY shipping."confirmationRequestedAt" ASC, shipping.id ASC
         FOR UPDATE OF shipping SKIP LOCKED
         LIMIT 1
      )
      UPDATE "CampaignShipping" shipping
         SET confirmation = TRUE,
             "confirmedAt" = NOW(),
             "dispatchKey" = gen_random_uuid(),
             "dispatchStatus" = 'PENDING',
             "dispatchStartedAt" = NULL,
             "updatedAt" = NOW()
        FROM candidate
       WHERE shipping.id = candidate.id
      RETURNING shipping.id,
                shipping."campaignId" AS "campaignId",
                shipping."companyId" AS "companyId",
                shipping."dispatchKey" AS "dispatchKey"
    `,
    { replacements: { companyId, number }, type: QueryTypes.SELECT }
  );

  return rows.length === 1 ? rows[0] : null;
};

export default ConfirmCampaignShippingService;
