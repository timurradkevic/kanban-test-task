# syntax=docker/dockerfile:1

##### Base ########################################################
# Debian-slim instead of alpine — Prisma engines behave more reliably on it.
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

##### Dependencies (full workspace, cached) #######################
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace=backend --include-workspace-root

##### Build (generate Prisma client + compile TypeScript) #########
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate --config prisma.config.ts
RUN npm run build

##### Production ####################################################
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app/backend

COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts

# --- Runtime configuration -----------------------------------------
# These are placeholders. Provide real values on your hosting platform
# (Render/Railway/Fly.io dashboard, docker-compose env_file, `docker run -e`, etc.)
ENV PORT=3000
ENV DATABASE_URL=""
ENV CORS_ORIGIN=""

EXPOSE 3000

# Applies pending Prisma migrations, then starts the server.
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma.config.ts && node dist/server.js"]
