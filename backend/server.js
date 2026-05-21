import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Op } from "sequelize";
import { sequelize, dbKind } from "./db.js";
import { Verb } from "./models/Verb.js";
import { Noun } from "./models/Noun.js";
import { VerbProgress } from "./models/VerbProgress.js";
import { NounProgress } from "./models/NounProgress.js";
import { Stats } from "./models/Stats.js";
import { seedIfNeeded } from "./seed.js";
import { srsUpdate, nextStreak, MASTERED_LEVEL } from "./srs.js";

Verb.hasMany(VerbProgress, { foreignKey: "infinitive" });
VerbProgress.belongsTo(Verb, { foreignKey: "infinitive" });
Noun.hasMany(NounProgress, { foreignKey: "word" });
NounProgress.belongsTo(Noun, { foreignKey: "word" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

const COOKIE_NAME = "dt_uid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    out[k] = v.join("=");
  }
  return out;
}

async function initUserProgress(userId) {
  // SQLite is single-writer, so we do the three writes sequentially. Postgres
  // would happily run them in parallel, but the sequential cost is ~tens of ms
  // even for 700 rows.
  const verbs = await Verb.findAll({ attributes: ["infinitive"] });
  const nouns = await Noun.findAll({ attributes: ["word"] });
  const now = new Date();
  await VerbProgress.bulkCreate(
    verbs.map((v) => ({ user_id: userId, infinitive: v.infinitive, next_review: now })),
    { ignoreDuplicates: true }
  );
  await NounProgress.bulkCreate(
    nouns.map((n) => ({ user_id: userId, word: n.word, next_review: now })),
    { ignoreDuplicates: true }
  );
  await Stats.findOrCreate({ where: { user_id: userId }, defaults: { user_id: userId } });
}

// Anonymous per-user session: first visit gets a UUID cookie and a private
// copy of the SRS state for every word in the dictionary. Sharing the URL
// gives the recipient a different cookie → their own progress.
app.use(async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    let uid = cookies[COOKIE_NAME];
    let isNew = false;
    if (!uid) {
      uid = crypto.randomUUID();
      isNew = true;
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.append(
        "Set-Cookie",
        `${COOKIE_NAME}=${uid}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`
      );
    }
    req.userId = uid;
    if (isNew) await initUserProgress(uid);
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", db: dbKind });
  } catch (err) {
    res.status(500).json({ status: "error", db: dbKind, error: err.message });
  }
});

function progressModelFor(kind) {
  if (kind === "verb") return { Progress: VerbProgress, Dict: Verb, keyField: "infinitive" };
  if (kind === "noun") return { Progress: NounProgress, Dict: Noun, keyField: "word" };
  return null;
}

app.get("/api/queue", async (req, res) => {
  const cfg = progressModelFor(req.query.kind);
  if (!cfg) return res.status(400).json({ error: "kind must be verb or noun" });

  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const now = new Date();
  const rows = await cfg.Progress.findAll({
    where: {
      user_id: req.userId,
      level: { [Op.lt]: MASTERED_LEVEL },
      next_review: { [Op.lte]: now },
    },
    order: [["next_review", "ASC"], sequelize.literal("RANDOM()")],
    limit,
    include: [{ model: cfg.Dict, attributes: ["meaning"] }],
  });

  const items = rows.map((r) => {
    const meaning = r[cfg.Dict.name]?.meaning;
    if (req.query.kind === "verb") {
      return { kind: "verb", key: r.infinitive, infinitive: r.infinitive, meaning, level: r.level };
    }
    return { kind: "noun", key: r.word, word: r.word, meaning, level: r.level };
  });

  let nextDueAt = null;
  if (items.length === 0) {
    const upcoming = await cfg.Progress.findOne({
      where: {
        user_id: req.userId,
        level: { [Op.lt]: MASTERED_LEVEL },
        next_review: { [Op.gt]: now },
      },
      order: [["next_review", "ASC"]],
    });
    nextDueAt = upcoming ? upcoming.next_review : null;
  }
  res.json({ items, nextDueAt });
});

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

