# Add writing / blog

## Goal

Turn the latent `writing` collection scaffold into a working blog section: list page, post route, post layout, homepage link, and a first placeholder post.

## Steps

- [x] `feat(writing): add Post layout`
- [x] `feat(writing): add /writing index route`
- [x] `feat(writing): add dynamic post route with draft filtering`
- [x] `feat(home): add Writing section linking to recent posts`
- [x] `content: add placeholder first post`
- [x] `style(writing): add article typography`

## Notes

Decisions made before implementation:
- Both .md and .mdx supported (glob loader already accepts both; @astrojs/mdx already installed)
- Drafts hidden in prod, visible in dev — filter via `import.meta.env.PROD ? !data.draft : true`
- Homepage shows 3 most recent non-draft posts with title + date + link to /writing
- Slugs derived from filename (Astro default `id`); no custom slug field needed
- No extras in v1 (RSS, reading time, tags, prev/next all deferred)
