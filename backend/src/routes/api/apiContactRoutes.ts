import express from "express";

import * as ContactController from "../../controllers/api/ContactController";
import tokenAuth from "../../middleware/tokenAuth";

const apiContactRoutes = express.Router();

// `tokenAuth` amarra a requisição a uma credencial de API de UMA empresa,
// revogável. Substitui `isAuthCompany`, que validava um único token global do
// ambiente e deixava o chamador escolher a empresa no corpo da requisição.
apiContactRoutes.get("/contacts", tokenAuth, ContactController.show);
apiContactRoutes.get("/contacts-count", tokenAuth, ContactController.count);


export default apiContactRoutes;