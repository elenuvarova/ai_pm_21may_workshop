import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

// Single-row table for global stats (no auth in MVP, one shared user).
export const Stats = sequelize.define(
  "Stats",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
    streak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    last_session_date: { type: DataTypes.DATEONLY, allowNull: true },
    done_today: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "stats", timestamps: false }
);
