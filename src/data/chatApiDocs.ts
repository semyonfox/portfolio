import openApi from '../../api/openapi.json';

const siteUrl = openApi.servers[0]?.url ?? 'https://semyon.ie';
const chatPath = '/api/chat';
const healthPath = '/api/chat/health';
const openApiPath = '/api/chat/openapi.json';
const catalogPath = '/.well-known/api-catalog';
const markdownPath = '/docs/chat-api.md';

const chatOperation = openApi.paths[chatPath].post;
const requestSchema = openApi.components.schemas.ChatRequest;
const messageSchema = openApi.components.schemas.ChatMessage;
const messagesSchema = requestSchema.properties.messages;
const contentSchema = messageSchema.properties.content;

const requestExample =
  chatOperation.requestBody.content['application/json'].examples.minimal.value;
const responseExample =
  chatOperation.responses['200'].content['application/json'].examples.reply
    .value;
const healthExample = { status: 'ok' };

const jsonBlock = (value: unknown) => JSON.stringify(value, null, 2);
const jsonInline = (value: unknown) => JSON.stringify(value);
const absoluteUrl = (path: string) => `${siteUrl}${path}`;

export const chatApiJson = {
  request: jsonBlock(requestExample),
  response: jsonBlock(responseExample),
  health: jsonBlock(healthExample),
  healthInline: jsonInline(healthExample),
};

export const chatApiDocs = {
  title: 'Chat API',
  pageDescription:
    "POST /api/chat. Semyon's site assistant answers questions about his projects, blog, and background.",
  summary:
    "A small public endpoint for the site's assistant. It answers in third person about Semyon's projects, blog, and background. Replies are plain text, rate limited, non-streaming, and unauthenticated.",
  endpoint: {
    method: 'POST',
    path: chatPath,
    url: absoluteUrl(chatPath),
    contentType: 'application/json',
  },
  requestRules: [
    {
      term: 'messages',
      description: `${messagesSchema.minItems}-${messagesSchema.maxItems} entries of { role, content }.`,
    },
    {
      term: 'role',
      description: `${messageSchema.properties.role.enum
        .map((role) => `"${role}"`)
        .join(
          ' or ',
        )}. Client-supplied system messages are ignored before the model call.`,
    },
    {
      term: 'content',
      description: `Non-empty string, max ${contentSchema.maxLength} characters.`,
    },
    {
      term: 'history',
      description:
        'The server prepends a fixed system prompt and keeps only the last 5 user/assistant messages.',
    },
    {
      term: 'conversation_id',
      description: `Optional client-generated id (e.g. a UUID) so multi-turn conversations group together server-side. Max ${requestSchema.properties.conversation_id.maxLength} chars, alphanumeric and dashes.`,
    },
  ],
  responseSummary:
    'Returns one plain-text reply with a roughly 300-token cap. Streaming and reasoning tokens are disabled.',
  errors: [
    {
      status: '400',
      description: `${chatOperation.responses['400'].description}; the reply contains the validation hint.`,
    },
    {
      status: '429',
      description: chatOperation.responses['429'].description,
    },
    {
      status: '502',
      description: chatOperation.responses['502'].description,
    },
  ],
  health: {
    method: 'GET',
    path: healthPath,
    url: absoluteUrl(healthPath),
  },
  links: [
    {
      label: 'OpenAPI 3.1',
      href: openApiPath,
      url: absoluteUrl(openApiPath),
    },
    {
      label: 'API catalog (RFC 9727)',
      href: catalogPath,
      url: absoluteUrl(catalogPath),
    },
    {
      label: 'Markdown docs',
      href: markdownPath,
      url: absoluteUrl(markdownPath),
    },
  ],
  curlExample: `curl -sS ${absoluteUrl(chatPath)} \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"hello!"}]}'`,
  agentNotes: [
    'Public endpoint, no auth.',
    'Assistant persona is fixed: third-person, casual lowercase, plain text, no markdown, no emojis.',
    'For broader context about Semyon, request page URLs with Accept: text/markdown or use the explicit .md suffix.',
    'Questions and replies are stored with a coarse country code (never a raw IP) to improve the assistant. Details: /privacy.',
  ],
} as const;

export const endpointBlock = `${chatApiDocs.endpoint.method} ${chatApiDocs.endpoint.url}
Content-Type: ${chatApiDocs.endpoint.contentType}`;

export const healthBlock = `${chatApiDocs.health.method} ${chatApiDocs.health.url} -> ${chatApiJson.healthInline}`;

export const renderChatApiMarkdown = () => `# ${chatApiDocs.title}

${chatApiDocs.summary}

## Endpoint

\`${chatApiDocs.endpoint.method} ${chatApiDocs.endpoint.url}\`

Content-Type: \`${chatApiDocs.endpoint.contentType}\`

## Request

\`\`\`json
${chatApiJson.request}
\`\`\`

${chatApiDocs.requestRules
  .map((rule) => `- \`${rule.term}\`: ${rule.description}`)
  .join('\n')}

## Response (200)

\`\`\`json
${chatApiJson.response}
\`\`\`

${chatApiDocs.responseSummary}

## Errors

${chatApiDocs.errors
  .map((error) => `- \`${error.status}\`: ${error.description}`)
  .join('\n')}

## Health

\`${healthBlock}\`

## Machine-readable

${chatApiDocs.links.map((link) => `- ${link.label}: ${link.url}`).join('\n')}

## Example

\`\`\`bash
${chatApiDocs.curlExample}
\`\`\`

## Notes for agents

${chatApiDocs.agentNotes.map((note) => `- ${note}`).join('\n')}
`;
