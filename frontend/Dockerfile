# syntax=docker/dockerfile:1

##### Dependencies (npm hoists everything into the root node_modules) ####
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace=frontend --include-workspace-root

##### Build ###########################################################
# Vite inlines env vars at build time, so the API URL must be supplied
# as a build argument (not a runtime env var).
FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

##### Production (static files served by nginx) #######################
FROM nginx:1.27-alpine AS production
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
