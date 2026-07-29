import { Router } from "express";
import * as HealthController from "../controllers/HealthController";

const healthRoutes = Router();

healthRoutes.get("/health/live", HealthController.live);
healthRoutes.get("/health/ready", HealthController.ready);

export default healthRoutes;
