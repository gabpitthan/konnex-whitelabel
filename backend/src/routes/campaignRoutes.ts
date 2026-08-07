import express from "express";
import isAuth from "../middleware/isAuth";

import * as CampaignController from "../controllers/CampaignController";
import multer from "multer";
import uploadConfig from "../config/upload";
import requirePlanFeature from "../middleware/requirePlanFeature";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/campaigns/list", isAuth, requirePlanFeature("useCampaigns"), CampaignController.findList);
routes.get("/campaigns", isAuth, requirePlanFeature("useCampaigns"), CampaignController.index);
routes.get("/campaigns/:id", isAuth, requirePlanFeature("useCampaigns"), CampaignController.show);
routes.post("/campaigns", isAuth, requirePlanFeature("useCampaigns"), CampaignController.store);
routes.put("/campaigns/:id", isAuth, requirePlanFeature("useCampaigns"), CampaignController.update);
routes.delete("/campaigns/:id", isAuth, requirePlanFeature("useCampaigns"), CampaignController.remove);
routes.post("/campaigns/:id/cancel", isAuth, requirePlanFeature("useCampaigns"), CampaignController.cancel);
routes.post("/campaigns/:id/restart", isAuth, requirePlanFeature("useCampaigns"), CampaignController.restart);
routes.post("/campaigns/:id/media-upload", isAuth, requirePlanFeature("useCampaigns"), upload.array("file"), CampaignController.mediaUpload);
routes.delete("/campaigns/:id/media-upload", isAuth, requirePlanFeature("useCampaigns"), CampaignController.deleteMedia);

export default routes;
