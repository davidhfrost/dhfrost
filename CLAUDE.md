# dhfrost.com — Claude Code Conventions

This is a personal website built with Astro 6, Tailwind v4, and deployed to Cloudflare Pages. Treat it as a long-lived project I'll come back to in bursts, not a one-shot build. Optimize for *future me being able to pick up where we left off*.

## Hard rules

1. **Run `pnpm lint && pnpm build` before committing** anything that touches `.astro`, `.ts`, `.tsx`, `.css`, config, or `tailwind.config.*`. Both must pass — lint catches empty blocks, formatting, and type errors that build silently ignores.
2. **After any structural HTML change that affects layout, verify visually in the dev server** before committing. `pnpm build` only checks that the template compiles; it cannot catch elements that are misaligned or have lost inherited CSS from a moved parent.

## Stack-specific notes

- **Astro:** prefer `.astro` components over framework components unless interactivity is required. If reaching for React, justify it in the commit message or an ADR.
- **Tailwind v4:** use the CSS-first config (`@theme` in the main stylesheet), not a JS config file. Don't reintroduce `tailwind.config.js`.
- **Content collections:** schema changes go in `src/content.config.ts` (note: top-level, not inside `src/content/`) and need a journal entry — they have ripple effects.
- **Cloudflare Pages:** assume the build runs in CI. Don't rely on local-only env vars without documenting them in `.env.example`. The Pages project, custom domains, DNS, and the `www → apex` Redirect Rule are codified in OpenTofu under `infra/`; changes go through PR review and CI applies on merge to `main`.
- **CF Pages coalesces near-simultaneous merges.** When landing multiple PRs in a short window, space the merges by at least 60 seconds. Otherwise Pages may build only the first and silently skip the rest, leaving production stuck on an older commit even though `main` is up to date. Verify after merging with `gh api repos/davidhfrost/dhfrost/commits/<sha>/check-runs`; absence of a `Cloudflare Pages` check on a merge commit means that build was dropped, and any follow-up commit will retrigger one. The skipped commit will not appear in the CF dashboard's deployment list, so there is nothing to "Retry" from there.
- **Images:** the index page stays image-free by design (see the README design rules). Writing posts and project pages do ship images, all kept under `src/assets/`. Use Astro's `<Image>` component for raster sources (PNG/JPG) so they're optimized to WebP at build; for SVGs, import the asset and use a raw `<img src={imported.src}>`, since `<Image>` doesn't optimize vector. Keep source media in `src/assets/`, not `public/`, unless it needs a stable URL.
- **CSS `ch` units are font-size-relative.** Two elements using the same `max-width: 60ch` but different `font-size` values will compute to different pixel widths and won't align. When two sibling elements need to share a column width, put the `max-width` and centering on a shared parent wrapper instead of duplicating it on each child.
