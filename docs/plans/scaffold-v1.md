# dhfrost.com — v1 scaffold

> **Durable record.** This plan file is the source of truth across sessions. The commit checklist below is updated as each step lands. A fresh session (after compaction, restart, or days later) can read this file, check the journal at `docs/journal/`, and know exactly what's done and what's next. See also `CLAUDE.md` → "Plans".

## Context

David wants a single-page personal calling card at dhfrost.com — a resume/Google-result target, not an audience site. v1 is intentionally tiny (name, one-line bio, a "now" paragraph, footer) but must feel complete and make adding sections later a 5-minute job, not a refactor. Reference aesthetic: paco.me and leerob.com — single column, markdown-heading sections, no nav/logo/hero/animations. Personality lives in the prose.

The repo is greenfield (just `README.md` stub + `CLAUDE.md`). `CLAUDE.md` sets hard rules I will follow throughout this work:

- Atomic commits per logical change, Conventional Commits format
- Journal entry in `docs/journal/YYYY-MM-DD.md` before declaring any step complete
- Never push to `main` — work on a branch, user merges
- Run build before committing any code/config change
- ADRs in `docs/decisions/NNNN-*.md` for non-obvious technical choices (font pick, accent color, Cloudflare deploy approach all qualify)
- Tailwind v4 CSS-first `@theme`, no JS config

## Workflow: git worktrees + CLAUDE.md update

Per user instruction, I will:

1. **Update `CLAUDE.md` first** (my first commit on the working branch) to add a "Git worktrees" section codifying: all non-trivial work happens in a git worktree under `../frosty-worktrees/<branch-name>/`, created via `git worktree add`, removed with `git worktree remove` once merged. This keeps `main` checkout clean and lets parallel work streams coexist.
2. **Create a worktree** for this scaffold work: `git worktree add ../frosty-worktrees/scaffold-v1 -b scaffold/v1` and do all subsequent work there. The original `/Users/david/GitHub/frosty` stays on `main`.
3. **Note the pnpm vs npm discrepancy**: `CLAUDE.md` currently says "run `npm run build`". The stack is pnpm. I'll update that line to `pnpm build` in the same CLAUDE.md commit.

## Stack decisions (locked by user)

- Astro (latest) + TypeScript `strict`, zero client JS (no `client:*` directives)
- Tailwind v4 (via `@tailwindcss/vite`, CSS-first config in `src/styles/global.css`)
- pnpm, Biome for lint + format (replaces ESLint/Prettier)
- MDX content collections (schemas only in v1)
- Cloudflare Pages via Wrangler, GitHub Actions for typecheck + build on PRs
- Self-hosted variable font: **Newsreader** (variable serif, optical size axis, Latin-subset woff2)
- Single accent color: **warm amber `#f5a524`** — used only on links

## File tree

```
/
├── .github/workflows/ci.yml        # typecheck + build on PRs
├── .gitignore
├── astro.config.mjs                # integrations: mdx, sitemap; vite: tailwindcss
├── biome.json                      # formatter + linter config
├── package.json                    # pnpm, scripts: dev/build/check/format/lint
├── pnpm-lock.yaml
├── tsconfig.json                   # extends astro/tsconfigs/strict
├── wrangler.toml                   # Cloudflare Pages project config
├── README.md                       # setup + deploy + "how to add sections later"
├── public/
│   ├── fonts/<chosen-font>.woff2   # subset to Latin, variable
│   ├── robots.txt                  # allow all, point to sitemap
│   └── favicon.svg                 # single-glyph text favicon, no image
├── scripts/
│   └── generate-og.ts              # build-time OG image from bio text (satori + resvg)
├── src/
│   ├── components/
│   │   └── Meta.astro              # <title>, description, canonical, OG tags
│   ├── content/
│   │   ├── config.ts               # collections: writing, projects (Zod schemas only)
│   │   ├── writing/.gitkeep
│   │   └── projects/.gitkeep
│   ├── layouts/
│   │   └── Base.astro              # <html>, <Meta/>, font preload, global.css
│   ├── pages/
│   │   └── index.astro             # bio + footer + commented section markers
│   └── styles/
│       └── global.css              # @import "tailwindcss"; @theme; prose rules
└── docs/
    ├── writing-route-template.astro   # paste into src/pages/writing/[slug].astro
    └── projects-route-template.astro  # paste into src/pages/projects/[slug].astro
```

## Content collections (latent scaffolding)

`src/content/config.ts` — schemas defined, **no routes created, not imported by index**.

```ts
import { defineCollection, z } from "astro:content";

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
    year: z.number(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { writing, projects };
```

`src/content/writing/` and `src/content/projects/` exist via `.gitkeep` so the collections resolve but produce zero output until content is dropped in.

