# Kanban Task Management Boards

A small, anonymous Trello-style task board app. Anyone can create a board, share its ID/link, and manage columns and cards on it — no authentication required.

**Live demo:** https://kanban-frontend-sdsr.onrender.com

> Hosted on Render's free tier — the backend spins down after 15 minutes of inactivity, so the first request after a while can take 30-50s to wake it up.

## Features

- Create / rename / delete boards
- Every board is created with three fixed columns: **To Do**, **In Progress**, **Done**
- Open any board by its ID and load its columns and cards
- Create / edit / delete cards (title + description)
- Drag & drop cards between columns and reorder them within a column

## Tech stack

| Layer        | Choice                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Frontend     | React 19 (hooks only), TypeScript, Redux Toolkit, dnd-kit, Vite, Tailwind CSS |
| Backend      | Express.js, TypeScript, Prisma ORM                                            |
| Database     | PostgreSQL                                                                    |
| Testing      | Vitest, Testing Library, Supertest                                            |
| Code quality | ESLint, Prettier, Husky + lint-staged, commitlint                             |
| CI/CD        | GitHub Actions                                                                |

## Project structure

```
.
├── backend/            Express + TypeScript API (Prisma/PostgreSQL)
│   ├── prisma/          schema & migrations
│   └── src/
│       ├── controllers/ request validation (zod) + response shaping
│       ├── services/    business logic / Prisma queries
│       ├── routes/      Express routers
│       └── middlewares/ error handling
├── frontend/           React + TypeScript SPA (feature-sliced design)
│   └── src/
│       ├── app/          store, providers, routing shell
│       ├── pages/        route-level components
│       ├── widgets/      composed UI blocks (e.g. the board)
│       ├── features/     user actions (create/update/delete/move)
│       ├── entities/     domain models + API clients (board, column, task)
│       └── shared/       generic UI, api client, lib utilities
└── .github/workflows/  CI pipeline
```

## Getting started locally (without Docker)

Requirements: Node.js 20+, npm, a running PostgreSQL instance.

```bash
# 1. Install all workspace dependencies
npm install

# 2. Configure environment variables
cp backend/.env.example backend/.env      # edit DATABASE_URL if needed
cp frontend/.env.example frontend/.env

# 3. Apply database migrations
npm run --workspace=backend -- prisma migrate deploy

# 4. Run both apps in dev mode
npm run dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

Useful root-level scripts (run across both workspaces):

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest
npm run format       # Prettier --write
```

## Running with Docker

Each app has its own multi-stage `Dockerfile`, and `docker-compose.yml` wires them together with a PostgreSQL container for a one-command local setup:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Postgres: localhost:5432 (user/pass: `postgres` / `postgres`)

Migrations run automatically on backend container startup (`prisma migrate deploy`).

### Building images individually

```bash
# Backend
docker build -f backend/Dockerfile -t kanban-backend .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e CORS_ORIGIN="https://your-frontend-url" \
  -e PORT=3000 \
  kanban-backend

# Frontend (VITE_API_URL is baked in at build time, not runtime)
docker build -f frontend/Dockerfile \
  --build-arg VITE_API_URL="https://your-backend-url" \
  -t kanban-frontend .
docker run -p 8080:80 kanban-frontend
```

## Environment variables

**backend/.env**

| Variable       | Description                             | Example                                                          |
| -------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string            | `postgresql://postgres:password@localhost:5432/kanban_test_task` |
| `PORT`         | Port the API listens on                 | `3000`                                                           |
| `CORS_ORIGIN`  | Allowed origin for the frontend         | `http://localhost:5173`                                          |
| `NODE_ENV`     | `development` \| `production` \| `test` | `development`                                                    |

**frontend/.env**

| Variable       | Description                 | Example                 |
| -------------- | --------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:3000` |

## CI

`.github/workflows/ci.yml` runs on every push/PR to `main` and, for both the frontend and backend workspaces independently: install → lint → typecheck → test (and build, for the frontend).

## Deployment

Deployed on [Render](https://render.com), one Docker web service per app plus a managed PostgreSQL instance.

- **Backend URL:** https://kanban-backend-1ox0.onrender.com
- **Frontend URL:** https://kanban-frontend-sdsr.onrender.com
- **Database:** managed PostgreSQL (Render), connected via `DATABASE_URL`

Flow used:

1. Provisioned a managed PostgreSQL database on Render, copied its internal connection string into `DATABASE_URL`.
2. Deployed `backend/Dockerfile` as a Web Service; set `DATABASE_URL`, `CORS_ORIGIN` (the frontend URL above), `NODE_ENV=production`. Migrations (`prisma migrate deploy`) run automatically on container start.
3. Deployed `frontend/Dockerfile` as a Web Service, with `VITE_API_URL` set to the backend URL above passed as a **Docker Build Arg** (Vite inlines it at build time, not runtime).
4. Set `CORS_ORIGIN` on the backend to the final frontend URL and redeployed.
