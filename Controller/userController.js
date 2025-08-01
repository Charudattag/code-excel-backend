import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtUtils.js";
import User from "../model/user.js";
import { Op } from "sequelize";
import bcrypt from "bcrypt";

export const addUser = async (req, res) => {
  try {
    const { first_name, last_name, mobile, email, password, role } = req.body;

    if (!mobile || !email) {
      return res.status(400).json({
        success: false,
        message: " mobile, email  are required",
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      first_name,
      last_name,
      mobile,
      email,
      password: hashedPassword,
      role: role || "STUDENT",
    });

    await newUser.update({
      created_by: newUser.id,
      modified_by: newUser.id,
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || "";
    const offset = (page - 1) * limit;

    const whereClause = {
      is_active: true,
    };

    if (searchTerm) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${searchTerm}%` } },
        { last_name: { [Op.like]: `%${searchTerm}%` } },
        { email: { [Op.like]: `%${searchTerm}%` } },
        { mobile: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    const totalCount = await User.count({ where: whereClause });

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, mobile, email, password, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData = {
      first_name,
      last_name,
      mobile,
      email,
      role,
      modified_by: user.id,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.update(updateData);

    const userResponse = updatedUser.toJSON();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: userResponse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update User",
      error: error.message,
    });
  }
};

export const deleteuser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting User",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error: error.message,
    });
  }
};
