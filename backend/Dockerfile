# syntax=docker/dockerfile:1

##### Base ########################################################
# Debian-slim instead of alpine — Prisma engines behave more reliably on it.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

##### Dependencies (npm hoists everything into the root node_modules) ####
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace=backend --include-workspace-root

##### Build (generate Prisma client + compile TypeScript) #########
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend ./backend
WORKDIR /app/backend
# prisma.config.ts resolves DATABASE_URL eagerly even for `generate` (which
# doesn't actually connect to a DB) — a placeholder is enough at build time;
# the real value is supplied at runtime by the hosting platform.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx prisma generate --config prisma.config.ts
RUN npx tsc -p tsconfig.json

##### Production ####################################################
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app

# node_modules stays at the repo root; Node's module resolution walks
# up parent directories to find it, so ./backend/dist can still `require`
# everything from here.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/prisma.config.ts ./backend/prisma.config.ts

WORKDIR /app/backend

# --- Runtime configuration -----------------------------------------
# These are placeholders. Provide real values on your hosting platform
# (Render/Railway/Fly.io dashboard, docker-compose env_file, `docker run -e`, etc.)
ENV PORT=3000
ENV DATABASE_URL=""
ENV CORS_ORIGIN=""

EXPOSE 3000

# Applies pending Prisma migrations, then starts the server.
# Note: tsconfig has no explicit rootDir, and its `include` covers both
# src/ and prisma.config.ts (which lives next to src/, not inside it) — so
# tsc infers the backend/ folder itself as rootDir and mirrors that under
# dist/, landing the compiled entrypoint at dist/src/server.js.
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.ts && node dist/src/server.js"]
