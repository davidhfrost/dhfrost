import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Content collections using Astro 6 Content Layer API.
 *
 * `writing` is consumed by src/pages/writing/[...id].astro,
 * src/pages/rss.xml.ts, and src/pages/index.astro.
 *
 * `projects` is consumed by src/pages/projects/[...id].astro (detail
 * pages) and src/pages/index.astro (the homepage Projects list renders
 * every entry with a `cardSummary`). retrofolio.mdx is the first entry.
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
    // Terse line for meta/OG on the detail page. Keep it snippet-length
    // (~155 chars); Google truncates beyond that and it isn't a ranking
    // factor. The richer homepage card text lives in `cardSummary`.
    description: z.string(),
    // Optional richer blurb for the homepage Projects list. Stored without
    // the leading "Title:" — the homepage template prepends the linked
    // title. Entries without it are not surfaced on the homepage.
    cardSummary: z.string().optional(),
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
