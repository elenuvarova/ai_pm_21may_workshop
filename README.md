# AI PM Workshop Template

A minimal full-stack starter: React + Vite on the frontend, Express + Sequelize on the backend. SQLite locally so there's nothing to install; Postgres in production. Deploys to the Render free tier as a Blueprint — no credit card, no infra wiring.

## Stack

- **Frontend:** React 18 + Vite 5 (plain JavaScript / JSX)
- **Backend:** Node.js + Express, ES modules
- **ORM:** Sequelize
- **Database:** SQLite locally, Postgres on Render (selected at runtime from `DATABASE_URL`)
- **Deploy:** Render free web service + free Postgres, provisioned via `render.yaml`
- **Container:** Docker is used only by Render's build — local dev does not need it

## Project structure

```
.
├── backend/
│   ├── package.json
│   ├── server.js
│   └── db.js
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── styles.css
├── Dockerfile
├── render.yaml
├── .env.example
├── .gitignore
├── .dockerignore
└── README.md
```

## Local development

No database to install — SQLite is built in. The backend creates `backend/data.sqlite` on first boot.

Open two terminals.

**Terminal 1 — backend:**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api/*` to the backend on port 3001.

## Deploy to Render

1. Push this repo to GitHub.
2. In Render, click **New → Blueprint** and connect the repo.
3. Render reads `render.yaml`, provisions the free Postgres database, builds the Docker image, and starts the web service with `DATABASE_URL` already wired up.

Things to know about the free tier:

- The web service **sleeps after ~15 minutes of inactivity**, so the first request after idle takes ~30 seconds (cold start).
- The free Postgres database **expires after 30 days** — Render will email you before it does.

## Endpoints

- `GET /api/health` — verifies the database connection. Returns `{ "status": "ok", "db": "sqlite" | "postgres" }`.
- `GET /api/hello` — returns `{ "message": "Hello from the backend 👋" }`.
- `GET /*` — in production, serves the built frontend from `backend/public/`.
