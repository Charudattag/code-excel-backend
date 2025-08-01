import SubSection from "../model/subsection.js";
import Course from "../model/Course.js";
import Sections from "../model/Sections.js";
import SubSectionResource from "../model/subsectionresource.js";
import { Op } from "sequelize";

export const addSubSection = async (req, res) => {
  try {
    const { course_id, section_id, type, name, length, sequence } = req.body;
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

    // Check if section exists (if section_id is provided)
    if (section_id) {
      const section = await Sections.findByPk(section_id);
      if (!section) {
        return res.status(400).json({
          success: false,
          message: "Section not found",
        });
      }
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
    // Check for existing subsection with same name in the same course/section
    const existingSubSection = await SubSection.findOne({
      where: {
        course_id: course_id,
        section_id: section_id || null,
        name: name,
      },
    });

    if (existingSubSection) {
      return res.status(400).json({
        success: false,
        message:
          "A subsection with this name already exists for this course/section",
      });
    }

    // Check for sequence conflict if sequence is provided
    if (sequence) {
      const existingSequence = await SubSection.findOne({
        where: {
          course_id: course_id,
          section_id: section_id || null,
          sequence: sequence,
        },
      });

      if (existingSequence) {
        return res.status(400).json({
          success: false,
          message:
            "A subsection with this sequence number already exists for this course/section",
        });
      }
    }

    // Create new subsection
    const newSubSection = await SubSection.create({
      course_id,
      section_id: section_id || null,
      type,
      name,
      length: length || null,
      sequence: sequence || null,
      link,
      created_by: userId,
      modified_by: userId,
    });

    // Fetch the created subsection with associations
    const createdSubSection = await SubSection.findByPk(newSubSection.id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
        {
          model: Sections,
          as: "section",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Subsection created successfully",
      data: createdSubSection,
    });
  } catch (error) {
    console.error("Add subsection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subsection",
      error: error.message,
    });
  }
};

export const getSubSectionsByCourseId = async (req, res) => {
  try {
    const { course_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    // Check if course exists
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const totalCount = await SubSection.count({
      where: { course_id: course_id },
    });

    const subsections = await SubSection.findAll({
      where: { course_id: course_id },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
        {
          model: Sections,
          as: "section",
          attributes: ["id", "name", "description"],
        },
      ],
      limit,
      offset,
      order: [
        ["sequence", "ASC"],
        ["created_at", "DESC"],
      ],
    });

    // Fetch resources for each subsection
    const subsectionsWithResources = await Promise.all(
      subsections.map(async (subsection) => {
        const subsectionData = subsection.toJSON();

        // Fetch resources for this subsection
        const resources = await SubSectionResource.findAll({
          where: { subsection_id: subsection.id },
          order: [
            ["sequence", "ASC"],
            ["created_at", "DESC"],
          ],
        });

        // Add resources to subsection data
        subsectionData.resources = resources;

        return subsectionData;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Subsections retrieved successfully",
      data: {
        subsections: subsectionsWithResources,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get subsections by course ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subsections",
      error: error.message,
    });
  }
};

export const getSubSectionsByCourseIdAndSectionId = async (req, res) => {
  try {
    const { course_id, section_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!course_id) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    if (!section_id) {
      return res.status(400).json({
        success: false,
        message: "Section ID is required",
      });
    }

    // Check if course exists
    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if section exists
    const section = await Sections.findByPk(section_id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const totalCount = await SubSection.count({
      where: {
        course_id: course_id,
        section_id: section_id,
      },
    });

    const subsections = await SubSection.findAll({
      where: {
        course_id: course_id,
        section_id: section_id,
      },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
        {
          model: Sections,
          as: "section",
          attributes: ["id", "name", "description"],
        },
      ],
      limit,
      offset,
      order: [
        ["sequence", "ASC"],
        ["created_at", "DESC"],
      ],
    });

    // Fetch resources for each subsection
    const subsectionsWithResources = await Promise.all(
      subsections.map(async (subsection) => {
        const subsectionData = subsection.toJSON();

        // Fetch resources for this subsection
        const resources = await SubSectionResource.findAll({
          where: { subsection_id: subsection.id },
          order: [
            ["sequence", "ASC"],
            ["created_at", "DESC"],
          ],
        });

        // Add resources to subsection data
        subsectionData.resources = resources;

        return subsectionData;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Subsections retrieved successfully",
      data: {
        subsections: subsectionsWithResources,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get subsections by course ID and section ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve subsections",
      error: error.message,
    });
  }
};

export const updateSubSection = async (req, res) => {
  try {
    const { id, name, description, type, length, sequence } = req.body;
    const userId = req.user?.id || null;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Subsection ID is required in body",
      });
    }

    const subsection = await SubSection.findByPk(id);

    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      });
    }

    // Validate type if provided
    if (type) {
      const validTypes = ["IMAGE", "VIDEO", "PDF", "DOCUMENT", "LINK"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid type. Must be one of: IMAGE, VIDEO, PDF, DOCUMENT, LINK",
        });
      }
    }

    // Handle file upload for non-link types
    let link = subsection.link; // Keep existing link by default
    if (type && type !== "LINK" && type !== subsection.type) {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `File is required for type: ${type}`,
        });
      }
      link = req.file.filename;
    } else if (type === "LINK" && type !== subsection.type) {
      // For LINK type, get link from request body
      link = req.body.link;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Link is required for LINK type",
        });
      }
    }

    // Check for existing subsection with same name in the same course/section
    if (name && name !== subsection.name) {
      const existingSubSection = await SubSection.findOne({
        where: {
          course_id: subsection.course_id,
          section_id: subsection.section_id,
          name: name,
          id: { [Op.ne]: id },
        },
      });

      if (existingSubSection) {
        return res.status(400).json({
          success: false,
          message:
            "A subsection with this name already exists for this course/section",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (length !== undefined) updateData.length = length;
    if (sequence) updateData.sequence = sequence;
    if (link !== subsection.link) updateData.link = link;
    updateData.modified_by = userId;

    await subsection.update(updateData);

    // Fetch the updated subsection with associations
    const updatedSubSection = await SubSection.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
        {
          model: Sections,
          as: "section",
          attributes: ["id", "name", "description"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Subsection updated successfully",
      data: updatedSubSection,
    });
  } catch (error) {
    console.error("Update subsection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subsection",
      error: error.message,
    });
  }
};

export const deleteSubSection = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user?.id || null;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Subsection ID is required in body",
      });
    }

    const subsection = await SubSection.findByPk(id);

    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      });
    }

    // Delete associated resources first
    const subsectionResources = await SubSectionResource.findAll({
      where: { subsection_id: id },
    });

    if (subsectionResources.length > 0) {
      // Delete all associated resources
      await SubSectionResource.destroy({
        where: { subsection_id: id },
      });
    }

    await subsection.destroy();

    return res.status(200).json({
      success: true,
      message: "Subsection deleted successfully",
    });
  } catch (error) {
    console.error("Delete subsection error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subsection",
      error: error.message,
    });
  }
};
