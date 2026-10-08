# Quiz Battle

A real-time multiplayer quiz game for learning **English** (vocabulary, IELTS-style questions) and **Japanese** (JLPT kanji). Players create a room, share a 5-character code with friends, and race to answer each question within 15 seconds. Correct and fast answers earn more points. A leaderboard is shown at the end of every match and results are saved to the database.

---

## Table of Contents

- [Features](#features)
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
- **English mode**: vocabulary and IELTS-style fill-in questions at three levels (A1-A2, B1-B2, C1-C2)
- **Japanese mode**: kanji meaning and reading questions from JLPT N5 to N1 (data from [kanjiapi.dev](https://kanjiapi.dev))
- **Real-time play**: live player list, a check mark when someone has answered, countdown timer
- **Scoring**: 100 points per correct answer plus up to 50 speed bonus points
- **Leaderboard**: top 10 players per language
- **History**: list of your matches and details of each match
- **Anti-cheat**: the server holds the answers and scores them; the correct answer is sent only after time is up
- **Dockerized**: the whole stack starts with one command

## Screenshots

> Add your screenshots to `docs/screenshots/` and keep the file names below.

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

| Japanese mode | Mobile (via tunnel) |
|---|---|
| ![Japanese](docs/screenshots/09-japanese.png) | ![Mobile](docs/screenshots/11-mobile.png) |

**Running containers**

![Docker](docs/screenshots/10-docker.png)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Redux Toolkit, React Router, Axios, Socket.IO client |
| Backend | NestJS, Socket.IO, Passport JWT, bcrypt |
| Database | PostgreSQL 16, Prisma ORM |
| Deployment | Docker Compose (db, backend, frontend served by Nginx), Cloudflare Tunnel |

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
 +-----------------------------------------------------------------------+
```

- **Nginx** serves the React build and acts as a reverse proxy, so the browser talks to a single address.
- **REST** (`/api`) handles sign up, login, leaderboard and history.
- **Socket.IO** (`/socket.io`) handles everything real-time: rooms, questions, answers, scores.
- **Active rooms live in server memory** for speed and simplicity. Only final match results are written to PostgreSQL.
- Only the `frontend` container publishes a port; the backend and database are reachable only inside the Docker network.

## Game Rules and Scoring

| Rule | Value |
|---|---|
| Time per question | 15 seconds |
| Pause between questions | 3 seconds (answer reveal) |
| Questions per match | 3 to 20 (host chooses) |
| Correct answer | 100 points |
| Speed bonus | up to 50 points, proportional to remaining time |
| Early finish | if every connected player has answered, the question ends immediately |

All timing and scoring are calculated on the server. The client only draws the countdown bar.

## Data Model

| Model | Fields | Purpose |
|---|---|---|
| `User` | id, email (unique), name, password (hashed), createdAt | Accounts |
| `Match` | id, code, language (`EN`/`JA`), totalQuestions, createdAt | One finished game |
| `MatchPlayer` | id, matchId, userId, score, rank | A player's result in a match |
| `KanjiCard` | id, kanji (unique), meanings, kunReadings, onReadings, jlpt, grade | Question bank for Japanese mode |

Relation: `User` - `MatchPlayer` - `Match` (many-to-many through `MatchPlayer`).

English questions come from `backend/src/quiz/english-question-bank.ts`. Japanese questions are generated from the `KanjiCard` table.

## API Reference

All REST routes use the `/api` prefix. Routes marked "auth" need the header `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | no | Body `{email, name, password}` (password at least 6 characters). Returns `{token, user}` |
| POST | `/api/auth/login` | no | Body `{email, password}`. Returns `{token, user}` |
| GET | `/api/auth/me` | yes | Current user |
| GET | `/api/matches/mine` | yes | Your last 20 matches |
| GET | `/api/matches/leaderboard?lang=EN\|JA` | yes | Top 10 by total score |
| GET | `/api/matches/:id` | yes | Match details with ranking |

## Socket.IO Events

The socket handshake must include the JWT: `io({ auth: { token } })`. Invalid tokens are rejected.

| Event | Direction | Payload | Description |
|---|---|---|---|
| `room:create` | client to server | `{lang, total, mode, level}` | Create a room; ack returns the room code |
| `room:join` | client to server | `{code}` | Join a room; ack returns `{code, lang, mode, level}` or `{error}` |
| `room:players` | server to room | player list | Players, scores and host flag |
| `game:start` | client to server | `{code}` | Host starts the match |
| `game:question` | server to room | `{index, total, text, options, durationMs}` | New question (the correct answer is **not** included) |
| `game:answer` | client to server | `{code, choice}` | Submit a selected option |
| `game:answered` | server to room | `{userId}` | Someone answered (shows a check mark) |
| `game:reveal` | server to room | `{correctIndex, answers, players}` | Correct answer and updated scores |
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

   All three services (`db`, `backend`, `frontend`) should be `Up`. The first build takes a few minutes.

3. Seed the kanji data (run once):

   ```bash
   docker compose exec backend npx ts-node prisma/seed-kanji.ts
   ```

4. Open **http://localhost**.

Useful commands:

| Command | Effect |
|---|---|
| `docker compose up -d` | Start the stack in the background |
| `docker compose up -d --build` | Rebuild after code changes |
| `docker compose ps` | Show running services |
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose restart backend` | Restart only the backend |
| `docker compose down` | Stop and remove containers (data is kept) |

> Never run `docker compose down -v` unless you want to delete the database (accounts, history and kanji data).

If port 80 is already in use, change `"80:80"` to `"8080:80"` in `docker-compose.yml` and open `http://localhost:8080`.

### Development Setup

Requirements: Node.js 20+ and Docker (for the database).

```bash
# 1. PostgreSQL for development (port 5433)
docker compose -f docker-compose.dev.yml up -d

# 2. Backend (http://localhost:3000)
cd backend
cp .env.example .env        # on Windows PowerShell: Copy-Item .env.example .env
npm install
npx prisma migrate dev
npx ts-node prisma/seed-kanji.ts
npm run start:dev

# 3. Frontend (http://localhost:5173)
cd ../frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` to the backend on port 3000. The development database and the Docker stack database are **separate**, so accounts do not carry over.

To test with two players on one computer, use a normal window and an incognito window (they keep separate `localStorage`, so they log in as different users).

### Environment Variables

| File | Variable | Description |
|---|---|---|
| `.env` (root) | `DB_PASSWORD` | PostgreSQL password used by Docker Compose |
| `.env` (root) | `JWT_SECRET` | Secret used to sign JWTs |
| `backend/.env` | `DATABASE_URL` | Connection string for local development, e.g. `postgresql://postgres:<password>@localhost:5433/quizdb` |
| `backend/.env` | `JWT_SECRET` | Same purpose as above |

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
│   │   ├── quiz/
│   │   │   ├── game.service.ts        Rooms, timer, scoring
│   │   │   ├── question.service.ts    Question generation
│   │   │   ├── english-question-bank.ts
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
| Table does not exist | `backend/prisma/migrations` is missing. Run `npx prisma migrate dev --name init` |
| Japanese mode shows an error or too few questions | Kanji data is not seeded (or the chosen JLPT level has too few kanji). Run the seed command |
| Garbled characters (`?` or a replacement symbol) | A file was saved in the wrong encoding. Re-save it as UTF-8 |
| Blank page when opening `index.html` directly | Expected. Use `http://localhost` (Docker) or `http://localhost:5173` (dev) |
| Page not updated after editing code | Docker serves a built copy. Run `docker compose up -d --build` |

## Limitations

- Active rooms are stored in server memory, so only a single backend instance is supported and running games are lost when the backend restarts. To scale horizontally, use the Socket.IO Redis adapter and keep room state in Redis.
- The seed script imports kanji of school grades 1 and 2 only (about 240 characters), so higher JLPT levels may have few questions.
- Reconnecting in the middle of a match does not restore the current question.
- Cloudflare quick tunnels have no uptime guarantee and are meant for demos, not production.

## Roadmap

- Rejoin a running match after a connection drop
- Import kanji of all grades and filter by JLPT level
- Vietnamese translations for kanji meanings
- Question categories and custom question sets managed by an admin
- Sound effects, streaks, and a red countdown bar for the last 5 seconds
- Persistent room state in Redis and deployment to a VPS
