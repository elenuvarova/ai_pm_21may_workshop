# Dutch Trainer

Тренажёр голландского для expat'ов в Бельгии/Нидерландах. Два режима: **sterke werkwoorden** (неправильные глаголы, 3 формы) и **het/de** (артикли существительных). Spaced repetition. Объяснения по запросу — на русском, с примером во фламандском, через Claude Haiku.

## Stack

- **Frontend:** React 18 + Vite 5 (JSX, без TypeScript)
- **Backend:** Node.js + Express, ES modules
- **ORM:** Sequelize
- **Database:** SQLite локально, Postgres на Render
- **LLM:** Claude Haiku 4.5 для кнопки «Why?» — серверный прокси, ключ не утекает в браузер
- **Deploy:** Render free tier (web + Postgres), provision через `render.yaml`

## Project structure

```
.
├── backend/
│   ├── models/
│   │   ├── Verb.js
│   │   ├── Noun.js
│   │   └── Stats.js
│   ├── seed.js          # 30 verbs + 40 nouns
│   ├── srs.js           # SRS intervals + streak logic
│   ├── db.js
│   ├── server.js        # /api/queue, /api/answer, /api/stats, /api/explain
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TabBar.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── VerbCard.jsx
│   │   │   ├── NounCard.jsx
│   │   │   └── WhyPanel.jsx
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

Нужны два терминала. Базу ставить не надо — SQLite встроен.

**Terminal 1 — backend:**

```bash
cd backend
npm install
npm run dev    # на Node 18+; на Node 17 — npm start
```

Бэк поднимается на `:3001`, при первом запуске сидит БД из `seed.js` (30 глаголов + 40 существительных). Файл `backend/data.sqlite` создаётся автоматически.

**Terminal 2 — frontend:**

```bash
cd frontend
npm install
npm run dev
```

Открыть <http://localhost:5173>. Vite проксирует `/api/*` на `:3001`.

### Чтобы заработала кнопка «Why?»

Скопируй [.env.example](.env.example) в `.env` в корне или в `backend/.env`, впиши `ANTHROPIC_API_KEY=sk-ant-...` (получить на [console.anthropic.com](https://console.anthropic.com)). Без ключа `/api/explain` отдаёт 503 и фронт показывает плейсхолдер — остальное работает.

## Deploy to Render

1. Push в GitHub.
2. Render → **New → Blueprint**, подключить репо.
3. Render читает [render.yaml](render.yaml): провижит бесплатный Postgres `ai-workshop-db`, билдит Docker-образ, стартует web-service `ai-workshop-web` с уже подключенным `DATABASE_URL`.
4. **Ручной шаг:** в Render dashboard → Environment → ввести `ANTHROPIC_API_KEY` (он помечен `sync: false`, в репо не коммитится).

Про free tier:

- Web-service **засыпает после ~15 минут простоя** — первый запрос потом ~30 сек.
- Free Postgres **истекает через 30 дней** — Render предупредит письмом.

## Endpoints

- `GET /api/health` — проверка БД, возвращает `{status, db}`.
- `GET /api/queue?kind=verb|noun&limit=10` — слова, готовые к повтору (`next_review <= now`, не mastered).
- `POST /api/answer {kind, key, userPast, userParticiple}` (verb) или `{kind, key, userArticle}` (noun) — сервер проверяет, обновляет SRS-уровень и stats, возвращает `{correct, correctAnswer, meaning_ru, newLevel, nextReview}`.
- `GET /api/stats` — streak, done_today, counts по {new, learning, review, mastered} для глаголов и существительных.
- `POST /api/explain {kind, key}` — Claude-разбор слова. Кэшируется в БД на первом вызове.
- В production: `GET /*` отдаёт билд фронта из `backend/public/`.

## SRS

- `correct`: `level+1`, интервалы `[10min, 1d, 3d, 7d, 21d]` индексируются по предыдущему `level`. Уровень 5 — mastered, исключается из очереди.
- `wrong`: `level → 1`, `next_review = now + 10min`.
- Streak считается по UTC-дате: same-day → done_today++; +1 day → streak++; больше дня — streak обнуляется до 1.
