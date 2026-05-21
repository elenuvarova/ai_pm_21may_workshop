import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Verb = sequelize.define(
  "Verb",
  {
    infinitive: { type: DataTypes.STRING, primaryKey: true },
    past: { type: DataTypes.STRING, allowNull: false },
    participle: { type: DataTypes.STRING, allowNull: false },
    meaning_ru: { type: DataTypes.STRING, allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_review: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    mistakes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    explanation: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "verbs", timestamps: false }
);
