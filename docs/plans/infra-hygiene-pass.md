# Infra + hygiene pass for dhfrost.com

## Context

The repo is small, tidy, and shipping cleanly. Survey of current state:

- CI at `.github/workflows/ci.yml` runs lint + `astro check` + build + a 50KB first-load budget check on every PR and push. Solid.
- `public/robots.txt` correctly points at `https://dhfrost.com/sitemap-index.xml`. No action needed.
- Homepage (`src/pages/index.astro`), single layout (`src/layouts/Base.astro`), single head component (`src/components/Meta.astro`).
- `public/` contains only `favicon.svg`, `fonts/newsreader-latin-400.woff2`, `robots.txt`. OG card is generated at build time via `scripts/generate-og.ts`.
- `package.json` has no `engines` field and no local Node version pin; CI uses Node 22 via `actions/setup-node`.
- Dependencies are on caret ranges at `astro@^5.0.0`, `@astrojs/mdx@^4.0.0`, `@astrojs/sitemap@^3.2.0`. No automated update config present (no `.github/dependabot.yml`, no Renovate config).
- No `src/pages/404.astro` — Cloudflare serves its default on unknown paths.
- No PNG favicon, apple-touch-icon, or web app manifest — modern browsers with SVG support are fine, but iOS home-screen and older social crawlers fall back to ugly defaults.

"Improve this project" resolved (via AskUserQuestion) to **infra + hygiene pass, sequenced multi-PR plan**. Goal is a small roadmap of independently-shippable hygiene PRs that make the project more robust for the long intermittent-work horizon, without adding features or touching user-visible design.

Out of scope (explicitly deferred or belongs to another focus area):
- Em dashes on homepage prose, headshot asset, `sameAs` backlink reconciliation — all belong to the "flagged follow-ups" bucket the user didn't pick.
- Writing/blog section — separate feature track.
- Homepage content depth — separate content track.

## Sequenced PRs

Each PR is its own branch, own worktree, own journal entry. One concern per PR. Ticked off as each lands.

### PR 1 — `chore/node-version-pin`
- [ ] Add `.nvmrc` with `22` so local shells match CI.
- [ ] Add `engines.node: ">=22"` and `engines.pnpm: ">=9.12.0"` to `package.json`.
- [ ] Verify `pnpm install` still succeeds locally on Node 22.
- [ ] `pnpm lint && pnpm build` green.
- [ ] Journal entry + commit `chore: pin Node 22 locally via .nvmrc and engines`.

Rationale: zero user-facing risk, closes the drift gap between "what CI runs" and "what my shell runs" in a 3-months-from-now session.

### PR 2 — `feat/404-page`
- [ ] Create `src/pages/404.astro` using `Base.astro` layout.
- [ ] Content: H1 "Not found", one-sentence body, a link back to `/`. Match existing voice — terse, no em dashes, no emoji.
- [ ] Confirm Cloudflare Pages serves it on unknown paths (Astro static 404 convention; CF Pages picks up `404.html` automatically from the build output).
- [ ] Verify in `pnpm dev` by hitting a bogus path; verify in `pnpm build && pnpm preview`.
- [ ] Check that the 50KB first-load CI budget still passes (404 is a separate file, not additive to index.html — should be fine).
- [ ] Journal entry + commit `feat(pages): add 404 page`.

Rationale: a personal site losing a stale link to Cloudflare's default chrome looks worse than a one-line hand-written page.

### PR 3 — `feat/favicon-variants`
- [ ] Add raster favicon fallback: `public/favicon-32.png`, `public/favicon-192.png`, `public/apple-touch-icon.png` (180×180). Source from the existing `public/favicon.svg` so the brand mark stays identical. Generation can be a one-off via `sharp` or a manual export — prefer not adding a new build-time dep unless reused.
- [ ] Add `public/site.webmanifest` with name, short_name, theme_color (pull from the accent token in `src/styles/global.css`), background_color, icons array, display `minimal-ui`.
- [ ] Update `src/components/Meta.astro` to emit:
  - `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` (already there — confirm)
  - `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">`
  - `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`
  - `<link rel="manifest" href="/site.webmanifest">`
  - `<meta name="theme-color" content="...">` matching manifest.
- [ ] Confirm icons render in the dev server tab, on iOS add-to-home-screen (simulator or device), and that `pnpm build` doesn't blow the 50KB first-load budget (raster icons live in `public/` and are not counted against the budget — confirm the CI script only measures `dist/index.html + font`).
- [ ] Journal entry + commit `feat(meta): add raster favicon variants and web manifest`.

Rationale: iOS home-screen, social scrapers without SVG support, and older RSS readers all currently fall back to ugly defaults.

