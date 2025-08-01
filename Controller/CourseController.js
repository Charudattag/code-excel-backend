import Course from "../model/Course.js";
import Sections from "../model/Sections.js";
import CourseMedia from "../model/coursemedia.js";
import SubSection from "../model/subsection.js";
import SubSectionResource from "../model/subsectionresource.js";
import { Op } from "sequelize";
import { generateUniqueSlug } from "../utils/slugUtils.js";

export const addCourse = async (req, res) => {
  try {
    const {
      name,
      description,
      topic,
      prerequisites,
      outcomes,
      duration,
      intro_video,
    } = req.body;

    const banner = req.file ? req.file.filename : null;

    let parsedPrerequisites = [];
    let parsedOutcomes = [];

    try {
      if (prerequisites) {
        if (typeof prerequisites === "string") {
          try {
            parsedPrerequisites = JSON.parse(prerequisites);
          } catch {
            parsedPrerequisites = prerequisites
              .split(",")
              .map((item) => item.trim());
          }
        } else {
          parsedPrerequisites = prerequisites;
        }
      }

      if (outcomes) {
        if (typeof outcomes === "string") {
          try {
            parsedOutcomes = JSON.parse(outcomes);
          } catch {
            parsedOutcomes = outcomes.split(",").map((item) => item.trim());
          }
        } else {
          parsedOutcomes = outcomes;
        }
      }
    } catch (error) {
      console.error("Error parsing arrays:", error);
    }

    if (!name || !description || !topic) {
      return res.status(400).json({
        success: false,
        message: "Name, description, topic are required fields",
      });
    }

    const existingCourse = await Course.findOne({
      where: {
        name: name,
        status: "ACTIVE",
      },
    });

    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: "A course with this name already exists",
      });
    }

    // Generate unique slug
    const checkSlugExists = async (slug) => {
      const existingSlug = await Course.findOne({
        where: { slug: slug, is_active: true },
      });
      return !!existingSlug;
    };

    const slug = await generateUniqueSlug(name, checkSlugExists);

    const userId = req.user?.id || null;

    const newCourse = await Course.create({
      name,
      description,
      topic,
      slug,
      prerequisites: parsedPrerequisites,
      outcomes: parsedOutcomes,
      duration,
      banner,
      intro_video,
      created_by: userId,
      modified_by: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });
  } catch (error) {
    console.error("Add course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || "";
    const status = req.query.status;
    const topic = req.query.topic;
    const offset = (page - 1) * limit;

    // Build the where clause
    const whereClause = {
      status: "ACTIVE",
    };

    // Add search condition if searchTerm is provided
    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
        { topic: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (topic) {
      whereClause.topic = topic;
    }

    const totalCount = await Course.count({ where: whereClause });

    const courses = await Course.findAll({
      where: whereClause,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    const coursesWithSections = await Promise.all(
      courses.map(async (course) => {
        const sections = await Sections.findAll({
          where: { course_id: course.id },
          order: [["sequence", "ASC"]],
        });

        const courseMedia = await CourseMedia.findAll({
          where: { course_id: course.id },
          order: [["created_at", "DESC"]],
        });

        const courseData = course.toJSON();
        courseData.sections = sections;
        courseData.media = courseMedia;
        return courseData;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        courses: coursesWithSections,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
      error: error.message,
    });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Fetch sections for this course
    const sections = await Sections.findAll({
      where: { course_id: course.id },
      order: [["sequence", "ASC"]],
    });

    // Fetch subsections for each section
    const sectionsWithSubsections = await Promise.all(
      sections.map(async (section) => {
        const subsections = await SubSection.findAll({
          where: { section_id: section.id },
          order: [["sequence", "ASC"]],
        });

        // Fetch resources for each subsection
        const subsectionsWithResources = await Promise.all(
          subsections.map(async (subsection) => {
            const resources = await SubSectionResource.findAll({
              where: { subsection_id: subsection.id },
              order: [
                ["sequence", "ASC"],
                ["created_at", "ASC"],
              ],
            });

            const subsectionData = subsection.toJSON();
            subsectionData.resources = resources;
            return subsectionData;
          })
        );

        const sectionData = section.toJSON();
        sectionData.subsections = subsectionsWithResources;
        return sectionData;
      })
    );

    // Fetch course media for this course
    const courseMedia = await CourseMedia.findAll({
      where: { course_id: course.id },
      order: [["created_at", "DESC"]],
    });

    const courseData = course.toJSON();
    courseData.sections = sectionsWithSubsections;
    courseData.media = courseMedia;

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: courseData,
    });
  } catch (error) {
    console.error("Get course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course",
      error: error.message,
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      topic,
      status,
      prerequisites,
      outcomes,
      duration,
      banner,
      intro_video,
    } = req.body;

    // Find the course
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let parsedPrerequisites = [];
    let parsedOutcomes = [];

    try {
      if (prerequisites) {
        if (typeof prerequisites === "string") {
          try {
            parsedPrerequisites = JSON.parse(prerequisites);
          } catch {
            parsedPrerequisites = prerequisites
              .split(",")
              .map((item) => item.trim());
          }
        } else {
          parsedPrerequisites = prerequisites;
        }
      }

      if (outcomes) {
        if (typeof outcomes === "string") {
          try {
            parsedOutcomes = JSON.parse(outcomes);
          } catch {
            parsedOutcomes = outcomes.split(",").map((item) => item.trim());
          }
        } else {
          parsedOutcomes = outcomes;
        }
      }
    } catch (error) {
      console.error("Error parsing arrays:", error);
    }

    const bannerFile = req.file ? req.file.filename : null;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (topic) updateData.topic = topic;
    if (status) updateData.status = status;
    if (prerequisites) updateData.prerequisites = parsedPrerequisites;
    if (outcomes) updateData.outcomes = parsedOutcomes;
    if (duration) updateData.duration = duration;
    if (bannerFile) updateData.banner = bannerFile;
    if (intro_video) updateData.intro_video = intro_video;
    updateData.modified_by = req.user?.id || course.id;

    // Generate new slug if name is being updated
    if (name && name !== course.name) {
      const checkSlugExists = async (slug) => {
        const existingSlug = await Course.findOne({
          where: {
            slug: slug,
            is_active: true,
            id: { [Op.ne]: id },
          },
        });
        return !!existingSlug;
      };

      const newSlug = await generateUniqueSlug(name, checkSlugExists);
      updateData.slug = newSlug;
    }

    await course.update(updateData);

    const updatedCourse = await Course.findByPk(id);

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Update course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course",
      error: error.message,
    });
  }
};

