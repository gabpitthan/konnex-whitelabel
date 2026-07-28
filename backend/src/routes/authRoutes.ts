import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import * as UserController from "../controllers/UserController";
import isAuth from "../middleware/isAuth";
import envTokenAuth from "../middleware/envTokenAuth";

const authRoutes = Router();

authRoutes.post("/signup", UserController.store);
authRoutes.post("/login", SessionController.store);
authRoutes.post("/refresh_token", SessionController.update);
authRoutes.delete("/logout", isAuth, SessionController.remove);
authRoutes.get("/me", isAuth, SessionController.me);
authRoutes.post("/forgot-password", (req, res) => {
    console.log("Rota /forgot-password chamada com body:", req.body);
    return SessionController.forgotPassword(req, res);
  });
authRoutes.post("/reset-password", (req, res) => {
    console.log("Rota /reset-password chamada com body:", req.body);
    return SessionController.resetPassword(req, res);
  });
export default authRoutes;
