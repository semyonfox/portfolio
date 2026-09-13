FROM ghcr.io/voidzero-dev/vite-plus:0.2.9@sha256:7f50a663616057466a23343053974b2ae82b1cbb94186e88d1fe9dc7b8c1fed2 AS build
WORKDIR /app
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN vp install --frozen-lockfile
COPY --chown=vp:vp . .
ARG PUBLIC_CHAT_API_URL=/api/chat
ENV PUBLIC_CHAT_API_URL=$PUBLIC_CHAT_API_URL
RUN vp run build

FROM nginx:1.31-alpine@sha256:a9ae6f6d078d477e21323310498e5196cb2b7c0aedd9e07b7306612077227d7c
RUN apk add --no-cache wget
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