export const getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await Course.findOne({
      where: {
        slug: slug,
        is_active: true,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const sections = await Sections.findAll({
      where: { course_id: course.id },
      order: [["sequence", "ASC"]],
    });

    // Fetch course media for this course
    const courseMedia = await CourseMedia.findAll({
      where: { course_id: course.id },
      order: [["created_at", "DESC"]],
    });

    const courseData = course.toJSON();
    courseData.sections = sections;
    courseData.media = courseMedia;

    return res.status(200).json({
      success: true,
      message: "Course retrieved successfully",
      data: courseData,
    });
  } catch (error) {
    console.error("Get course by slug error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve course",
      error: error.message,
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the course
    const course = await Course.findOne({
      where: {
        id: id,
        is_active: true,
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await course.update({ is_active: false });

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: error.message,
    });
  }
};

export const getAllCoursesforadmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchTerm = req.query.searchTerm || "";
    const status = req.query.status;
    const topic = req.query.topic;
    const offset = (page - 1) * limit;

    // Build the where clause
    const whereClause = {
      is_active: true,
    };

    // Add search condition if searchTerm is provided
    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
        { topic: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (topic) {
      whereClause.topic = topic;
    }

    const totalCount = await Course.count({ where: whereClause });

    const courses = await Course.findAll({
      where: whereClause,
      limit,
      offset,
      order: [["created_at", "DESC"]],
    });

    const coursesWithSections = await Promise.all(
      courses.map(async (course) => {
        const sections = await Sections.findAll({
          where: { course_id: course.id },
          order: [["sequence", "ASC"]],
        });

        const courseMedia = await CourseMedia.findAll({
          where: { course_id: course.id },
          order: [["created_at", "DESC"]],
        });

        const courseData = course.toJSON();
        courseData.sections = sections;
        courseData.media = courseMedia;
        return courseData;
      })
    );

    return res.status(200).json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        courses: coursesWithSections,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
      error: error.message,
    });
  }
};

export const changeCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing status. Must be 'ACTIVE' or 'INACTIVE'.",
      });
    }

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await course.update({ status });

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${status}`,
      data: course,
    });
  } catch (error) {
    console.error("Change course status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course status",
      error: error.message,
    });
  }
};
