import express from "express";
import {
  addSubSectionResource,
  updateSubSectionResource,
  deleteSubSectionResource,
  getResourcesByCourseIdAndSectionAndSubsectionId,
} from "../Controller/subsectionresourceController.js";
import { uploadSubsectionFile } from "../middleware/multer.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Add subsection with file upload support
router.post(
  "/addsubsectionresource",
  authMiddleware,
  uploadSubsectionFile,
  addSubSectionResource
);

router.post(
  "/updatesubsectionresource",
  authMiddleware,
  uploadSubsectionFile,
  updateSubSectionResource
);

router.post(
  "/deletesubsectionresource",
  authMiddleware,
  deleteSubSectionResource
);

router.get(
  "/getresourcesbycourseidandsectionandsubsectionid/:course_id/:section_id/:subsection_id",
  getResourcesByCourseIdAndSectionAndSubsectionId
);

export default router;
