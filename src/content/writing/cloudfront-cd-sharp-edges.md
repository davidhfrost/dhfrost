---
title: "CloudFront Continuous Deployment: Sharp Edges and When to Use It"
description: "A practical look at CloudFront CD: automation friction, pipeline IaC separation, runtime edge cases, and lifecycle cleanup pain, all explained through the lens of eventual consistency."
publishedAt: 2026-04-25
draft: false
---

CloudFront has a lot going for it. Deep AWS integration, a sprawling POP footprint, the generous 1TB free tier, Origin Shield closing the gaps that used to require third-party caching layers, and the egress economics from EC2 and S3 that quietly create real lock-in once you're committed.

Continuous Deployment is one of the more interesting and under-discussed pieces of that story. I've been working on CD for a large production web application for a while, and the parts that matter most in practice are different from where the docs spend their time. The engineering tradeoffs underneath are genuinely interesting once you sit with them. Most of what feels like rough edges turns out to be a consequence of doing canary-style traffic shifting on top of an eventually-consistent, globally-distributed control plane. Once that lands, the rest of the operational picture follows.

## The architectural tension

CloudFront is two systems welded together. The data plane serves traffic in milliseconds across a global POP fleet. The control plane configures that fleet, and it's eventually consistent: when you change a distribution's config, the new version propagates across the POP fleet over the next few minutes. POPs flip independently as they get the update. There's no atomic "everyone has the new config now" moment.

CD is canary-style traffic shifting layered on top of that reality. Two distributions with different configs, a policy that splits real traffic between them by header or by weight, and a promote action that swaps the primary's config for the staging's once you're satisfied. Most of CD's behavior, including the parts that feel weird, comes back to the propagation reality underneath.

## Sharp edges in practice

The edges show up across automation, pipeline integration, runtime behavior, and lifecycle. Lifecycle is where teams lose the most time.

### Automation friction

Every distribution update requires the etag of the version you fetched. AWS rejects mismatches. Standard optimistic concurrency, same as everywhere else in AWS.

The friction starts when you chain operations. After any update, a distribution sits in `InProgress` for several minutes while the new config propagates across the POP fleet. Subsequent operations fail or queue awkwardly until that state clears. SDK code that doesn't account for this breaks in non-obvious ways the first time you run a multi-step deployment. The fix is to poll `Status` after each mutation and wait until it's back to `Deployed`.

The check itself is small:

```python
import boto3

cf = boto3.client("cloudfront")

def is_deployed(distribution_id):
    return cf.get_distribution(Id=distribution_id)["Distribution"]["Status"] == "Deployed"
```

Wrap it in whatever retry, timeout, and observability your platform expects. In our deployment platform a Step Functions Wait state handles the orchestration, since you don't want a Lambda burning execution time idling on propagation.

Optimistic concurrency and eventually-consistent rollout are reasonable primitives for a globally-distributed control plane. The friction comes with the territory.

### Pipeline integration

CD changes the contract between your IaC and the primary distribution. Without CD, your pipeline applies IaC directly to a distribution and that's the end of it. With CD, primary updates only happen via promote: your pipeline applies IaC to staging, and the promote action writes those changes to primary.

You have to structure your IaC around that fact. We keep staging in its own stack that the pipeline deploys to, and a separate primary stack we deliberately don't deploy. For routine index.html updates we don't touch IaC at all. The setup is blue-green on S3: the two distributions point at different origins (different prefixes in the same bucket, or different buckets entirely), and deploys upload new content to whichever side staging serves. CD validates and promote swaps which origin primary reads from.

For unusual config changes (cache behaviors, header policies, origin tweaks), we update the IaC for both stacks at the same time but only deploy staging. The primary stack's IaC is now ahead of the live distribution, and when promote runs it catches up. Drift detection has to know to ignore the gap during the promote-pending window.

IaC is the source of truth for desired state. Promote applies it to primary. A stack update on primary mid-cycle bypasses CD on that change.

