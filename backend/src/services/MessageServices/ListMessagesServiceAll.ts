import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Message from "../../models/Message";

interface Request {
  companyId: number;
  fromMe: boolean;
  dateStart: string;
  dateEnd: string;
}

interface Response {
  count: number;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const ListMessagesServiceAll = async ({
  companyId,
  fromMe,
  dateStart,
  dateEnd
}: Request): Promise<Response> => {
  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new AppError("INVALID_COMPANY", 400);
  }
  if (
    (dateStart || dateEnd) &&
    (!isIsoDate(dateStart) ||
      !isIsoDate(dateEnd) ||
      dateStart > dateEnd)
  ) {
    throw new AppError("INVALID_MESSAGE_RANGE", 400);
  }

  const where: Record<string, unknown> = { companyId };
  if (fromMe) where.fromMe = true;
  if (dateStart && dateEnd) {
    const endExclusive = new Date(`${dateEnd}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    where.createdAt = {
      [Op.gte]: new Date(`${dateStart}T00:00:00.000Z`),
      [Op.lt]: endExclusive
    };
  }

  return {
    count: await Message.count({ where })
  };
};

export default ListMessagesServiceAll;
