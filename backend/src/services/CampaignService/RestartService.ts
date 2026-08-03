import Campaign from "../../models/Campaign";
import { campaignQueue } from "../../queues";
import sequelize from "../../database";

export async function RestartService(id: number, companyId: number) {
  const campaign = await Campaign.findOne({ where: { id, companyId } });
  if (!campaign) return;
  await campaign.update({ status: "EM_ANDAMENTO" });

  await sequelize.query(
    `
      UPDATE "CampaignShipping"
         SET "dispatchStatus" = 'PENDING',
             "dispatchKey" = gen_random_uuid(),
             "dispatchStartedAt" = NULL,
             "updatedAt" = NOW()
       WHERE "campaignId" = :id
         AND "companyId" = :companyId
         AND "dispatchStatus" = 'ERROR'
         AND "deliveredAt" IS NULL
    `,
    { replacements: { id, companyId } }
  );

  await campaignQueue.add("ProcessCampaign", {
    id: campaign.id,
    companyId,
    delay: 3000
  }, { jobId: `campaign-process:${companyId}:${campaign.id}:${Date.now()}` });
}
