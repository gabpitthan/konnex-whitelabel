import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as QueueIntegrationController from "../controllers/QueueIntegrationController";
import requirePlanFeature from "../middleware/requirePlanFeature";

const queueIntegrationRoutes = Router();

queueIntegrationRoutes.get("/queueIntegration", isAuth, requirePlanFeature("useIntegrations"), QueueIntegrationController.index);

queueIntegrationRoutes.post("/queueIntegration", isAuth, requirePlanFeature("useIntegrations"), QueueIntegrationController.store);

queueIntegrationRoutes.get("/queueIntegration/:integrationId", isAuth, requirePlanFeature("useIntegrations"), QueueIntegrationController.show);

queueIntegrationRoutes.put("/queueIntegration/:integrationId", isAuth, requirePlanFeature("useIntegrations"), QueueIntegrationController.update);

queueIntegrationRoutes.delete("/queueIntegration/:integrationId", isAuth, requirePlanFeature("useIntegrations"), QueueIntegrationController.remove);

queueIntegrationRoutes.post("/queueIntegration/testsession", isAuth, requirePlanFeature("useIntegrations"), QueueIntegrationController.testSession);

export default queueIntegrationRoutes;