import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize, dbKind } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", db: dbKind });
  } catch (err) {
    res.status(500).json({ status: "error", db: dbKind, error: err.message });
  }
});

app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from the backend 👋" });
});

if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend listening on :${port} (db: ${dbKind})`);
});
