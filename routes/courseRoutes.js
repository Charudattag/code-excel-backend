import express from "express";
import {
  addCourse,
  getAllCourses,
  getCourseById,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
  getAllCoursesforadmin,
  changeCourseStatus,
} from "../Controller/CourseController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { uploadCourseBanner } from "../middleware/multer.js";

const CourseRouter = express.Router();

CourseRouter.post(
  "/addCourse",
  uploadCourseBanner,
  authMiddleware,
  adminMiddleware,
  addCourse
);

CourseRouter.get("/getAllCourses", getAllCourses);

CourseRouter.get("/getCourseById/:id", getCourseById);

CourseRouter.get("/getCourseBySlug/:slug", getCourseBySlug);

CourseRouter.post(
  "/updateCourse/:id",
  uploadCourseBanner,
  authMiddleware,
  updateCourse
);
CourseRouter.post(
  "/deleteCourse/:id",

  deleteCourse
);

CourseRouter.get("/getAllCoursesforadmin", getAllCoursesforadmin);

CourseRouter.post("/changeCourseStatus/:id", changeCourseStatus);

export default CourseRouter;
