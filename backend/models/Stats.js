import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

// One row per anonymous cookie user. The previous singleton `stats` table
// is left orphan in DBs that had it — harmless, just unused.
export const Stats = sequelize.define(
  "Stats",
  {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    streak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    last_session_date: { type: DataTypes.DATEONLY, allowNull: true },
    done_today: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { tableName: "user_stats", timestamps: false }
);
