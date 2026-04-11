# 0001. Stack: Astro 5 + Tailwind v4 + pnpm + Biome + Cloudflare Pages

Date: 2026-04-11
Status: Accepted

## Context

dhfrost.com is a single-page personal site that needs to look intentional, stay under 50KB first-load, hit Lighthouse 100/100/100/100, and make it trivial to add a writing or projects section later without restructuring. It will be edited primarily through coding agents, so everything must live in the repo. The user is familiar with the JS/TS ecosystem and wants strict typing.

## Decision

- **Astro 5** as the framework. Zero client JS by default, first-class MDX + content collections, perfect fit for a content-driven static site. Pinned to 5.x; Astro 6 is available but the jump is a separate decision.
- **Tailwind v4** via `@tailwindcss/vite`, CSS-first config (`@theme` in `src/styles/global.css`). No `tailwind.config.js`.
- **pnpm 9.12.0** as the package manager. `packageManager` field in `package.json` pins it.
- **Biome 1.9.4** for lint + format. Replaces ESLint + Prettier with a single faster tool.
- **TypeScript strict**, extending `astro/tsconfigs/strict` and adding `noUncheckedIndexedAccess`.
- **Cloudflare Pages** for hosting, with Wrangler for optional manual deploys. Git integration is the default deploy path.
- **GitHub Actions** for CI on PRs (lint + typecheck + build + 50KB size budget).
- **MDX content collections** with Zod schemas, defined but unused in v1 (latent scaffolding).

## Alternatives considered

- **Next.js**. Overkill for a zero-JS static site. Brings React, a bigger install, and a heavier mental model for no benefit here.
- **11ty**. Solid and mature but the content-collections + MDX story is less polished than Astro's, and strict TS integration is weaker.
- **Plain HTML + a CSS file**. Tempting for a one-pager, but the latent scaffolding requirement (be ready to add writing/projects in 5 minutes) pushes us to something with a build step and content modeling.
- **Vercel / Netlify instead of Cloudflare Pages**. All three are fine for a static site; Cloudflare was picked because the user already has an account and it has the best free-tier bandwidth.
- **ESLint + Prettier instead of Biome**. Two tools where one suffices. Biome is faster and has enough coverage for this project.

## Consequences

**Easier**:

- Adding a writing or projects section later is a 5-minute job (schemas exist, route templates exist, index markers exist).
- The build is fully static and hermetic — no runtime dependencies on external APIs.
- `pnpm lint` and `pnpm check` both run in well under a second; CI round-trip is fast.
- The 50KB budget is achievable with room to spare.

**Harder**:

- Any framework component with client-side interactivity (e.g. a React island) would need explicit opt-in via `client:*` and would risk the zero-JS rule. Treat this as a feature, not a limitation.
- Staying on Astro 5 while 6 exists means we'll eventually do a bump-and-test ADR. Deferred on purpose.
- Biome's Astro parser only sees frontmatter, so `noUnusedVariables`, `noUnusedImports`, and `useImportType` are disabled for `*.astro` via an override. Watch for other overrides accumulating there over time.
