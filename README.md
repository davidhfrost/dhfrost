# dhfrost.com

Source code for [dhfrost.com](https://dhfrost.com), David Frost's personal website. Built with Astro 6, Tailwind v4 (CSS-first), TypeScript strict, zero client JS. Self-hosted Newsreader weight 400, Latin subset. Deployed to Cloudflare Pages.

This is a personal site, not a starter template — but the code is MIT-licensed and free to study or adapt.

## Design rules

Codified so they don't get diluted by accident:

- Single column, left-aligned, 60ch measure
- Dark default, `prefers-color-scheme` honored, no toggle
- Line-height 1.7, generous vertical rhythm
- One accent color (`#f5a524`, warm amber) used only on links
- Foreground, background, and one muted gray. No other colors.
- No images on the index page
- One self-hosted font, one weight (400), Latin subset
- Zero client JS
- <50KB first-load, Lighthouse 100/100/100/100

## Tech stack

- [Astro 6](https://astro.build) + MDX
- [Tailwind v4](https://tailwindcss.com) (CSS-first, no JS config)
- TypeScript strict via `astro check`
- [Biome 2](https://biomejs.dev) for lint and format
- [Satori](https://github.com/vercel/satori) + resvg for build-time OG image generation
- Cloudflare Pages (static deploy via Git integration)
- pnpm 10 / Node 22

## Local dev

```sh
pnpm install
pnpm dev
```

The site is served at http://localhost:4321. Hot reload works for `.astro`, `.ts`, and `.css` edits.

## Scripts

| Command          | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `pnpm dev`       | Start the Astro dev server.                                           |
| `pnpm build`     | Generate OG image, then build the static site into `dist/`.           |
| `pnpm preview`   | Serve `dist/` for a local prod smoke test.                            |
| `pnpm check`     | `astro check`: strict TypeScript across `.astro`, `.ts`, frontmatter. |
| `pnpm lint`      | `biome check .`: lint + format check, non-mutating.                   |
| `pnpm format`    | `biome format --write .`: rewrite files to match format rules.        |
| `pnpm fix`       | `biome check --write .`: apply safe lint + format fixes.              |
| `pnpm og`        | Regenerate `public/og.png` without a full build.                      |

`pnpm build` runs `scripts/generate-og.ts` as a `prebuild` hook, so every build has a fresh OG card.

## Project layout

```
.github/workflows/ci.yml     # lint + typecheck + build + size budget on PRs
astro.config.mjs             # mdx, sitemap, @tailwindcss/vite, inlineStylesheets=always
biome.json                   # lint + format config (replaces eslint/prettier)
wrangler.toml                # cloudflare pages project
docs/
  decisions/NNNN-*.md        # architecture decision records
  plans/<slug>.md            # multi-step plans with progress checklists
  deploy.md                  # cloudflare pages setup reference
  writing-route-template.astro   # copy to src/pages/writing/[slug].astro to enable
  projects-route-template.astro  # copy to src/pages/projects/[slug].astro to enable
public/
  fonts/newsreader-latin-400.woff2  # shipped to users, preloaded
  favicon.svg
  robots.txt
  og.png                     # generated at build time (gitignored)
scripts/
  generate-og.ts             # satori + resvg, runs as prebuild
  fonts/newsreader-latin-400.ttf    # build-time only, not shipped
src/
  components/Meta.astro      # <head> metadata: title, description, canonical, OG, twitter
  layouts/Base.astro         # html shell, font preload, favicon, <slot/>
  pages/index.astro          # the whole site
  content/
    config.ts                # writing + projects collection schemas (latent)
    writing/                 # empty; add MDX files to enable the writing section
    projects/                # empty; add MDX files to enable the projects section
  styles/global.css          # @theme tokens + base rules, one @font-face
```

`src/pages/index.astro` is the whole site. Everything else is latent scaffolding.

## Content workflow

### Editing content

All content lives in the repo. There is no CMS.

- **Bio + Now paragraph**: edit `src/pages/index.astro`. The `description` constant is the bio; the `<p>` inside `<h2>Now</h2>` is the Now paragraph.
- **Footer links**: same file. GitHub + LinkedIn only. No email by design.

### Adding a writing section

1. Drop an MDX file in `src/content/writing/`, e.g. `hello.mdx`. Frontmatter must match the schema in `src/content/config.ts`:

   ```mdx
   ---
   title: "Hello"
   description: "A very short first post."
   publishedAt: 2026-04-11
   ---

   The body is MDX.
   ```

2. Enable the listing on the index: find the `{/* Writing section goes here */}` marker in `src/pages/index.astro` and replace it with the listing loop from `docs/writing-route-template.astro`.

3. Add the post route: copy `docs/writing-route-template.astro` to `src/pages/writing/[slug].astro`. Individual posts render at `/writing/<slug>`.

4. `pnpm build` to verify.

### Adding a projects section

Same pattern as writing:

1. Drop an MDX file in `src/content/projects/` matching the `projects` schema (`title`, `description`, `url?`, `repo?`, `year`, `featured`).
2. Replace `{/* Projects section goes here */}` in `src/pages/index.astro` with the listing loop from `docs/projects-route-template.astro`.
3. Copy `docs/projects-route-template.astro` to `src/pages/projects/[slug].astro`.
4. `pnpm build`.

## Deploy

The site deploys automatically to Cloudflare Pages on push to `main`. See [`docs/deploy.md`](docs/deploy.md) for setup details and the break-glass manual deploy path.

## CI

`.github/workflows/ci.yml` runs on every PR and push to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (Biome)
3. `pnpm check` (astro check, strict TS)
4. `pnpm build`
5. First-load size budget: fails if `dist/index.html` + `dist/fonts/newsreader-latin-400.woff2` > 50,000 bytes.

The size budget is the load-bearing rule that keeps the site honest.

## License

Code: [MIT](LICENSE).
Written content (`docs/**`, `src/content/**`): [CC BY 4.0](LICENSE-CONTENT).

## Conventions

See [`CLAUDE.md`](CLAUDE.md) for commit, branching, journal, ADR, and worktree conventions.
