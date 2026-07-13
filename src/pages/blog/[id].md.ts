import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
};

export const GET: APIRoute = async ({ props }) => {
  const post = props.post as Awaited<
    ReturnType<typeof getCollection<'blog'>>
  >[number];

  const fm = [
    '---',
    `title: ${JSON.stringify(post.data.title)}`,
    `date: ${post.data.date}`,
    `author: ${JSON.stringify(post.data.author)}`,
    `description: ${JSON.stringify(post.data.description)}`,
    `tags: ${JSON.stringify(post.data.tags)}`,
    `canonical: https://semyon.ie/blog/${post.id}`,
    '---',
    '',
  ].join('\n');

  const md = fm + (post.body ?? '');

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'x-markdown-tokens': String(Math.ceil(md.length / 4)),
    },
  });
};
