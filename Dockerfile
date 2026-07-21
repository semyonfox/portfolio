FROM ghcr.io/voidzero-dev/vite-plus:0.2.5@sha256:d76cd1d63710a942bd6d8c00d149064b4dbc776720ef4f36d401d927d092d0ad AS build
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
