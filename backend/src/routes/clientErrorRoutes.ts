import { Router } from "express";
import * as ClientErrorController from "../controllers/ClientErrorController";
import clientErrorRateLimit from "../middleware/clientErrorRateLimit";

const clientErrorRoutes = Router();

clientErrorRoutes.post(
  "/client-errors",
  clientErrorRateLimit,
  ClientErrorController.store
);

export default clientErrorRoutes;

