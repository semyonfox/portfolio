import type { APIRoute } from 'astro';

const md = `# Semyon Fox

Galway, Ireland · semyon.fox@gmail.com · https://semyon.ie · https://github.com/semyonfox · https://linkedin.com/in/semyonfox

PDF version: https://semyon.ie/cv.pdf
TeX source: https://semyon.ie/cv.tex

Builder, swimmer, filmmaker.
2nd-year CS at Galway (First Class Honours). Auditor turned Treasurer of CompSoc, a 450+ member computing society. Builds React/Next.js frontends, Rust APIs, and self-hosted infra.

## Technical skills

- Languages: JavaScript, TypeScript, Java, C, SQL, Python, Rust
- Web: React, Next.js, Astro, Node.js/Express, REST APIs, HTML/CSS, Tailwind CSS
- Databases: PostgreSQL, TimescaleDB, MySQL, Redis
- Infrastructure: Docker, Jenkins CI/CD, Git/GitHub, Linux, Nginx, Cloudflare Workers, Tunnels, Zero Trust, AWS, Btrfs, NFS

## Education

**University of Galway** — Bachelor of Science (Honours) in Computer Science and Information Technology · Expected August 2028
2nd year · First Class Honours (year 1)
Modules: Software Engineering, Database Systems (SQL), OOP (Java), Data Structures & Algorithms, Networks & Data Communication, Computer Systems & Organisation, Digital Security & Cryptography, Modelling (Python/NumPy/Matplotlib), Discrete Mathematics, Linear Algebra, Statistics

## Honours & awards

- **Best Intervarsity Award** — CompSoc "Capture the Flag" (March 2025, March 2026). University of Galway Societies Awards 2025 and 2026; BICS National Society Award 2025, nominated again in 2026.
- **Brian O Maoilchiarain Award** — Outstanding Student, Leaving Certificate year (June 2024), Colaiste an Eachréidh.
- **STEM Award — GRETB** (June 2024). Recognition for excellence in STEM subjects.

## Key projects

- **OghmaNotes** — MVP deployed. Next.js, TypeScript, PostgreSQL (pgvector), Redis, AWS, Docker. Markdown e-learning platform with RAG search, quizzing, FSRS spaced repetition, Canvas LMS integration, PDF extraction, and embedding pipeline. Migrated from AWS to self-hosted on-prem to cut costs. Live at https://oghmanotes.ie.
- **Uisce** — In development, targeting August 2026. React 19, Node.js/Express, PostgreSQL, Redis, Docker, Jest. Full-stack platform with role-based access for swimmers, coaches, and committee members. 58-table PostgreSQL schema covering attendance, meet results, training schedules, squad analytics, and equipment.
- **Canvas MCP Server** — Open source. TypeScript, Model Context Protocol SDK, Zod. MCP server exposing the full Canvas LMS REST API to AI assistants across 15 domains; merged and normalised 12 open-source Canvas MCP projects. https://github.com/semyonfox/canvas-mcp
- **Irish Rail Data Pipeline** — Running 24/7. Python (asyncio/aiohttp), TimescaleDB, Rust (axum), Docker. Polls Irish Rail every 3 seconds, storing train positions and station data in TimescaleDB. Rust API serves a live map and delay-tracking dashboard.
- **Home Lab & CI/CD Infrastructure** — Docker, Jenkins, Nginx, Cloudflare Tunnels, Btrfs, NFS, Pi-hole. Self-host 30+ services in 54 containers. Six Jenkins pipelines auto-deploy OghmaNotes, Uisce, Portfolio, etc. on GitHub push. Cloudflare Zero Trust tunnels, internal Nginx reverse proxying, and GFS backups to NAS.
- **Portfolio Website** — https://semyon.ie. Astro, Preact, Tailwind CSS v4, Rust (axum), Docker, Jenkins. Portfolio with projects, write-ups, experiments, and an AI chatbot answering questions about me from the Rust backend.

See full list at https://semyon.ie/projects.

## Work experience

**University of Galway Computer Society (CompSoc)** — Treasurer, volunteer (Nov 2024-present)
Led 450+ member student society across finance, communications, and event strategy. Organised CompSoc CTF 2026 (110+ participants), securing four corporate sponsors and university grant funding. Reduced participant costs by 50%; increased event profit. Fixed CI/CD pipeline and JSX syntax bugs on the compsoc.ie React/TypeScript frontend. Held three committee roles: Public Relations Officer (Nov 2024-Feb 2025), Auditor (Feb 2025-Mar 2026), Treasurer (Mar 2026-present).

**Computer Repair Technician** — Cahill Computers, Athenry & Galway (part-time, 8 months), Lapteck (TY placement, 2023)
Hardware upgrades, repairs, diagnostics. System administration, OS installation, drive cloning.

## Interests

Swimming: competitive pool swimmer with regular training and meets.
Video Production: colour grading, VFX, and editing in DaVinci Resolve for short films and personal projects.
Woodworking: hand-built live-edge furniture pieces.
`;

export const GET: APIRoute = async () =>
  new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
