import ShowService from "./ShowService";

/**
 * Escopado pelo tenant via ShowService — ver o contrato em
 * routes/__tests__/tenantAuthContract.spec.ts.
 */
const DeleteService = async (
  queueOptionId: number | string,
  companyId: number
): Promise<void> => {
  const queueOption = await ShowService(queueOptionId, companyId);

  await queueOption.destroy();
};

export default DeleteService;
