# Deploy reference

The site is a fully static Astro build deployed to Cloudflare Pages.

## Cloudflare Pages Git integration (live path)

The `dhfrost` Pages project is connected to `davidhfrost/frosty`. Pushes to `main` auto-deploy to `https://dhfrost.com`. PRs get a `*.pages.dev` preview URL commented on the PR.

The Pages project, custom domain attachments, DNS records, and the `www → apex` Redirect Rule are all codified in OpenTofu under `infra/`. Build-related settings (project name `dhfrost`, command `pnpm build`, output `dist`, env var `NODE_VERSION=22`) live in HCL, not in this doc — `infra/pages.tf` is the source of truth. pnpm 10 is picked up automatically from the `packageManager` field in `package.json`.

`http → https` upgrade is automatic at the Cloudflare edge and is not codified.

## Manual deploy via Wrangler (break-glass only)

```sh
pnpm build
pnpm dlx wrangler pages deploy dist --project-name=dhfrost
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment. This bypasses the Git integration and creates a "Direct Upload" deployment — reserve it for the case where Cloudflare's GitHub-side build is broken and a fix needs to ship immediately. Avoid mixing flows in normal operation.
