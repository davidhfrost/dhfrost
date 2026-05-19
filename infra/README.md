# infra/ — Cloudflare IaC for dhfrost.com

OpenTofu configuration that codifies the Cloudflare-side state for `dhfrost.com`: the `dhfrost` Pages project, its custom domain attachments, the DNS records owned by this project, and the `www → apex` Redirect Rule.

What this directory does **not** do: drive the build or deploy. Builds still run via Cloudflare's Pages Git integration on every push to `main`. OpenTofu only describes the surrounding configuration.

## Bootstrap (one-time)

These three resources can't be managed by the state that depends on them, so they live in the dashboard and are recreated by hand if ever lost:

1. **R2 bucket** named `dhfrost-tofu-state` (any region; pick the closest one).
2. **R2 API token** — R2 → Manage R2 API Tokens → Create. Permission: `Object Read & Write`. Scope to the bucket above. Save the Access Key ID and Secret.
3. **Cloudflare API token** — My Profile → API Tokens → Create Custom Token. Permissions:
   - `Account` → `Cloudflare Pages` → `Edit`
   - `Zone` → `DNS` → `Edit`
   - `Zone` → `Zone Settings` → `Edit`
   - `Zone` → `Zone` → `Read`

   Account resources: include the dhfrost account only. Zone resources: include only `dhfrost.com`.

The credentials are stored in 1Password and as four GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## Local setup

```sh
cd infra
cp terraform.tfvars.example terraform.tfvars   # fill in account_id, zone_id
cp backend.hcl.example      backend.hcl        # fill in the R2 endpoint URL
```

Both files are gitignored. The backend endpoint URL has the form `https://<account_id>.r2.cloudflarestorage.com`.

Export credentials in your shell:

```sh
export CLOUDFLARE_API_TOKEN=...           # from 1Password
export AWS_ACCESS_KEY_ID=...              # the R2 access key
export AWS_SECRET_ACCESS_KEY=...          # the R2 secret
```

The OpenTofu `s3` backend reads `AWS_*` env vars even when the bucket is on R2 — that's how the s3 backend protocol works.

Then:

```sh
tofu init -backend-config=backend.hcl
tofu plan
```

## Layout

| File           | Contents                                                       |
| -------------- | -------------------------------------------------------------- |
| `versions.tf`  | OpenTofu + provider version pins; `s3` backend (partial config) |
| `providers.tf` | Cloudflare provider                                            |
| `variables.tf` | Account ID, zone ID, project name                              |
| `pages.tf`     | `cloudflare_pages_project` + `cloudflare_pages_domain` x2      |
| `dns.tf`       | DNS records owned by this project (other records on the zone are managed outside) |
| `redirects.tf` | `cloudflare_ruleset` for `www → apex` 301                      |

## Recon (filling in resource HCL from current dashboard state)

To dump the live state when authoring or reconciling resources:

```sh
# Zone ID
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=dhfrost.com" \
  | jq -r '.result[0].id'

# DNS records
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?per_page=100" \
  | jq '.result[] | {id, name, type, content, ttl, proxied}'

# Rulesets (find the http_request_dynamic_redirect one for www -> apex)
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
  | jq '.result[] | {id, name, phase}'

# Pages project
curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/dhfrost" \
  | jq '.result | {name, production_branch, source, build_config, deployment_configs}'
```

## Reconciling drift

If `tofu plan` ever shows a non-zero diff against the live state, the HCL no longer matches the dashboard. Fix the HCL — do not let `apply` mutate live config. Use the recon snippets above to see what the dashboard actually has, then update the resource definitions to match before re-running `plan`.

If you need to absorb a brand-new resource that was created in the dashboard (rather than via this configuration), add an `import {}` block to a temporary `imports.tf`, run `tofu plan` and `tofu apply` once to bring the resource under management, then delete `imports.tf` in a follow-up commit before the next apply.

## CI

`.github/workflows/infra.yml` runs `tofu plan` on PRs that touch `infra/**` and posts the plan as a sticky PR comment. On merge to `main`, the same workflow runs `tofu apply -auto-approve`. The four GitHub secrets above must be set for CI to function.
