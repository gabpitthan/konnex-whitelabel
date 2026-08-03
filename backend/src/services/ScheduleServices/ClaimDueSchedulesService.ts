import { QueryTypes } from "sequelize";
import sequelize from "../../database";

export interface ScheduleDispatchClaim {
  id: number;
  companyId: number;
  dispatchKey: string;
}

interface Request {
  horizon?: Date;
  staleBefore?: Date;
  limit?: number;
}

const ClaimDueSchedulesService = async ({
  horizon = new Date(Date.now() + 30_000),
  staleBefore = new Date(Date.now() - 2 * 60_000),
  limit = 100
}: Request = {}): Promise<ScheduleDispatchClaim[]> => {
  const boundedLimit = Math.max(1, Math.min(500, Math.trunc(limit)));

  return sequelize.query<ScheduleDispatchClaim>(
    `
      WITH candidates AS (
        SELECT id
          FROM "Schedules"
         WHERE "sentAt" IS NULL
           AND (
             (status = 'PENDENTE' AND "sendAt" <= :horizon)
             OR (
               status = 'AGENDADA'
               AND "dispatchClaimedAt" < :staleBefore
             )
           )
         ORDER BY "sendAt" ASC, id ASC
         FOR UPDATE SKIP LOCKED
         LIMIT :limit
      ), claimed AS (
        UPDATE "Schedules" AS schedule
           SET status = 'AGENDADA',
               "dispatchKey" = COALESCE(
                 schedule."dispatchKey",
                 gen_random_uuid()
               ),
               "dispatchClaimedAt" = NOW(),
               "updatedAt" = NOW()
          FROM candidates
         WHERE schedule.id = candidates.id
        RETURNING schedule.id,
                  schedule."companyId" AS "companyId",
                  schedule."dispatchKey" AS "dispatchKey"
      )
      SELECT id, "companyId", "dispatchKey"
        FROM claimed
       ORDER BY id ASC
    `,
    {
      replacements: { horizon, staleBefore, limit: boundedLimit },
      type: QueryTypes.SELECT
    }
  );
};

export default ClaimDueSchedulesService;
