import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Course from "./Course.js";
import Sections from "./Sections.js";

const SubSection = sequelize.define(
  "SubSection",
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
    section_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "sections",
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
    length: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING,
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
    tableName: "subsections",
  }
);

SubSection.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

SubSection.belongsTo(Sections, {
  foreignKey: "section_id",
  as: "section",
});

export default SubSection;
