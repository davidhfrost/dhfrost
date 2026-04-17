# Deploy reference

The site is a fully static Astro build deployed to Cloudflare Pages.

## Cloudflare Pages Git integration (live path)

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

pnpm 10 is picked up automatically from the `packageManager` field in `package.json`; no `PNPM_VERSION` env var needed.

**Custom domains** attached to the Pages project:

- `dhfrost.com` (apex, canonical; matches `site` in `astro.config.mjs`)
- `www.dhfrost.com`

A zone-level **Redirect Rule** named `www to apex` 301-redirects `www.dhfrost.com/*` to `https://dhfrost.com/$1`, preserving path and query string. The rule lives at `dhfrost.com` zone → Rules → Redirect Rules. Cloudflare also auto-redirects `http://` → `https://`.

## Manual deploy via Wrangler (break-glass only)

```sh
pnpm build
pnpm dlx wrangler pages deploy dist --project-name=dhfrost
```

Requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment. This bypasses the Git integration and creates a "Direct Upload" deployment — reserve it for the case where Cloudflare's GitHub-side build is broken and a fix needs to ship immediately. Avoid mixing flows in normal operation.
