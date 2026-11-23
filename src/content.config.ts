import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* Property Guides (blog) — naya article add karne ke liye src/content/guides/ mein
   ek .md file banayein (upar wala frontmatter copy karein). */
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(170),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      image: image(),
      imageAlt: z.string(),
      tags: z.array(z.string()).default([]),
    }),
});

export const collections = { guides };
