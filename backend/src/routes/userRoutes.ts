import express from "express";
import isAuth from "../middleware/isAuth";
import * as UserController from "../controllers/UserController";
import { upload } from "../controllers/UserController";

const userRoutes = express.Router();

userRoutes.get("/users", isAuth, UserController.index);
userRoutes.get("/users/list", isAuth, UserController.list);
userRoutes.post("/users", isAuth, UserController.store);
userRoutes.put("/users/:userId", isAuth, UserController.update);
userRoutes.get("/users/:userId", isAuth, UserController.show);
userRoutes.delete("/users/:userId", isAuth, UserController.remove);
userRoutes.post(
  "/users/:userId/media-upload",
  isAuth,
  upload.array("profileImage"),
  UserController.mediaUpload
);
userRoutes.put(
  "/users/toggleChangeWidht/:userId",
  isAuth,
  UserController.toggleChangeWidht
);
userRoutes.put(
  "/users/:userId/language",
  isAuth,
  UserController.updateLanguage
);
userRoutes.get(
  "/settings/userCreation",
  UserController.getUserCreationStatus
);

// ✅ Avatar
userRoutes.post(
  "/users/:userId/avatar",
  isAuth,
  upload.single("file"),
  UserController.uploadAvatar
);

export default userRoutes;
