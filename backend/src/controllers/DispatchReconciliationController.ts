import { Request, Response } from "express";
import AppError from "../errors/AppError";
import ListDispatchReconciliationsService from "../services/DispatchReconciliationServices/ListDispatchReconciliationsService";
import ListDispatchReconciliationAuditsService from "../services/DispatchReconciliationServices/ListDispatchReconciliationAuditsService";
import ReconcileDispatchService from "../services/DispatchReconciliationServices/ReconcileDispatchService";

const requireAdmin = (req: Request): void => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  requireAdmin(req);
  const limit = Number(req.query.limit || 100);
  const result = await ListDispatchReconciliationsService({
    companyId: req.user.companyId,
    limit
  });
  return res.json(result);
};

export const audits = async (req: Request, res: Response): Promise<Response> => {
  requireAdmin(req);
  const limit = Number(req.query.limit || 100);
  const records = await ListDispatchReconciliationAuditsService(
    req.user.companyId,
    limit
  );
  return res.json({ records });
};

export const reconcile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  const entityType = String(req.params.entityType || "").toUpperCase() as any;
  const entityId = Number(req.params.entityId);
  const action = String(req.body.action || "").toUpperCase() as any;
  const expectedDispatchKey = typeof req.body.expectedDispatchKey === "string"
    ? req.body.expectedDispatchKey
    : "";
  const reason = typeof req.body.reason === "string" ? req.body.reason : "";

  const result = await ReconcileDispatchService({
    companyId: req.user.companyId,
    actorUserId: Number(req.user.id),
    entityType,
    entityId,
    action,
    expectedDispatchKey,
    reason
  });

  return res.status(200).json(result);
};
