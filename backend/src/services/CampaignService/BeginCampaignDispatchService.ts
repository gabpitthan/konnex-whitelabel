import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import CampaignShipping from "../../models/CampaignShipping";
import ContactListItem from "../../models/ContactListItem";

interface Request {
  id: number;
  campaignId: number;
  companyId: number;
  dispatchKey: string;
}

const BeginCampaignDispatchService = async ({
  id,
  campaignId,
  companyId,
  dispatchKey
}: Request): Promise<CampaignShipping | null> => {
  const claimed = await sequelize.query<{ id: number }>(
    `
      UPDATE "CampaignShipping"
         SET "dispatchStatus" = 'PROCESSING',
             "dispatchStartedAt" = NOW(),
             "updatedAt" = NOW()
       WHERE id = :id
         AND "campaignId" = :campaignId
         AND "companyId" = :companyId
         AND "dispatchKey" = :dispatchKey
         AND "dispatchStatus" = 'PENDING'
         AND EXISTS (
           SELECT 1
             FROM "Campaigns" campaign
            WHERE campaign.id = :campaignId
              AND campaign."companyId" = :companyId
              AND campaign.status = 'EM_ANDAMENTO'
         )
      RETURNING id
    `,
    {
      replacements: { id, campaignId, companyId, dispatchKey },
      type: QueryTypes.SELECT
    }
  );

  if (claimed.length !== 1) return null;

  return CampaignShipping.findOne({
    where: {
      id,
      campaignId,
      companyId,
      dispatchKey,
      dispatchStatus: "PROCESSING"
    },
    include: [{
      model: ContactListItem,
      as: "contact",
      where: { companyId }
    }]
  });
};

export default BeginCampaignDispatchService;
