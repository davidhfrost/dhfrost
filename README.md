# dhfrost.com

David Frost's personal website.

Built with Astro 5, Tailwind v4 (CSS-first), TypeScript strict, zero client JS. Self-hosted Newsreader weight 400, Latin subset. Deployed to Cloudflare Pages.

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
  journal/YYYY-MM-DD.md      # work journal (see CLAUDE.md for the required format)
  decisions/NNNN-*.md        # ADRs (see CLAUDE.md for the template)
  plans/<slug>.md            # multi-step plans with progress checklists
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

## Editing content

All content is in the repo. There is no CMS.

- **Bio + Now paragraph**: edit `src/pages/index.astro` directly. The `description` constant is the bio; the `<p>` inside `<h2>Now</h2>` is the Now paragraph. Commit.
- **Footer links**: same file. GitHub + LinkedIn only. No email by design (see below).

## Adding a writing section later

Goal: go from "no writing" to "posts listed on index and individually routable" in ~5 minutes.

1. **Drop an MDX file** in `src/content/writing/`, e.g. `hello.mdx`. Frontmatter must match the schema in `src/content/config.ts`:

   ```mdx
   ---
   title: "Hello"
   description: "A very short first post."
   publishedAt: 2026-04-11
   ---

   The body is MDX. Write whatever.
   ```

2. **Enable the listing on the index**. Open `src/pages/index.astro`, find the `{/* Writing section goes here */}` marker, and replace it with a listing. The paste-ready loop is at the bottom of `docs/writing-route-template.astro`.

3. **Add the post route**. Copy `docs/writing-route-template.astro` to `src/pages/writing/[slug].astro`. No edits needed: it's wired to the existing schema. Individual posts will render at `/writing/<slug>`.

4. `pnpm build` to verify.

## Adding a projects section later

Same pattern:

1. Drop an MDX file in `src/content/projects/` matching the `projects` schema (`title`, `description`, `url?`, `repo?`, `year`, `featured`).
2. Replace the `{/* Projects section goes here */}` marker in `src/pages/index.astro` with the listing loop at the bottom of `docs/projects-route-template.astro`.
3. Copy `docs/projects-route-template.astro` to `src/pages/projects/[slug].astro`.
4. `pnpm build`.

## Deploy

The site is a fully static Astro build deployed to Cloudflare Pages. The live deploy path is the Cloudflare Pages Git integration; manual `wrangler` is documented below as a break-glass.

### A. Cloudflare Pages Git integration (live)

The `dhfrost` Pages project is connected to `davidhfrost/frosty`. Pushes to `main` auto-deploy to `https://dhfrost.com`. PRs get a `*.pages.dev` preview URL commented on the PR.

Settings (recorded here so they can be recreated if the project is ever rebuilt):

| Setting                  | Value                                          |
| ------------------------ | ---------------------------------------------- |
| Project name             | `dhfrost` (must match `wrangler.toml`)         |
| Production branch        | `main`                                         |
| Framework preset         | **None** (presets override `wrangler.toml`)    |
| Build command            | `pnpm build`                                   |
| Build output directory   | `dist`                                         |
| Root directory           | repo root                                      |
| Env var (Prod + Preview) | `NODE_VERSION=22`                              |

pnpm 9.12.0 is picked up automatically from the `packageManager` field in `package.json`; no `PNPM_VERSION` env var needed. The `prebuild` hook regenerates `public/og.png` as part of `pnpm build`, so the deployed OG card is always current.

**Custom domains** attached to the Pages project:

- `dhfrost.com` (apex, canonical; matches `site` in `astro.config.mjs`)
- `www.dhfrost.com`

A zone-level **Redirect Rule** named `www to apex` 301-redirects `www.dhfrost.com/*` to `https://dhfrost.com/$1`, preserving path and query string. The rule lives at `dhfrost.com` zone → Rules → Redirect Rules. Cloudflare also auto-redirects `http://` → `https://`.

### B. Manual deploy via Wrangler (break-glass only)

```sh
pnpm build
pnpm dlx wrangler pages deploy dist --project-name=dhfrost
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment. This bypasses the Git integration and creates a "Direct Upload" deployment, so reserve it for the case where Cloudflare's GitHub-side build is broken and a fix needs to ship now. Avoid mixing flows in normal operation.

## CI

`.github/workflows/ci.yml` runs on every PR to `main` and every push to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (biome)
3. `pnpm check` (astro check, strict TS)
4. `pnpm build`
5. First-load size budget: fails if `dist/index.html` + `dist/fonts/newsreader-latin-400.woff2` > 50,000 bytes.

The size budget is the load-bearing rule that keeps this site honest. If it fails, find out why before loosening it.

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

## Conventions

See `CLAUDE.md` for hard rules on commits, branching, journal entries, ADRs, and the git-worktree workflow. New work happens in a worktree under `../frosty-worktrees/<branch>/`, never directly in the primary checkout.

## A note on the footer

GitHub + LinkedIn only. No email link. Public personal sites get scraped hard and a plain `mailto:` is free fuel for spam lists. If a contact channel is needed beyond those two, open a GitHub discussion or message through LinkedIn.
