import { mkdir, writeFile } from 'node:fs/promises';
import { people } from '../src/data/people.ts';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY must be set');
}

const EMBEDDING_MODEL_CANDIDATES = [
  'qwen/qwen3-embedding-8b',
  'qwen/qwen3-embedding-4b',
];

const OUTPUT_PATH = new URL('../src/data/people-graph.json', import.meta.url);

const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

async function resolveEmbeddingModel() {
  const res = await fetch('https://openrouter.ai/api/v1/embeddings/models');
  if (!res.ok) {
    throw new Error(`Failed to list embedding models: ${res.status}`);
  }

  const data = await res.json();
  const ids = new Set(data.data.map((model) => model.id));

  for (const candidate of EMBEDDING_MODEL_CANDIDATES) {
    if (ids.has(candidate)) return candidate;
  }

  throw new Error('No supported Qwen embedding model available');
}

async function wikipediaSummary(query) {
  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('list', 'search');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('origin', '*');
  searchUrl.searchParams.set('srlimit', '5');
  searchUrl.searchParams.set('srsearch', query);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const results = searchData?.query?.search || [];

  const queryTokens = new Set(normalize(query));
  const best = results.find((result) => {
    const titleTokens = new Set(normalize(result.title));
    let overlap = 0;
    for (const token of queryTokens) {
      if (titleTokens.has(token)) overlap += 1;
    }
    return overlap >= Math.min(2, queryTokens.size);
  });

  if (!best) return null;

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(best.title)}`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { accept: 'application/json' },
  });

  if (!summaryRes.ok) return null;
  const summaryData = await summaryRes.json();
  const extract = summaryData.extract?.trim();
  if (!extract || extract.length < 80) return null;

  return {
    title: best.title,
    extract,
    url: summaryData.content_urls?.desktop?.page || summaryUrl,
  };
}

function cosine(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embedBatch(model, input) {
  const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedding request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.data.map((item) => item.embedding);
}

const model = await resolveEmbeddingModel();

const resolved = [];
for (const person of people) {
  const wiki =
    person.wikiSearch === false
      ? null
      : await wikipediaSummary(person.wikiSearch || person.name);
  const summary = wiki?.extract || person.summary;
  const semanticText = [
    person.name,
    `Category: ${person.category}`,
    `Summary: ${summary}`,
    `Tags: ${person.tags.join(', ')}`,
  ].join('\n');

  resolved.push({
    slug: person.slug,
    name: person.name,
    source: wiki ? 'wikipedia' : 'fallback',
    wikiTitle: wiki?.title || null,
    wikiUrl: wiki?.url || null,
    summary,
    semanticText,
  });
}

const batchSize = 16;
const embeddings = [];
for (let i = 0; i < resolved.length; i += batchSize) {
  const batch = resolved.slice(i, i + batchSize);
  const batchEmbeddings = await embedBatch(
    model,
    batch.map((item) => item.semanticText),
  );
  embeddings.push(...batchEmbeddings);
}

const explicitPairs = new Set();
for (const person of people) {
  for (const target of person.connections || []) {
    const key = [person.slug, target].sort().join(':');
    explicitPairs.add(key);
  }
}

const nodeMeta = {};
const semanticEdges = [];

for (let i = 0; i < resolved.length; i++) {
  const sims = [];
  for (let j = 0; j < resolved.length; j++) {
    if (i === j) continue;
    const score = cosine(embeddings[i], embeddings[j]);
    sims.push({
      slug: resolved[j].slug,
      score,
      explicit: explicitPairs.has(
        [resolved[i].slug, resolved[j].slug].sort().join(':'),
      ),
    });
  }

  sims.sort((a, b) => b.score - a.score);
  const top = sims.filter((item) => item.score >= 0.42).slice(0, 4);
  const avgTop =
    top.reduce((sum, item) => sum + item.score, 0) / Math.max(top.length, 1);

  const graphWeight = Math.max(
    1,
    Math.min(5, Math.round(((avgTop - 0.35) / 0.12) * 4 + 1)),
  );

  nodeMeta[resolved[i].slug] = {
    source: resolved[i].source,
    wikiTitle: resolved[i].wikiTitle,
    wikiUrl: resolved[i].wikiUrl,
    summary: resolved[i].summary,
    graphWeight,
  };

  for (const match of top) {
    const key = [resolved[i].slug, match.slug].sort().join(':');
    if (semanticEdges.some((edge) => edge.key === key)) continue;
    semanticEdges.push({
      key,
      source: resolved[i].slug < match.slug ? resolved[i].slug : match.slug,
      target: resolved[i].slug < match.slug ? match.slug : resolved[i].slug,
      score: Number(match.score.toFixed(4)),
    });
  }
}

const output = {
  generatedAt: new Date().toISOString(),
  model,
  nodes: nodeMeta,
  semanticEdges: semanticEdges.map(({ key, ...edge }) => edge),
};

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

console.log(
  `Generated people graph data with ${resolved.length} nodes using ${model}`,
);
