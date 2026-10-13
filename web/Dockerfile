# Build from the repo root (npm workspaces share one lockfile):
#   docker build -f web/Dockerfile --build-arg VITE_API_URL=http://localhost:3000 .

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/
RUN npm ci -w web
COPY web/ web/
# Vite replaces import.meta.env.VITE_* with literal strings during the build, so the
# API URL is fixed here, at build time. Changing it later means rebuilding the image.
# It's the URL the *browser* uses, so it points at the host-published API port,
# never at the compose service name `api`.
ARG VITE_API_URL=http://localhost:3000
RUN npm run build -w web

FROM nginx:alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
