# dhfrost.com — Claude Code Conventions

This is a personal website built with Astro 6, Tailwind v4, and deployed to Cloudflare Pages. Treat it as a long-lived project I'll come back to in bursts, not a one-shot build. Optimize for *future me being able to pick up where we left off*.

## Hard rules (do not skip)

1. **Commit after every logically complete change.** A passing build, a finished component, a fixed bug, a content update — each is its own commit. Never bundle unrelated changes.
2. **Before declaring any task complete, append a journal entry** to `docs/journal/YYYY-MM-DD.md` (see format below). This is not optional.
3. **Never push to `main` directly.** Work on a branch, even for small changes. I'll merge.
4. **Run `pnpm lint && pnpm build` before committing** anything that touches `.astro`, `.ts`, `.tsx`, `.css`, config, or `tailwind.config.*`. Both must pass — lint catches empty blocks, formatting, and type errors that build silently ignores.
5. **After any structural HTML change that affects layout, verify visually in the dev server** before committing. `pnpm build` only checks that the template compiles; it cannot catch elements that are misaligned or have lost inherited CSS from a moved parent.
6. **Never edit `dist/`, `.astro/`, or `node_modules/`.** These are generated.
7. **Work in a git worktree**, not the primary checkout (see "Git worktrees" below).
8. **Tear down a worktree as soon as its branch is merged.** An abandoned worktree keeps its branch alive, burns disk, and tempts future work onto a stale base. Clean up in the same session the PR merges.
9. **When raising a PR in this repo, check `~/GitHub/dhfrost-journal` for uncommitted or unpushed journal entries.** If any exist, commit and push them, then raise a PR on `dhfrost-journal` in the same session.

## Git worktrees

The primary checkout stays on `main` and should not accumulate uncommitted work. All non-trivial changes happen in a worktree:

```sh
# create — always branch off the latest main, not off another feature branch
cd <primary-checkout>
git checkout main && git pull --ff-only origin main
git worktree add ../frosty-worktrees/<branch-name> -b <branch-name> main
cd ../frosty-worktrees/<branch-name>

# ...work, commit, push, open PR, merge on GitHub...

# cleanup — do this the same session the PR merges, not "later"
cd <primary-checkout>
git worktree remove ../frosty-worktrees/<branch-name>
git branch -d <branch-name>          # local cleanup; remote already gone
git checkout main && git pull --ff-only origin main   # primary back on fresh main
```

Worktrees live under `../frosty-worktrees/<branch-name>/` relative to the primary checkout. Name the directory to match the branch so `git worktree list` is self-explanatory. Parallel streams of work (e.g. a content edit and a refactor) should each get their own worktree so they don't block each other.

**Branch base:** always create worktrees off the latest `main` (note the explicit `main` at the end of `git worktree add`). Branching off another feature branch stacks work on an unmerged base and makes the eventual PR diff hard to review.

**Cleanup is not optional** (see hard rule #8). Before declaring a merged PR "done," run `git worktree remove` + `git branch -d` + pull fresh `main` into the primary checkout. Stale worktrees have already caused one incident where follow-up work branched off an unmerged scaffold instead of `main`.

Agents: always `cd` into the worktree before any file writes or `pnpm` commands. Never modify files in the primary checkout except to resolve a merge conflict on `main` itself.

## Git workflow

- Conventional Commits, scoped where useful:
  - `feat(blog): add reading time to post layout`
  - `fix(nav): correct mobile menu z-index`
  - `style(home): tighten hero spacing`
  - `content: add post on SREcon takeaways`
  - `chore(deps): bump astro to 5.x.y`
  - `refactor:`, `docs:`, `perf:`, `build:`, `ci:` as needed
- Commit body explains *why* when it's non-obvious. Skip the body for trivial changes.
- One concern per commit. If you find yourself writing "and" in the subject, split it.

## Work journal

`docs/journal/` is a symlink to a separate private repo (`dhfrost-journal`), cloned at `~/GitHub/dhfrost-journal/`. It is gitignored in the public repo. After writing entries, commit and push in that repo:

```sh
cd ~/GitHub/dhfrost-journal && git add -A && git commit -m "journal: $(date +%Y-%m-%d)" && git push
```

On a fresh clone of `frosty`, recreate the symlink from the repo root:

```sh
ln -s ../../dhfrost-journal docs/journal
```

Path: `docs/journal/YYYY-MM-DD.md` (create if missing, append if exists).

Entry format:

​```markdown
## <HH:MM> — <short task title>

**Goal:** What I set out to do, in one sentence.

**Changes:**
- `path/to/file.astro` — what changed and why
- `path/to/other.ts` — ...

**Problems:**
- Anything that didn't work the first time. Include the actual error message, not a paraphrase.
- Dead ends I explored and abandoned, with a sentence on why.

**Resolution:** How I got past it. If I'm stuck, say so explicitly and list what I tried.

**Next:** Open threads, follow-ups, things I noticed but didn't fix.
​```

Multiple entries per day are fine — append, don't overwrite.

## Decision records

For any non-obvious technical choice (picking a library, changing build config, restructuring content collections, choosing between two implementation approaches), create `docs/decisions/NNNN-short-title.md` using this template:

​```markdown
# NNNN. <Title>

Date: YYYY-MM-DD
Status: Accepted

## Context
What's the situation that forced a decision?

## Decision
What did we pick?

## Alternatives considered
What else was on the table, and why not?

## Consequences
What does this make easier? Harder? What are we now committed to?
​```

Number sequentially. Don't edit old ADRs — supersede them with a new one that references the old.

## Plans

Non-trivial multi-step work gets a plan file at `docs/plans/<slug>.md` with a progress checklist that is updated as steps land. This is the durable record across sessions — do not rely on in-session task lists alone.

When plan mode is active, the harness writes its scratch file to `~/.claude/plans/`. That file is ephemeral. Before starting implementation, copy the approved plan into `docs/plans/<slug>.md`, commit it on the working branch, and use that file as the live checklist. Tick off each item as the corresponding commit lands. The `~/.claude/plans/` file can be ignored after that.

Plan file format:

```markdown
# <Title>

## Goal
One sentence.

## Steps
- [ ] Step one
- [ ] Step two
- [x] Completed step (check off as commits land)

## Notes
Decisions made during implementation, dead ends, follow-ups.
```

## Stack-specific notes

- **Astro:** prefer `.astro` components over framework components unless interactivity is required. If reaching for React, justify it in the commit message or an ADR.
- **Tailwind v4:** use the CSS-first config (`@theme` in the main stylesheet), not a JS config file. Don't reintroduce `tailwind.config.js`.
- **Content collections:** schema changes go in `src/content.config.ts` (note: top-level, not inside `src/content/`) and need a journal entry — they have ripple effects.
- **Cloudflare Pages:** assume the build runs in CI. Don't rely on local-only env vars without documenting them in `.env.example`.
- **Images:** use Astro's `<Image>` component, not raw `<img>`. Source images live in `src/assets/`, not `public/`, unless they need a stable URL.
- **CSS `ch` units are font-size-relative.** Two elements using the same `max-width: 60ch` but different `font-size` values will compute to different pixel widths and won't align. When two sibling elements need to share a column width, put the `max-width` and centering on a shared parent wrapper instead of duplicating it on each child.

## When you're unsure

Stop and ask. I'd rather answer a question than untangle a wrong assumption later. Especially for: content tone/voice, design choices, anything touching SEO or analytics, anything that changes URLs.
