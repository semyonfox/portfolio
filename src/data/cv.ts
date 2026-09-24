export type CVFormat = 'html' | 'markdown';

export type FormatText =
  | string
  | {
      html: string;
      markdown: string;
    };

export interface CVDate {
  month: string;
  year: number;
}

export interface CVContact {
  label: string;
  href: string;
  external?: boolean;
}

export interface CVDownload {
  format: 'pdf' | 'zip';
  href: `/${string}`;
  filename: string;
  badge: 'PDF' | 'ZIP';
  optionTitle: string;
}

export interface CVSkillGroup {
  label: string;
  items: readonly string[];
}

export interface CVInterest {
  label: string;
  description: FormatText;
}

export interface CVStackItem {
  name: string;
  detail?: string;
}

export interface CVProjectStatus {
  text: string;
  htmlTitleCase?: boolean;
}

export interface CVProject {
  name: string;
  formats: readonly CVFormat[];
  status?: CVProjectStatus;
  stack: readonly CVStackItem[];
  description: FormatText;
  links?: readonly {
    url: string;
    label?: string;
    placement?: 'lead' | 'tail';
  }[];
}

export interface CVModule {
  name: string;
  detail?: string;
  markdownDetail?: string;
}

export interface CVAward {
  title: string;
  context?: string;
  dates: readonly CVDate[];
  description: string;
  issuer?: string;
}

export interface CVRepairEntry {
  title: string;
  organisation: string;
  location?: string;
  context: string;
  year?: number;
  description: string;
}

export const portfolioOrigin = 'https://semyon.ie';

export const portfolioUrl = (path: `/${string}`) =>
  new URL(path, portfolioOrigin).toString();

export const textFor = (value: FormatText, format: CVFormat) =>
  typeof value === 'string' ? value : value[format];

export const formatDate = (date: CVDate, abbreviated = false) =>
  `${abbreviated ? date.month.slice(0, 3) : date.month} ${date.year}`;

export const formatAwardDates = (dates: readonly CVDate[], format: CVFormat) =>
  dates.map((date) => formatDate(date, format === 'html')).join(', ');

export const formatStack = (stack: readonly CVStackItem[], format: CVFormat) =>
  stack
    .flatMap((item) => {
      if (!item.detail) return item.name;

      return format === 'html'
        ? [item.name, item.detail]
        : `${item.name} (${item.detail})`;
    })
    .join(', ');

export const formatModules = (modules: readonly CVModule[], format: CVFormat) =>
  modules
    .map((module) => {
      const detail =
        format === 'markdown'
          ? (module.markdownDetail ?? module.detail)
          : module.detail;

      return detail ? `${module.name} (${detail})` : module.name;
    })
    .join(', ');

export const projectSupports = (project: CVProject, format: CVFormat) =>
  project.formats.includes(format);

export const formatProjectStatus = (
  status: CVProjectStatus,
  format: CVFormat,
) =>
  format === 'html' && status.htmlTitleCase
    ? status.text.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    : status.text;

