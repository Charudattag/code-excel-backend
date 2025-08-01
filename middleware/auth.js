/* eslint-disable no-undef */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";

dotenv.config();

export const uploadMiddleware = fileUpload();

// Middleware to check if the user is authenticated
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }
    // const token = authHeader.split(" ")[1];
    const token = authHeader.replace("Bearer ", "").trim();
    // Check if the token exists
    if (!token) {
      return res.status(401).json({ message: "Token is missing" });
    }
    // Verify the token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the user data to the request object
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check if the user is an admin
export const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  next();
};
