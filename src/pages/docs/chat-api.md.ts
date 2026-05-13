import type { APIRoute } from 'astro';

const md = `# Chat API

Ask the site's assistant a question and get a reply. Answers in third person about Semyon's background, projects, and blog. Rate limited.

## Endpoint

\`POST https://semyon.ie/api/chat\`

Content-Type: \`application/json\`

### Request

\`\`\`json
{
  "messages": [
    { "role": "user", "content": "what are you working on lately?" }
  ]
}
\`\`\`

- \`messages\`: array (1-40 entries) of \`{ role, content }\`.
- \`role\`: \`"user"\` or \`"assistant"\` (client-supplied \`system\` messages are dropped).
- \`content\`: non-empty string, max 4000 characters.
- Server prepends a fixed system prompt and keeps only the last 5 user/assistant turns.

### Response (200)

\`\`\`json
{ "reply": "lately semyon's been grinding on the homelab and shipping a new feature for uisce..." }
\`\`\`

- Single plain-text reply, max ~300 tokens, non-streaming.
- No reasoning/thinking tokens are emitted.

### Errors

- \`400\` — invalid body (\`reply\` contains the validation hint).
- \`429\` — rate limit hit (20 requests/minute/IP).
- \`502\` — upstream model failure.

## Health

\`GET https://semyon.ie/api/chat/health\` → \`{"status":"ok"}\`.

## Machine-readable spec

OpenAPI 3.1: https://semyon.ie/api/chat/openapi.json

Discoverable via the API catalog at https://semyon.ie/.well-known/api-catalog (\`application/linkset+json\`, per RFC 9727).

## Example

\`\`\`bash
curl -sS https://semyon.ie/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"hello!"}]}'
\`\`\`

## Notes for agents

- Public endpoint, no auth.
- Personality is fixed: third-person assistant, lowercase casual responses, no markdown, no emojis, no emdashes.
- For longer-form, programmatic content about Semyon, prefer page markdown variants (request any page with \`Accept: text/markdown\`).
`;

export const GET: APIRoute = async () =>
  new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
