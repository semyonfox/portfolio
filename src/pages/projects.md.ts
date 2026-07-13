import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const all = (await getCollection('projects')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const personal = all.filter((p) => p.data.category === 'personal');
  const academic = all.filter((p) => p.data.category === 'academic');

  const renderOne = (p: (typeof all)[number]) => {
    const links = [
      p.data.github && !p.data.private ? `GitHub: ${p.data.github}` : null,
      p.data.github && p.data.private ? 'Source: private repository' : null,
      p.data.live ? `Live: ${p.data.live}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return [
      `### ${p.data.title}${p.data.featured ? ' (featured)' : ''}`,
      '',
      p.data.description,
      '',
      `Stack: ${p.data.tags.join(', ')}`,
      links ? links : null,
    ]
      .filter((s) => s !== null)
      .join('\n');
  };

  const md = `# Projects

Things I've built, broken, and learned from. ${all.length} entries.

## Personal (${personal.length})

${personal.map(renderOne).join('\n\n')}

## Academic (${academic.length})

${academic.map(renderOne).join('\n\n')}
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
