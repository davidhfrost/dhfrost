# SEO: rank for "David Frost software engineer" / "David Frost Capital One"

## Goal

Add Person JSON-LD structured data to the homepage and tighten the SERP title/description so Google can disambiguate dhfrost.com as the "David Frost, software engineer at Capital One" entity.

## Steps

- [x] **1. Scaffold the worktree and commit the plan.**
- [x] **2. Extend `Meta.astro` with structured-data support.** Add `personSchema?: boolean` prop, conditional JSON-LD `<script>` block, `<meta name="author" content="David Frost">`.
- [x] **3. Forward the prop through `Base.astro`.** Add `personSchema?: boolean` to `Base` props, pass through to `<Meta>`.
- [x] **4. Enable schema + tighten snippet on the homepage.** Update `src/pages/index.astro` title and description (remove em dash, lead with name, include "Capital One" in title), pass `personSchema={true}` to `<Base>`.
- [x] **5. Verify.** Run `pnpm lint && pnpm build`, view-source spot-check, validate JSON-LD at validator.schema.org. Journal entry. (Note: Google Rich Results Test is wrong tool for Person -- it only covers visual SERP types and always returns "no rich results detected" for Person schema.)
- [x] **6. Open PR.** davidhfrost/frosty#11

## Notes

**JSON-LD Person schema to emit** (in Meta.astro when `personSchema={true}`):

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "David Frost",
  "alternateName": "davidhfrost",
  "url": "https://dhfrost.com",
  "image": "https://dhfrost.com/og.png",
  "jobTitle": "Software Engineer",
  "worksFor": {
    "@type": "Organization",
    "name": "Capital One",
    "url": "https://www.capitalone.com"
  },
  "sameAs": [
    "https://github.com/davidhfrost",
    "https://www.linkedin.com/in/davidhfrost"
  ],
  "description": "Software engineer working on cloud infrastructure at Capital One.",
  "knowsAbout": [
    "Cloud infrastructure",
    "Infrastructure as code",
    "CI/CD",
    "Distributed systems"
  ]
}
```

**Title/description targets:**
- Title: `"David Frost · Software Engineer at Capital One"` (replaces em dash, adds employer for long-tail query match)
- Description: `"David Frost is a software engineer at Capital One working on cloud infrastructure, infrastructure as code, and CI/CD. Side project: Retrofolio, a portfolio backtester."` (leads with name, front-loads employer)

**`image` field note:** `/og.png` is the auto-generated text card, not a headshot. Valid URL, but Google will not use it as a knowledge-panel photo. Headshot follow-up is separate.

**Follow-ups (not in this PR):**
1. Headshot at `public/headshot.jpg` + reference in schema `image` + same photo on LinkedIn.
2. Em dashes in homepage prose (`src/pages/index.astro:14,20`) — separate commit.
3. External backlinks: LinkedIn "Website" field + GitHub profile README should link to `https://dhfrost.com`.
