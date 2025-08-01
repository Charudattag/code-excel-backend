import express from "express";
import {
  login,
  addUser,
  getAllUsers,
  updateUser,
  deleteuser,
  getUserById,
} from "../Controller/userController.js";
import { uploadFiles } from "../middleware/multer.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const UserRouter = express.Router();

UserRouter.post("/addUser", addUser);

UserRouter.post("/login", login);

UserRouter.get("/getAllUsers", getAllUsers);

UserRouter.post("/updateUser/:id", authMiddleware, adminMiddleware, updateUser);
UserRouter.post("/deleteUser/:id", deleteuser);
UserRouter.get("/getUserById/:id", getUserById);

export default UserRouter;
