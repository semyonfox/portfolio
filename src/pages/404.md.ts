import type { APIRoute } from 'astro';

const md = `# 404 — not found

Nothing here. Try one of these:

- [Home](https://semyon.ie/)
- [Projects](https://semyon.ie/projects)
- [Blog](https://semyon.ie/blog)
- [CV](https://semyon.ie/cv)
- [Chat API docs](https://semyon.ie/docs/chat-api)
`;

export const GET: APIRoute = async () =>
  new Response(md, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
