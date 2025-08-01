import express from "express";
import cors from "cors"; // Import CORS middleware
import dotenv from "dotenv";
import "./config/db.js";
import userRouter from "./routes/userRoutes.js";
import courseRouter from "./routes/courseRoutes.js";
import sectionRouter from "./routes/SectionRoutes.js";
import courseMediaRouter from "./routes/coursemediaRoutes.js";
import subsectionRouter from "./routes/subsectionRoutes.js";
import subsectionResourceRouter from "./routes/subsectionresourceRoutes.js";

dotenv.config();

const app = express();

// CORS Middleware Configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/users", userRouter);

app.use("/api/courses", courseRouter);
app.use("/api/sections", sectionRouter);
app.use("/api/course-media", courseMediaRouter);
app.use("/api/subsections", subsectionRouter);
app.use("/api/subsection-resources", subsectionResourceRouter);
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
