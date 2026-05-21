// Pick the Sequelize dialect from DATABASE_URL so the same config works
// locally (blank → SQLite file) and on Render (Postgres URL injected).
import { Sequelize } from "sequelize";

const url = process.env.DATABASE_URL;
const isPostgres = url && /^postgres(ql)?:\/\//.test(url);

if (process.env.NODE_ENV === "production" && !isPostgres) {
  throw new Error(
    "DATABASE_URL must be a postgres:// URL in production. " +
      "On Render this is injected from the managed Postgres via render.yaml — " +
      "check that the database has finished provisioning."
  );
}

export const dbKind = isPostgres ? "postgres" : "sqlite";

export const sequelize = isPostgres
  ? new Sequelize(url, {
      dialect: "postgres",
      logging: false,
      dialectOptions:
        process.env.NODE_ENV === "production"
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: process.env.SQLITE_PATH || "./data.sqlite",
      logging: false,
    });
