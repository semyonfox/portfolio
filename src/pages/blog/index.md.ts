import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );

  const md = `# Blog

Thoughts, experiences, and things I've learned. ${posts.length} posts.

${posts
  .map(
    (p) =>
      `## [${p.data.title}](/blog/${p.id})\n\n${fmtDate(p.data.date)} · ${p.data.author}\n\n${p.data.description}`,
  )
  .join('\n\n')}
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
