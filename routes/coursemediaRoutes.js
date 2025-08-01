import express from "express";
import {
  addCourseMedia,
  getCourseMedia,
  getCourseMediaById,
  updateCourseMedia,
  deleteCourseMedia,
} from "../Controller/coursemediaController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { uploadCourseMediaFile } from "../middleware/multer.js";

const CourseMediaRouter = express.Router();

CourseMediaRouter.post(
  "/addCourseMedia",
  uploadCourseMediaFile,
  authMiddleware,
  addCourseMedia
);

CourseMediaRouter.get("/getCourseMedia", getCourseMedia);

CourseMediaRouter.get("/getCourseMediaById/:id", getCourseMediaById);

CourseMediaRouter.post(
  "/updateCourseMedia/:id",
  uploadCourseMediaFile,
  authMiddleware,
  updateCourseMedia
);

CourseMediaRouter.post(
  "/deleteCourseMedia/:id",
  authMiddleware,
  adminMiddleware,
  deleteCourseMedia
);

export default CourseMediaRouter;