## `src/pages/index.astro` shape

```astro
---
import Base from "../layouts/Base.astro";
const bio = "Software engineer working on cloud infrastructure and developer platforms at Capital One.";
const now = "…"; // placeholder for David to fill in
---
<Base title="David Frost" description={bio}>
  <main>
    <h1>David Frost</h1>
    <p>{bio}</p>

    <section>
      <h2>Now</h2>
      <p>{now}</p>
    </section>

    {/* Writing section goes here */}
    {/* To enable: import getCollection, list posts from src/content/writing,
        and create src/pages/writing/[slug].astro from docs/writing-route-template.astro */}

    {/* Projects section goes here */}
    {/* To enable: import getCollection, list entries from src/content/projects,
        and create src/pages/projects/[slug].astro from docs/projects-route-template.astro */}

    <footer>
      <a href="https://github.com/…">GitHub</a> ·
      <a href="https://linkedin.com/in/…">LinkedIn</a> ·
      <a href="mailto:…">Email</a>
    </footer>
  </main>
</Base>
```

Headings render as markdown-style section headers via CSS — no visual chrome beyond type weight/size.

## Styling (Tailwind v4, CSS-first)

`src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0e0e10;         /* dark default */
  --color-fg: #e6e6e6;
  --color-muted: #8a8a92;
  --color-accent: <tbd>;       /* user pick */
  --font-sans: "<chosen>", ui-sans-serif, system-ui, sans-serif;
}

@media (prefers-color-scheme: light) {
  @theme {
    --color-bg: #fafaf7;
    --color-fg: #16161a;
    --color-muted: #6b6b74;
  }
}

html { color-scheme: light dark; }
body {
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-sans);
  line-height: 1.7;
  font-feature-settings: "ss01", "kern";
}
main { max-width: 60ch; margin: 6rem auto; padding: 0 1.5rem; }
a { color: var(--color-accent); text-decoration: underline; text-underline-offset: 3px; }
a:hover { text-decoration-thickness: 2px; }
h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 1.5rem; }
h2 { font-size: 1rem; font-weight: 600; margin: 3rem 0 1rem; }
p  { margin: 0 0 1rem; }
footer { margin-top: 4rem; color: var(--color-muted); font-size: 0.9rem; }
```

Design rules enforced:
- Single column, left-aligned, 60ch measure ✓
- Dark default, honors `prefers-color-scheme`, no toggle ✓
- 1.7 line-height ✓
- One accent (links only), foreground, background, muted gray ✓
- No images on index ✓

## Font (self-hosted, variable, Latin subset)

Download from Google Fonts or the foundry, run through `glyphhanger` / `fonttools` to subset to Latin (U+0000-024F, U+2000-206F, U+2190-21FF), convert to woff2, preload in `Base.astro` via `<link rel="preload" as="font" crossorigin>`. Single file, single weight axis.

Options presented in Open Questions below.

## Meta + SEO

`src/components/Meta.astro` — props: `title`, `description`, `image?`. Emits:
- `<title>` and `<meta name="description">`
- `<link rel="canonical">` from `Astro.url`
- OG: `og:title`, `og:description`, `og:image`, `og:type=website`, `og:url`
- Twitter: `summary_large_image`
- `<meta name="theme-color">` matching `--color-bg`

`public/robots.txt` — `User-agent: *\nAllow: /\nSitemap: https://dhfrost.com/sitemap-index.xml`

Sitemap via `@astrojs/sitemap` integration.

## OG image (build-time, no external service)

`scripts/generate-og.ts` — uses `satori` + `@resvg/resvg-js` to render a 1200×630 PNG from a JSX template (name + bio, same font as the site). Wired into `package.json` `prebuild` script so it runs before `astro build` and writes to `public/og.png`. Zero runtime cost.

## Performance budget

- Zero client JS (no Astro islands, no `client:*`)
- One font file, preloaded, subset (~15–25KB woff2)
- Tailwind v4 output scoped to used utilities (<5KB gzipped for this page)
- No images on index
- Target: <50KB first load, Lighthouse 100/100/100/100

Verified via `pnpm build && npx http-server dist` + Chrome DevTools Lighthouse.

## Deploy: Cloudflare Pages via Wrangler

