import express from "express";
import isAuth from "../middleware/isAuth";

import * as WhatsAppController from "../controllers/WhatsAppController";

import multer from "multer";
import uploadConfig from "../config/upload";
import { mediaUpload } from "../services/WhatsappService/uploadMediaAttachment";
import { deleteMedia } from "../services/WhatsappService/uploadMediaAttachment";

const upload = multer(uploadConfig);


const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);
whatsappRoutes.get("/whatsapp/filter", isAuth, WhatsAppController.indexFilter);
whatsappRoutes.get("/whatsapp/all", isAuth, WhatsAppController.listAll);
whatsappRoutes.get(
  "/whatsapp/api-token/migration-status",
  isAuth,
  WhatsAppController.apiCredentialMigrationStatus
);

whatsappRoutes.post("/whatsapp/", isAuth, WhatsAppController.store);
whatsappRoutes.post("/facebook/", isAuth, WhatsAppController.storeFacebook);
whatsappRoutes.get("/whatsapp/:whatsappId", isAuth, WhatsAppController.show);
whatsappRoutes.put("/whatsapp/:whatsappId", isAuth, WhatsAppController.update);
whatsappRoutes.post(
  "/whatsapp/:whatsappId/api-token/rotate",
  isAuth,
  WhatsAppController.rotateApiToken
);
whatsappRoutes.delete(
  "/whatsapp/:whatsappId/api-token",
  isAuth,
  WhatsAppController.revokeApiToken
);
whatsappRoutes.delete("/whatsapp/:whatsappId", isAuth, WhatsAppController.remove);
whatsappRoutes.post("/closedimported/:whatsappId", isAuth, WhatsAppController.closedTickets);

//restart
whatsappRoutes.post("/whatsapp-restart/", isAuth, WhatsAppController.restart);
whatsappRoutes.post("/whatsapp/:whatsappId/media-upload", isAuth, upload.array("file"), mediaUpload);

whatsappRoutes.delete("/whatsapp/:whatsappId/media-upload", isAuth, deleteMedia);


whatsappRoutes.delete("/whatsapp-admin/:whatsappId", isAuth, WhatsAppController.remove);

whatsappRoutes.put("/whatsapp-admin/:whatsappId", isAuth, WhatsAppController.updateAdmin);

whatsappRoutes.get("/whatsapp-admin/:whatsappId", isAuth, WhatsAppController.showAdmin);

export default whatsappRoutes;
