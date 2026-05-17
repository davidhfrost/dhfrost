---
title: "Streamlining Multi-Agent Development"
description: "Parallel git-worktree workflows quietly duplicate state until a tool's isolation defaults bite. Why content-addressed stores (pnpm, Docker image layers) make multi-agent development cheap."
publishedAt: 2026-05-17
draft: false
---

By the time I noticed, I had eight backend Docker images on my Mac, roughly 13 GB of `node_modules` spread across 28 worktrees, and a stack in my primary checkout that had fallen weeks behind its own database. None of these were bugs in any tool I was using.

They were the side effects of running a workflow that most developer tooling wasn't built to support: several parallel branches of work, each in its own git worktree, often with a Claude Code session driving each one. The primary checkout stays on `main`. Each branch lives in its own sibling directory at `~/GitHub/<repo>-worktrees/<branch>/`. Agents can work in parallel without stepping on each other's files, ports, or git state, and independent stages of a larger plan get their own worktrees too.

The setup works because git was designed for it. Worktrees share `.git/objects`, branch state stays independent, and spinning up a fresh one costs a second.

I run Ghostty, mostly for the multiplexing: several Claude Code sessions live in splits and tabs inside one window instead of as N separate macOS windows competing for screen real estate. Claude Code's `preferredNotifChannel` setting can route permission prompts and stage-completion pings through Ghostty's native notifications, so an agent can ping me even when I'm not looking at its pane. If hooks are available, a Notification hook that runs `afplay /System/Library/Sounds/Glass.aiff` does the same job with a system sound. When hooks are disabled by managed settings, the terminal channel is the only path left.

Everything outside git and the terminal is where duplication starts compounding. I hit two versions of it on the same project.

## Docker Compose

Docker Compose derives its project name from the parent directory (overridable, but the default is what bit me). Two worktrees of the same repo become two Compose projects, with their own containers, their own named volumes, and their own image tags. Compose v2 tags built images as `<project>-<service>`, so each worktree ends up with its own backend image on the daemon. Pulled base images like `postgres:16` still share layers via Docker's content store; what duplicates is the stuff you build yourself.

You want that isolation: feat-x's Postgres volume shouldn't leak schemas into feat-y's tests. But the isolation works by making N independent copies, so eight active worktrees mean eight backend image tags and eight Postgres volumes on disk, almost all of them near-identical.

Disk pressure is the obvious cost. The worse one is staleness you don't see. Worktree projects rebuild on demand because you're actively working in them. The primary checkout's image only rebuilds when you remember to do it there, and once the worktree workflow takes over, the primary goes dormant: every feature branch has its own fresh stack, and "is the primary's image up to date?" stops being a question anyone is asking.

I hit it on a routine task in the primary checkout. The stack came up stale against a database the worktree branches had moved forward over several merged migrations. Alembic crashed: `DuplicateColumn`, trying to add a column that already existed. The image's idea of the latest revision was several behind what the repo on disk knew about, and the database had drifted from migration history along the way. The worktree stacks were fine; only the primary, the one project I'd stopped exercising because the workflow had stopped needing it, had drifted everywhere at once.

The fix was mechanical: align the alembic version row with the schema, rebuild the image, apply the newer migrations. The debugging was the part that took attention. The disk cost of separate Compose projects is the obvious part. The real cost is a maintenance assumption: any stack you stop touching will rot, and parallel workflows produce stacks you stop touching.

`docker compose up -d --build` is now the default in the runbook. Plain `up` is a footgun.

## pnpm

The `node_modules` problem is the same mechanism with different numbers. The same project's worktrees had also accumulated `node_modules` directories. 28 active branches, each with its own `node_modules`, each fresh install around 557 MB. Measured total on disk: about 13 GB (noticeably less than 28 × 557 MB, because older worktrees had partial cleanups and never re-installed the full graph). Most of those bytes are duplicated React and Next.js toolchain.

This is npm working as designed. It has no concept of cross-project deduplication: each project's `node_modules` is a self-contained tree of regular files. If you have N projects sharing 90% of their dependency graphs, npm uses N copies of disk. For a single-project workflow this is invisible. For a multi-worktree workflow, you've multiplied your `node_modules` footprint by the number of active branches, and you don't notice until `df` makes you look.

pnpm solves a problem npm predates. It keeps a single content-addressed store on the host, and each project's `node_modules` is a top-level tree of symlinks into `node_modules/.pnpm/`, where the actual package files live as hardlinks, or on APFS as `clonefile()` CoW clones (which pnpm prefers by default).

The migration isn't free. Strict hoisting catches undeclared transitive imports that npm's flat tree allowed, and a handful of packages need explicit allow-listing for post-install scripts. For any project that lives in many worktrees, that's a cheap trade. On macOS with clones, the apparent size of each `node_modules` stays roughly the same (`du` still reports the full ~550 MB) but the real disk allocation drops to about 17 MB per worktree, because the data blocks are shared.

One measurement gotcha: `du` reports apparent size and doesn't know about APFS clones. Each clone has a distinct inode even though the data blocks are shared, so `du` dutifully sums their apparent sizes and overcounts wildly. The right tool is `df` deltas: measure before, install, measure after, take the difference.

| | npm (before) | pnpm (after) |
|---|---|---|
| Marginal disk per worktree (df delta) | ~557 MB | ~17 MB |
| 28 worktrees, measured total on disk | ~13 GB | ~1.5 GB (incl. ~1 GB shared store) |
| Install time (warm cache or store) | ~30 s | ~2.5 s |

The ~11 GB of recovered disk is a nice bonus but isn't really the point. At 30 seconds and 557 MB per worktree, you don't bother creating one for a short-lived task; you stay on the current branch and let state pile up. At 2.5 seconds and 17 MB, one worktree per parallel task stops being a decision.

## The pattern

Both incidents are the same bug: a tool's isolation default produces duplicated state, and the duplication stays invisible until parallelism multiplies it.

Loosening the boundaries isn't the fix; that breaks correctness. What works is tools that achieve isolation via *content sharing* rather than via *copy*: pnpm's content-addressed store for npm, Docker's content-addressed image layer store, the Nix store for system packages. All three let you have N isolated environments without N copies of the bytes.

In a multi-worktree workflow, anything cached and rebuilt on demand will drift: Docker images, `node_modules`, build outputs, anything else generated. Single-project workflows don't have this problem because there's only one of everything to touch. Parallel work needs explicit habits to keep caches fresh, because each cache only gets exercised when an agent happens to be working in the branch that owns it.

When I think about working with agents, prompting isn't the first thing on my mind. The first thing is whether my toolchain can sustain a few parallel branches of work without accumulating state, duplication, and drift. Docker Compose and npm weren't designed for that workflow. Docker's layer store and pnpm were. The difference shows up in gigabytes of disk and seconds of rebuild, until it shows up as a stalled migration.
