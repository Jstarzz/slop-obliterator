---
name: design-research
description: Use when choosing a design system, component source, UI primitive library, motion library, or reference implementation before building a UI. Triggers on requests for "design systems", "component libraries", "UI inspiration", "React Bits", "Magic UI", "KokonutUI", "Primer", "Carbon", "Radix", "what should I build this with", and when ui-design needs raw material beyond the built-in component search. Chooses sources by job, stack, accessibility needs, license, and whether the source is authoritative or merely inspiration.
---

# Design source research

Do not search component libraries as if they are interchangeable bags of JSX. Choose the source based on what decision you are trying to make.

Read `references/sources.md` for the curated source matrix.

## Source hierarchy

Use the highest-authority source that answers the question:

1. **The project's own design contract and components** - existing product decisions beat external taste.
2. **Official design-system MCP/docs** - when the project uses Primer, Carbon, shadcn, or another established system, query its current source of truth rather than guessing APIs from memory.
3. **Accessible primitives** - use low-level libraries such as Radix when you need interaction semantics and composability more than a finished visual language.
4. **Curated component registries** - use the MCP's `component_find` for installable raw material. Adapt it into the project's tokens and direction.
5. **Expressive/motion libraries** - use these to solve a specific interaction or visual moment, not to decorate every section.
6. **Visual references** - learn hierarchy/composition/pattern decisions; do not copy branding or exact layouts.

## Built-in registry directory

`component_find(source: "shadcn")` searches these shadcn-schema registries in parallel by default:

- shadcn/ui
- Magic UI
- KokonutUI
- React Bits

Results are ranked locally by name/title/description so registries that return their whole index behave consistently with registries that support server-side query parameters.

`component_fetch` can proxy source from the MIT registries. React Bits is **searchable but intentionally not proxied** because its current MIT + Commons Clause terms allow use but restrict redistribution of the components themselves. Install/fetch React Bits directly from upstream instead.

`SLOP_REGISTRY_URL` still switches `source: "shadcn"` to one custom shadcn-schema registry for teams with an internal component system.

## How to choose

Before selecting a source, establish:

- **Stack** - React/Next, plain HTML/CSS, another framework?
- **Job** - primitive behavior, full design language, motion, visual texture, data-dense application UI, marketing surface?
- **Identity** - are you adopting the source's visual language or only borrowing implementation raw material?
- **Accessibility** - does the source provide semantics/keyboard/focus behavior, or are you responsible for rebuilding it?
- **Dependency budget** - does one animation drag in Three.js/GSAP/WebGL for a screen that did not need them?
- **License** - can the code be copied/redistributed, or should the agent direct-install it from upstream?

Then search one or two sources that fit. Do not shotgun every library and dump 80 results into context.

## Retrieval rules

- Query by the interaction/problem: `command palette`, `animated tabs`, `data table density`, `hero background`, not vague `cool component`.
- Fetch only the top few candidates.
- Inspect dependencies before choosing. A visually tiny component can have a large runtime cost.
- Treat fetched code as raw material. Replace its colors, radii, spacing, type, and icon assumptions with the active design system.
- Run `audit_design` after integration. Third-party polish does not make the surrounding page coherent automatically.
- For library APIs that change quickly, use current version-specific docs (Context7 or equivalent when available) before implementing around memory.

## Avoid

- mixing five component libraries because each had one pretty demo
- adopting a full enterprise design system for one button
- copying a distinctive marketing component unchanged and calling that product identity
- adding Three.js, GSAP, or a large motion dependency for incidental decoration
- proxying or vendoring source whose license restricts redistribution
- treating a design-system MCP as a style generator; it is a source of truth for that system

## Handoff

When recommending raw material, return:

```text
Source: library/design system
Why: the specific job it solves
Integration: registry/MCP/package/direct reference
Dependencies: important runtime additions
License: relevant constraint
Adapt: what must change to fit this product
Verify: rendered/a11y/perf check to run after integration
```
