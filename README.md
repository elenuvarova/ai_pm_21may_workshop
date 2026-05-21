# Dutch Trainer

A Dutch trainer for expats in Belgium and the Netherlands. Two tabs: **Sterke werkwoorden** (irregular verbs — 3 forms) and **Het of de** (noun articles). Spaced repetition. Seeded with 150 irregular verbs and 300 everyday nouns (150 het / 150 de).

## Stack

- **Frontend:** React 18 + Vite 5 (plain JavaScript / JSX)
- **Backend:** Node.js + Express, ES modules
- **ORM:** Sequelize
- **Database:** SQLite locally, Postgres on Render (selected at runtime from `DATABASE_URL`)
- **Deploy:** Render free tier (web + Postgres), provisioned via `render.yaml`
- **Container:** Docker is used only by Render's build — local dev does not need it

## Project structure

```
.
├── backend/
│   ├── models/
│   │   ├── Verb.js
│   │   ├── Noun.js
│   │   └── Stats.js
│   ├── seed.js          # 150 verbs + 300 nouns
│   ├── srs.js           # SRS intervals + streak logic
│   ├── db.js
│   ├── server.js        # /api/queue, /api/answer, /api/stats
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TabBar.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── VerbCard.jsx
│   │   │   └── NounCard.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Dockerfile
├── render.yaml
├── .env.example
└── README.md
```

## Local development

No database to install — SQLite is built in. The backend creates `backend/data.sqlite` on first boot and seeds it.

Open two terminals.

**Terminal 1 — backend:**

```bash
cd backend
npm install
npm run dev    # requires Node 18+ for --watch; on Node 17 use npm start
```

Backend listens on `:3001`. On first boot it seeds the database from `seed.js` (150 verbs + 300 nouns). Reseeds are idempotent — re-running just updates the `meaning` column on existing rows, so user progress (level / next_review / attempts) survives content edits.

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api/*` to the backend on port 3001.

## Deploy to Render

1. Push the repo to GitHub.
2. In Render, click **New → Blueprint** and connect the repo.
3. Render reads [render.yaml](render.yaml), provisions the free Postgres database `ai-workshop-db`, builds the Docker image, and starts the web service `ai-workshop-web` with `DATABASE_URL` already wired up.

Free tier notes:

- The web service **sleeps after ~15 minutes of inactivity** — the first request after idle takes ~30 seconds (cold start).
- The free Postgres database **expires after 30 days** — Render emails you in advance.

## Endpoints

- `GET /api/health` — verifies the DB connection, returns `{status, db}`.
- `GET /api/queue?kind=verb|noun&limit=10` — words due for review (`next_review <= now`, not mastered). Order: oldest due first, then `RANDOM()` to mix ties.
- `POST /api/answer` — `{kind, key, userPast, userParticiple}` for verbs or `{kind, key, userArticle}` for nouns. Server validates (case-insensitive, trimmed), updates the SRS level and stats in a single transaction, and returns `{correct, correctAnswer, meaning, newLevel, nextReview}`.
- `GET /api/stats` — streak, done_today, and counts for `{new, learning, review, mastered}` per kind.
- In production, `GET /*` serves the built frontend from `backend/public/`.

## SRS

- **Correct:** `level + 1`, with intervals `[10min, 1d, 3d, 7d, 21d]` indexed by the previous level. Level 5 is mastered and excluded from the queue.
- **Wrong:** `level → 1`, `next_review = now + 10min`.
- **Streak** runs on UTC days: same day → `done_today++`; next day → `streak++`; longer gap → streak resets to 1.
