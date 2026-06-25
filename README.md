# Portfolio

Personal site for [semyon.ie](https://semyon.ie). Astro builds the frontend, nginx serves the static output with Markdown content negotiation, and a Rust Axum service backs the chat API.

## Repo Map

- `src/pages`: Astro pages plus `.md.ts` Markdown variants for agent-readable output.
- `src/content`: blog posts, project entries, and game metadata.
- `src/data`: shared structured data used by pages and generated docs.
- `api`: Rust chat API and OpenAPI spec.
- `nginx.conf`: static serving, gzip, and `Accept: text/markdown` routing.
- `Jenkinsfile`, `jenkins/`, `docker-compose.yml`: deployment automation.

## Local Development

Requires Node `>=22.12.0` and pnpm `10.33.2`.

```bash
corepack enable
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm preview
pnpm check
```

For the chat API or tunnel, copy `.env.example` to `.env` and set `OPENROUTER_API_KEY` and `TUNNEL_TOKEN`.

## Content And Docs

- Content collections are typed in `src/content.config.ts`.
- The Chat API HTML and Markdown docs render from `src/data/chatApiDocs.ts`, with endpoint/schema details pulled from `api/openapi.json`.
- Page Markdown variants are available by sending `Accept: text/markdown` or by requesting the explicit `.md` route.

## Deployment

Production runs with Docker Compose:

- `portfolio`: Astro build served by nginx.
- `chat-api`: Rust Axum backend on port `3001`.
- `tunnel`: Cloudflare tunnel entrypoint.

Jenkins installs dependencies, runs lint/test steps when available, and rebuilds the compose stack from `main` after a push. `pnpm run deploy` is intentionally local-only: it verifies the site with `check` and `build`, then reminds you that Jenkins owns the actual deployment.

## License

MIT
