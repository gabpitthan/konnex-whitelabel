import express from "express";
import isAuth from "../middleware/isAuth";

import * as DashboardController from "../controllers/DashbardController";

const routes = express.Router();

routes.get("/dashboard", isAuth, DashboardController.index);
routes.get("/dashboard/ticketsUsers", isAuth, DashboardController.reportsUsers);
routes.get("/dashboard/ticketsDay", isAuth, DashboardController.reportsDay);
routes.get("/dashboard/moments",isAuth, DashboardController.DashTicketsQueues);

export default routes;
