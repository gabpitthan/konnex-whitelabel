import express from "express";
import isAuth from "../middleware/isAuth";

import * as ContactListItemController from "../controllers/ContactListItemController";
import requirePlanFeature from "../middleware/requirePlanFeature";

const routes = express.Router();

routes.get(
  "/contact-list-items/list",
  isAuth, requirePlanFeature("useCampaigns"),
  ContactListItemController.findList
);

routes.get("/contact-list-items", isAuth, requirePlanFeature("useCampaigns"), ContactListItemController.index);

routes.get("/contact-list-items/:id", isAuth, requirePlanFeature("useCampaigns"), ContactListItemController.show);

routes.post("/contact-list-items", isAuth, requirePlanFeature("useCampaigns"), ContactListItemController.store);

routes.put("/contact-list-items/:id", isAuth, requirePlanFeature("useCampaigns"), ContactListItemController.update);

routes.delete(
  "/contact-list-items/:id",
  isAuth, requirePlanFeature("useCampaigns"),
  ContactListItemController.remove
);

export default routes;
