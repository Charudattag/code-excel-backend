import express from "express";
import {
  addSubSection,
  getSubSectionsByCourseId,
  updateSubSection,
  deleteSubSection,
  getSubSectionsByCourseIdAndSectionId,
} from "../Controller/subsectionController.js";
import { uploadSubsectionFile } from "../middleware/multer.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Add subsection with file upload support
router.post(
  "/addsubsection",
  authMiddleware,
  uploadSubsectionFile,
  addSubSection
);

router.get("/getSubSectionsByCourseId/:course_id", getSubSectionsByCourseId);

// Update subsection with file upload support
router.post(
  "/updatesubsection",
  authMiddleware,
  uploadSubsectionFile,
  updateSubSection
);

// Delete subsection
router.post("/deletesubsection", authMiddleware, deleteSubSection);

router.get(
  "/getsubsectionsbycourseidandsectionid/:course_id/:section_id",
  authMiddleware,
  getSubSectionsByCourseIdAndSectionId
);

export default router;
