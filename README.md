# Quiz Battle

A Vietnamese-language competitive English-learning game with CEFR levels from A1 to C2. Play a 60-second Time Attack, complete one shared 10-question Daily Challenge, practise in multiplayer rooms, and climb global Redis leaderboards.

---

## Table of Contents

- [Features](#features)
- [Game Modes](#game-modes)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Game Rules and Scoring](#game-rules-and-scoring)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Socket.IO Events](#socketio-events)
- [Getting Started](#getting-started)
  - [Run with Docker](#run-with-docker)
  - [Development Setup](#development-setup)
  - [Environment Variables](#environment-variables)
- [Share a Public Link](#share-a-public-link)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [Roadmap](#roadmap)

---

## Features

- **Authentication**: sign up and log in with JWT; passwords are hashed with bcrypt
- **Rooms**: create a room, join with a 5-character code, the host starts the game
- **CEFR learning path**: English vocabulary and grammar from A1 to C2; Vietnamese UI with English learning content
- **Time Attack**: answer as many questions as possible in 60 seconds; streak combos multiply points
- **Daily Challenge**: the same seeded 10-question B1 set for everyone each UTC day; one scored completion per player per day and a consecutive-day streak
- **Practice rooms**: retain the existing room-code multiplayer quiz and match history
- **Question types**: meaning choice, scrambled letters, fill in the blank, listen and choose with speech synthesis, and Wordle
- **Power-ups**: 50/50, +10 seconds and first-letter hint; each power-up is usable once per run
- **Real-time play**: live player list, a check mark when someone has answered, countdown timer
- **Scoring**: 100 points per correct answer plus up to 50 speed bonus points
- **Leaderboard**: global Redis sorted sets for today, this week and all time
- **History**: list of your matches and details of each match
- **Anti-cheat**: answers, scoring and deadlines are verified server-side; changing tabs is recorded
- **Dockerized**: the whole stack starts with one command

## Screenshots

> Add your screenshots to `docs/screenshots/` and keep the file names below.
> The screenshot files are not currently present in the repository; add them to this folder for the images to render.

| Login | Home |
|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Home](docs/screenshots/02-home.png) |

| Lobby | Playing |
|---|---|
| ![Lobby](docs/screenshots/03-lobby.png) | ![Playing](docs/screenshots/04-playing.png) |

| Answer reveal | Final result |
|---|---|
| ![Reveal](docs/screenshots/05-reveal.png) | ![Result](docs/screenshots/06-result.png) |

| Leaderboard | History |
|---|---|
| ![Leaderboard](docs/screenshots/07-leaderboard.png) | ![History](docs/screenshots/08-history.png) |

| Grammar mode | Mobile (via tunnel) |
|---|---|
| ![Grammar](docs/screenshots/09-grammar.png) | ![Mobile](docs/screenshots/11-mobile.png) |

**Running containers**

![Docker](docs/screenshots/10-docker.png)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Redux Toolkit, React Router, Axios, Socket.IO client |
| Backend | NestJS 12, Socket.IO, Passport JWT, bcrypt |
| Database | PostgreSQL 16, Prisma ORM |
| Cache / leaderboard / active solo sessions | Redis 7 sorted sets and expiring keys |
| Deployment | Docker Compose (db, Redis, backend, frontend served by Nginx), Cloudflare Tunnel |

## Architecture

```
Browser / phone
      |  https://xxx.trycloudflare.com   (optional, public link)
      v
 Cloudflare tunnel (cloudflared on your machine)
      |
      v
 localhost:80
 +--------------------------- Docker Compose ----------------------------+
 |  frontend (Nginx)                                                     |
 |    /            -> built React app (static files)                     |
 |    /api/        -> backend:3000   (REST)                              |
 |    /socket.io/  -> backend:3000   (WebSocket)                         |
 |                         |                                             |
 |                         v                                             |
|  backend (NestJS) --- Prisma ---> db (PostgreSQL, volume: dbdata)     |
|         |                                                            |
|         +---- redis (sorted sets / persistent solo sessions) --------|
 +-----------------------------------------------------------------------+
```

- **Nginx** serves the React build and acts as a reverse proxy, so the browser talks to a single address.
- **REST** (`/api`) handles sign up, login, leaderboard and history.
- **Socket.IO** (`/socket.io`) handles everything real-time: rooms, questions, answers, scores.
- Multiplayer room state lives in backend memory; solo sessions, daily completion/streak records, leaderboard scores and player names live in Redis. User accounts and multiplayer match history live in PostgreSQL.
- Only the `frontend` container publishes a port; the backend and database are reachable only inside the Docker network.

## Game Rules and Scoring

| Rule | Value |
|---|---|
| Time Attack | 60 seconds for as many answers as possible |
| Daily Challenge | 10 deterministic B1 questions per UTC day |
| Multiplayer practice | 15 seconds per question; 3-second answer reveal |
| Questions per multiplayer match | 3 to 20 (host chooses) |
| Correct answer | 100 points |
| Speed bonus | up to 50 points, proportional to remaining time |
| Solo combo | 10 base points per correct answer; every three consecutive correct answers adds a multiplier, up to 5× |
| Early finish | if every connected player has answered, the question ends immediately |

All timing and scoring are calculated on the server. The client displays the server deadline and countdown.

## Game Modes

| Mode | Skill | Status |
|---|---|---|
| Meaning choice | Vocabulary | Ready |
| Letter order | Spelling | Ready |
| Fill gap | Grammar | Ready |
| Listen choice | Listening with browser speech synthesis | Ready |
| Wordle | Vocabulary and spelling | Ready |
| Picture match, Hangman, error correction, sentence order, speaking, reading, word chain, crossword, Boggle | Mixed | Scaffolded with TODO markers |

Solo games share the module contract in `backend/src/quiz/english-game-modes.ts`: each module declares an ID and skill, generates a question from a CEFR level and supplied random source, then checks an answer. Time Attack selects from ready modules. Daily Challenge chooses reproducible modules/questions from the UTC date seed.

### Add a game mode or question

1. Add vocabulary or grammar entries with a `level` (`A1` through `C2`) to `backend/src/quiz/english-learning-bank.ts`. Include at least four entries per level for useful multiple-choice distractors.
2. Add an `EnglishModeId` and an `EnglishGameModule` in `english-game-modes.ts`. Implement `generateQuestion(level, random)` using the supplied random function so Daily Challenge remains reproducible, and implement `checkAnswer` on the server.
3. Add the mode ID to `PLAYABLE_MODES` only after it is ready. Add it to `DAILY_MODES` only when it is suitable for a shared daily challenge. Scaffolded modules have `todo: true` and are deliberately excluded.
4. Add a focused test in `english-game-modes.spec.ts`, then run `npm run build`, `npm run lint` and `npm test -- --runInBand src/quiz/english-game-modes.spec.ts` from `backend/`.

## Data Model

| Model | Fields | Purpose |
|---|---|---|
| `User` | id, email (unique), name, password (hashed), createdAt | Accounts |
| `Match` | id, code, language (`EN`/`JA`), totalQuestions, createdAt | One finished game |
| `MatchPlayer` | id, matchId, userId, score, rank | A player's result in a match |
| `KanjiCard` | id, kanji (unique), meanings, kunReadings, onReadings, jlpt, grade | Question bank for Japanese mode |

Relation: `User` - `MatchPlayer` - `Match` (many-to-many through `MatchPlayer`).

English practice questions come from `backend/src/quiz/english-learning-bank.ts`; question-game contracts live in `backend/src/quiz/english-game-modes.ts`. The legacy `KanjiCard` model and multiplayer match APIs remain for compatibility.

## API Reference

All REST routes use the `/api` prefix. Routes marked "auth" need the header `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | no | Body `{email, name, password}` (password at least 6 characters). Returns `{token, user}` |
| POST | `/api/auth/login` | no | Body `{email, password}`. Returns `{token, user}` |
| GET | `/api/auth/me` | yes | Current user |
| GET | `/api/matches/mine` | yes | Your last 20 matches |
| GET | `/api/matches/leaderboard?lang=EN\|JA` | yes | Legacy multiplayer match leaderboard |
| GET | `/api/matches/:id` | yes | Match details with ranking |
| POST | `/api/english-games/start` | yes | Start or resume `{kind: time-attack\|daily, level: A1..C2}` |
| GET | `/api/english-games/:id` | yes | Resume a Redis-backed solo session |
| POST | `/api/english-games/:id/answer` | yes | Submit an answer; the correct answer is never returned |
| POST | `/api/english-games/:id/items` | yes | Use `fifty-fifty`, `extra-time` or `hint` once per run |
| POST | `/api/english-games/:id/tab-hidden` | yes | Record a tab visibility change during a run |
| GET | `/api/english-games/leaderboard?scope=today\|week\|all` | yes | Global top 10 from Redis sorted sets |

## Socket.IO Events

The socket handshake must include the JWT: `io({ auth: { token } })`. Invalid tokens are rejected.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | client to server | `{lang, total, mode, level}` | Create a room; ack returns `{ok, code}` |
| `room:join` | client to server | `{code}` | Join a room; ack returns `{ok, code, lang, mode, level}` or `{error}` |
| `room:players` | server to room | `[{userId, name, score, isHost}]` | Current players, scores and host flag |
| `game:start` | client to server | `{code}` | Host requests to start the match |
| `game:start` | server to room | `{total}` | Announces that the match has started |
| `game:question` | server to room | `{index, total, text, options, durationMs}` | New question (the correct answer is **not** included) |
| `game:answer` | client to server | `{code, choice}` | Submit a selected option |
| `game:answered` | server to room | `{userId}` | Someone answered (shows a check mark) |
| `game:reveal` | server to room | `{correctIndex, answers, players}` | Correct answer and updated scores, after timeout or when all connected players have answered |
| `game:end` | server to room | `{ranking}` | Final ranking; the match is saved to the database |

## Getting Started

### Run with Docker

Requirement: [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Create a `.env` file in the project root (see `.env.example`):

   ```env
   DB_PASSWORD=your-alphanumeric-password
   JWT_SECRET=a-long-random-secret
   ```

   Use letters and digits only for the password, because it is embedded in the database connection URL.

2. Build and start everything:

   ```bash
   docker compose up -d --build
   docker compose ps
   ```

   All four services (`db`, `redis`, `backend`, `frontend`) should be `Up`. The first build takes a few minutes. English questions ship with the backend; no seed step is needed.

3. Open **http://localhost**.

Useful commands:

| Command | Effect |
|---|---|
| `docker compose up -d` | Start the stack in the background |
| `docker compose up -d --build` | Rebuild after code changes |
| `docker compose ps` | Show running services |
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose logs -f redis` | Follow Redis logs |
| `docker compose restart backend` | Restart only the backend |
| `docker compose down` | Stop and remove containers (data is kept) |

> `docker compose down -v` deletes PostgreSQL and Redis data, including accounts, match history, leaderboard scores and daily streaks.

If port 80 is already in use, change `"80:80"` to `"8080:80"` in `docker-compose.yml` and open `http://localhost:8080`.

### Development Setup

Requirements: Node.js 20+ and Docker (for PostgreSQL and Redis).

```bash
# 1. PostgreSQL (port 5433) and Redis (port 6379) for development
docker compose -f docker-compose.dev.yml up -d

# 2. Backend (http://localhost:3000)
cd backend
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
npm install
npx prisma migrate dev
npm run start:dev

# 3. Frontend (http://localhost:5173)
cd ../frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` to the backend on port 3000. The development database and the Docker stack database are **separate**, so accounts do not carry over. Redis-backed solo sessions and leaderboard data are global to whichever Redis service the backend connects to.

To test with two players on one computer, use a normal window and an incognito window (they keep separate `localStorage`, so they log in as different users).

### Environment Variables

| File | Variable | Description |
|---|---|---|
| `.env` (root) | `DB_PASSWORD` | PostgreSQL password used by Docker Compose |
| `.env` (root) | `JWT_SECRET` | Secret used to sign JWTs |
| `backend/.env` | `DATABASE_URL` | Connection string for local development, e.g. `postgresql://postgres:<password>@localhost:5433/quizdb` |
| `backend/.env` | `JWT_SECRET` | Same purpose as above |
| `backend/.env` | `REDIS_URL` | Redis connection; defaults to `redis://localhost:6379` for local development |

`.env` files are git-ignored. Copy the `.env.example` files and fill in your own values. **Never commit real secrets.**

## Share a Public Link

[Cloudflare quick tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/) gives friends a public URL without opening router ports or creating an account.

```bash
cloudflared tunnel --url http://localhost:80
```

If the tunnel cannot connect (some school or company networks block UDP), force HTTP/2:

```bash
cloudflared tunnel --protocol http2 --url http://localhost:80
```

- Keep the tunnel window open; closing it kills the link.
- The URL changes every time you restart the tunnel.
- The Docker stack must be running, and the laptop must stay awake and online.
- Before a demo, test with a phone on mobile data and check that the player list and check marks update instantly (this confirms WebSockets work through the tunnel).

## Project Structure

```
quiz-battle/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          Data model
│   │   ├── migrations/            Database migrations
│   │   └── seed-kanji.ts          Kanji importer (kanjiapi.dev)
│   ├── src/
│   │   ├── auth/                  Register, login, JWT strategy
│   │   ├── prisma/                Prisma service and module
│   │   ├── redis/                  Redis connection and global state
│   │   ├── quiz/
│   │   │   ├── game.service.ts        Rooms, timer, scoring
│   │   │   ├── question.service.ts    Question generation
│   │   │   ├── english-learning-bank.ts
│   │   │   ├── english-game-modes.ts   Shared game-module registry
│   │   │   ├── english-game.service.ts Solo sessions, scoring, items, leaderboards
│   │   │   ├── english-game.controller.ts Solo-game REST API
│   │   │   ├── quiz.gateway.ts        Socket.IO gateway
│   │   │   ├── match.controller.ts    History and leaderboard
│   │   │   └── quiz.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                 AuthPage, Home, Room, Leaderboard, History, MatchDetail
│   │   ├── store/                 Redux slices (auth, game)
│   │   ├── api.ts                 Axios instance
│   │   ├── socket.ts              Socket.IO client
│   │   └── App.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docs/screenshots/              README images
├── docker-compose.yml             Production stack
├── docker-compose.dev.yml         Database for development
├── demo.bat                       One-click start for demos (Windows)
├── .env.example
└── README.md
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `port is already allocated` | Port 80 is busy. Use `"8080:80"` in `docker-compose.yml` |
| `EADDRINUSE ... 3000` (dev) | An old backend is still running. Stop node processes and start again |
| `Can't reach database server` | The database is not ready. Check `docker compose ps` and wait about 20 seconds |
| `Cannot find module '/app/dist/main'` | Build output is in the wrong place. Check `backend/tsconfig.build.json` and rebuild with `--build` |
| `secretOrKey must be provided` | `JWT_SECRET` is missing, or `import 'dotenv/config'` is not at the top of `main.ts` |
| Web shows 502 | Backend is not up yet or crashed. Check `docker compose logs backend` |
| Table does not exist | Apply the committed migrations with `npx prisma migrate deploy` from `backend/` (or `docker compose exec backend npx prisma migrate deploy` for Docker) |
| Redis connection refused | Start Docker Compose, including the Redis service, or run the dev Redis container on port 6379 |
| Daily Challenge says it is already complete | Each account can score once per UTC day; an unfinished session resumes in the same browser |
| English level has too few questions | Add vocabulary and grammar entries for that CEFR level in `english-learning-bank.ts` |
| Garbled characters (`?` or a replacement symbol) | A file was saved in the wrong encoding. Re-save it as UTF-8 |
| Blank page when opening `index.html` directly | Expected. Use `http://localhost` (Docker) or `http://localhost:5173` (dev) |
| Page not updated after editing code | Docker serves a built copy. Run `docker compose up -d --build` |

## Limitations

- Active rooms are stored in server memory, so only a single backend instance is supported and running games are lost when the backend restarts. To scale horizontally, use the Socket.IO Redis adapter and keep room state in Redis.
- The seed script imports kanji from the JLPT N5 through N1 lists. A level may still have too few usable questions because question generation requires valid meanings/readings and enough distinct answer options.
- Reconnecting in the middle of a match does not restore the current question.
- Cloudflare quick tunnels have no uptime guarantee and are meant for demos, not production.

## Roadmap

- Rejoin a running match after a connection drop
- Import kanji of all grades and filter by JLPT level
- Vietnamese translations for kanji meanings
- Question categories and custom question sets managed by an admin
- Sound effects, streaks, and a red countdown bar for the last 5 seconds
- Persistent room state in Redis and deployment to a VPS