- `wrangler.toml` declares pages project `dhfrost`
- `pnpm build` → `dist/` → `wrangler pages deploy dist --project-name=dhfrost`
- CI builds on PR; merge to `main` triggers deploy (either Cloudflare's Git integration, or a deploy step in the Actions workflow using `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets — README documents both, user picks at setup time)

## CI: `.github/workflows/ci.yml`

Runs on PRs to `main`:
1. Checkout
2. Setup pnpm + Node 22
3. `pnpm install --frozen-lockfile`
4. `pnpm biome check .`
5. `pnpm astro check` (typecheck)
6. `pnpm build`

## README structure

1. What this is (one paragraph)
2. Local dev: `pnpm install && pnpm dev`
3. Scripts: `dev`, `build`, `preview`, `check`, `format`, `lint`
4. Deploy to Cloudflare Pages (both Git-integration and manual `wrangler pages deploy` flows)
5. **Adding a writing section later**:
   - Drop an MDX file in `src/content/writing/` matching the schema in `src/content/config.ts`
   - Uncomment the `{/* Writing section goes here */}` block in `src/pages/index.astro` and replace with a `getCollection("writing")` loop
   - Copy `docs/writing-route-template.astro` to `src/pages/writing/[slug].astro`
6. **Adding a projects section later**: same pattern, `docs/projects-route-template.astro`
7. Editing content with coding agents — MDX lives in-repo, just edit and commit

## Route templates in `docs/`

Full `getStaticPaths` + `<Content/>` render templates for `[slug].astro`, wired to the existing collection schemas so the user pastes → renames → works.

## Commit plan (atomic, Conventional Commits, one concern each)

On branch `scaffold/v1` in worktree `../frosty-worktrees/scaffold-v1`. This checklist is the durable record — it is committed to `docs/plans/scaffold-v1.md` in step 2 and updated as steps land.

- [x] 1. `docs(claude): add git worktree workflow and fix pnpm build command` — `b59d83c`
- [x] 2. `docs(plan): commit scaffold-v1 plan + progress checklist to docs/plans/` — `5ce22da`
- [x] 3. `chore: init astro + pnpm + typescript strict` — `8dddd8a`
- [ ] 4. `chore(tooling): add biome config and scripts` ← next
- [ ] 4. `chore(tooling): add biome config and scripts`
- [ ] 5. `feat(styles): add tailwind v4 with theme tokens and global.css`
- [ ] 6. `feat(fonts): self-host Newsreader variable, latin subset`
- [ ] 7. `feat(layout): add Base layout and Meta component`
- [ ] 8. `feat(home): add index.astro with bio, now, footer, section markers`
- [ ] 9. `feat(content): add writing + projects collection schemas (no routes)`
- [ ] 10. `feat(seo): add robots.txt, sitemap integration, canonical + og tags`
- [ ] 11. `feat(og): build-time OG image generation via satori`
- [ ] 12. `ci: typecheck + build on PRs`
- [ ] 13. `chore(deploy): wrangler config for cloudflare pages`
- [ ] 14. `docs: README with setup, deploy, and how to add writing/projects later`
- [ ] 15. `docs(templates): add writing + projects route templates in docs/`
- [ ] 16. `docs(decisions): ADR 0001 stack, 0002 font, 0003 accent`

Each commit: runs `pnpm build` first (from step 5 onward), followed by a journal entry appended to `docs/journal/YYYY-MM-DD.md` and a progress checkbox flip in `docs/plans/scaffold-v1.md` before marking the step done.

## Verification

1. `pnpm install` → `pnpm dev` → visit `http://localhost:4321`, confirm bio + footer render, dark by default, light under system toggle, 60ch measure
2. `pnpm astro check` → 0 errors (strict TS)
3. `pnpm biome check .` → clean
4. `pnpm build` → inspect `dist/`, confirm `index.html` + `og.png` + `sitemap-index.xml` + `robots.txt` + one font file
5. `du -sh dist/` and Chrome DevTools "Disable cache" reload → first-load payload < 50KB
6. Lighthouse (mobile, simulated) → 100/100/100/100
7. `wrangler pages deploy dist --project-name=dhfrost` (user runs first deploy after Cloudflare account linked)
8. Confirm CI green on first PR

## Critical files to create

- `package.json`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `wrangler.toml`
- `src/pages/index.astro`
- `src/layouts/Base.astro`
- `src/components/Meta.astro`
- `src/content/config.ts`
- `src/styles/global.css`
- `scripts/generate-og.ts`
- `.github/workflows/ci.yml`
- `public/fonts/<chosen>.woff2`, `public/robots.txt`, `public/favicon.svg`
- `docs/writing-route-template.astro`, `docs/projects-route-template.astro`
- `README.md`

## Resolved choices

- **Font**: Newsreader (variable serif, optical size axis). Downloaded from Google Fonts, subset to Latin via `glyphhanger`/`fonttools`, emitted as a single variable woff2 in `public/fonts/newsreader.woff2`, preloaded from `Base.astro`.
- **Accent**: `#f5a524` (warm amber). Applied only to `a { color: … }`. Will verify WCAG AA contrast against both `#0e0e10` and the light-mode `#fafaf7` background during build.
