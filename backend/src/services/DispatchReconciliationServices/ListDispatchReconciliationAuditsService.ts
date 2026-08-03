import DispatchReconciliationAudit from "../../models/DispatchReconciliationAudit";
import User from "../../models/User";

const ListDispatchReconciliationAuditsService = async (
  companyId: number,
  limit = 100
): Promise<DispatchReconciliationAudit[]> => {
  const normalizedLimit = Number.isFinite(limit) ? Math.trunc(limit) : 100;
  const boundedLimit = Math.max(1, Math.min(200, normalizedLimit));
  return DispatchReconciliationAudit.findAll({
    where: { companyId },
    attributes: [
      "id", "entityType", "entityId", "parentId", "phase", "action",
      "previousStatus", "previousStartedAt", "nextStatus", "reason", "createdAt"
    ],
    include: [{ model: User, as: "actor", attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"], ["id", "DESC"]],
    limit: boundedLimit
  });
};

export default ListDispatchReconciliationAuditsService;
