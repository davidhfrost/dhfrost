# 0004. Deploy via Cloudflare Pages Git integration, not Wrangler from CI

Date: 2026-04-11
Status: Accepted

## Context

ADR 0001 picked Cloudflare Pages as the host but left the deploy mechanism open: the README documented both the Pages Git integration (Cloudflare watches the repo and builds on push) and a Wrangler-from-GitHub-Actions flow (CI builds, then `wrangler pages deploy` publishes `dist/`). With the scaffold merged and the site ready to ship to `dhfrost.com`, one of the two had to become the live path.

## Decision

**Cloudflare Pages Git integration.** The `dhfrost` Pages project is connected to `davidhfrost/frosty`; Cloudflare runs `pnpm build` on its own builders on every push to `main` and on every PR, publishes `dist/` to `https://dhfrost.com` (production) or `https://<hash>.dhfrost.pages.dev` (previews), and comments preview URLs on the PR.

The custom domain wiring is part of the same decision: `dhfrost.com` is the canonical hostname (matching `site` in `astro.config.mjs`), and `www.dhfrost.com` 301-redirects to the apex via a zone-level Redirect Rule.

## Alternatives considered

- **Wrangler from GitHub Actions** (the README's flow B). Would require adding `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` as GitHub secrets, a deploy job in `ci.yml`, and conditional logic for "main vs PR." More moving parts, two systems to keep in sync (CI build vs. Cloudflare build), and no preview URLs for free — they'd have to be wired up by hand. The only real upside is "deploy logic in-repo," which is weak when the existing `wrangler.toml` already declares the project shape.
- **Manual `wrangler pages deploy` from the laptop**. Simplest possible, but trivially easy to forget, and there's no record of which build shipped. Fine as a break-glass; not fine as the primary flow.
- **Apex → www instead of www → apex**. Some big sites do this (`www.google.com`). Historically apex-as-canonical had DNS limitations (no `CNAME` at the zone apex in vanilla DNS), but Cloudflare's CNAME flattening removes that constraint. Apex is shorter, matches the `site` config without needing a code change, and is what `<link rel="canonical">` already declares.

## Consequences

**Easier**:

- **Zero secrets in GitHub.** No tokens to rotate, no scope-creep risk on the GitHub Actions surface.
- **Preview URLs come for free.** Every PR gets a `*.pages.dev` deployment commented on the PR within ~1 min, which is the right feedback loop for a site where most changes are visual or content.
- **One build system, not two.** CI runs lint/typecheck/build/size-budget as a *gate*; Cloudflare runs `pnpm build` independently as the *deploy*. They share `package.json` so divergence is unlikely, and if Cloudflare's build fails the dashboard surfaces it without polluting CI status.
- **`wrangler.toml` is still the source of truth** for the project name (`dhfrost`) and output dir (`dist`). The dashboard settings just mirror it. Recreating the project from scratch is a 2-minute job using the table in README § Deploy → A.

**Harder**:

- **Deploy logic isn't visible in the repo diff.** Someone reading `git log` won't see "deploy step changed" if the dashboard config is edited. Mitigated by recording the settings in the README and this ADR — any out-of-band change should be reflected back here.
- **Two ways to ship a deploy** (Git push vs. manual `wrangler`) is a footgun. A manual `wrangler pages deploy` creates a "Direct Upload" deployment that bypasses the Git connection and shows up alongside Git-driven deploys in the dashboard, which is confusing. README § B now flags this as break-glass only.
- **Cloudflare's builders are a hidden dependency.** If they regress (e.g. drop pnpm 9.x support), the deploy breaks even though local `pnpm build` is fine. The `packageManager` field in `package.json` pins pnpm 9.12.0 which Cloudflare honors today; if that ever changes, the fallback is `PNPM_VERSION=9.12.0` as an env var, then escalating to flow B if the builder is genuinely broken.
