import express from "express";
import isAuth from "../middleware/isAuth";

import * as ChatController from "../controllers/ChatController";
import requirePlanFeature from "../middleware/requirePlanFeature";

const routes = express.Router();

routes.get("/chats", isAuth, requirePlanFeature("useInternalChat"), ChatController.index);
routes.get("/chats/:id", isAuth, requirePlanFeature("useInternalChat"), ChatController.show);
routes.get("/chats/:id/messages", isAuth, requirePlanFeature("useInternalChat"), ChatController.messages);
routes.post("/chats/:id/messages", isAuth, requirePlanFeature("useInternalChat"), ChatController.saveMessage);
routes.post("/chats/:id/read", isAuth, requirePlanFeature("useInternalChat"), ChatController.checkAsRead);
routes.post("/chats", isAuth, requirePlanFeature("useInternalChat"), ChatController.store);
routes.put("/chats/:id", isAuth, requirePlanFeature("useInternalChat"), ChatController.update);
routes.delete("/chats/:id", isAuth, requirePlanFeature("useInternalChat"), ChatController.remove);

export default routes;
