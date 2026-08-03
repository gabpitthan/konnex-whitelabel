import { QueryTypes } from "sequelize";
import sequelize from "../../database";
import Contact from "../../models/Contact";
import Schedule from "../../models/Schedule";
import User from "../../models/User";

interface Request {
  id: number;
  companyId: number;
  dispatchKey: string;
}

const BeginScheduleDispatchService = async ({
  id,
  companyId,
  dispatchKey
}: Request): Promise<Schedule | null> => {
  const claimed = await sequelize.query<{ id: number }>(
    `
      UPDATE "Schedules"
         SET status = 'PROCESSANDO',
             "dispatchStartedAt" = NOW(),
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

  if (claimed.length !== 1) return null;

  return Schedule.findOne({
    where: {
      id,
      companyId,
      dispatchKey,
      status: "PROCESSANDO",
      sentAt: null
    },
    include: [
      { model: Contact, as: "contact" },
      { model: User, as: "user", attributes: ["id", "name"] }
    ]
  });
};

export default BeginScheduleDispatchService;
