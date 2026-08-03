import { QueryTypes } from "sequelize";
import sequelize from "../../database";

interface Request {
  id: number;
  companyId: number;
  dispatchKey: string;
}

const ReleaseScheduleDispatchClaimService = async ({
  id,
  companyId,
  dispatchKey
}: Request): Promise<boolean> => {
  const rows = await sequelize.query<{ id: number }>(
    `
      UPDATE "Schedules"
         SET status = 'PENDENTE',
             "dispatchKey" = NULL,
             "dispatchClaimedAt" = NULL,
             "updatedAt" = NOW()
       WHERE id = :id
         AND "companyId" = :companyId
         AND "dispatchKey" = :dispatchKey
         AND status = 'AGENDADA'
         AND "sentAt" IS NULL
      RETURNING id
    `,
    {
      replacements: { id, companyId, dispatchKey },
      type: QueryTypes.SELECT
    }
  );

  return rows.length === 1;
};

export default ReleaseScheduleDispatchClaimService;
