# dhfrost.com

The personal site of David Frost: software engineer at Capital One, writing on cloud infrastructure, infrastructure as code, and CI/CD. Live at [dhfrost.com](https://dhfrost.com).

Built with Astro 6, Tailwind v4 (CSS-first), TypeScript strict, no behavioral JS. Self-hosted Newsreader weight 400, Latin subset. Deployed to Cloudflare Pages. Code is MIT-licensed and free to study or adapt.

## Design rules

Codified so they don't get diluted by accident:

- Single column, left-aligned, 60ch measure
- Dark default, `prefers-color-scheme` honored, no toggle
- Line-height 1.7, generous vertical rhythm
- One accent color (`#f5a524`, warm amber) used only on links
- Foreground, background, and one muted gray. No other colors.
- No images on the index page
- One self-hosted font, one weight (400), Latin subset
- No first-party client JS (one inline JSON-LD block on the homepage for SEO; Cloudflare auto-injects a privacy-preserving Web Analytics beacon)
- <50KB combined homepage HTML + font, enforced in CI

## Writing

- [Streamlining Multi-Agent Development](https://dhfrost.com/writing/streamlining-multi-agent-development/) — isolation via content sharing, not copying. Worktrees, node_modules sprawl, a debugging story.
- [CloudFront Continuous Deployment: sharp edges](https://dhfrost.com/writing/cloudfront-cd-sharp-edges/) — control-plane vs data-plane, orphaned CD policies, when DNS is the binding constraint.

## Tech stack

- [Astro 6](https://astro.build) + MDX
- [Tailwind v4](https://tailwindcss.com) (CSS-first, no JS config)
- TypeScript strict via `astro check`
- [Biome 2](https://biomejs.dev) for lint and format
- [Satori](https://github.com/vercel/satori) + resvg for build-time OG image generation
- Cloudflare Pages (static deploy via Git integration); DNS and Pages project codified in [OpenTofu](https://opentofu.org) under [`infra/`](infra/README.md)
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

<details>
<summary>Expand</summary>

```
.github/workflows/ci.yml     # lint + typecheck + build + size budget on PRs
astro.config.mjs             # mdx, sitemap, @tailwindcss/vite, inlineStylesheets=always
biome.json                   # lint + format config (replaces eslint/prettier)
wrangler.toml                # cloudflare pages project
infra/                       # opentofu for cloudflare pages, dns, redirect rules
docs/deploy.md               # cloudflare pages setup reference
public/
  fonts/newsreader-latin-400.woff2  # shipped to users, preloaded
  favicon.svg
  favicon-32.png
  favicon-192.png
  apple-touch-icon.png
  site.webmanifest
  robots.txt
  og.png                     # generated at build time (gitignored)
scripts/
  generate-og.ts             # satori + resvg, runs as prebuild
  fonts/newsreader-latin-400.ttf    # build-time only, not shipped
src/
  components/Meta.astro      # <head> metadata: title, description, canonical, OG, twitter, Person JSON-LD
  layouts/
    Base.astro               # html shell, font preload, skip link, <main> landmark
    Post.astro               # per-post wrapper used by writing/[...id].astro
  pages/
    index.astro              # homepage
    404.astro                # not-found page
    writing/[...id].astro    # writing post pages
    rss.xml.ts               # /rss.xml feed
  content.config.ts          # writing + projects collection schemas
  content/
    writing/                 # MDX posts
    projects/                # latent; no route consumes this yet
  styles/global.css          # @theme tokens + base rules, one @font-face
```

</details>

## Content workflow

All content lives in the repo. There is no CMS.

- **Bio + Now paragraph**: edit `src/pages/index.astro`. The `description` constant is the bio; the `<p>` inside `<h2>Now</h2>` is the Now paragraph.
- **Footer links**: same file. GitHub, LinkedIn, RSS. No email by design.
- **New post**: drop an MDX file in `src/content/writing/` with frontmatter matching the schema in `src/content.config.ts` (`title`, `description`, `publishedAt`, optional `updatedAt`, optional `draft`). The route at `src/pages/writing/[...id].astro` picks it up automatically.

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

Split intentionally so code and prose travel under different terms:

- **Code** ([`LICENSE`](LICENSE)) — MIT. Free to study or adapt.
- **Written content** under `src/content/**` ([`LICENSE-CONTENT`](LICENSE-CONTENT)) — CC BY 4.0. Reposting the prose requires attribution.

## Conventions

[`CLAUDE.md`](CLAUDE.md) is the live instruction file for AI coding agents working in this repo (Claude Code, Codex, etc.); it also documents the project's commit, branching, and worktree conventions for human contributors.
