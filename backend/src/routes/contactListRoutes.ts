import express from "express";
import isAuth from "../middleware/isAuth";
import uploadConfig from "../config/upload";

import * as ContactListController from "../controllers/ContactListController";
import multer from "multer";
import requirePlanFeature from "../middleware/requirePlanFeature";

const routes = express.Router();

const upload = multer(uploadConfig);

routes.get("/contact-lists/list", isAuth, requirePlanFeature("useCampaigns"), ContactListController.findList);
routes.get("/contact-lists", isAuth, requirePlanFeature("useCampaigns"), ContactListController.index);
routes.get("/contact-lists/:id", isAuth, requirePlanFeature("useCampaigns"), ContactListController.show);
routes.post("/contact-lists", isAuth, requirePlanFeature("useCampaigns"), ContactListController.store);
routes.post("/contact-lists/:id/upload",isAuth, requirePlanFeature("useCampaigns"),upload.array("file"),ContactListController.upload);
routes.put("/contact-lists/:id", isAuth, requirePlanFeature("useCampaigns"), ContactListController.update);
routes.delete("/contact-lists/:id", isAuth, requirePlanFeature("useCampaigns"), ContactListController.remove);

export default routes;
