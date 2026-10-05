// single source for the privacy notice, rendered by privacy.astro and privacy.md.ts

export const privacyMeta = {
  title: 'Privacy',
  pageDescription:
    'What semyon.ie collects and why. No cookies, no banners, no raw IPs.',
  updated: '3 October 2026',
};

export interface PrivacySection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export const privacyIntro =
  'This version uses no cookies, browser storage, visitor identifiers or fingerprinting for analytics. Anonymous counts and fixed error categories are off until explicitly configured. This notice describes this version; it requires the matching site and API deployment.';

export const privacySections: PrivacySection[] = [
  {
    heading: 'Anonymous counts and errors',
    paragraphs: [
      'If enabled, self-hosted analytics receive screen and action counts plus fixed technical error categories. Each event contains only the schema version, app name, count/error kind, an allowlisted event name, web surface and a static page category.',
      'No URL paths, query strings, referrers, browser details, country, IP hashes, visitor IDs, conversation IDs, form contents or error messages/stacks are included. There are no unique visitor counts or recordings.',
    ],
  },
  {
    heading: 'Opting out',
    paragraphs: [
      'Do Not Track and Global Privacy Control suppress analytics. You can also select “Disable anonymous counts for this page session” in the footer. That choice lasts through site navigation until reload and is kept only in memory.',
    ],
  },
  {
    heading: 'Chat and contact',
    paragraphs: [
      'Assistant messages are forwarded to OpenRouter and the underlying model provider to generate replies. Please leave out personal details. This API version does not write questions, replies or visitor identifiers to analytics storage.',
      'Cloudflare Email Service delivers the name, email and message you submit to the configured inbox. Contact message contents are not stored in this site’s database; the delivered email remains in the inbox until deleted.',
      'IP addresses are used transiently in memory for security rate limiting. Site traffic passes through Cloudflare. Hosting intermediaries and external providers have their own processing and retention policies.',
    ],
  },
  {
    heading: 'Retention',
    paragraphs: [
      'The self-hosted collector contract requires UTC daily aggregate counts only: 30 days for usage counts and 14 days for error counts, with hourly purging. Raw events and request metadata must not be stored, and access logging must be disabled on the ingestion path before collection is enabled.',
      'This version stops writing to the previous analytics database and leaves existing historical records untouched. Their retention and deletion need a separate operator review. Updating this source does not change a running deployment or delete stored data.',
    ],
  },
  {
    heading: 'Questions and requests',
    paragraphs: [
      'For privacy questions, access, correction, deletion or objections, email hello@semyon.ie. Anonymous counters have no visitor identifier that can link them back to you.',
    ],
  },
];

export const renderPrivacyMarkdown = () => `# ${privacyMeta.title}

Last updated: ${privacyMeta.updated}

${privacyIntro}

${privacySections
  .map((section) =>
    [
      `## ${section.heading}`,
      ...(section.paragraphs ?? []),
      ...(section.items?.map((item) => `- ${item}`) ?? []),
    ].join('\n\n'),
  )
  .join('\n\n')}
`;
