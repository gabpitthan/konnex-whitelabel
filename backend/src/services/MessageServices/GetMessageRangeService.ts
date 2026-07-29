import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import { QueryTypes } from "sequelize";
import sequelize from "../../database";

interface Request {
    companyId: number;
    startDate: string;
    lastDate: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const GetMessageRangeService = async ({ companyId, startDate, lastDate }: Request): Promise<Message[]> => {
    if (
      !Number.isInteger(companyId) ||
      companyId <= 0 ||
      !isIsoDate(startDate) ||
      !isIsoDate(lastDate) ||
      startDate > lastDate
    ) {
      throw new AppError("INVALID_MESSAGE_RANGE", 400);
    }

    const messages = await sequelize.query<Message>(
        `SELECT * FROM "Messages"
         WHERE "companyId" = :companyId
           AND "createdAt" >= :startDate
           AND "createdAt" < (CAST(:lastDate AS date) + INTERVAL '1 day')`,
        {
            replacements: { companyId, startDate, lastDate },
            type: QueryTypes.SELECT
        }
    );

    if (!messages) {
        throw new AppError("MESSAGES_NOT_FIND");
    }

    return messages;
};

export default GetMessageRangeService;