export const cv = {
  seo: {
    title: 'CV | Semyon Fox',
    description:
      'Semyon Fox, third-year Computer Science and IT student at the University of Galway. Projects, experience and a two-page CV.',
  },
  person: {
    name: 'Semyon Fox',
    location: 'Galway, Ireland',
    siteOrigin: portfolioOrigin,
    contacts: [
      {
        label: 'semyon.fox@gmail.com',
        href: 'mailto:semyon.fox@gmail.com',
        external: false,
      },
      {
        label: 'semyon.ie',
        href: portfolioOrigin,
        external: false,
      },
      {
        label: 'github.com/semyonfox',
        href: 'https://github.com/semyonfox',
        external: true,
      },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/semyonfox/',
        external: true,
      },
    ] satisfies readonly CVContact[],
  },
  downloads: [
    {
      format: 'pdf',
      href: '/cv.pdf',
      filename: 'SEMYON_FOX_CV.pdf',
      badge: 'PDF',
      optionTitle: 'PDF version',
    },
    {
      format: 'zip',
      href: '/cv-source.zip',
      filename: 'SEMYON_FOX_CV_SOURCE.zip',
      badge: 'ZIP',
      optionTitle: 'LaTeX source',
    },
  ] satisfies readonly CVDownload[],
  summary: {
    html: 'Programmer, swimmer, filmmaker. Third-year Computer Science and IT student at the University of Galway. I build software for study and swimming, write tools to simplify everyday tasks, and run my own Linux infrastructure. I use AI throughout development and take responsibility for reviewing, testing and maintaining what I build.',
    markdown:
      'Programmer, swimmer, filmmaker. Third-year Computer Science and IT student at the University of Galway. I build software for study and swimming, write tools to simplify everyday tasks, and run my own Linux infrastructure. I use AI throughout development and take responsibility for reviewing, testing and maintaining what I build.',
  },
  sections: {
    skills: {
      html: 'Technical Skills',
      markdown: 'Technical skills',
    },
    education: 'Education',
    awards: {
      html: 'Honours & Awards',
      markdown: 'Honours & awards',
    },
    projects: {
      html: 'Key Projects',
      markdown: 'Key projects',
    },
    workExperience: {
      html: 'Work Experience',
      markdown: 'Work experience',
    },
    leadership: {
      html: 'Leadership & Involvement',
      markdown: 'Leadership & involvement',
    },
    interests: 'Interests',
  },
  skills: [
    {
      label: 'Languages',
      items: [
        'TypeScript',
        'Python',
        'Go',
        'Rust',
        'SQL',
        'Bash',
        'Java and C coursework',
      ],
    },
    {
      label: 'Applications and data',
      items: [
        'React',
        'Next.js',
        'Node.js',
        'PostgreSQL',
        'Redis',
        'Qdrant',
        'REST',
        'MCP',
      ],
    },
    {
      label: 'Delivery',
      items: [
        'Git',
        'Linux',
        'Docker',
        'Jenkins',
        'BuildKit',
        'Nginx',
        'Cloudflare',
        'AWS project experience',
      ],
    },
  ] satisfies readonly CVSkillGroup[],
  education: {
    institution: 'University of Galway',
    degree:
      'Bachelor of Science (Honours) in Computer Science and Information Technology',
    expected: { month: 'August', year: 2028 },
    year: 'Third year',
    distinction: '2:1',
    distinctionPeriod: 'Current overall average',
    modules: [
      { name: 'Software Engineering' },
      { name: 'Data Structures & Algorithms' },
      { name: 'Database Systems' },
      { name: 'Networks and Data Communications' },
      { name: 'Human-Computer Interaction' },
    ] satisfies readonly CVModule[],
  },
  awards: [
    {
      title: 'CompSoc: Best Intervarsity',
      dates: [
        { month: 'March', year: 2025 },
        { month: 'March', year: 2026 },
      ],
      description:
        'University of Galway award in 2025 and 2026; BICS National Society Award winner in 2025 and nominee in 2026.',
    },
    {
      title: 'Brian Ó Maoilchiaráin Award',
      dates: [{ month: 'June', year: 2024 }],
      description: 'Outstanding Leaving Certificate student',
      issuer: 'Coláiste an Eachréidh',
    },
    {
      title: 'GRETB STEM Award',
      dates: [{ month: 'June', year: 2024 }],
      description: 'STEM award.',
    },
  ] satisfies readonly CVAward[],
  projects: [
    {
      name: 'OghmaNotes',
      formats: ['html', 'markdown'],
      status: { text: 'Deployed' },
      stack: [
        { name: 'Next.js' },
        { name: 'TypeScript' },
        { name: 'PostgreSQL' },
        { name: 'Qdrant' },
        { name: 'Redis/BullMQ' },
        { name: 'Docker' },
      ],
      description:
        'Built in a three-person team. OghmaNotes brings Canvas course material, notes, cited AI chat, quizzes and spaced repetition into one study workspace. Its import workers extract PDFs, create embeddings and report progress; Qdrant handles retrieval while PostgreSQL stores content and ownership. The team moved it from AWS to self-hosted Docker.',
      links: [{ url: 'https://oghmanotes.ie', label: 'Live at' }],
    },
    {
      name: 'Uisce',
      formats: ['html', 'markdown'],
      status: { text: 'Deployed' },
      stack: [
        { name: 'React' },
        { name: 'Express' },
        { name: 'PostgreSQL' },
        { name: 'Redis' },
        { name: 'JSON:API' },
        { name: 'Docker' },
        { name: 'Vitest' },
      ],
      description:
        'Built a swimming-club platform for squads, training sessions, attendance, results and performance tracking. Designed its React interface, JSON:API backend and multi-schema PostgreSQL model; tested client and API workflows with Vitest.',
      links: [{ url: 'https://swim.semyon.ie', label: 'Live at' }],
    },
    {
      name: 'Home lab and CI/CD infrastructure',
      formats: ['html', 'markdown'],
      status: { text: 'Self-hosted' },
      stack: [
        { name: 'Linux' },
        { name: 'Docker' },
        { name: 'Jenkins' },
        { name: 'Nginx' },
        { name: 'Cloudflare' },
        { name: 'Btrfs' },
        { name: 'NFS' },
      ],
      description:
        'Run 30+ services in 54 containers with Jenkins pipelines, Cloudflare tunnels and Nginx reverse proxies across 21 internal virtual hosts. Back up services to a RAID NAS over NFS using Btrfs snapshots.',
    },
    {
      name: 'Irish Rail data pipeline',
      formats: ['html', 'markdown'],
      status: { text: 'Deployed' },
      stack: [
        { name: 'Python', detail: 'asyncio/aiohttp' },
        { name: 'TimescaleDB' },
        { name: 'Rust', detail: 'axum' },
        { name: 'Docker' },
      ],
      description:
        'Built a Python collector that polls the Irish Rail API every three seconds and stores train positions and station data in TimescaleDB. A Rust API feeds a live map and delay dashboard.',
      links: [{ url: 'https://traein.semyon.ie', label: 'Live at' }],
    },
  ] satisfies readonly CVProject[],
  openSource: [
    {
      name: 'Noctalia Bluetooth fix',
      formats: ['html', 'markdown'],
      status: { text: 'Merged contribution' },
      stack: [{ name: 'C++' }],
      description:
        'Contributed a fix that stops Bluetooth discovery after ten seconds and cancels pending scans when the panel closes.',
      links: [
        {
          url: 'https://github.com/noctalia-dev/noctalia/pull/4145',
          label: 'Pull request #4145',
        },
      ],
    },
    {
      name: 'Seol',
      formats: ['html', 'markdown'],
      status: { text: 'Open source' },
      stack: [{ name: 'Go' }, { name: 'SQLite' }, { name: 'Docker' }],
      description:
        'Built a service and CLI that publish HTML reports and static sites through temporary links, with expiry, archive size and path checks, and atomic updates at the same URL.',
      links: [{ url: 'https://github.com/semyonfox/seol', label: 'GitHub' }],
    },
    {
      name: 'Canvas MCP',
      formats: ['html', 'markdown'],
      status: { text: 'Open source' },
      stack: [
        { name: 'TypeScript' },
        { name: 'Model Context Protocol SDK' },
        { name: 'Zod' },
      ],
      description:
        'Consolidated and extended community tool designs into a typed MCP server for selected Canvas LMS APIs, with input validation, pagination, timeouts and bounded retries for read operations.',
      links: [
        { url: 'https://github.com/semyonfox/canvas-mcp', label: 'GitHub' },
      ],
    },
  ] satisfies readonly CVProject[],
  projectsIndex: {
    href: '/projects',
    label: 'view all projects',
  },
  repairExperience: {
    entries: [
      {
        title: 'School IT support',
        organisation: 'Coláiste an Eachréidh',
        context: '2023–2026; one voluntary year, then two paid',
        description:
          'Configured laptops, set up ebooks and carried out repairs for students. Built API integrations and automation tools for ebook setup at the school.',
      },
      {
        title: 'Laptop repair technician',
        organisation: 'Cahill Computers',
        location: 'Athenry',
        context: '2022; part-time',
        description:
          'Diagnosed faults, replaced screens and batteries, upgraded RAM and storage, cloned drives and installed Windows.',
      },
      {
        title: 'Laptop repair placement',
        organisation: 'Lapteck',
        location: 'Galway',
        context: '2022; Transition Year',
        description:
          'Completed a work-experience placement learning laptop diagnostics and repair.',
      },
      {
        title: 'Kitchen porter',
        organisation: 'Old Barracks',
        location: 'Athenry',
        context: 'seasonal and part-time',
        description:
          'Supported the kitchen team during busy summer services, with additional occasional part-time work.',
      },
    ] satisfies readonly CVRepairEntry[],
  },
  leadership: {
    shortOrganisation: 'CompSoc',
    organisation: 'University of Galway Computer Society',
    currentRole: 'Treasurer',
    capacity: 'volunteer',
    involvementPeriod: 'Nov 2024–present',
    description:
      'Organised CompSoc CTF 2026 as part of the committee, with 110 participants, four corporate sponsors and 50% lower participant costs. Contributed to the society website through CI build checks, deployment and routing fixes, and committee updates.',
    roleHistory: [
      {
        role: 'Public Relations Officer',
        period: 'Nov 2024–Feb 2025',
      },
      { role: 'Auditor', period: 'Feb 2025–Mar 2026' },
      { role: 'Treasurer', period: 'Mar 2026–present' },
    ],
  },
  interests: [
    {
      label: 'Swimming',
      description: {
        html: 'Competitive pool swimming with regular training and meets.',
        markdown: 'competitive pool swimmer with regular training and meets.',
      },
    },
    {
      label: 'Video Production',
      description: {
        html: 'Video production, colour grading and VFX in DaVinci Resolve.',
        markdown:
          'colour grading, VFX, and editing in DaVinci Resolve for short films and personal projects.',
      },
    },
    {
      label: 'Woodworking',
      description: {
        html: 'Woodworking and hand-built live-edge furniture.',
        markdown: 'woodworking and hand-built live-edge furniture.',
      },
    },
  ] satisfies readonly CVInterest[],
} as const;

export type CVData = typeof cv;
