// single source for the privacy notice, rendered by privacy.astro and privacy.md.ts

export const privacyMeta = {
  title: 'Privacy',
  pageDescription:
    'What semyon.ie collects and why. No cookies, no banners, no raw IPs.',
  updated: '11 July 2026',
};

export interface PrivacySection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export const privacyIntro =
  "This site collects as little as it can, and stores none of it on your device. No cookies, no localStorage, no fingerprinting, no third-party analytics, no ads. That's why there's no cookie banner.";

export const privacySections: PrivacySection[] = [
  {
    heading: 'What gets collected',
    items: [
      'Assistant chats: the messages you send, the reply you get, a timestamp, response time, and which model answered. Chats are read later to improve the assistant and to spot what people look for, so please don’t type personal details into it.',
      'Usage events: page views, aggregate internal navigation between site paths, coarse link placement (header, footer, content, or call to action), chat opens, game launches, outbound link clicks, contact form submissions, and requests for pages that don’t exist. Event URLs are limited to paths or external origins and paths, without query strings or fragments. Page views are classified only as direct or external arrivals; navigation events are not tied together into a browsing history.',
      'Device context per event: browser and operating system family (parsed from the user agent, the raw string is never kept), preferred language, and a coarse device class (mobile, tablet, or desktop).',
      'Rough location: a two-letter country code resolved by Cloudflare at the network edge. This site never looks up or stores your IP address itself.',
      'An anonymous visitor id: a salted hash of your IP and browser that rotates every day, used to estimate daily unique visitors. It is designed not to reveal your IP and can’t link your visits across days.',
    ],
  },
  {
    heading: 'What never gets collected',
    items: [
      'Raw IP addresses. They’re used transiently in memory for rate limiting, then discarded.',
      'Names, emails, or accounts, unless you type them into the chat or the contact form yourself.',
      'Anything stored in or read from browser storage.',
    ],
  },
  {
    heading: 'Opting out',
    paragraphs: [
      'If your browser sends Do Not Track or Global Privacy Control, usage events are not recorded. This is honoured on both the client and the server.',
    ],
  },
  {
    heading: 'Third parties',
    items: [
      'OpenRouter: chat messages are forwarded to OpenRouter and the underlying model provider to generate replies.',
      'Formspree: the contact form is processed by Formspree, which receives the name, email, and message you submit.',
      'Cloudflare: site traffic passes through Cloudflare, which performs the country lookup at the edge.',
    ],
  },
  {
    heading: 'Retention',
    paragraphs: [
      'Chat logs are kept for up to 12 months. Usage events are kept for up to 24 months. After that they’re deleted.',
    ],
  },
  {
    heading: 'Legal basis',
    paragraphs: [
      'Processing rests on legitimate interest (GDPR article 6(1)(f)): running, securing, and improving this site. Nothing here is used for advertising, sold, or shared for marketing.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'You have the usual GDPR rights: access, correction, deletion, and objection. Email hello@semyon.ie. One honest caveat: because visitor ids rotate daily and IPs aren’t stored, this site usually can’t tell which rows are yours. For chat deletion requests it helps if you can quote part of the conversation.',
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
