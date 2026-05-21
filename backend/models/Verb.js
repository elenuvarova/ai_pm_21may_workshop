import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

// Shared dictionary — per-user state lives in VerbProgress.
export const Verb = sequelize.define(
  "Verb",
  {
    infinitive: { type: DataTypes.STRING, primaryKey: true },
    past: { type: DataTypes.STRING, allowNull: false },
    participle: { type: DataTypes.STRING, allowNull: false },
    meaning: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: "verbs", timestamps: false }
);
