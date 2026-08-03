import AppError from "../../errors/AppError";
import ContactList from "../../models/ContactList";
import Queue from "../../models/Queue";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  companyId: number;
  contactListId?: number | string | null;
  whatsappId?: number | string | null;
  userId?: number | string | null;
  queueId?: number | string | null;
}

const isPresent = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== "";

const ValidateCampaignRelationsService = async ({
  companyId,
  contactListId,
  whatsappId,
  userId,
  queueId
}: Request): Promise<void> => {
  const checks = [
    { model: ContactList, id: contactListId },
    { model: Whatsapp, id: whatsappId },
    { model: User, id: userId },
    { model: Queue, id: queueId }
  ].filter(check => isPresent(check.id));

  const normalized = checks.map(check => ({
    model: check.model,
    id: Number(check.id)
  }));

  if (normalized.some(check => !Number.isSafeInteger(check.id) || check.id <= 0)) {
    throw new AppError("ERR_CAMPAIGN_RELATION_NOT_FOUND", 404);
  }

  const results = await Promise.all(normalized.map(check =>
    (check.model as any).count({
      where: { id: check.id, companyId }
    }) as Promise<number>
  ));

  if (results.some(count => count !== 1)) {
    throw new AppError("ERR_CAMPAIGN_RELATION_NOT_FOUND", 404);
  }
};

export default ValidateCampaignRelationsService;
