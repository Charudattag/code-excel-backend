import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateToken = (payload, duration) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: duration || "24h",
  });
};

export const generateAccessToken = (user) => {
  return generateToken(
    {
      id: user.id,
      mobile: user.mobile,
      is_active: user.is_active,
      role: user.role,
    },
    "24h"
  );
};

export const generateRefreshToken = (user) => {
  return generateToken(
    {
      id: user.id,
      mobile: user.mobile,
    },
    "7d"
  );
};
