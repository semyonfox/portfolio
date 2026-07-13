import type { APIRoute } from 'astro';
import {
  cv,
  formatAwardDates,
  formatDate,
  formatModules,
  formatProjectStatus,
  formatStack,
  portfolioUrl,
  projectSupports,
  textFor,
  type CVAward,
  type CVProject,
  type CVRepairEntry,
} from '../data/cv';

const renderAward = (award: CVAward) => {
  const dates = formatAwardDates(award.dates, 'markdown');

  if (award.issuer) {
    return `- **${award.title}** — ${award.description} (${dates}), ${award.issuer}.`;
  }

  const context = award.context ? ` — ${award.context}` : '';
  return `- **${award.title}**${context} (${dates}). ${award.description}`;
};

const markdownUrl = (url: string) => `<${url}>`;

const renderProject = (project: CVProject) => {
  const status = project.status
    ? formatProjectStatus(project.status, 'markdown')
    : '';
  const leadLinks =
    project.links
      ?.filter((link) => link.placement === 'lead')
      .map((link) => markdownUrl(link.url)) ?? [];
  const tailLinks =
    project.links
      ?.filter((link) => link.placement !== 'lead')
      .map((link) =>
        link.label
          ? `${link.label} ${markdownUrl(link.url)}`
          : markdownUrl(link.url),
      ) ?? [];
  const lead = [...leadLinks, status].filter(Boolean).join('. ');
  const heading = `**${project.name}** — ${lead ? `${lead}. ` : ''}${formatStack(project.stack, 'markdown')}.`;

  return `- ${[
    heading,
    textFor(project.description, 'markdown'),
    ...tailLinks.map((link) => `${link}.`),
  ].join(' ')}`;
};

const markdownProjects = cv.projects.filter((project) =>
  projectSupports(project, 'markdown'),
);
const markdownContact = (href: string) => href.replace(/^mailto:/, '');
const renderRepairEntry = (entry: CVRepairEntry) => {
  const workplace = [entry.organisation, entry.location]
    .filter(Boolean)
    .join(', ');
  const context = [entry.context, entry.year].filter(Boolean).join(', ');

  return `**${entry.title}** — ${workplace} (${context})\n\n${entry.description}`;
};
const roleHistory = cv.leadership.roleHistory
  .map((role) => `${role.role} (${role.period})`)
  .join(', ');

const md = `# ${cv.person.name}

${cv.person.location} · ${cv.person.contacts.map((contact) => markdownContact(contact.href)).join(' · ')}

${cv.downloads.map((download) => `${download.optionTitle}: <${portfolioUrl(download.href)}>`).join('\n')}

${textFor(cv.summary, 'markdown')}

## ${textFor(cv.sections.skills, 'markdown')}

${cv.skills.map((skill) => `- ${skill.label}: ${skill.items.join(', ')}`).join('\n')}

## ${textFor(cv.sections.education, 'markdown')}

**${cv.education.institution}** — ${cv.education.degree} · Expected ${formatDate(cv.education.expected)}

${cv.education.year.replace('Year', 'year')} · ${cv.education.distinction} (${cv.education.distinctionPeriod.toLowerCase()})

Modules: ${formatModules(cv.education.modules, 'markdown')}

## ${textFor(cv.sections.awards, 'markdown')}

${cv.awards.map(renderAward).join('\n')}

## ${textFor(cv.sections.projects, 'markdown')}

${markdownProjects.map(renderProject).join('\n')}

See full list at <${portfolioUrl(cv.projectsIndex.href)}>.

## ${textFor(cv.sections.workExperience, 'markdown')}

${cv.repairExperience.entries.map(renderRepairEntry).join('\n\n')}

## ${textFor(cv.sections.leadership, 'markdown')}

**${cv.leadership.organisation} (${cv.leadership.shortOrganisation})** — ${cv.leadership.currentRole}, ${cv.leadership.capacity} (${cv.leadership.involvementPeriod})

${cv.leadership.description} Held three committee roles: ${roleHistory}.

## ${textFor(cv.sections.interests, 'markdown')}

${cv.interests.map((interest) => `- **${interest.label}:** ${textFor(interest.description, 'markdown')}`).join('\n')}
`;

export const GET: APIRoute = async () =>
  new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
