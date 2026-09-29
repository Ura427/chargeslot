# Build from the repo root (npm workspaces share one lockfile):
#   docker build -f api/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The schema is copied first because `npm ci` runs `prisma generate` on postinstall.
COPY api/package.json api/prisma.config.ts api/
COPY api/prisma api/prisma
RUN npm ci -w api
COPY api/ api/
RUN npm run build -w api

FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
# --omit=optional drops the Prisma CLI, which @prisma/client pulls in as an optional peer (~240 MB).
RUN npm ci -w api --omit=dev --omit=optional --ignore-scripts

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/api/dist api/dist
COPY api/package.json api/
USER node
EXPOSE 3000
CMD ["node", "api/dist/main.js"]
