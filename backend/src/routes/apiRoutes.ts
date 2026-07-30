import express from "express";
import multer from "multer";
import uploadConfig from "../config/upload";

import * as ApiController from "../controllers/ApiController";
import apiRateLimit from "../middleware/apiRateLimit";
import tokenAuth from "../middleware/tokenAuth";

const upload = multer(uploadConfig);

const ApiRoutes = express.Router();

ApiRoutes.post(
  "/send",
  tokenAuth,
  apiRateLimit,
  upload.array("medias"),
  ApiController.index
);
// ApiRoutes.post("/send/linkPdf", tokenAuth, ApiController.indexLink);
ApiRoutes.post(
  "/send/linkImage",
  tokenAuth,
  apiRateLimit,
  ApiController.indexImage
);
ApiRoutes.post(
  "/checkNumber",
  tokenAuth,
  apiRateLimit,
  ApiController.checkNumber
);

// ApiRoutes.post("/send/linkVideo", tokenAuth, ApiController.indexVideo);
// ApiRoutes.post("/send/toManyText", tokenAuth, ApiController.indexToMany);
// ApiRoutes.post("/send/toManyLinkPdf", tokenAuth, ApiController.indexToManyLinkPdf);
// ApiRoutes.post("/send/toManyImage", tokenAuth, ApiController.indexToManyImage);

// retornar os whatsapp e seus status
// ApiRoutes.get("/getWhatsappsId", tokenAuth, ApiController.indexWhatsappsId);

export default ApiRoutes;
