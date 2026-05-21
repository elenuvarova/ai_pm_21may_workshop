import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

// Shared dictionary — per-user state lives in NounProgress.
export const Noun = sequelize.define(
  "Noun",
  {
    word: { type: DataTypes.STRING, primaryKey: true },
    article: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["het", "de"]] },
    },
    meaning: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "nouns", timestamps: false }
);
