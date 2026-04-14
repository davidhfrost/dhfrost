# 0005. Astro 6 upgrade

Date: 2026-04-13
Status: Accepted

## Context

The site was scaffolded against `astro@^5.0.0` in April 2026 because CLAUDE.md at the time
said "Astro 5." Astro 6.1.6 had already shipped but the version choice was deferred pending
an explicit decision. See `docs/journal/2026-04-11.md` (15:55 entry) for the original note.

Astro 6 is now the `latest` tag on npm. The caret range in `package.json` does NOT
auto-upgrade across a major; it requires an explicit bump. With Dependabot now configured
(PR #16), major bumps will arrive as individual PRs — this ADR makes the decision before
that PR arrives unattended.

### What changed in Astro 6 relevant to this site

**Required integration upgrades:**
- `@astrojs/mdx` splits on the Astro major. `@astrojs/mdx@4.x` requires Astro 5;
  `@astrojs/mdx@5.x` requires Astro 6. Must bump in lockstep.
- `@astrojs/sitemap@3.7.2` (latest) is compatible with both Astro 5 and 6. No change needed.
- `@tailwindcss/vite@4.2.2` already declares `vite: "^5.2.0 || ^6 || ^7 || ^8"`.
  Astro 6 uses Vite 7. Compatible.

**Breaking changes that apply to this site:**
- Node 22.12.0 minimum. Already on Node 22 (pinned via `.nvmrc` and `engines` in PR #13).
- Astro 6 bundles Zod 4. Our content schemas use only `z.string()`, `z.date()`,
  `z.boolean()`, `z.number()`, `.optional()`, `.default()`, `.url()`, `.int()`,
  `.min()`, `.max()` — all stable across Zod 3→4.

**Breaking changes that do NOT apply to this site:**
- Legacy content collections API removed (`getEntryBySlug`, `getDataEntryById`,
  `entry.render`). We have no routes that call these; collections are latent scaffolding.
- `Astro.glob()` removed. Not used anywhere.
- `<ViewTransitions />` renamed to `<ClientRouter />`. Not used.
- CommonJS config files dropped. `astro.config.mjs` is already ESM.
- `i18n.routing.redirectToDefaultLocale` default change. No i18n config in use.
- Heading ID generation changes. No markdown content exists yet.

**Config options used — all unchanged:**
- `trailingSlash: "never"` — no documented change.
- `build.inlineStylesheets: "always"` — no documented change.
- `vite.build.cssMinify: "lightningcss"` — no documented change.

**Config file location changed:** `src/content/config.ts` must move to `src/content.config.ts`
and each collection must declare an explicit loader (e.g. `glob()`). This is a one-time
migration, not ongoing maintenance.

**`z` deprecated from `"astro:content"`:** Astro 6 bundles Zod 4 and marks the re-exported
`z` as deprecated in TypeScript hints. `zod` is not a standalone dep (it's bundled), so the
fix is to wait until content routes are written and switch to `z` from `"zod"` (added as a
direct dep at that point). For now the collections are latent — `astro check` reports 0 errors
and 0 warnings; the 17 deprecation hints are informational only.

**First-load budget risk:** Astro 6 ships Vite 7 and a refactored router; static output for
a one-page site with no client JS should be equal or smaller. Verified below.

## Decision

Upgrade to Astro 6. Bump `astro` to `^6.0.0` and `@astrojs/mdx` to `^5.0.0` in the same
commit. Leave `@astrojs/sitemap` at `^3.2.0` (already compatible).

## Migration performed

- `package.json`: `astro@^5.0.0` → `^6.0.0`, `@astrojs/mdx@^4.0.0` → `^5.0.0`.
- `src/content/config.ts` → deleted; replaced by `src/content.config.ts` with explicit
  `glob()` loaders per the new Content Layer API.
- `@astrojs/sitemap` and `@tailwindcss/vite`: no changes needed.
- First-load budget: 33,213 B on Astro 6 vs 33,022 B on Astro 5 (+191 B). Well within 50,000 B.
- `astro check`: 0 errors, 0 warnings, 17 informational hints (deprecated `z` re-export).

## Alternatives considered

**Stay on Astro 5** — No pressing reason to move; 5 still receives patch releases. Deferred
approach is safe. Rejected because: (1) the site is new with no content yet, so the migration
surface is minimal right now; (2) `@astrojs/mdx@5` dropping Astro 5 support means a future
deferred PR will land with a larger diff; (3) the Dependabot PR for the major will arrive
soon anyway — better to decide with full context than reactively approve an automated bump.

**Upgrade Astro only, leave mdx at 4.x** — Not possible; `@astrojs/mdx@4.x` declares
`peerDependencies: { astro: "^5.0.0" }` and will produce peer dep warnings or fail depending
on the package manager's enforcement level.

## Consequences

- **Easier:** Future content work starts on Astro 6, so writing posts and project pages will
  use stable Content Layer API from day one. No legacy API migration mid-project.
- **Easier:** Dependabot's weekly minor/patch PRs will now track the Astro 6.x release train.
- **Harder (mitigated):** If a future Astro 6 patch introduces a regression, rollback requires
  pinning. Acceptable given the site has zero client JS, no adapter, and a simple static build.
- **Committed to:** Node 22 minimum (already enforced). Zod 4 (no user-facing impact yet).
  Vite 7. `@astrojs/mdx@^5.0.0` going forward.
