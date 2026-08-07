import AppError from "../../errors/AppError";
import QueueOption from "../../models/QueueOption";
import Queue from "../../models/Queue";

/**
 * Consulta escopada pelo tenant — ver o contrato em
 * routes/__tests__/tenantAuthContract.spec.ts. Buscar so por ID deixava o
 * registro de outra empresa alcancavel por qualquer usuario autenticado.
 */
const ShowService = async (
  queueOptionId: number | string,
  companyId: number
): Promise<QueueOption> => {
  const queue = await QueueOption.findOne({
    where: {
      id: queueOptionId
    },
    include: [
      {
        model: Queue,
        as: "queue",
        where: { companyId },
        required: true,
        attributes: []
      },
      {
        model: QueueOption,
        as: 'parent',
        where: { parentId: queueOptionId },
        required: false
      },
    ]
  });

  if (!queue) {
    throw new AppError("ERR_QUEUE_NOT_FOUND");
  }

  return queue;
};

export default ShowService;