### Runtime surprises

Two behaviors to know about before committing to CD.

The peak-traffic override is the first. AWS documents that during high CloudFront-wide load, all requests may go to the primary distribution regardless of CD policy. We asked AWS, and they told us it's per-POP: a POP flips when its own load is high, while others keep honoring the policy. Peak refers to CloudFront's own load, not yours. We haven't observed this in production, but we designed for it: any promote action confirms staging is actually receiving traffic before proceeding. Promote is one-way, so paying that cost on every promote is cheap insurance.

HTTP/3 is the other. CD doesn't work with distributions that have HTTP/3 enabled. If you want CD, you stay on HTTP/2.

### Lifecycle and migration pain

This is where we've spent the most operational time. Most of it stays invisible until you try something irreversible.

CD policies can't be deleted while attached to a staging distribution. That sounds obvious until you realize the attachment outlives the CloudFormation stack that created it. We've seen cases where a CD policy provisioned in a staging distribution's CDK stack survived `aws cloudformation delete-stack`, orphaned and still referencing a torn-down distribution, blocking follow-on operations. The fix involves detaching the policy via `update-distribution` (with the requisite etag), then deleting it via `delete-continuous-deployment-policy`. Our developer IAM roles didn't have those permissions, which turned cleanup into a ticket before it could become a script. These tickets tend to take months.

The other lifecycle pain is DNS. If you need to migrate to a new distribution, say switching IaC tools or moving between AWS accounts, you're moving CNAMEs. DNS pace becomes the binding constraint. Long TTLs slow the cutover. Change-management gates on DNS records slow it further. Rollback retraces the same path: another DNS change, another window, another wait for caches to clear. In environments where DNS updates aren't fast and self-service, what looks like a simple migration turns into a multi-day exercise. Worth knowing before you put CD on a critical path.

Both come back to the same architectural fact. CD's resource model treats policies as independent enough of distributions to outlive their stacks, and DNS sits outside CloudFront entirely.

## Where CD fits in a broader progressive delivery story

Progressive delivery has two layers. CD owns one: the CDN, where changes ride the request path. Bootstrap documents, asset versions, cache config, anything validated by a slice of staging traffic. The other layer is application-side feature flags. They handle feature releases, business logic toggles, and experiments.

Rollback at the CDN layer is repointing primary, which takes minutes. Flipping a feature flag propagates in seconds. The blast radii differ too: feature flags scope per user, per cohort, per geography, while CD applies to everyone hitting the distribution.

Treating CD as your whole progressive delivery story is where teams get into trouble. The CDN can't read user state, so feature canaries don't belong there. Flag systems can't reach the bootstrap document, so static-asset rotations don't belong there. Each layer is good at its own shape of change.

## When CD is the right call

CD works well for high-frequency, low-stakes changes to static content. Bootstrap doc updates flow through the canary first: a new index.html sees real traffic on staging, and we promote when it looks healthy. The same shape works for asset rotations and cache behavior tweaks, where a five-minute ramp is cheap insurance against a regression. The CDN isn't where you'd run your most novel code paths, and CD fits that. It catches the obvious failures (a misconfigured header, an inverted cache key, a broken root document) before they reach your full audience.

CD struggles where the staging distribution's feature gaps bite or where you need control it doesn't expose. Lambda@Edge changes are the main case. The staging side has subtle behavioral differences and a percentage-based ramp won't catch a function regression that depends on origin behavior. Per-path weighting isn't supported. Nothing auto-rolls back on health signals; if you want metrics-gated promotion, you build that yourself on top of CD.

CD makes sense when traffic on the staging distribution is enough to verify the change. Feature flags handle everything else.

CD's limits are mostly architectural. Doing canary mechanics on an eventually-consistent control plane carries costs, and the operational practice is mostly about designing around them. Within that frame, it's an underrated piece of the AWS stack.

*(For the record, this site runs on Cloudflare Pages.)*

---

If any of this resonates, I'd be glad to compare notes.
