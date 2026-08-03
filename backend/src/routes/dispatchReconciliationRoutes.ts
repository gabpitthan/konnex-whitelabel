import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as DispatchReconciliationController from "../controllers/DispatchReconciliationController";

const routes = Router();

routes.get(
  "/dispatch-reconciliations",
  isAuth,
  DispatchReconciliationController.index
);
routes.get(
  "/dispatch-reconciliations/audits",
  isAuth,
  DispatchReconciliationController.audits
);
routes.post(
  "/dispatch-reconciliations/:entityType/:entityId",
  isAuth,
  DispatchReconciliationController.reconcile
);

export default routes;
