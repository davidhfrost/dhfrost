# 0006. Codify Cloudflare-side configuration in OpenTofu

Date: 2026-05-03
Status: Accepted

## Context

Until this ADR, dhfrost.com's Cloudflare configuration lived in two places: `wrangler.toml` (Pages project name + output dir) and the Cloudflare dashboard (everything else — Pages build settings, custom domain attachments, DNS records, the `www → apex` Redirect Rule, zone settings). ADR 0004 accepted that split deliberately, with one stated downside: *"Deploy logic isn't visible in the repo diff."* The mitigation was to record settings in `docs/deploy.md` and the ADR itself.

That mitigation held for the Pages build settings but not for DNS or the Redirect Rule, which had no source of truth outside the dashboard. Recreating the zone from scratch — after an account loss, accidental deletion, or migration — would have been a guess-and-check exercise, and there was no drift detection if a record were edited by hand or by another tool.

## Decision

Codify the Cloudflare-side configuration for `dhfrost.com` in OpenTofu under `infra/`, with state stored in an R2 bucket (`dhfrost-tofu-state`) and a GitHub Actions workflow that runs `tofu plan` on PRs touching `infra/**` and `tofu apply` on merges to `main`.

In scope:

- `cloudflare_pages_project` for `dhfrost`, including build config and Git source
- `cloudflare_pages_domain` for `dhfrost.com` and `www.dhfrost.com`
- `cloudflare_dns_record` for the three Pages-related records (apex CNAME, www CNAME, Google site verification TXT)
- `cloudflare_ruleset` for the `www → apex` 301 Redirect Rule

Explicitly out of scope:

- Other DNS records on the same zone (`retrofolio.dhfrost.com`, `cdn.baseline.dhfrost.com`) belong to other Pages projects with independent lifecycles. Leaving them dashboard-only means OpenTofu won't fight changes to them.
- The Pages Git integration's deploy mechanism — ADR 0004 stays in force. Cloudflare still builds and deploys on every push to `main`; OpenTofu only describes the *configuration around* the deploy, not the deploy itself.

## Alternatives considered

- **Keep the status quo (ADR 0004 unchanged).** Lowest cost, but the DNS / Redirect Rule gap remains. The trigger to act now was authoring this IaC for a separate project, where the same Cloudflare account had to be partially re-bootstrapped — an exercise the dashboard-only setup made more painful than it should have been.
- **Terraform instead of OpenTofu.** Identical for this workload; OpenTofu picked for the cleaner license (MPL vs BSL) and because the workload is trivial enough that ecosystem-mindshare differences don't matter.
- **Local-only OpenTofu (no CI).** Avoids the GitHub-secret reintroduction that ADR 0004's "zero secrets" stance was protecting. Rejected because drift detection is the headline benefit, and it only works if `plan` runs reliably — local-only is too easy to forget.
- **Manage the entire zone (including retrofolio + cdn.baseline).** Stronger source-of-truth, but couples unrelated projects' DNS lifecycles to frosty PRs. Rejected as too tight a coupling for a personal-site multi-project zone.

## Consequences

**Easier:**

- DNS and the Redirect Rule have a real source of truth. The HCL plus `git log` are now the answer to "what is the production config?"
- Drift detection runs on every PR. If a record is hand-edited in the dashboard, the next plan flags it.
- Recreating Cloudflare-side state from scratch is a `tofu init && tofu apply` away.
- The bootstrap (R2 bucket, R2 token, Cloudflare API token, four GitHub secrets) is documented in `infra/README.md` and reproducible.

**Harder:**

- Reintroduces a `CLOUDFLARE_API_TOKEN` GitHub secret that ADR 0004 was explicitly avoiding. Trade is accepted: drift detection on a static site's DNS is worth one scoped, rotatable token. The token's permissions are pinned to the dhfrost account and zone only.
- A second token for R2 (Object R/W on the state bucket) and four total GitHub secrets to rotate when needed.
- Two Cloudflare-managing systems on the same account now: this OpenTofu project, and the Pages Git integration. They don't overlap — Pages owns the build, OpenTofu owns the zone — but operators need to know which is which. `docs/deploy.md` and `infra/README.md` make the boundary explicit.
- Cloudflare's API token permissions for the modern Rulesets engine are non-obvious. Zone-level Redirect Rules need `Zone → Single Redirect → Edit` specifically; neither `Account Rulesets`, `Zone WAF`, `Config Rules`, nor `Transform Rules` covers them. Recorded here so the next bootstrap doesn't repeat the dance.

This ADR amends ADR 0004 rather than superseding it. ADR 0004's deploy-path decision (Cloudflare Pages Git integration over Wrangler-from-CI) stands.
