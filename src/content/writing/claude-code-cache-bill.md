---
title: "What Actually Drives Claude Code's Cache Bill"
description: "A status-line cache timer blamed the bill on 5-minute TTL eviction. The transcripts disagreed: Claude Code runs the 1-hour cache, and the real driver was prefix-key rotation from parallel tool calls, not idle expiry."
publishedAt: 2026-06-27
draft: false
---

I added a prompt-cache timer to my Claude Code status line and watched the cache create / cache read ratio swing toward write every time a long subagent dispatched. The obvious story: the cache was evicting on its 5-minute idle timer during the wait, and the next parent message was paying full rate to rebuild the context.

When I went back to the transcripts to verify the math, the mechanism story didn't survive. Claude Code wasn't on the 5-minute cache tier; it was on the 1-hour one, with a different rate. And the biggest "eviction" of the session followed a 99-second gap, not anything close to an hour.

## How the cache works

Anthropic's prompt cache has two TTL options. The standard ephemeral cache holds the prefix for about 5 minutes at a 1.25x base-input write rate. A 1-hour variant costs 2.0x base input to write but survives much longer pauses. Both pay 0.1x base input on reads.

Claude Code uses the 1-hour variant by default. You can see this in any session transcript at `~/.claude/projects/<encoded-path>/<session-uuid>.jsonl`: assistant messages report `cache_creation.ephemeral_1h_input_tokens` populated and `ephemeral_5m_input_tokens` at zero. The write/read ratio for the 1-hour tier is 20x, not the 12.5x of the 5-minute tier. A 7-minute subagent dispatch doesn't expire the cache; you'd need a full hour of idle.

The cache prefix key is a hash over tools, system prompt, and message history, in that order. Any change to any of them is treated as a cache miss on the next request, regardless of how recent the previous write was.

## What I expected vs what the transcripts showed

The mental model behind the status-line timer: long subagent wait, cache idles past TTL, expires, next parent message rebuilds at full rate. I eyeballed about eight subagent runs over five minutes, a mid-session parent context around 150,000 tokens, and the 5-minute tier's 12.5x miss multiplier, which comes out to roughly 1.2 million tokens of cache-miss spend.

The transcripts told a different story. Across the session there were only two large cache_creation events: 476,442 tokens written at 22:00Z and 70,034 written at 19:13Z. The 476k spike followed a parent gap of 99 seconds. Nowhere near the 1-hour TTL.

The rotation fingerprint was visible in the spike message itself: cache_read on the prefix dropped to 16k while a fresh 476k write landed. That's a near-total prefix rebuild, not an idle expiry. The cause: the preceding parent turn had streamed ten `tool_use` blocks in parallel (five TaskCreate plus five Agent), which changed the prefix key. The next cached entry was a fresh write of the whole prefix.

The remaining ~1 million of parent cache_write came from prefix accumulation as the session grew turn by turn. The old mechanism (5-minute idle eviction) would have predicted around 1.2M in cache writes; the corrected mechanism (prefix rotation plus accumulation) gives ~1.48M. The wrong mechanism produced the right order of magnitude, which is why it survived a first pass.

## The session, by the numbers

The retro I wrote during this session had the parent share at 2.5-3M tokens. Deduped against the transcript (Claude Code logs streaming-append duplicates with identical `message.id`, and a naive sum triples them), the parent's input plus output plus cache-write tokens total about 2 million. Of those, 1.48 million were cache writes, much higher than the rough half I originally estimated.

The single largest cached prefix on any message was 981,547 tokens, read late in the session. That's only possible on the 1M-token context window, not the 200k standard. On a near-1M prefix, each prefix-key rotation rewrites up to ~2 million base-input equivalents at the 2.0x cache-write rate.

Twenty-nine Agent `tool_use` blocks across fifteen distinct assistant turns; some turns dispatched several at once. Eleven ran longer than five minutes, not the eight I'd eyeballed for the estimate above. The two longest were a 24-minute backend retry and a 38-minute background-job retry, both serial. Subagent return messages get folded into the parent's context, growing the cached prefix on the next turn.

## The diagnostic still works

`npx ccusage` reports cache create vs cache read tokens for your recent sessions. A subagent-heavy run with serial dispatches and bursts of parallel `tool_use` shows up as an inverted ratio: heavy writes relative to reads. It flags that something is happening, but it can't tell you whether the cause is TTL eviction, prefix-key rotation, or simple accumulation. To distinguish those, you have to read the transcript.

Symptom monitors flag that something happened. Transcripts tell you which mechanism produced it.
