import { QueryTypes } from "sequelize";
import sequelize from "../../database";

type Outcome = "AWAITING_CONFIRMATION" | "DONE" | "ERROR";

interface Request {
  id: number;
  companyId: number;
  dispatchKey: string;
  outcome: Outcome;
}

const CompleteCampaignDispatchService = async ({
  id,
  companyId,
  dispatchKey,
  outcome
}: Request): Promise<boolean> => {
  const timestampColumn = outcome === "AWAITING_CONFIRMATION"
    ? `"confirmationRequestedAt" = NOW(),`
    : outcome === "DONE"
      ? `"deliveredAt" = NOW(),`
      : "";

  const rows = await sequelize.query<{ id: number }>(
    `
      UPDATE "CampaignShipping"
         SET "dispatchStatus" = :outcome,
             ${timestampColumn}
             "dispatchKey" = NULL,
             "updatedAt" = NOW()
       WHERE id = :id
         AND "companyId" = :companyId
         AND "dispatchKey" = :dispatchKey
         AND "dispatchStatus" = 'PROCESSING'
      RETURNING id
    `,
    {
      replacements: { id, companyId, dispatchKey, outcome },
      type: QueryTypes.SELECT
    }
  );

  return rows.length === 1;
};

export default CompleteCampaignDispatchService;
