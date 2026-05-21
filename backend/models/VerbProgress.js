import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const VerbProgress = sequelize.define(
  "VerbProgress",
  {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    infinitive: { type: DataTypes.STRING, primaryKey: true },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_review: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    mistakes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "verb_progress", timestamps: false }
);
