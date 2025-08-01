import express from "express";
import {
  addSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  getSectionsByCourseId,
} from "../Controller/SectionController.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const SectionRouter = express.Router();

SectionRouter.post("/addSection", authMiddleware, adminMiddleware, addSection);

SectionRouter.get("/getAllSections", getAllSections);

SectionRouter.get("/getSectionById/:id", getSectionById);

SectionRouter.post("/updateSection", updateSection);
SectionRouter.post(
  "/deleteSection/:id",

  deleteSection
);

SectionRouter.get("/getSectionsByCourseId/:course_id", getSectionsByCourseId);

export default SectionRouter;
