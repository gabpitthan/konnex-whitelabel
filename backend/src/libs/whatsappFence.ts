import { Op, QueryTypes, Transaction } from "sequelize";
import sequelize from "../database";
import Whatsapp from "../models/Whatsapp";

export interface WhatsappSessionOwner {
  whatsappId: number;
  companyId: number;
}

export class WhatsappFenceLostError extends Error {
  constructor() {
    super("WHATSAPP_SESSION_FENCE_LOST");
    this.name = "WhatsappFenceLostError";
  }
}

export const nextWhatsappSessionFence = async (): Promise<string> => {
  const rows = await sequelize.query<{ fence: string }>(
    "SELECT nextval('whatsapp_session_fence_seq')::text AS fence",
    { type: QueryTypes.SELECT }
  );
  if (!rows[0]?.fence) throw new Error("WHATSAPP_SESSION_FENCE_UNAVAILABLE");
  return rows[0].fence;
};

export const claimWhatsappSessionFence = async (
  owner: WhatsappSessionOwner,
  fence: string
): Promise<void> => {
  const [affected] = await Whatsapp.update(
    { sessionFence: fence },
    {
      where: {
        id: owner.whatsappId,
        companyId: owner.companyId,
        channel: "whatsapp",
        sessionFence: { [Op.lt]: fence }
      }
    }
  );
  if (affected !== 1) throw new WhatsappFenceLostError();
};

export const updateWhatsappLifecycleWithFence = async (
  owner: WhatsappSessionOwner,
  fence: string,
  values: Partial<Pick<
    Whatsapp,
    "status" | "qrcode" | "retries" | "number" | "session"
  >>
): Promise<Whatsapp> => {
  const [affected] = await Whatsapp.update(values, {
    where: {
      id: owner.whatsappId,
      companyId: owner.companyId,
      sessionFence: fence
    }
  });
  if (affected !== 1) throw new WhatsappFenceLostError();

  const current = await Whatsapp.findOne({
    where: {
      id: owner.whatsappId,
      companyId: owner.companyId,
      sessionFence: fence
    }
  });
  if (!current) throw new WhatsappFenceLostError();
  return current;
};

export const assertWhatsappSessionFence = async (
  owner: WhatsappSessionOwner,
  fence: string
): Promise<void> => {
  const current = await Whatsapp.count({
    where: {
      id: owner.whatsappId,
      companyId: owner.companyId,
      sessionFence: fence
    }
  });
  if (current !== 1) throw new WhatsappFenceLostError();
};

export const withWhatsappSessionFenceTransaction = async <T>(
  owner: WhatsappSessionOwner,
  fence: string,
  operation: (transaction: Transaction) => Promise<T>
): Promise<T> => {
  if (
    !Number.isInteger(owner.whatsappId) ||
    owner.whatsappId <= 0 ||
    !Number.isInteger(owner.companyId) ||
    owner.companyId <= 0 ||
    !/^[1-9]\d*$/.test(String(fence))
  ) {
    throw new WhatsappFenceLostError();
  }

  return sequelize.transaction(async transaction => {
    const current = await Whatsapp.findOne({
      where: {
        id: owner.whatsappId,
        companyId: owner.companyId,
        channel: "whatsapp",
        sessionFence: fence
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!current) throw new WhatsappFenceLostError();

    return operation(transaction);
  });
};
