import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve("./uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes =
    /jpeg|jpg|png|gif|mp4|mov|avi|video\/mp4|video\/quicktime|video\/x-msvideo|pdf|application\/pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error("Invalid file type"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Simple configuration for courseImage
const uploadCourseImage = upload.single("courseImage");

// Other configurations
const uploadFiles = upload.fields([
  { name: "images" },
  { name: "videos" },
  { name: "pdf" },
  { name: "banner" },
]);

const uploadCourseBanner = upload.single("banner");

// Configuration for subsection file uploads
const uploadSubsectionFile = upload.single("file");

// Configuration for course media file uploads
const uploadCourseMediaFile = upload.single("file");

const uploadCourseMedia = upload.fields([
  { name: "courseImage", maxCount: 10 },
  { name: "courseVideo", maxCount: 5 },
  { name: "courseDocument", maxCount: 5 },
]);

export {
  uploadFiles,
  uploadCourseBanner,
  uploadCourseMedia,
  uploadCourseImage,
  uploadSubsectionFile,
  uploadCourseMediaFile,
};
