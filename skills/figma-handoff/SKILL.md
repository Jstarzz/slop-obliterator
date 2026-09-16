---
name: figma-handoff
description: Use when a task includes a Figma file/frame/selection, asks to implement or update a Figma design, needs design-system extraction, Code Connect/component reuse, or wants live UI captured back into Figma. Routes exact Figma context into the existing codebase without treating generated markup as final code, then verifies the implementation with bounded evidence.
---

# Figma handoff

Figma is design-source context, not a code generator you blindly obey.

Figma is provided by the optional `slop-visual-companions` plugin rather than the core plugin. Enable it only when Figma is actually source truth. If unavailable, continue from code/screenshots and state which source was missing.

## Read before write

1. Inspect the target code route/component and project tokens/components.
2. Identify the exact Figma frame/node that maps to the requested surface.
3. Pull only the context needed for that node: layout, variables, components, assets, and relevant Code Connect mappings.
4. Compare Figma semantics to existing code primitives before creating anything new.

Prefer a node link over whole-file retrieval. Do not flood context with unrelated pages.

## Source-of-truth rules

- Figma variables beat guessed hex/radius/spacing values when the design is authoritative.
- Code Connect mappings beat generated replacement components.
- Existing production components beat one-off Figma markup when they already implement the same semantic job.
- Product behavior in code/specs beats a static frame when the frame omits loading, error, permission, keyboard, or responsive behavior.
- If Figma and code disagree materially, name the conflict instead of silently choosing one.

## Figma -> code

1. Get design context for the exact node/selection.
2. Map Figma components to project components by semantic role.
3. Map variables to project tokens; add a token only for a genuinely new concept.
4. Preserve the project's framework and state architecture.
5. Implement responsive behavior rather than freezing frame coordinates into CSS.
6. Add states the static design cannot show: focus, keyboard, loading, error, empty, disabled, long content, localization, reduced motion.
7. Run `audit_design` / `audit_responsive`.
8. Enable/use Playwright only if the interaction path still needs behavior proof.

Do not recreate text as SVG, flatten accessible controls, hard-code every coordinate, or introduce a conflicting icon family.

## Code -> Figma

- Prefer authenticated Figma MCP code-to-canvas/write capabilities when available.
- Capture only meaningful states: default plus the specific open/error/mobile state needed for review.
- Keep browser implementation authoritative for behavior.
- Reuse existing file components/variables instead of creating visually duplicate local primitives.

## Design-system work

Inventory variables/component variants first; compare them with `DESIGN.md`, CSS variables/Tailwind theme, and real component props; use Code Connect where available; report orphan tokens, naming mismatches, and duplicated components separately. Do not merge tokens merely because their current numeric values match.

## Verification split

Figma answers **what was designed**. Playwright answers **what the browser does**. `audit_design` answers **what the rendered page measurably violates**.

A handoff is complete when the evidence required by the requested state agrees, or remaining disagreement is explicit. Do not pay all three evidence sources when one or two already prove the claim.
