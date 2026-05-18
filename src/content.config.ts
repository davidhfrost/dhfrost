import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections using Astro 6 Content Layer API.
 *
 * Moved from src/content/config.ts and updated to use explicit glob loaders
 * as required by Astro 6.
 *
 * Collections are latent scaffolding: schemas are defined so adding
 * writing/projects later is a 5-minute job, not a refactor. No routes
 * consume these yet.
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
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    year: z.number().int().min(2000).max(2100),
    featured: z.boolean().default(false),
  }),
});

export const collections = { writing, projects };
