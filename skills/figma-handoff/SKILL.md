---
name: figma-handoff
description: Use when a task includes a Figma file/frame/selection, asks to implement or update a Figma design, needs design-system extraction, Code Connect/component reuse, or wants live UI captured back into Figma. Routes Figma MCP context into the existing codebase without treating generated markup as final code, then verifies the implementation in the browser.
---

# Figma handoff

Figma is design-source context, not a code generator you blindly obey.

The plugin bundles Figma's remote MCP server as `figma`. Authentication is user-scoped and happens through the MCP client. If Figma is unavailable, continue from code/screenshots and say which source of truth was missing.

## Read before write

Before asking Figma for anything large:

1. Inspect the target code route/component and the project's tokens/components.
2. Identify the exact Figma frame/node that maps to the requested surface.
3. Pull only the context needed for that frame: layout, variables, components, assets, and relevant Code Connect mappings.
4. Compare Figma semantics to existing code primitives before creating anything new.

Prefer a Figma node link over whole-file retrieval. Do not flood context with unrelated pages.

## Source-of-truth rules

- Figma variables beat guessed hex/radius/spacing values when the design is authoritative.
- Code Connect mappings beat generated replacement components.
- Existing production components beat one-off Figma-generated markup when they already implement the same semantic job.
- Product behavior in code/specs beats a static frame when the frame omits loading, error, permission, keyboard, or responsive behavior.
- If Figma and code disagree materially, name the conflict instead of silently choosing one.

## Figma -> code

For implementation:

1. Get design context for the exact node/selection.
2. Map Figma components to project components by semantic role.
3. Map variables to project tokens; add a token only when the design genuinely introduces a new concept.
4. Preserve the project's framework and state architecture. Figma output is reference material, not permission to replace architecture.
5. Implement responsive behavior rather than freezing desktop frame dimensions into CSS.
6. Add states the static design cannot show: focus, keyboard, loading, error, empty, disabled, long content, localization, reduced motion.
7. Run `audit_design` and `audit_responsive`.
8. Use Playwright MCP for the interaction path the frame represents.

Do not recreate text as SVG, flatten accessible controls, hard-code every coordinate, or introduce an icon family that disagrees with the project.

## Code -> Figma

When the user wants the live interface captured or iterated in Figma:

- Prefer Figma MCP's code-to-canvas/write capabilities when available in the authenticated client.
- Capture meaningful states separately: default, menu/dialog open, empty/error, mobile, etc.
- Keep the browser implementation authoritative for behavior; use Figma to review and communicate design, not as a substitute for runtime verification.
- When writing into an existing file, reuse its components/variables instead of creating visually duplicate local primitives.

## Design-system work

When extracting or reconciling a design system:

- inventory variables and component variants first;
- compare them with `DESIGN.md`, CSS variables/Tailwind theme, and real component props;
- use Code Connect where available to make the relationship explicit;
- report orphan Figma tokens, orphan code tokens, naming mismatches, and visually duplicated components separately;
- do not merge similar tokens just because their current numeric values happen to match.

## Verification split

Figma answers **what was designed**. Playwright answers **what the browser does**. `audit_design` answers **what the rendered page measurably violates**.

A handoff is not complete until all three agree on the requested state, or the disagreement is documented.
