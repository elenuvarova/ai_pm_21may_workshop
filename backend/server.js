import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Op } from "sequelize";
import Anthropic from "@anthropic-ai/sdk";
import { sequelize, dbKind } from "./db.js";
import { Verb } from "./models/Verb.js";
import { Noun } from "./models/Noun.js";
import { Stats } from "./models/Stats.js";
import { seedIfNeeded } from "./seed.js";
import { srsUpdate, nextStreak, MASTERED_LEVEL } from "./srs.js";

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

function modelFor(kind) {
  if (kind === "verb") return Verb;
  if (kind === "noun") return Noun;
  return null;
}

function publicVerb(v) {
  return { kind: "verb", key: v.infinitive, infinitive: v.infinitive, meaning_ru: v.meaning_ru, level: v.level };
}
function publicNoun(n) {
  return { kind: "noun", key: n.word, word: n.word, meaning_ru: n.meaning_ru, level: n.level };
}

app.get("/api/queue", async (req, res) => {
  const kind = req.query.kind;
  const Model = modelFor(kind);
  if (!Model) return res.status(400).json({ error: "kind must be verb or noun" });

  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const now = new Date();
  const rows = await Model.findAll({
    where: {
      level: { [Op.lt]: MASTERED_LEVEL },
      next_review: { [Op.lte]: now },
    },
    order: [["next_review", "ASC"]],
    limit,
  });
  const items = rows.map((r) => (kind === "verb" ? publicVerb(r) : publicNoun(r)));

  let nextDueAt = null;
  if (items.length === 0) {
    const upcoming = await Model.findOne({
      where: { level: { [Op.lt]: MASTERED_LEVEL }, next_review: { [Op.gt]: now } },
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
  const Model = modelFor(kind);
  if (!Model) return res.status(400).json({ error: "kind must be verb or noun" });
  if (!key) return res.status(400).json({ error: "key required" });

  try {
    const result = await sequelize.transaction(async (t) => {
      const row = await Model.findByPk(key, { transaction: t });
      if (!row) throw Object.assign(new Error("not found"), { status: 404 });

      let correct;
      let correctAnswer;
      if (kind === "verb") {
        const okPast = norm(userPast) === norm(row.past);
        const okPart = norm(userParticiple) === norm(row.participle);
        correct = okPast && okPart;
        correctAnswer = { past: row.past, participle: row.participle };
      } else {
        correct = norm(userArticle) === row.article;
        correctAnswer = { article: row.article };
      }

      const { newLevel, nextReview } = srsUpdate(row.level, correct);
      row.level = newLevel;
      row.next_review = nextReview;
      row.attempts += 1;
      if (!correct) row.mistakes += 1;
      await row.save({ transaction: t });

      const [stats] = await Stats.findOrCreate({ where: { id: 1 }, defaults: { id: 1 }, transaction: t });
      const upd = nextStreak(stats);
      stats.streak = upd.streak;
      stats.done_today = upd.done_today;
      stats.last_session_date = upd.last_session_date;
      await stats.save({ transaction: t });

      return { correct, correctAnswer, meaning_ru: row.meaning_ru, newLevel, nextReview };
    });
    res.json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "not found" });
    console.error("/api/answer:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats", async (_req, res) => {
  const [stats] = await Stats.findOrCreate({ where: { id: 1 }, defaults: { id: 1 } });
  const now = new Date();

  async function counts(Model) {
    const [newC, learningC, reviewC, masteredC, dueC] = await Promise.all([
      Model.count({ where: { level: 0 } }),
      Model.count({ where: { level: { [Op.between]: [1, 2] } } }),
      Model.count({ where: { level: { [Op.between]: [3, 4] } } }),
      Model.count({ where: { level: MASTERED_LEVEL } }),
      Model.count({
        where: { level: { [Op.lt]: MASTERED_LEVEL }, next_review: { [Op.lte]: now } },
      }),
    ]);
    return { new: newC, learning: learningC, review: reviewC, mastered: masteredC, due: dueC };
  }

  const [verbs, nouns] = await Promise.all([counts(Verb), counts(Noun)]);
  res.json({
    streak: stats.streak,
    done_today: stats.done_today,
    last_session_date: stats.last_session_date,
    verbs,
    nouns,
  });
});

app.post("/api/explain", async (req, res) => {
  const { kind, key } = req.body || {};
  const Model = modelFor(kind);
  if (!Model) return res.status(400).json({ error: "kind must be verb or noun" });
  if (!key) return res.status(400).json({ error: "key required" });

  const row = await Model.findByPk(key);
  if (!row) return res.status(404).json({ error: "not found" });

  if (row.explanation) {
    return res.json({ explanation: row.explanation, cached: true });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error:
        "ANTHROPIC_API_KEY not configured. Set it in .env locally or in Render dashboard.",
    });
  }

  const word = kind === "verb" ? row.infinitive : row.word;
  const what = kind === "verb" ? "this verb pattern (past + participle forms)" : `the article "${row.article}"`;
  const prompt = `Explain in Russian why "${word}" uses ${what}. Give the rule (if any) and one example sentence in Flemish Dutch. Keep it under 80 words.`;

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });
    const explanation = msg.content[0].text;
    row.explanation = explanation;
    await row.save();
    res.json({ explanation, cached: false });
  } catch (err) {
    console.error("/api/explain:", err);
    res.status(502).json({ error: `Claude API error: ${err.message}` });
  }
});

if (process.env.NODE_ENV === "production") {
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

const port = process.env.PORT || 3001;

async function start() {
  await sequelize.sync();
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
