import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections using Astro 6 Content Layer API.
 *
 * `writing` is consumed by src/pages/writing/[...id].astro,
 * src/pages/rss.xml.ts, and src/pages/index.astro.
 *
 * `projects` is latent scaffolding — schema is defined so adding
 * project entries later is a 5-minute job, but no route consumes it
 * yet and the directory holds no MDX files.
 */

const writing = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z
      .string()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), { message: "url must be http(s)" })
      .optional(),
    repo: z
      .string()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), { message: "repo must be http(s)" })
      .optional(),
    year: z.number().int().min(2000).max(2100),
    featured: z.boolean().default(false),
  }),
});

export const collections = { writing, projects };
