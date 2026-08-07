import express from "express";
import isAuth from "../middleware/isAuth";

import * as ScheduleController from "../controllers/ScheduleController";
import multer from "multer";
import uploadConfig from "../config/upload";
import requirePlanFeature from "../middleware/requirePlanFeature";

const upload = multer(uploadConfig);

const scheduleRoutes = express.Router();

scheduleRoutes.get("/schedules", isAuth, requirePlanFeature("useSchedules"), ScheduleController.index);

scheduleRoutes.post("/schedules", isAuth, requirePlanFeature("useSchedules"), ScheduleController.store);

scheduleRoutes.put("/schedules/:scheduleId", isAuth, requirePlanFeature("useSchedules"), ScheduleController.update);

scheduleRoutes.get("/schedules/:scheduleId", isAuth, requirePlanFeature("useSchedules"), ScheduleController.show);

scheduleRoutes.delete("/schedules/:scheduleId", isAuth, requirePlanFeature("useSchedules"), ScheduleController.remove);

scheduleRoutes.post("/schedules/:id/media-upload", isAuth, requirePlanFeature("useSchedules"), upload.array("file"), ScheduleController.mediaUpload);

scheduleRoutes.delete("/schedules/:id/media-upload", isAuth, requirePlanFeature("useSchedules"), ScheduleController.deleteMedia);

export default scheduleRoutes;
