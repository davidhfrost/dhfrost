import { defineCollection, z } from "astro:content";

/**
 * Latent content collections.
 *
 * Schemas are defined so adding writing/projects later is a 5-minute job,
 * not a refactor. v1 of the site does NOT import these anywhere and does
 * NOT have route files for them — see docs/plans/scaffold-v1.md and the
 * commented markers in src/pages/index.astro for how to turn them on.
 *
 * The writing/ and projects/ directories exist (via .gitkeep) so the
 * collections resolve cleanly and `astro check` / `astro build` stay
 * green with zero entries.
 */

const writing = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: "content",
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
