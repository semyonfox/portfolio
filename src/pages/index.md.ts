import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const GET: APIRoute = async () => {
  const projects = (await getCollection('projects')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const posts = (await getCollection('blog')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );
  const games = (await getCollection('games')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const featured = projects.find((p) => p.data.featured) || projects[0];

  const md = `# Semyon Fox

Developer, swimmer, tinkerer. Second-year Computer Science & IT student at the University of Galway (first-class honours, year 1). Auditor of CompSoc (450+ members); previously PR officer. Organised CTF 2026 — Ireland's largest student-run cybersecurity competition.

Builds and breaks things with curiosity. Currently running 45+ containers on a repurposed Dell XPS 15 homelab and chasing sub-1min 100m freestyle.

## Tech

JavaScript, TypeScript, React, Next.js, Node.js/Express, Java, Python, Rust, C, C++, SQL, PostgreSQL, MySQL, TimescaleDB, Redis, Docker, Linux, Nginx, Cloudflare Workers, AWS, Tailwind, Astro.

## Featured project

**${featured.data.title}** — ${featured.data.description}

Tags: ${featured.data.tags.join(', ')}${featured.data.github ? `\nGitHub: ${featured.data.github}` : ''}${featured.data.live ? `\nLive: ${featured.data.live}` : ''}

## Recent

- Latest blog: [${posts[0].data.title}](/blog/${posts[0].id}) — ${fmtDate(posts[0].data.date)}
- Latest game: ${games[0].data.title} (${games[0].data.tech})

## Pages

- [/projects](https://semyon.ie/projects) — ${projects.length} projects
- [/blog](https://semyon.ie/blog) — ${posts.length} posts
- [/games](https://semyon.ie/games) — ${games.length} games
- [/cv](https://semyon.ie/cv) — full CV (PDF at /cv.pdf)
- [/docs/chat-api](https://semyon.ie/docs/chat-api) — POST /api/chat ("ask Semyon" endpoint)

## For agents

This site supports content negotiation: send \`Accept: text/markdown\` to any page URL to get a markdown variant (also reachable via the explicit \`.md\` suffix).

Discovery: \`Link: </.well-known/api-catalog>; rel="api-catalog"\` on every response. The catalog (RFC 9727) advertises the chat API's OpenAPI spec, docs, and health endpoint.

## Contact

- Email: semyon.fox@gmail.com
- LinkedIn: https://www.linkedin.com/in/semyon-fox-968685249/
- GitHub: https://github.com/semyonfox
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
