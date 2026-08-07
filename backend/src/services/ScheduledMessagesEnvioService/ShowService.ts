import ScheduledMessages from "../../models/ScheduledMessages";
import AppError from "../../errors/AppError";

/**
 * Consulta escopada pelo tenant — ver o contrato em
 * routes/__tests__/tenantAuthContract.spec.ts. Buscar so por ID deixava o
 * registro de outra empresa alcancavel por qualquer usuario autenticado.
 */
const ScheduleService = async (
  id: string | number,
  companyId: number
): Promise<ScheduledMessages> => {
  const schedule = await ScheduledMessages.findOne({ where: { id, companyId } });

  if (!schedule) {
    throw new AppError("ERR_NO_SCHEDULE_FOUND", 404);
  }

  return schedule;
};

export default ScheduleService;
