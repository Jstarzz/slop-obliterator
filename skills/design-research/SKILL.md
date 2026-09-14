---
name: design-research
description: Use when choosing structural references, interaction patterns, design systems, component sources, UI primitives, Figma context, or external implementation references before building a UI. Chooses the smallest useful source by job, stack, accessibility, license, and token cost instead of shotgun-searching libraries.
---

# Design source research

Research should reduce uncertainty, not create an inspiration landfill.

## Fast path

For a new product surface or meaningful redesign, start with:

```text
design_plan(query: "product + primary task + audience + constraints", platform: "web|mobile")
```

`design_plan` returns a bounded bundle:

- craft profile: surface mode + design variance / motion intensity / visual density;
- role-specific structural reference candidates;
- interaction-pattern shortlist;
- evidence routing for Figma, Playwright, and deterministic audits.

Use `craft_profile` alone when structure is already known and the missing decision is craft/density/motion rather than information architecture.

## Source hierarchy

Use the highest-authority source that answers the question:

1. **User brief and product requirements** — explicit intent wins.
2. **Existing product/code truth** — behavior, tokens, components, `DESIGN.md`.
3. **Figma MCP** — when a Figma frame/design system is authoritative: variables, components, layout, assets, Code Connect.
4. **Structural references** — `reference_find`, `reference_rank_axes`, `reference_expand`.
5. **Interaction patterns** — `pattern_find`, `pattern_expand`.
6. **Official design systems/docs** — when the project actually uses that system.
7. **Accessible primitives / project registries** — implementation capability.
8. **External visual references** — composition and visual-language evidence, never a clone target.

Do not jump from "dashboard" or "CRM" straight to cards/components.

## Structural synthesis

Use `reference_find` only when you need to inspect alternatives beyond `design_plan`. Compare 2–4 routes and assign different jobs: domain convention, structure, interaction, components, mobile behavior.

Use `reference_rank_axes` when several routes are plausible. Its scores are heuristics, not probabilities.

Commit the chosen jobs with `reference_contract` before implementation. Duplicate roles are rejected deliberately: reference soup is not synthesis.

Expand only finalists with `reference_expand`.

## Interaction patterns

Choose the smallest pattern that matches the information/action shape:

```text
pattern_find(query: "operators triage exceptions then inspect one without losing queue context", platform: "web", limit: 4)
pattern_find(query: "field inspection checklist evidence offline resume", platform: "mobile", limit: 4)
pattern_find(query: "vehicle map selection route context", platform: "mobile", limit: 4)
```

Patterns are decision cards, not components. They define use-when, shape, interactions, avoid-when, and mobile adaptation. Expand one finalist; do not combine several merely because they all ranked well.

## Figma research

Load `figma-handoff` when Figma is in play.

Pull the exact frame/node needed. Prefer variables, components, assets, and Code Connect over screenshot imitation. Compare Figma primitives with the existing codebase before generating new components. If Figma and runtime behavior disagree, report the conflict rather than silently choosing.

## Component retrieval

Only search components after structure and interaction are resolved.

`component_find(source: "shadcn")` searches the configured shadcn-schema sources and ranks candidates globally across registries. Registry catalogues are cached by source/root; repeated queries rank locally instead of refetching indexes.

Default retrieval budget:

- one structural plan;
- one pattern shortlist;
- one component-family query;
- 3–5 summaries;
- fetch at most 1–2 finalists;
- 3–6 icon candidates.

Preference order:

1. existing project component;
2. existing primitive composed differently;
3. current design-system primitive;
4. registry component;
5. custom implementation.

For shadcn-managed projects, honor `components.json` and its configured icon library. `icon_find` is semantic discovery, not permission to mix families.

## Browser research

Load `browser-qa` when runtime behavior is the unknown.

- use Playwright MCP for navigation, keyboard/focus, overlays, forms, state transitions and reproduction;
- use `audit_design` / `audit_responsive` for compact deterministic rendered measurements;
- use screenshots only when visual judgement remains unresolved.

Do not use Playwright MCP accessibility snapshots as a substitute for a deterministic audit, and do not use screenshots as a substitute for interaction verification.

## External design lineages

`design-craft` contains an original compact synthesis informed by Emil Kowalski's interaction-craft work, Impeccable's quality/surface discipline, and Taste Skill's variance/motion/density dials. Use the synthesis for routing and project decisions; consult upstream sources only when deeper source-specific guidance is actually needed.

## Avoid

- dumping an entire Figma file or component registry into context;
- mixing several design systems because each has one attractive demo;
- selecting a reference by overall score and cloning it end-to-end;
- using external visual inspiration to override product behavior;
- fetching component source before the interaction job is known;
- using Playwright MCP for static facts a compact audit already measures;
- treating higher design variance or motion intensity as inherently better.
