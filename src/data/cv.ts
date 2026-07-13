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
  format: 'pdf' | 'tex';
  href: `/${string}`;
  filename: string;
  badge: 'PDF' | 'TEX';
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
      'Semyon Fox - CS student, full-stack developer, homelab enthusiast.',
  },
  person: {
    name: 'Semyon Fox',
    location: 'Galway, Ireland',
    siteOrigin: portfolioOrigin,
    contacts: [
      {
        label: 'hello@semyon.ie',
        href: 'mailto:hello@semyon.ie',
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
        href: 'https://www.linkedin.com/in/semyon-fox-968685249/',
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
      format: 'tex',
      href: '/cv.tex',
      filename: 'SEMYON_FOX_CV.tex',
      badge: 'TEX',
      optionTitle: 'TeX source',
    },
  ] satisfies readonly CVDownload[],
  summary: {
    html: 'Builder, swimmer, filmmaker. Second-year Computer Science student at the University of Galway with First Class Honours in year 1. Auditor turned Treasurer of CompSoc, a 450+ member computing society. Builds React and Next.js frontends, Rust APIs, and self-hosted infrastructure.',
    markdown:
      'Builder, swimmer, filmmaker.\n2nd-year CS at Galway (First Class Honours). Auditor turned Treasurer of CompSoc, a 450+ member computing society. Builds React/Next.js frontends, Rust APIs, and self-hosted infra.',
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
      items: ['JavaScript', 'TypeScript', 'Java', 'C', 'SQL', 'Python', 'Rust'],
    },
    {
      label: 'Web',
      items: [
        'React',
        'Next.js',
        'Astro',
        'Node.js/Express',
        'REST APIs',
        'HTML/CSS',
        'Tailwind CSS',
      ],
    },
    {
      label: 'Databases',
      items: ['PostgreSQL', 'TimescaleDB', 'MySQL', 'Redis'],
    },
    {
      label: 'Infrastructure',
      items: [
        'Docker',
        'Jenkins CI/CD',
        'Git/GitHub',
        'Linux',
        'nginx',
        'Cloudflare Workers',
        'Tunnels',
        'Zero Trust',
        'AWS',
        'Btrfs',
        'NFS',
      ],
    },
  ] satisfies readonly CVSkillGroup[],
  education: {
    institution: 'University of Galway',
    degree:
      'Bachelor of Science (Honours) in Computer Science and Information Technology',
    expected: { month: 'August', year: 2028 },
    year: '2nd Year',
    distinction: 'First Class Honours',
    distinctionPeriod: 'Year 1',
    modules: [
      { name: 'Software Engineering' },
      { name: 'Database Systems', markdownDetail: 'SQL' },
      { name: 'OOP', detail: 'Java' },
      { name: 'Data Structures & Algorithms' },
      { name: 'Networks & Data Communication' },
      { name: 'Computer Systems & Organisation' },
      { name: 'Digital Security & Cryptography' },
      {
        name: 'Modelling',
        markdownDetail: 'Python/NumPy/Matplotlib',
      },
      { name: 'Discrete Mathematics' },
      { name: 'Linear Algebra' },
      { name: 'Statistics' },
    ] satisfies readonly CVModule[],
  },
  awards: [
    {
      title: 'Best Intervarsity Award',
      context: 'CompSoc "Capture the Flag"',
      dates: [
        { month: 'March', year: 2025 },
        { month: 'March', year: 2026 },
      ],
      description:
        'University of Galway Societies Awards 2025 and 2026; BICS National Society Award 2025, nominated again in 2026.',
    },
    {
      title: 'Brian O Maoilchiarain Award',
      dates: [{ month: 'June', year: 2024 }],
      description: 'Outstanding Student, Leaving Certificate year',
      issuer: 'Colaiste an Eachréidh',
    },
    {
      title: 'STEM Award',
      context: 'GRETB',
      dates: [{ month: 'June', year: 2024 }],
      description: 'Recognition for excellence in STEM subjects.',
    },
  ] satisfies readonly CVAward[],
  projects: [
    {
      name: 'OghmaNotes',
      formats: ['html', 'markdown'],
      status: { text: 'MVP deployed', htmlTitleCase: true },
      stack: [
        { name: 'Next.js' },
        { name: 'TypeScript' },
        { name: 'PostgreSQL', detail: 'pgvector' },
        { name: 'Redis' },
        { name: 'AWS' },
        { name: 'Docker' },
      ],
      description:
        'Markdown e-learning platform with RAG search, quizzing, FSRS spaced repetition, Canvas LMS import, PDF extraction, and embedding pipeline. Migrated from AWS to self-hosted on-prem to cut costs.',
      links: [
        {
          url: 'https://oghmanotes.ie',
          label: 'Live at',
          placement: 'tail',
        },
      ],
    },
    {
      name: 'Uisce',
      formats: ['html', 'markdown'],
      status: { text: 'In development, targeting August 2026' },
      stack: [
        { name: 'React 19' },
        { name: 'Node.js/Express' },
        { name: 'PostgreSQL' },
        { name: 'Redis' },
        { name: 'Docker' },
        { name: 'Jest' },
      ],
      description:
        'Full-stack platform with role-based access for swimmers, coaches, and committee members. 58-table PostgreSQL schema covering attendance, meet results, training schedules, squad analytics, and equipment.',
    },
    {
      name: 'Canvas MCP Server',
      formats: ['html', 'markdown'],
      status: { text: 'Open source', htmlTitleCase: true },
      stack: [
        { name: 'TypeScript' },
        { name: 'Model Context Protocol SDK' },
        { name: 'Zod' },
      ],
      description:
        'MCP server exposing the full Canvas LMS REST API to AI assistants across 15 domains. Merged and normalised 12 open-source Canvas MCP projects.',
      links: [
        {
          url: 'https://github.com/semyonfox/canvas-mcp',
          placement: 'tail',
        },
      ],
    },
    {
      name: 'Irish Rail Data Pipeline',
      formats: ['html', 'markdown'],
      status: { text: 'Running 24/7' },
      stack: [
        { name: 'Python', detail: 'asyncio/aiohttp' },
        { name: 'TimescaleDB' },
        { name: 'Rust', detail: 'axum' },
        { name: 'Docker' },
      ],
      description:
        'Polls Irish Rail every 3 seconds, storing train positions and station data in TimescaleDB. Rust API serves a live map and delay-tracking dashboard.',
    },
    {
      name: 'Home Lab & CI/CD Infrastructure',
      formats: ['html', 'markdown'],
      status: { text: 'Ongoing' },
      stack: [
        { name: 'Docker' },
        { name: 'Jenkins' },
        { name: 'nginx' },
        { name: 'Cloudflare Tunnels' },
        { name: 'Btrfs' },
        { name: 'NFS' },
        { name: 'Pi-hole' },
      ],
      description: {
        html: 'Self-hosts 30+ services in 54 containers. Six Jenkins pipelines auto-deploy projects on GitHub push, with Cloudflare Zero Trust tunnels, internal nginx reverse proxying, and GFS backups to NAS.',
        markdown:
          'Self-host 30+ services in 54 containers. Six Jenkins pipelines auto-deploy OghmaNotes, Uisce, Portfolio, etc. on GitHub push. Cloudflare Zero Trust tunnels, internal nginx reverse proxying, and GFS backups to NAS.',
      },
    },
    {
      name: 'Portfolio Website',
      formats: ['markdown'],
      stack: [
        { name: 'Astro' },
        { name: 'Preact' },
        { name: 'Tailwind CSS v4' },
        { name: 'Rust', detail: 'axum' },
        { name: 'Docker' },
        { name: 'Jenkins' },
      ],
      description:
        'Portfolio with projects, write-ups, experiments, and an AI chatbot answering questions about me from the Rust backend.',
      links: [
        {
          url: 'https://semyon.ie',
          placement: 'lead',
        },
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
        title: 'Laptop Repair Technician',
        organisation: 'Cahill Computers',
        location: 'Athenry & Galway',
        context: 'part-time, 8 months',
        description:
          'Hardware upgrades, repairs, diagnostics. System administration, OS installation, drive cloning.',
      },
      {
        title: 'Work Experience Placements',
        organisation: 'Lapteck',
        context: 'TY placement',
        year: 2023,
        description:
          'Hardware upgrades, screen and battery replacements, OS installation, drive cloning, and diagnostics.',
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
      'Led 450+ member student society across finance, communications, and event strategy. Organised CompSoc CTF 2026 with 110+ participants, securing four corporate sponsors and university grant funding. Reduced participant costs by 50%; increased event profit. Fixed CI/CD pipeline and JSX syntax bugs on the compsoc.ie React/TypeScript frontend.',
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
        html: 'Video production, colour grading, VFX, and editing in DaVinci Resolve.',
        markdown:
          'colour grading, VFX, and editing in DaVinci Resolve for short films and personal projects.',
      },
    },
    {
      label: 'Woodworking',
      description: {
        html: 'Woodworking and hand-built live-edge furniture.',
        markdown: 'hand-built live-edge furniture pieces.',
      },
    },
  ] satisfies readonly CVInterest[],
} as const;

export type CVData = typeof cv;
