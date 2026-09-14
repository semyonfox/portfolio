FROM ghcr.io/voidzero-dev/vite-plus:0.3.1@sha256:d3ce400c0155dbb2bb17e48bf4b549528cf6dbb6f837f0557acb162d97d4688e AS build
WORKDIR /app
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN vp install --frozen-lockfile
COPY --chown=vp:vp . .
ARG PUBLIC_CHAT_API_URL=/api/chat
ENV PUBLIC_CHAT_API_URL=$PUBLIC_CHAT_API_URL
RUN vp run build

FROM nginx:1.31-alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752
RUN apk add --no-cache wget
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
