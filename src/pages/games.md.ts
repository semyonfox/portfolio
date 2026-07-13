import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const games = (await getCollection('games')).sort(
    (a, b) => a.data.order - b.data.order,
  );

  const md = `# Games and apps

Games, simulations, and interactive experiments. ${games.length} entries.

${games
  .map((g) => {
    const links = [
      g.data.github && !g.data.private ? `GitHub: ${g.data.github}` : null,
      g.data.github && g.data.private ? 'Source: private repository' : null,
      g.data.embed ? `Play: ${g.data.embed}` : null,
      g.data.noEmbed ? `Availability: ${g.data.noEmbed}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return [
      `## ${g.data.title}`,
      '',
      g.data.description,
      '',
      `Tech: ${g.data.tech}`,
      links ? links : null,
    ]
      .filter((s) => s !== null)
      .join('\n');
  })
  .join('\n\n')}
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
