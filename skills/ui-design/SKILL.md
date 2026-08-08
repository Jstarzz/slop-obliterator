---
name: ui-design
description: Use when building, redesigning, or reviewing any user interface — web pages, app screens, components, dashboards, landing pages, design systems, or mockups. Triggers on "build a UI", "make this look better", "design a page", "it looks like AI made it", "generic", "slop", requests for colour palettes, typography, layout, spacing, or design tokens, and on any front-end work where appearance matters. Produces interfaces that read as designed rather than defaulted, and verifies the result in a real browser instead of assuming.
---

# UI design that doesn't read as machine-default

## The problem you are solving

A language model predicts the most probable next token. For code that is a strength. For design it is fatal, because the most probable choice is the average of everything the model has seen, and the average of web design since 2019 is Tailwind's `indigo-500`, Inter, and three rounded cards in a row.

That output is not ugly. It is anonymous, which is worse: a visitor cannot tell it apart from the last four products they looked at. Every finding in this skill traces back to the same root cause — **a decision that nobody made, filled in with a default.**

Your job is to make the decision.

## The one rule

> Before writing a single line of UI, name the aesthetic direction out loud, in the conversation, and commit to it.

Not "clean and modern." That is the average wearing a disguise. Name something a person could disagree with:

- "1970s ski lodge: burnt orange, avocado, warm browns, chunky slab serif."
- "Bloomberg terminal: near-black, phosphor green, monospace everywhere, information-dense, zero rounded corners."
- "Swiss pharmaceutical packaging: white, one red, Helvetica-adjacent grotesque, strict grid, enormous margins."

If you cannot name it, read `references/directions.md` and pick one. Twelve are catalogued there with their palettes, typefaces, and layout logic. Picking one at random beats defaulting every time.

State the direction, then hold it. Re-state it in a comment at the top of the stylesheet so it survives the next edit.

## Workflow

### 1. Decide before you build

Answer these in the conversation. If the user has not said, either ask (use the `grill` skill for anything non-trivial) or state your assumption explicitly so it can be corrected.

- **Direction** — the named aesthetic, per above.
- **Density** — spacious/editorial, or dense/operational? This one decision sets spacing, type size, and radius scale.
- **Light or dark first** — which one gets designed properly, not just inverted?
- **Emotional register** — should the user feel calm, urgent, curious, safe, powerful?
- **The one thing** — what is the single most important element on the screen? Everything else is subordinate to it.

### 2. Generate the token layer first

Never write hex values by hand. Call `design_system` on the MCP server with a seed drawn from something real — a material, a place, a photograph, a book cover. It returns OKLCH ramps with eased lightness, a chroma bell curve, hue shift across each ramp, tinted neutrals, and every semantic pair verified against WCAG AA. It refuses indigo/violet seeds unless you override.

```
design_system(seed: "#9a3412", intensity: "balanced", modes: ["light","dark"])
```

Use the emitted `@theme` block (Tailwind v4) or custom properties directly. Components reference semantic tokens — `--app-primary`, `--app-text-muted` — never raw ramp steps and never literals.

Full colour reasoning: `references/color.md`.

### 3. Build

Work through `references/typography.md`, `references/layout-space.md`, `references/states.md`, and `references/motion.md`. The short version:

- **Type**: two faces with different skeletons. Weight extremes (300 vs 800), not 400 vs 600. Scale ratio ≥3× top to bottom. Body copy capped at `65ch`.
- **Layout**: asymmetry beats symmetry. Vary the rhythm. Never three equal cards in a row with an icon and a heading.
- **Space**: one 4px-based scale, ~8 steps, exposed as tokens. Space communicates grouping — proximity does more work than borders.
- **States**: every interactive element needs rest, hover, active, `:focus-visible`, disabled, loading. Every data surface needs empty, loading, error, and partial. This is where generated UI fails hardest.
- **Motion**: one well-orchestrated entrance with staggered delays beats a dozen scattered micro-interactions. Always guard with `prefers-reduced-motion`.

Icons: call `icon_find` (Tabler and Lucide, offline, ~7000 icons, consistent 24/2px/currentColor). Never mix icon sets with different stroke weights — that mismatch is visible instantly.

Components: `component_find` searches Uiverse (MIT, ~3000 community CSS/Tailwind elements — excellent for texture and detail) and any shadcn-schema registry. Treat results as raw material to adapt, never as a finished design.

### 4. Look at it

**This step is not optional and it is the reason this skill exists.** You cannot tell whether a design works by reading its source.

```
audit_design(file: "/abs/path/index.html", viewport: "desktop")
audit_responsive(url: "http://localhost:3000", viewports: ["mobile","tablet","desktop"])
```

The audit measures the rendered result — palette in OKLCH, type scale, spacing grid, contrast, focus rings, tap targets, form states, motion guards, landmarks — and returns named findings with a fix for each. It costs a few hundred tokens, so run it after every meaningful change.

Fix every `BLOCK`. Fix every `MAJOR` or say out loud why you are not. Re-run until clean.

`capture` exists for when you genuinely need to see pixels, but the audit answers most questions for a fraction of the cost. Do not screenshot by reflex.

### 5. Self-critique before you hand it over

Run `references/critique.md` against your own work. It is eleven questions, and the honest answer to at least one of them is usually "no."

## Non-negotiables

These are correctness, not taste. Never ship without them.

| Requirement | Standard |
|---|---|
| Text contrast | 4.5:1 body, 3:1 for ≥24px or ≥18.66px bold |
| Control boundaries and focus rings | 3:1 against adjacent colour (WCAG 1.4.11) |
| Focus indicator | Visible `:focus-visible` on every interactive element, 2px min, with offset |
| Tap targets | ≥24×24 CSS px (WCAG 2.2 SC 2.5.8); 44×44 on touch |
| Form fields | Programmatic label, visible required marker, inline error with `role="alert"`, HTML validation attributes |
| Motion | Wrapped in `prefers-reduced-motion: no-preference`, or neutralised in a `reduce` block |
| Images | `alt` present (empty if decorative), `width`/`height` or `aspect-ratio` set |
| Structure | One `h1`, no level skips, `main`/`nav`/`header`/`footer` landmarks, skip link |
| Keyboard | Full operation without a mouse; visible focus order matching visual order |

## Making mockups

When the user wants options rather than an implementation, read `references/mockups.md`. The short version: produce **three genuinely different directions**, not three shades of the same one — a model asked for variations will otherwise return the same layout in three palettes. Each mockup is a single self-contained HTML file, audited before it is shown.

## Reference files

| File | Read it when |
|---|---|
| `references/slop-tells.md` | Diagnosing why something looks generated; full catalogue of tells |
| `references/directions.md` | Choosing an aesthetic direction; twelve worked-out options |
| `references/color.md` | Palette, OKLCH, contrast, dark mode, semantic colour |
| `references/typography.md` | Typeface choice, pairings, scale, measure, the banned list |
| `references/layout-space.md` | Grid, rhythm, spacing scale, hierarchy, page flow |
| `references/states.md` | Interaction states, empty/loading/error, forms, accessibility |
| `references/motion.md` | Animation principles plus Motion, anime.js, and CSS recipes |
| `references/critique.md` | The eleven-question self-review |
| `references/mockups.md` | Producing multiple design directions |
