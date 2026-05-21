import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const Noun = sequelize.define(
  "Noun",
  {
    word: { type: DataTypes.STRING, primaryKey: true },
    article: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["het", "de"]] },
    },
    meaning_ru: { type: DataTypes.STRING, allowNull: false },
    level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    next_review: { type: DataTypes.DATE, allowNull: true },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    mistakes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    explanation: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "nouns", timestamps: false }
);
