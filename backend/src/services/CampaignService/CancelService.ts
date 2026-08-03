import { QueryTypes } from "sequelize";
import Campaign from "../../models/Campaign";
import { campaignQueue } from "../../queues";
import sequelize from "../../database";

export async function CancelService(id: number, companyId: number) {
  const campaign = await Campaign.findOne({ where: { id, companyId } });
  if (!campaign) return;
  await campaign.update({ status: "CANCELADA" });

  const recordsToCancel = await sequelize.query<{ jobId: string | null }>(
    `
      UPDATE "CampaignShipping"
         SET "dispatchStatus" = 'CANCELLED',
             "dispatchKey" = NULL,
             "updatedAt" = NOW()
       WHERE "campaignId" = :id
         AND "companyId" = :companyId
         AND "dispatchStatus" IN ('PENDING', 'ERROR')
      RETURNING "jobId" AS "jobId"
    `,
    {
      replacements: { id, companyId },
      type: QueryTypes.SELECT
    }
  );

  const promises = [];

  for (let record of recordsToCancel) {
    if (!record.jobId) continue;
    const job = await campaignQueue.getJob(record.jobId);
    if (job) {
      promises.push(job.remove());
    }
  }

  await Promise.all(promises);
}
