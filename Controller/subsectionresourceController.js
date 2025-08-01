import SubSectionResource from "../model/subsectionresource.js";
import SubSection from "../model/subsection.js";
import Course from "../model/Course.js";
import Sections from "../model/Sections.js";
import { Op } from "sequelize";

export const addSubSectionResource = async (req, res) => {
  try {
    const {
      course_id,
      section_id,
      subsection_id,
      type,
      name,
      length,
      sequence,
    } = req.body;
    const userId = req.user?.id || null;

    // Validate required fields
    if (!course_id || !type || !name || !subsection_id) {
      return res.status(400).json({
        success: false,
        message: "Course ID, type, name, and subsection ID are required fields",
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

    // Check if subsection exists
    const subsection = await SubSection.findByPk(subsection_id);
    if (!subsection) {
      return res.status(400).json({
        success: false,
        message: "Subsection not found",
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
      link = req.file.filename; // Store the filename like CourseController
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

    // Create new subsection resource
    const newSubSectionResource = await SubSectionResource.create({
      course_id,
      section_id: section_id || null,
      subsection_id,
      type,
      name,
      length: length || null,
      sequence: sequence || null,
      link,
      created_by: userId,
      modified_by: userId,
    });

    // Fetch the created subsection resource with associations
    const createdSubSectionResource = await SubSectionResource.findByPk(
      newSubSectionResource.id,
      {
        include: [
          {
            model: Course,
            as: "course",
            attributes: ["id", "name", "topic"],
          },
          {
            model: Sections,
            as: "section",
            attributes: ["id", "name"],
          },
        ],
      }
    );

    // Fetch subsection data manually
    const subsectionData = await SubSection.findByPk(subsection_id, {
      attributes: ["id", "name", "type"],
    });

    // Add subsection data to the response
    const responseData = {
      ...createdSubSectionResource.toJSON(),
      subsection: subsectionData,
    };

    return res.status(201).json({
      success: true,
      message: "Subsection resource created successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Add subsection resource error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create subsection resource",
      error: error.message,
    });
  }
};

export const updateSubSectionResource = async (req, res) => {
  try {
    const {
      id,
      course_id,
      section_id,
      subsection_id,
      type,
      name,
      length,
      sequence,
    } = req.body;
    const userId = req.user?.id || null;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Resource ID is required for update",
      });
    }

    // Check if subsection resource exists
    const existingResource = await SubSectionResource.findByPk(id);
    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: "Subsection resource not found",
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

    // Check if course exists (if course_id is provided)
    if (course_id) {
      const course = await Course.findByPk(course_id);
      if (!course) {
        return res.status(400).json({
          success: false,
          message: "Course not found",
        });
      }
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

    // Check if subsection exists (if subsection_id is provided)
    if (subsection_id) {
      const subsection = await SubSection.findByPk(subsection_id);
      if (!subsection) {
        return res.status(400).json({
          success: false,
          message: "Subsection not found",
        });
      }
    }

    // Handle file upload for non-link types
    let link = existingResource.link; // Keep existing link by default
    if (type && type !== "LINK" && type !== "VIDEOID") {
      if (req.file) {
        link = req.file.filename; // Update with new file
      } else if (type !== existingResource.type) {
        // If type changed but no file provided
        return res.status(400).json({
          success: false,
          message: `File is required for type: ${type}`,
        });
      }
    } else if (type === "LINK") {
      // For LINK type, get link from request body
      link = req.body.link || existingResource.link;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Link is required for LINK type",
        });
      }
    } else if (type === "VIDEOID") {
      // For VIDEOID type, get video ID from request body
      link = req.body.video_id || existingResource.link;
      if (!link) {
        return res.status(400).json({
          success: false,
          message: "Video ID is required for VIDEOID type",
        });
      }
    }

    // Prepare update data
    const updateData = {
      modified_by: userId,
      modified_at: new Date(),
    };

    // Only update fields that are provided
    if (course_id !== undefined) updateData.course_id = course_id;
    if (section_id !== undefined) updateData.section_id = section_id;
    if (subsection_id !== undefined) updateData.subsection_id = subsection_id;
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (length !== undefined && length !== "" && length !== null)
      updateData.length = length;
    if (sequence !== undefined && sequence !== "" && sequence !== null)
      updateData.sequence = sequence;
    if (link !== undefined) updateData.link = link;

    // Update the subsection resource
    await existingResource.update(updateData);

    // Fetch the updated subsection resource with associations
    const updatedSubSectionResource = await SubSectionResource.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
        {
          model: Sections,
          as: "section",
          attributes: ["id", "name"],
        },
      ],
    });

    // Fetch subsection data manually
    const subsectionData = await SubSection.findByPk(
      updatedSubSectionResource.subsection_id,
      {
        attributes: ["id", "name", "type"],
      }
    );

    // Add subsection data to the response
    const responseData = {
      ...updatedSubSectionResource.toJSON(),
      subsection: subsectionData,
    };

    return res.status(200).json({
      success: true,
      message: "Subsection resource updated successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Update subsection resource error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subsection resource",
      error: error.message,
    });
  }
};

export const deleteSubSectionResource = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.user?.id || null;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Resource ID is required for deletion",
      });
    }

    // Check if subsection resource exists
    const existingResource = await SubSectionResource.findByPk(id);
    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: "Subsection resource not found",
      });
    }

    // Fetch the resource data before deletion for response
    const resourceToDelete = await SubSectionResource.findByPk(id, {
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["id", "name", "topic"],
        },
        {
          model: Sections,
          as: "section",
          attributes: ["id", "name"],
        },
      ],
    });

    // Fetch subsection data manually
    const subsectionData = await SubSection.findByPk(
      existingResource.subsection_id,
      {
        attributes: ["id", "name", "type"],
      }
    );

    // Delete the subsection resource
    await existingResource.destroy();

    // Add subsection data to the response
    const responseData = {
      ...resourceToDelete.toJSON(),
      subsection: subsectionData,
    };

    return res.status(200).json({
      success: true,
      message: "Subsection resource deleted successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Delete subsection resource error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete subsection resource",
      error: error.message,
    });
  }
};

export const getResourcesByCourseIdAndSectionAndSubsectionId = async (
  req,
  res
) => {
  try {
    const { course_id, section_id, subsection_id } = req.params;
    const userId = req.user?.id || null;

    // Validate required fields
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

    if (!subsection_id) {
      return res.status(400).json({
        success: false,
        message: "Subsection ID is required",
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

    // Check if subsection exists
    const subsection = await SubSection.findByPk(subsection_id);
    if (!subsection) {
      return res.status(404).json({
        success: false,
        message: "Subsection not found",
      });
    }

    // Fetch subsection resources for the specific course, section, and subsection
    const resources = await SubSectionResource.findAll({
      where: {
        course_id: course_id,
        section_id: section_id,
        subsection_id: subsection_id,
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
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["sequence", "ASC"],
        ["created_at", "ASC"],
      ],
    });

    // Fetch subsection data for each resource
    const resourcesWithSubsections = await Promise.all(
      resources.map(async (resource) => {
        const subsectionData = await SubSection.findByPk(
          resource.subsection_id,
          {
            attributes: ["id", "name", "type"],
          }
        );

        return {
          ...resource.toJSON(),
          subsection: subsectionData,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Resources retrieved successfully",
      data: {
        resources: resourcesWithSubsections,
        total_count: resourcesWithSubsections.length,
      },
    });
  } catch (error) {
    console.error(
      "Get resources by course ID, section ID, and subsection ID error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve resources",
      error: error.message,
    });
  }
};
