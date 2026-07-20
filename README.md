# Semyon Fox — Portfolio

Source for [semyon.ie](https://semyon.ie): selected software projects, technical writing, experiments and CV.

[Portfolio](https://semyon.ie) · [Projects](https://semyon.ie/projects) · [CV](https://semyon.ie/cv) · [Download CV (PDF)](https://semyon.ie/cv.pdf) · [LinkedIn](https://www.linkedin.com/in/semyon-fox-968685249/) · [Email](mailto:hello@semyon.ie)

## Highlights

- Project case studies and technical writing across backend systems, data pipelines, infrastructure and developer tooling.
- Interactive experiments and games alongside the main portfolio content.
- A public Rust/Axum chat API used by the site assistant.
- Built with Astro, TypeScript, Preact and Tailwind CSS.
- Containerized deployment configuration using nginx, Docker Compose, Cloudflare Tunnel and Jenkins automation.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/content/` | projects, blog posts and game content |
| `src/` | Astro/Preact site and API code |
| `public/` | static assets, CV source and generated PDF |
| `docker-compose.yml` | container topology |
| `Jenkinsfile` | build and deployment pipeline |
| `docs/` | operational and content-maintenance documentation |

## Local development

This repository uses Vite+ for its development workflow.

```bash
vp install
vp run dev
```

For project checks and deployment details, start with [docs/README.md](./docs/README.md). Keep credentials in untracked environment files; see the repository guidance before configuring local services.
