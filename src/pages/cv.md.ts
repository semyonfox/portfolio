import type { APIRoute } from 'astro';

const md = `# Semyon Fox

Galway, Ireland · semyon.fox@gmail.com · https://semyon.ie · https://github.com/semyonfox · https://www.linkedin.com/in/semyon-fox-968685249/

PDF version: https://semyon.ie/cv.pdf

Second-year Computer Science student building full-stack web applications and running a 45-container homelab. Currently serving as Auditor of the 450+ member Computer Science Society, previously PR Officer.

## Technical skills

- Languages: JavaScript, Java, C, SQL, Python, Rust
- Web: React, Node.js/Express, REST APIs, HTML/CSS, Tailwind CSS, Astro, Next.js
- Databases: PostgreSQL, MySQL, TimescaleDB, Redis
- Infrastructure: Docker, Git/GitHub, Linux, Nginx, Cloudflare Workers, Restic, Btrfs, JWT, CSRF

## Education

**University of Galway** — BSc (Hons) Computer Science & IT · Expected August 2028
2nd year · First Class Honours (year 1)
Modules: Web Development, Algorithms & Data Structures, Database Systems, Software Engineering, OOP (Java), Discrete Mathematics, Calculus, Statistics

## Honours & awards

- **Best Intervarsity Competition** — CompSoc "Capture the Flag" (March 2025). University of Galway Societies Award; selected by panel of judges; represented university at BICS National Society Awards.
- **Brian O Maoilchiarain Award** — Outstanding Student, Leaving Certificate year (June 2024), Colaiste an Eachréidh.
- **STEM Award — GRETB** (June 2024). Recognition for excellence in STEM subjects.

## Key projects

- **Swimming Club Management System (SWIM)** — React 19, Node.js/Express, PostgreSQL, Redis, Docker, Jest. Full-stack platform for 200 swimmers, 5 coaches, 10 committee members. 58-table PostgreSQL schema. Production-grade security with JWT, CSRF, rate limiting.
- **Home Lab Server** — Docker, Linux, Nginx, Restic, Btrfs. Self-host 45+ services on repurposed hardware with Nginx reverse proxy. Automated encrypted backups with daily/weekly/monthly retention.
- **OghmaNotes** — CT216 capstone. Next.js, PostgreSQL, S3, Tailwind CSS. Full-featured note-taking app with AI RAG chat, Canvas LMS import, quiz generation with spaced repetition (FSRS).
- **Irish Rail Nabber** — Python, TimescaleDB, Docker Compose. Real-time Irish Rail data collector. Train positions every 3 seconds with interactive network visualisations.

See full list at https://semyon.ie/projects.

## Work experience

**Laptop Repair Technician** — Cahill Computers, Athenry (8 months)
Hardware upgrades, repairs, diagnostics. System administration, OS installation, drive cloning.

**Work Experience Placements** — Lapteck (2023), Old Barracks Kitchen (2023-2025)
Diverse roles developing reliability and technical troubleshooting in fast-paced environments.

## Leadership & involvement

**CompSoc Auditor** — University of Galway Computer Science Society · 2025-present
Leads committee for 450+ members. Chairs meetings, organised CTF 2026 (Ireland's largest student-run cybersecurity competition: 110+ participants, 4 corporate sponsors, 50% participant cost reduction). Previously PR Officer (Sept 2024 – Feb 2025).

## Interests

Self-hosting and home networking, Linux tinkering, competitive swimming, hands-on tech experimentation, video production (DaVinci Resolve — colour grading, VFX, editing), chess, woodworking, sci-fi.

## Languages

Fluent in Irish, conversational French, basics in Russian and German.
`;

export const GET: APIRoute = async () =>
  new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
