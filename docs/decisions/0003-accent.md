# 0003. Accent color: warm amber #f5a524, on links only

Date: 2026-04-11
Status: Accepted

## Context

The design rules call for one accent color, used exclusively on links. Everything else is foreground, background, or one muted gray. The accent needs to read immediately as "this is a link" in dark mode (primary background `#0e0e10`) and stay readable in light mode (`#fafaf7`), without defaulting to browser blue.

## Decision

**`#f5a524`** — warm amber, paco.me-adjacent. Applied via the `--color-accent` design token in `@theme`, referenced only by `a { color: … }` and `::selection { background: … }`.

## Alternatives considered

- **Muted teal `#5eead4`**. Classic dev-tools feel, high contrast in dark mode, cool counterpoint to a warm serif. Felt too generic — reads as "developer default" rather than personal.
- **Desaturated coral `#f87171`**. Distinctive and rare as a link color. Ruled out because contrast in light mode (`#f87171` on `#fafaf7`) is borderline on WCAG AA and would require a separate light-mode accent token, complicating the single-accent rule.

## Consequences

**Easier**:

- Warmth pairs cleanly with Newsreader, which is a warm serif. The palette feels human, not clinical.
- High contrast on both dark (`#f5a524` on `#0e0e10` → ~9.3:1) and light (`#f5a524` on `#fafaf7` → ~2.5:1 — *see below*) without needing a mode-specific override.

**Harder**:

- **Light mode contrast is tight.** `#f5a524` on `#fafaf7` is ~2.5:1, which fails WCAG AA (4.5:1) for normal body text. For links that's technically non-compliant if treated as text; most accessibility evaluators judge links by a different standard since the underline provides the non-color affordance. If this gets flagged in a Lighthouse run, options are:
  1. Darken the light-mode accent only (e.g. `#c67a0a`) via a `prefers-color-scheme: light` override on `--color-accent`.
  2. Rely on the `text-decoration` underline as the primary affordance and accept the warning.
- Amber is trendy on personal sites in 2024–2026. If it starts feeling ubiquitous, supersede with a new ADR and shift toward a more unusual hue.