app.post("/api/answer", async (req, res) => {
  const { kind, key, userPast, userParticiple, userArticle } = req.body || {};
  const cfg = progressModelFor(kind);
  if (!cfg) return res.status(400).json({ error: "kind must be verb or noun" });
  if (!key) return res.status(400).json({ error: "key required" });

  try {
    const result = await sequelize.transaction(async (t) => {
      const word = await cfg.Dict.findByPk(key, { transaction: t });
      if (!word) throw Object.assign(new Error("not found"), { status: 404 });

      const progress = await cfg.Progress.findOne({
        where: { user_id: req.userId, [cfg.keyField]: key },
        transaction: t,
      });
      if (!progress) throw Object.assign(new Error("progress missing"), { status: 404 });

      let correct;
      let correctAnswer;
      if (kind === "verb") {
        const okPast = norm(userPast) === norm(word.past);
        const okPart = norm(userParticiple) === norm(word.participle);
        correct = okPast && okPart;
        correctAnswer = { past: word.past, participle: word.participle };
      } else {
        correct = norm(userArticle) === word.article;
        correctAnswer = { article: word.article };
      }

      const { newLevel, nextReview } = srsUpdate(progress.level, correct);
      progress.level = newLevel;
      progress.next_review = nextReview;
      progress.attempts += 1;
      if (!correct) progress.mistakes += 1;
      await progress.save({ transaction: t });

      const [stats] = await Stats.findOrCreate({
        where: { user_id: req.userId },
        defaults: { user_id: req.userId },
        transaction: t,
      });
      const upd = nextStreak(stats);
      stats.streak = upd.streak;
      stats.done_today = upd.done_today;
      stats.last_session_date = upd.last_session_date;
      await stats.save({ transaction: t });

      return { correct, correctAnswer, meaning: word.meaning, newLevel, nextReview };
    });
    res.json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    console.error("/api/answer:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats", async (req, res) => {
  const [stats] = await Stats.findOrCreate({
    where: { user_id: req.userId },
    defaults: { user_id: req.userId },
  });
  const now = new Date();

  async function counts(Progress) {
    const where = { user_id: req.userId };
    const [newC, learningC, reviewC, masteredC, dueC] = await Promise.all([
      Progress.count({ where: { ...where, level: 0 } }),
      Progress.count({ where: { ...where, level: { [Op.between]: [1, 2] } } }),
      Progress.count({ where: { ...where, level: { [Op.between]: [3, 4] } } }),
      Progress.count({ where: { ...where, level: MASTERED_LEVEL } }),
      Progress.count({
        where: { ...where, level: { [Op.lt]: MASTERED_LEVEL }, next_review: { [Op.lte]: now } },
      }),
    ]);
    return { new: newC, learning: learningC, review: reviewC, mastered: masteredC, due: dueC };
  }

  const [verbs, nouns] = await Promise.all([counts(VerbProgress), counts(NounProgress)]);
  res.json({
    streak: stats.streak,
    done_today: stats.done_today,
    last_session_date: stats.last_session_date,
    verbs,
    nouns,
  });
});

if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

const port = process.env.PORT || 3001;

// One-time rename for deploys that already have the legacy column name.
// Silently no-ops on fresh DBs and on already-migrated DBs.
async function renameLegacyMeaningColumn() {
  const qi = sequelize.getQueryInterface();
  for (const table of ["verbs", "nouns"]) {
    try {
      await qi.renameColumn(table, "meaning_ru", "meaning");
      console.log(`Migration: ${table}.meaning_ru → meaning`);
    } catch {
      // column already migrated or table was just created with the new name
    }
  }
}

async function start() {
  await sequelize.sync();
  await renameLegacyMeaningColumn();
  const seedResult = await seedIfNeeded();
  console.log(
    `Seed: +${seedResult.verbsAdded} verbs (total ${seedResult.verbsTotal}), ` +
      `+${seedResult.nounsAdded} nouns (total ${seedResult.nounsTotal})`
  );
  app.listen(port, () => {
    console.log(`Backend listening on :${port} (db: ${dbKind})`);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
