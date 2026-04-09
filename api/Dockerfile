FROM rust:1.87-slim AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
# cache deps
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release 2>/dev/null || true
RUN rm -rf src

COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
COPY --from=builder /app/target/release/portfolio-chat-api /usr/local/bin/portfolio-chat-api

ENV PORT=3001
EXPOSE 3001

CMD ["portfolio-chat-api"]
