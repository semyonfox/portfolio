import type { APIRoute } from 'astro';
import { renderChatApiMarkdown } from '../../data/chatApiDocs';

export const GET: APIRoute = async () => {
  const md = renderChatApiMarkdown();

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
