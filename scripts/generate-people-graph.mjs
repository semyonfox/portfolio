import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
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
const CACHE_PATH = new URL(
  '../data/cache/people-graph.sqlite',
  import.meta.url,
);
const WIKIPEDIA_HEADERS = {
  accept: 'application/json',
  'user-agent':
    'semyonfox-portfolio-people-graph/1.0 (portfolio semantic graph cache)',
};

const normalize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

const categoryKeywords = {
  dev: [
    'software',
    'developer',
    'programmer',
    'computer',
    'technology',
    'youtube',
    'channel',
    'educational',
  ],
  science: [
    'science',
    'mathematics',
    'math',
    'physics',
    'engineering',
    'astronomy',
    'youtube',
    'channel',
    'educational',
    'scientist',
  ],
  hardware: [
    'technology',
    'hardware',
    'youtube',
    'channel',
    'reviewer',
    'maker',
    'engineer',
  ],
  swimming: [
    'swimmer',
    'olympic',
    'athlete',
    'freestyle',
    'medley',
    'champion',
  ],
  games: ['youtube', 'channel', 'gamer', 'gaming', 'streamer', 'game'],
  creative: [
    'youtube',
    'channel',
    'filmmaker',
    'illusionist',
    'video',
    'vfx',
    'creator',
  ],
  chess: ['chess', 'grandmaster', 'player', 'youtube', 'channel'],
  comedy: ['comedian', 'comedy', 'actor', 'youtube', 'channel', 'sketch'],
};

await mkdir(new URL('../data/cache/', import.meta.url), { recursive: true });
const cacheDb = new DatabaseSync(fileURLToPath(CACHE_PATH));
cacheDb.exec(`
  CREATE TABLE IF NOT EXISTS wiki_cache (
    query TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    title TEXT,
    url TEXT,
    summary TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS embedding_cache (
    model TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    input TEXT NOT NULL,
    vector_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (model, text_hash)
  );
`);

const getWikiCache = cacheDb.prepare(`
  SELECT status, title, url, summary
  FROM wiki_cache
  WHERE query = ?
`);
const setWikiCache = cacheDb.prepare(`
  INSERT INTO wiki_cache (query, status, title, url, summary, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(query) DO UPDATE SET
    status = excluded.status,
    title = excluded.title,
    url = excluded.url,
    summary = excluded.summary,
    updated_at = excluded.updated_at
`);
const getEmbeddingCache = cacheDb.prepare(`
  SELECT vector_json
  FROM embedding_cache
  WHERE model = ? AND text_hash = ?
`);
const setEmbeddingCache = cacheDb.prepare(`
  INSERT INTO embedding_cache (model, text_hash, input, vector_json, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(model, text_hash) DO UPDATE SET
    input = excluded.input,
    vector_json = excluded.vector_json,
    updated_at = excluded.updated_at
`);

function hashText(value) {
  return createHash('sha256').update(value).digest('hex');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJsonWithRetry(url, options = {}, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) {
      return { ok: true, status: res.status, data: await res.json() };
    }

    if (res.status === 429 && attempt < retries) {
      await sleep(600 * (attempt + 1));
      continue;
    }

    return { ok: false, status: res.status, data: null };
  }

  return { ok: false, status: 429, data: null };
}

function isRelevantWikipediaSummary(person, summary, query) {
  const haystack = [summary.title, summary.extract].join(' ').toLowerCase();
  if (
    haystack.includes('may refer to') ||
    haystack.includes('type of soft toy') ||
    haystack.includes('wooden vessel')
  ) {
    return false;
  }

  const queryTokens = normalize(query);
  const haystackTokens = new Set(normalize(haystack));
  const queryOverlap = queryTokens.some((token) => haystackTokens.has(token));
  const queryMention =
    queryOverlap ||
    queryTokens.some((token) => haystack.includes(token)) ||
    haystack.includes(query.toLowerCase());

  const keywords = categoryKeywords[person.category] || [];
  return queryMention && keywords.some((keyword) => haystack.includes(keyword));
}

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

async function fetchSummaryByTitle(title) {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryRes = await fetchJsonWithRetry(summaryUrl, {
    headers: WIKIPEDIA_HEADERS,
  });

  if (!summaryRes.ok) return null;
  const summaryData = summaryRes.data;
  if (summaryData.type === 'disambiguation') return null;
  const extract = summaryData.extract?.trim();
  if (!extract || extract.length < 80) return null;

  return {
    title: summaryData.title || title,
    extract,
    url: summaryData.content_urls?.desktop?.page || summaryUrl,
  };
}

async function wikipediaSummary(person, query) {
  const cached = getWikiCache.get(query);
  if (cached) {
    if (cached.status === 'hit') {
      const cachedSummary = {
        title: cached.title,
        extract: cached.summary,
        url: cached.url,
      };
      if (isRelevantWikipediaSummary(person, cachedSummary, query)) {
        return cachedSummary;
      }
    }
    if (cached.status === 'miss') return null;
  }

  const exact = await fetchSummaryByTitle(query);
  if (exact && isRelevantWikipediaSummary(person, exact, query)) {
    setWikiCache.run(
      query,
      'hit',
      exact.title,
      exact.url,
      exact.extract,
      new Date().toISOString(),
    );
    return exact;
  }

  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('list', 'search');
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('origin', '*');
  searchUrl.searchParams.set('srlimit', '5');
  searchUrl.searchParams.set('srsearch', query);

  const searchRes = await fetchJsonWithRetry(searchUrl, {
    headers: WIKIPEDIA_HEADERS,
  });
  if (!searchRes.ok) {
    setWikiCache.run(query, 'miss', null, null, null, new Date().toISOString());
    return null;
  }
  const searchData = searchRes.data;
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

  if (!best) {
    setWikiCache.run(query, 'miss', null, null, null, new Date().toISOString());
    return null;
  }

  const resolved = await fetchSummaryByTitle(best.title);
  if (!resolved || !isRelevantWikipediaSummary(person, resolved, query)) {
    setWikiCache.run(query, 'miss', null, null, null, new Date().toISOString());
    return null;
  }

  setWikiCache.run(
    query,
    'hit',
    resolved.title,
    resolved.url,
    resolved.extract,
    new Date().toISOString(),
  );
  return resolved;
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

async function embedTexts(model, inputs) {
  const embeddings = new Array(inputs.length);
  const missing = [];

  for (const [index, input] of inputs.entries()) {
    const key = hashText(input);
    const cached = getEmbeddingCache.get(model, key);
    if (cached) {
      embeddings[index] = JSON.parse(cached.vector_json);
      continue;
    }
    missing.push({ index, input, key });
  }

  const batchSize = 16;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    const batchEmbeddings = await embedBatch(
      model,
      batch.map((item) => item.input),
    );
    const now = new Date().toISOString();
    batch.forEach((item, batchIndex) => {
      const embedding = batchEmbeddings[batchIndex];
      embeddings[item.index] = embedding;
      setEmbeddingCache.run(
        model,
        item.key,
        item.input,
        JSON.stringify(embedding),
        now,
      );
    });
  }

  return embeddings;
}

const model = await resolveEmbeddingModel();

const resolved = [];
for (const person of people) {
  const wiki =
    person.wikiSearch === false
      ? null
      : await wikipediaSummary(person, person.wikiSearch || person.name);
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

const embeddings = await embedTexts(
  model,
  resolved.map((item) => item.semanticText),
);

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

cacheDb.close();

console.log(
  `Generated people graph data with ${resolved.length} nodes using ${model}`,
);
