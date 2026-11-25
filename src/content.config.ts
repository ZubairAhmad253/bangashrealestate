import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* Property Guides (blog) — to add an article, create a .md file in src/content/guides/
   (copy the frontmatter from an existing guide). */
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
      /** Optional questions & answers shown at the end of the article */
      faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    }),
});

export const collections = { guides };
