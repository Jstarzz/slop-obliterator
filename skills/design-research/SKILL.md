---
name: design-research
description: Use when choosing a design system, component source, UI primitive library, motion library, structural reference, interaction pattern, or reference implementation before building a UI. Triggers on requests for "design systems", "component libraries", "UI inspiration", "React Bits", "Magic UI", "KokonutUI", "Primer", "Carbon", "Radix", "what should I build this with", comparing app designs, and when ui-design needs raw material beyond the built-in component search. Chooses sources by job, stack, accessibility needs, license, and whether the source is authoritative or merely inspiration.
---

# Design source research

Do not search component libraries as if they are interchangeable bags of JSX. Choose the source based on what decision you are trying to make.

Read `references/sources.md` for the curated source matrix. For multi-reference composition, also use the `design-synthesis` skill.

## Source hierarchy

Use the highest-authority source that answers the question:

1. **The project's own design contract and components** - existing product decisions beat external taste.
2. **Structural reference routes** - call `reference_find` with the product + primary task. It returns a few compact app structures without loading screenshots or a giant catalogue. Expand only shortlisted routes with `reference_expand`.
3. **Interaction-pattern decisions** - call `pattern_find` once the repeated task and information shape are understood. Choose the smallest useful pattern (master-detail, exception queue, map+dock, table, timeline, wizard, checklist, etc.) before browsing implementation libraries.
4. **Official design-system MCP/docs** - when the project uses Primer, Carbon, shadcn, or another established system, query its current source of truth rather than guessing APIs from memory.
5. **Accessible primitives** - use low-level libraries such as Radix when you need interaction semantics and composability more than a finished visual language.
6. **Curated component registries** - use the MCP's `component_find` for installable raw material. Adapt it into the project's tokens and direction.
7. **Expressive/motion libraries** - use these to solve a specific interaction or visual moment, not to decorate every section.
8. **External visual references** - learn hierarchy/composition/pattern decisions; do not copy branding or exact layouts.

## Fast path: one compact planning call

For a new product surface, prefer `design_plan` before issuing separate structural and interaction searches. It performs the deterministic part of the research loop in one bounded call: ranks references by synthesis role, prefers different references for different jobs when plausible, and returns a short interaction-pattern shortlist.

```text
design_plan(query: "port checkpoint nfc verification offline Android", platform: "mobile")
design_plan(query: "ambulance dispatch exception triage map", platform: "web")
```

Use its output as a research plan, not as permission to skip judgement. Inspect only the role finalists you actually need, then commit the chosen non-overlapping roles with `reference_contract`. `design_plan` deliberately does not choose visual style, branding, or an end-to-end source to clone.

Use the lower-level `reference_find`, `reference_rank_axes`, and `pattern_find` tools directly when you need to inspect or challenge one part of the plan.

## Structural reference search

`reference_find` is intentionally smaller than visual web research. Query by product and task, not style:

```text
reference_find(query: "ambulance dispatch exception handling", platform: "mobile", limit: 4)
reference_find(query: "port checkpoint nfc access verification", platform: "mobile", limit: 4)
reference_find(query: "developer infrastructure logs incident triage", platform: "web", limit: 4)
```

It searches 15+ compact archetypes and returns structure, interactions, useful component families, and anti-patterns. Compare 2-4 routes for different jobs, then use `design-synthesis`; do not treat the top result as a template.

Only call `reference_expand` for finalists. Empty queries deliberately return nothing so an agent cannot accidentally dump the entire reference catalogue into context.

## Interaction pattern search

After the broad structure is chosen, query the actual repeated task:

```text
pattern_find(query: "operators triage exceptions then inspect one without losing queue context", platform: "web", limit: 4)
pattern_find(query: "field inspection checklist evidence offline resume", platform: "mobile", limit: 4)
pattern_find(query: "vehicle map selection route context", platform: "mobile", limit: 4)
```

Patterns are decision cards, not components. They say when the pattern fits, what information shape it expects, what interactions must exist, when not to use it, and how it adapts to mobile. Use `pattern_expand` only for a finalist. Do not combine several patterns merely because they all scored reasonably well.

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

- Start with `design_plan` for a new product surface when the domain + primary task are known.
- Drop to `reference_find` / `reference_rank_axes` when you need to inspect structural alternatives manually.
- Use `pattern_find` before component search when the information architecture is known but the interaction shape is not.
- Start with `component_find` only when the missing capability is already known.
- Query components by the interaction/problem: `command palette`, `animated tabs`, `data table density`, `hero background`, not vague `cool component`.
- Fetch only the top few candidates.
- Inspect dependencies before choosing. A visually tiny component can have a large runtime cost.
- Treat fetched code as raw material. Replace its colors, radii, spacing, type, and icon assumptions with the active design system.
- Honor the project's configured icon family; use `icon_find` for semantic discovery, not as permission to mix icon systems.
- Run `audit_design` after integration. Third-party polish does not make the surrounding page coherent automatically.
- For library APIs that change quickly, use current version-specific docs (Context7 or equivalent when available) before implementing around memory.

## Avoid

- mixing five component libraries because each had one pretty demo
- adopting a full enterprise design system for one button
- copying a distinctive marketing component unchanged and calling that product identity
- adding Three.js, GSAP, or a large motion dependency for incidental decoration
- proxying or vendoring source whose license restricts redistribution
- treating a design-system MCP as a style generator; it is a source of truth for that system
- loading an entire reference catalogue when a four-result structural shortlist answers the question
- jumping from "CRM" or "dashboard" straight to cards without selecting the interaction pattern
- treating `design_plan` as an end-to-end template selector; it is a bounded decision aid

## Handoff

When recommending raw material, return:

```text
Source: library/design system/reference route
Why: the specific job it solves
Integration: registry/MCP/package/direct reference
Dependencies: important runtime additions
License: relevant constraint
Adapt: what must change to fit this product
Verify: rendered/a11y/perf check to run after integration
```
