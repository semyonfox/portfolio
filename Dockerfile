FROM ghcr.io/voidzero-dev/vite-plus:0.2.4@sha256:8ee0b146525eb74769564588091ba428188429885af17f7f01aa45d5b2835328 AS build
WORKDIR /app
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN vp install --frozen-lockfile
COPY --chown=vp:vp . .
ARG PUBLIC_CHAT_API_URL=/api/chat
ENV PUBLIC_CHAT_API_URL=$PUBLIC_CHAT_API_URL
RUN vp run build

FROM nginx:1.28-alpine@sha256:a8b39bd9cf0f83869a2162827a0caf6137ddf759d50a171451b335cecc87d236
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
