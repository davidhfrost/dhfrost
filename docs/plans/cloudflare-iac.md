# Codify the Cloudflare side of dhfrost.com in OpenTofu

## Goal

Make the entire Cloudflare-side configuration for `dhfrost.com` (Pages project, custom domains, DNS records, www→apex Redirect Rule, pinned zone settings) reproducible from `infra/*.tf`, with `tofu plan` on PR and `tofu apply` on merge to `main`, while leaving ADR 0004's Pages Git deploy path untouched.

## Steps

- [ ] Bootstrap (manual, dashboard): create R2 bucket `dhfrost-tofu-state`, R2 API token (Object R/W scoped to bucket), Cloudflare API token (Pages:Edit, Zone:DNS:Edit, Zone Settings:Edit, Zone:Read on `dhfrost.com`)
- [ ] Add the four GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- [ ] Scaffold `infra/`: `versions.tf`, `providers.tf`, `variables.tf`, `terraform.tfvars` (gitignored), `README.md`
- [ ] Update `.gitignore` for `infra/.terraform/`, `infra/terraform.tfvars`, `infra/*.tfstate*`
- [ ] Author HCL for live resources: `pages.tf`, `dns.tf`, `redirects.tf`, `zone.tf`
- [ ] Author `imports.tf` with `import {}` blocks for every existing resource (Pages project, both Pages domains, every DNS record, the Redirect Rule ruleset)
- [ ] Run `tofu init` + `tofu apply` locally; iterate until `tofu plan` shows **zero diff**
- [ ] Delete `imports.tf` in a follow-up commit once import has succeeded
- [ ] Add `.github/workflows/infra.yml`: plan-on-PR (sticky comment), apply-on-main, concurrency group, `opentofu/setup-opentofu@v1`
- [ ] Write ADR `docs/decisions/0006-cloudflare-iac-with-opentofu.md` (amends ADR 0004; explicit on the reintroduced GitHub secret)
- [ ] Update `docs/deploy.md`: collapse the settings table to a pointer at `infra/`; keep break-glass section
- [ ] Update `CLAUDE.md` Stack-specific notes with a one-liner about `infra/`
- [ ] Verify: live site smoke tests (curl apex 200, www 301, `dig` matches), CI dry-run via harmless `_tofu-test` TXT record PR, drift-detection check
- [ ] Journal entry, PR, merge, `wt-done frosty cloudflare-iac`

## Notes

Full rationale, file layout, provider/backend specifics, and import-ID formats live in the approved plan at `~/.claude/plans/i-ve-already-used-terraform-frolicking-spark.md`. Key constraints recorded there:

- Provider: `cloudflare/cloudflare ~> 5.0`. State backend: `s3` backend pointed at R2 (`use_path_style`, `skip_*` flags, `region = "auto"`).
- Imports use declarative `import {}` blocks (OpenTofu ≥ 1.5), not `tofu import` CLI.
- First post-import `tofu plan` MUST show zero diff. Any drift means the HCL is wrong; fix the HCL, do not let apply mutate live state.
- ADR 0004's deploy path (Cloudflare Pages Git integration) is unchanged; this is config-around-the-deploy, not a new deploy mechanism.
