import type { APIRoute } from 'astro';
import { renderPrivacyMarkdown } from '../data/privacy';

export const GET: APIRoute = async () => {
  const md = renderPrivacyMarkdown();

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
