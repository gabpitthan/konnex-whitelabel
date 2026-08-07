import express from "express";

import * as MessageController from "../../controllers/api/MessageController";
import tokenAuth from "../../middleware/tokenAuth";

const apiMessageRoutes = express.Router();

// Ver apiContactRoutes.ts: o tenant passa a vir da credencial por empresa,
// não de um token global com a empresa escolhida pelo chamador.
apiMessageRoutes.get("/messagesRange", tokenAuth, MessageController.show);

export default apiMessageRoutes;