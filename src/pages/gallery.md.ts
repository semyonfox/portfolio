import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const md = `# Gallery

A curated gallery is being assembled. No images are published yet.
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