### PR 4 — `chore/dependabot`
- [ ] Add `.github/dependabot.yml` with a weekly schedule for `npm` ecosystem, grouping minor+patch into a single PR, labeling `deps`.
- [ ] Keep major updates separate (one PR each) so Astro 6 etc. land as explicit decisions.
- [ ] Confirm the config parses via `gh api /repos/davidhfrost/frosty/dependabot/alerts` or by waiting for the first Dependabot run on the next push.
- [ ] Journal entry + commit `chore(ci): add dependabot config for weekly dep updates`.

Rationale: the project will sit untouched for weeks or months between bursts. Grouped weekly PRs mean David comes back to a small pile of pre-verified update branches instead of manually diffing a 6-month stale lockfile.

### PR 5 — `docs/adr-astro-6-decision` + conditional bump
- [ ] Write `docs/decisions/0005-astro-6-upgrade.md` with Context / Decision / Alternatives / Consequences sections covering:
  - What changed between Astro 5 and 6 (integrations breakage, content layer changes, Vite version bump — check `astro@6` changelog).
  - Whether the `@astrojs/mdx` and `@astrojs/sitemap` major pins need to move in lockstep.
  - Impact on first-load budget (Astro 6 ships different runtime hydration code — verify `pnpm build` output still fits under 50KB).
- [ ] If the ADR concludes "Accepted": bump `astro`, `@astrojs/mdx`, `@astrojs/sitemap` in a follow-up commit on the same branch, rerun `pnpm lint && pnpm check && pnpm build`, and update the ADR status to reflect the landed version.
- [ ] If the ADR concludes "Deferred": commit just the ADR with `Status: Deferred` and a dated revisit note. This PR is then ADR-only.
- [ ] Journal entry + commit `docs(adr): record Astro 6 upgrade decision` (and optionally `chore(deps): bump astro to 6.x`).

Rationale: Astro 5 is not yet stale enough to force a move, but the caret range in `package.json` means the decision will come up again. Write the reasoning down now while the context is loaded; a future Dependabot PR (from PR 4) will then land against an already-decided baseline instead of re-triggering the investigation.

## Critical files

- `.github/workflows/ci.yml` — read-only reference; the 50KB budget step at lines 44–55 constrains PR 2 and PR 3.
- `package.json:19-33` — dep versions and scripts; touched by PR 1 and PR 5.
- `src/components/Meta.astro` — head tag emission; touched by PR 3.
- `src/layouts/Base.astro` — layout wrapper reused by PR 2's 404 page.
- `src/pages/index.astro` — reference for voice/tone when writing the 404 body.
- `src/styles/global.css` — source of the accent color token PR 3 should reuse in the manifest `theme_color`.
- `docs/decisions/` — home for the new ADR in PR 5 (next number is `0005`).
- `docs/journal/2026-04-13.md` — append one entry per PR on the day it lands.
- `docs/plans/infra-hygiene-pass.md` — **copy this plan here on the first working branch before PR 1 starts**, per CLAUDE.md's instruction that `~/.claude/plans/` is ephemeral and the durable checklist lives in-repo.

## Verification per PR

- `pnpm lint` — biome clean.
- `pnpm check` — astro-check clean.
- `pnpm build` — production build succeeds and the CI 50KB first-load budget script would still pass locally:
  ```sh
  html=$(wc -c < dist/index.html); font=$(wc -c < dist/fonts/newsreader-latin-400.woff2); echo $((html + font))
  ```
- `pnpm dev` visual check — required by CLAUDE.md hard rule #5 for any structural HTML change. Applies to PR 2 (404 page) and PR 3 (Meta.astro link tags, visible via browser favicon).
- After PR 2 and PR 3 land on Cloudflare Pages, manually hit a 404 path and check the deployed favicon in a fresh browser tab to confirm CF is serving the built artifacts, not a cached default.
- PR 4 verified on the next push that triggers Dependabot.
- PR 5 verified by `pnpm build` output size comparison before vs after the Astro 6 bump (if accepted).

## Notes

- Each PR goes through its own worktree under `/Users/david/GitHub/frosty-worktrees/<branch-name>/`, created off fresh `main`, torn down the same session the PR merges (CLAUDE.md hard rules #7 and #8).
- PRs 1 through 4 are independent and can be worked in any order. PR 5 should come last so the Astro 6 decision lands against a pinned-Node, 404-complete, favicon-complete baseline.
- If at any point the 50KB first-load budget gets tight, PR 3 is the most likely culprit (Meta.astro link tag bloat); in that case drop the manifest's optional fields before dropping icon variants.
