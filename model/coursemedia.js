import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Course from "./Course.js";
import Sections from "./Sections.js";

const CourseMedia = sequelize.define(
  "CourseMedia",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "courses",
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM(
        "IMAGE",
        "VIDEO",
        "PDF",
        "DOCUMENT",
        "LINK",
        "VIDEOID"
      ),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    length: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    modified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    modified_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "modified_at",
    tableName: "course_media",
  }
);

CourseMedia.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

export default CourseMedia;
