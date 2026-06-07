import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    author: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    category: z.enum(['personal', 'academic']).default('personal'),
    github: z.string().optional(),
    private: z.boolean().default(false),
    live: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.string(),
    github: z.string().optional(),
    private: z.boolean().default(false),
    embed: z.string().optional(),
    noEmbed: z.string().optional(),
    displayWidth: z.number().optional(),
    displayHeight: z.number().optional(),
    thumbnail: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { blog, projects, games };
