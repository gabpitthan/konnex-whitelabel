import QueueOption from "../../models/QueueOption";
import ShowService from "./ShowService";

interface QueueData {
  queueId?: string;
  title?: string;
  option?: string;
  message?: string;
  parentId?: string;
}

/**
 * Escopado pelo tenant via ShowService — ver o contrato em
 * routes/__tests__/tenantAuthContract.spec.ts.
 */
const UpdateService = async (
  queueOptionId: number | string,
  queueOptionData: QueueData,
  companyId: number
): Promise<QueueOption> => {

  const queueOption = await ShowService(queueOptionId, companyId);

  await queueOption.update(queueOptionData);

  return queueOption;
};

export default UpdateService;
