import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const NounProgress = sequelize.define(
  "NounProgress",
  {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    word: { type: DataTypes.STRING, primaryKey: true },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_review: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    mistakes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "noun_progress", timestamps: false }
);
