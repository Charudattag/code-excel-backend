import Sections from "../model/Sections.js";
import Course from "../model/Course.js";
import { Op } from "sequelize";

export const addSection = async (req, res) => {
  try {
    const { course_id, name, description, sequence } = req.body;
    const userId = req.user?.id || null;

    if (!course_id || !name) {
      return res.status(400).json({
        success: false,
        message: "Course ID, name,  are required fields",
      });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    const existingSection = await Sections.findOne({
      where: {
        course_id: course_id,
        name: name,
      },
    });

    if (existingSection) {
      return res.status(400).json({
        success: false,
        message: "A section with this name already exists for this course",
      });
    }

    const existingSequence = await Sections.findOne({
      where: {
        course_id: course_id,
        sequence: sequence,
      },
    });

    if (existingSequence) {
      return res.status(400).json({
        success: false,
        message:
          "A section with this sequence number already exists for this course",
      });
    }

    const newSection = await Sections.create({
      course_id,
      name,
      description: description || null,
      sequence,
    });

    await newSection.update({
      created_by: userId,
      modified_by: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
    });
  } catch (error) {
    console.error("Add section error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create section",
      error: error.message,
    });
  }
};

export const getAllSections = async (req, res) => {
  try {
    const { course_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (course_id) {
      whereClause.course_id = course_id;
    }

    const totalCount = await Sections.count({ where: whereClause });

    const sections = await Sections.findAll({
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
      order: [["sequence", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Sections retrieved successfully",
      data: {
        sections,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get sections error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sections",
      error: error.message,
    });
  }
};

export const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Sections.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
      ],
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section retrieved successfully",
      data: section,
    });
  } catch (error) {
    console.error("Get section error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve section",
      error: error.message,
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { id, name, description, sequence } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Section ID is required in body",
      });
    }

    const section = await Sections.findByPk(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    if (name && name !== section.name) {
      const existingSection = await Sections.findOne({
        where: {
          course_id: section.course_id,
          name: name,
          id: { [Op.ne]: id },
        },
      });

      if (existingSection) {
        return res.status(400).json({
          success: false,
          message: "A section with this name already exists for this course",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sequence) updateData.sequence = sequence;
    updateData.modified_by = req.user?.id || null;

    await section.update(updateData);

    const updatedSection = await Sections.findByPk(id, {
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
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Update section error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update section",
      error: error.message,
    });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Sections.findByPk(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await section.destroy();

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Delete section error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete section",
      error: error.message,
    });
  }
};

export const getSectionsByCourseId = async (req, res) => {
  try {
    const { course_id } = req.params;
    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }
    const sections = await Sections.findAll({
      where: { course_id },
      order: [["sequence", "ASC"]],
    });
    return res.status(200).json({
      success: true,
      message: "Sections retrieved successfully",
      data: sections,
    });
  } catch (error) {
    console.error("Get sections by course ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sections",
      error: error.message,
    });
  }
};
