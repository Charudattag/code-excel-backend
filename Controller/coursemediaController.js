import CourseMedia from "../model/coursemedia.js";
import Course from "../model/Course.js";
import Sections from "../model/Sections.js";
import { Op } from "sequelize";

export const addCourseMedia = async (req, res) => {
  try {
    const { course_id, type, name, length } = req.body;
    const userId = req.user?.id || null;

    // Validate required fields
    if (!course_id || !type || !name) {
      return res.status(400).json({
        success: false,
        message: "Course ID, type, and name are required fields",
      });
    }

    // Validate type
    const validTypes = ["IMAGE", "VIDEO", "PDF", "DOCUMENT", "LINK", "VIDEOID"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid type. Must be one of: IMAGE, VIDEO, PDF, DOCUMENT, LINK, VIDEOID",
      });
    }

    // Check if course exists
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    // Handle file upload for non-link types
    let link = null;
    if (type !== "LINK" && type !== "VIDEOID") {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `File is required for type: ${type}`,
        });
      }
      link = req.file.filename; // Store the filename like addSubSection
    } else if (type === "LINK") {
      // For LINK type, get link from request body
      link = req.body.link;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Link is required for LINK type",
        });
      }
    } else if (type === "VIDEOID") {
      // For VIDEOID type, get video ID from request body
      link = req.body.video_id;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required for VIDEOID type",
        });
      }
    }

    // Check for existing course media with same name in the same course
    const existingCourseMedia = await CourseMedia.findOne({
      where: {
        course_id: course_id,
        name: name,
      },
    });

    if (existingCourseMedia) {
      return res.status(400).json({
        success: false,
        message: "A course media with this name already exists for this course",
      });
    }

    // Create new course media
    const newCourseMedia = await CourseMedia.create({
      course_id,
      type,
      name,
      length: length || null,
      link,
      created_by: userId,
      modified_by: userId,
    });

    // Fetch the created course media with associations
    const createdCourseMedia = await CourseMedia.findByPk(newCourseMedia.id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Course media created successfully",
      data: createdCourseMedia,
    });
  } catch (error) {
    console.error("Add course media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course media",
      error: error.message,
    });
  }
};

export const getCourseMedia = async (req, res) => {
  try {
    const { course_id, type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build the where clause
    const whereClause = {};

    if (course_id) {
      whereClause.course_id = course_id;
    }

    if (type) {
      whereClause.type = type;
    }

    // Get total count
    const totalCount = await CourseMedia.count({ where: whereClause });

    // Get media with course information
    const media = await CourseMedia.findAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
      ],
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Course media retrieved successfully",
      data: {
        media,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get course media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course media",
      error: error.message,
    });
  }
};

export const getCourseMediaById = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await CourseMedia.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
      ],
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Course media not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course media retrieved successfully",
      data: media,
    });
  } catch (error) {
    console.error("Get course media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course media",
      error: error.message,
    });
  }
};

export const updateCourseMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, type, name, length } = req.body;
    const userId = req.user?.id || null;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Course media ID is required",
      });
    }

    const media = await CourseMedia.findByPk(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Course media not found",
      });
    }

    // Validate type if provided
    if (type) {
      const validTypes = [
        "IMAGE",
        "VIDEO",
        "PDF",
        "DOCUMENT",
        "LINK",
        "VIDEOID",
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid type. Must be one of: IMAGE, VIDEO, PDF, DOCUMENT, LINK, VIDEOID",
        });
      }
    }

    // Handle file upload for non-link types
    let link = media.link; // Keep existing link by default
    if (type && type !== "LINK" && type !== "VIDEOID" && type !== media.type) {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `File is required for type: ${type}`,
        });
      }
      link = req.file.filename;
    } else if (type === "LINK" && type !== media.type) {
      // For LINK type, get link from request body
      link = req.body.link;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Link is required for LINK type",
        });
      }
    } else if (type === "VIDEOID" && type !== media.type) {
      // For VIDEOID type, get video ID from request body
      link = req.body.video_id;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required for VIDEOID type",
        });
      }
    }

    // Check for existing course media with same name in the same course
    if (name && name !== media.name) {
      const existingCourseMedia = await CourseMedia.findOne({
        where: {
          course_id: media.course_id,
          name: name,
          id: { [Op.ne]: id },
        },
      });

      if (existingCourseMedia) {
        return res.status(400).json({
          success: false,
          message:
            "A course media with this name already exists for this course",
        });
      }
    }

    // Check if course exists (if course_id is being updated)
    if (course_id && course_id !== media.course_id) {
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(400).json({
          success: false,
          message: "Course not found",
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (course_id) updateData.course_id = course_id;
    if (type) updateData.type = type;
    if (name) updateData.name = name;
    if (length !== undefined && length !== "" && length !== null)
      updateData.length = length;
    if (link !== media.link) updateData.link = link;
    updateData.modified_by = userId;

    // Update the media
    await media.update(updateData);

    // Fetch updated media
    const updatedMedia = await CourseMedia.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Course media updated successfully",
      data: updatedMedia,
    });
  } catch (error) {
    console.error("Update course media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course media",
      error: error.message,
    });
  }
};

export const deleteCourseMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await CourseMedia.findByPk(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Course media not found",
      });
    }

    await media.destroy();

    return res.status(200).json({
      success: true,
      message: "Course media deleted successfully",
    });
  } catch (error) {
    console.error("Delete course media error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete course media",
      error: error.message,
    });
  }
};
