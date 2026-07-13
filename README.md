# semyon.ie portfolio

Source for [semyon.ie](https://semyon.ie), a personal portfolio built with
Astro. nginx serves the static site and its Markdown variants; a Rust Axum
service powers the public chat API.

## Quick start

The frontend uses Vite+ `0.2.4`, which manages the required Node.js runtime and
delegates package installation to the pinned pnpm version.

```bash
curl -fsSL https://vite.plus | VP_VERSION=0.2.4 bash
```

After opening a new shell:

```bash
vp install
vp run dev
```

Astro prints the local URL when the development server starts.

To run the chat API separately, create its ignored environment file and start
the Rust service:

```bash
cd api
cp .env.example .env
cargo run
```

The Docker Compose stack is deployment-oriented because its public entry point
is a Cloudflare tunnel. Copy `.env.example` to `.env`, replace the placeholders,
then run `docker compose up --build` when you need the full stack.

## Checks

```bash
vp run check
vp run build
cargo test --manifest-path api/Cargo.toml
```

`vp run check` runs Vite+'s formatting, linting, and TypeScript checks followed
by Astro's type/content checks. `vp run build` also exercises every generated HTML and Markdown
route.

## Repository guide

| Path                      | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `src/pages`               | Astro pages and `.md.ts` Markdown variants                    |
| `src/content`             | Blog posts, project entries, and game metadata                |
| `src/data`                | Shared data used by pages and generated documentation         |
| `api`                     | Rust chat/analytics service and its OpenAPI document          |
| `public`                  | Static assets, game builds, and downloadable CV files         |
| `docs`                    | Maintainer runbooks and dated audit snapshots                 |
| `nginx.conf`              | Static serving, compression, and Markdown content negotiation |
| `Jenkinsfile`, `jenkins/` | CI/CD pipeline and Jenkins image configuration                |

See [`docs/README.md`](docs/README.md) for the documentation map and maintenance
rules.

## Environment files

Never commit populated environment files. See
[`docs/operations/secrets.md`](docs/operations/secrets.md) for the owner runbook.

| File       | Used by                 | Notes                                                                                                         |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.env`     | Docker Compose          | Copy from `.env.example`; Compose uses the API, analytics, and tunnel values. The Jenkins block is standalone |
| `api/.env` | `cargo run` from `api/` | Copy from `api/.env.example`; the API key is the only required value                                          |

`ANALYTICS_SALT` is optional in development but should be stable and secret in
production so anonymous daily visitor counts survive service restarts.

## Content and machine-readable docs

Content collection schemas live in `src/content.config.ts`. Keep card
descriptions concise and put longer, non-duplicated detail in the Markdown body.

The site exposes Markdown in two ways:

- request a page with `Accept: text/markdown`;
- request the explicit `.md` route, such as `/projects.md` or
  `/docs/chat-api.md`.

Chat API HTML and Markdown documentation share `src/data/chatApiDocs.ts`, while
request/response details come from `api/openapi.json`.

## Deployment

Production runs three Compose services:

- `portfolio`: the Astro build served by nginx;
- `chat-api`: the Axum service on the internal port `3001`;
- `tunnel`: the Cloudflare tunnel entry point.

Jenkins installs dependencies, runs the available checks, and rebuilds the
stack after a push to `main`. `vp run deploy` only verifies the local checkout;
Jenkins owns the production deployment.

GitHub Pages is not a production path. `.nojekyll` only prevents a legacy
branch-based Pages configuration from treating Astro source as Jekyll content.

## License

Licensed under the [MIT License](LICENSE).
