import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { selectedProjectIds } from '../data/project-display';

export const GET: APIRoute = async () => {
  const projects = (await getCollection('projects')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const games = (await getCollection('games')).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const selected = selectedProjectIds.map((id) => {
    const project = projectById.get(id);
    if (!project) throw new Error(`Selected project is missing: ${id}`);
    return project;
  });

  const selectedIds = new Set<string>(selectedProjectIds);
  const interactiveGames = games.filter((game) => !selectedIds.has(game.id));
  const shownIds = new Set([
    ...selectedProjectIds,
    ...interactiveGames.map((game) => game.id),
  ]);
  const remaining = projects.filter((project) => !shownIds.has(project.id));
  const personal = remaining.filter(
    (project) => project.data.category === 'personal',
  );
  const academic = remaining.filter(
    (project) => project.data.category === 'academic',
  );

  const renderProject = (project: (typeof projects)[number]) => {
    const links = [
      project.data.github && !project.data.private
        ? `GitHub: ${project.data.github}`
        : null,
      project.data.github && project.data.private
        ? 'Source: private repository'
        : null,
      project.data.live ? `Live: ${project.data.live}` : null,
      project.data.demo ? `Demo: ${project.data.demo}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return [
      `### [${project.data.title}](/projects/${project.id})${project.data.featured ? ' (featured)' : ''}`,
      '',
      project.data.description,
      '',
      `Stack: ${project.data.tags.join(', ')}`,
      links || null,
    ]
      .filter((line) => line !== null)
      .join('\n');
  };

  const renderGame = (game: (typeof games)[number]) => {
    const links = [
      game.data.embed ? `Open: /games#${game.id}` : null,
      game.data.github && !game.data.private
        ? `GitHub: ${game.data.github}`
        : null,
      game.data.noEmbed ? `Availability: ${game.data.noEmbed}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return [
      `### ${game.data.title}`,
      '',
      game.data.description,
      '',
      `Tech: ${game.data.tech}`,
      links || null,
    ]
      .filter((line) => line !== null)
      .join('\n');
  };

  const count = selected.length + interactiveGames.length + remaining.length;
  const markdown = `# Projects

Software for swimming, study, chess, games and the systems that run them. ${count} distinct entries.

## Selected work (${selected.length})

${selected.map(renderProject).join('\n\n')}

## Games and interactive tools (${interactiveGames.length})

${interactiveGames.map(renderGame).join('\n\n')}

## More personal projects (${personal.length})

${personal.map(renderProject).join('\n\n')}

## Coursework and team projects (${academic.length})

${academic.map(renderProject).join('\n\n')}
`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(markdown.length / 4)),
    },
  });
};
