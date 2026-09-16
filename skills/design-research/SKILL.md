---
name: design-research
description: Use when choosing structural references, interaction patterns, design systems, component sources, UI primitives, Figma context, or external implementation references before building a UI. Chooses the smallest useful source by job, stack, accessibility, license, runtime cost, and token cost instead of shotgun-searching libraries.
---

# Design source research

Research should reduce uncertainty, not create an inspiration landfill.

## Fast path

For a new product surface or meaningful redesign, start with:

```text
design_plan(query: "product + primary task + audience + constraints", platform: "web|mobile")
```

Use `craft_profile` alone when structure is already known and the missing decision is craft/density/motion rather than information architecture.

If the remaining question is **which external frontend skill/library/MCP to use**, load `design-resource-router`. Do not manually open five overlapping upstream skills.

## Source hierarchy

Use the highest-authority source that answers the question:

1. user brief and product requirements;
2. existing product/code truth — behavior, tokens, components, `DESIGN.md`;
3. exact Figma node/variables/components when Figma is authoritative;
4. structural references from the bounded design tools;
5. one interaction pattern;
6. official system/docs already used by the project;
7. one accessible primitive/component source if capability is missing;
8. one external taste/visual source only if design direction is still unresolved.

Do not jump from "dashboard" or "CRM" straight to a component buffet.

## Retrieval budget

For a focused UI task, default to:

- one `design_plan` or `craft_profile` call;
- 2-4 structural candidates only if the plan is insufficient;
- one interaction-pattern shortlist;
- one component-family query;
- 3-5 component summaries;
- full source for at most 1-2 finalists;
- 3-6 icon candidates;
- zero screenshots unless pixels answer an unresolved question.

External resource budget: **1-3 sources total**. Use 4 only for a broad redesign where each source owns a non-overlapping job such as direction, implementation, motion, and verification.

## Structural synthesis

Use `reference_find` only when alternatives beyond `design_plan` are needed. Assign different jobs: domain convention, structure, interaction, components, mobile behavior.

Use `reference_rank_axes` when several routes are plausible. Scores are heuristics, not probabilities. Commit chosen jobs with `reference_contract`; duplicate roles are rejected deliberately because reference soup is not synthesis.

Expand only finalists.

## Interaction patterns

Choose the smallest pattern that matches the information/action shape. Patterns are decision cards, not components. Expand one finalist; do not combine several merely because they all ranked well.

## External resource routing

Load `design-resource-router` when considering ThreeUI, 21st, UI/UX Pro Max, Taste Skill, Anthropic frontend-design, GSAP/Framer Motion, Vercel React/React Native guidance, Convex skills, Figma, or Playwright.

Important routing rules:

- ThreeUI only for genuine 3D/shader/immersive jobs; never a dashboard default.
- Taste Skill is strongest for landing pages/portfolios/redesigns, not dense multi-step product UI.
- UI/UX Pro Max is a knowledge/search layer; do not load it when project tokens already settle the question.
- 21st/shadcn are component sources, not replacements for information architecture.
- Vercel React/React Native guidance is implementation guidance, not visual direction.
- GSAP is for real choreography; Motion/Framer is usually enough for component-state transitions.
- Convex guidance applies only to Convex projects.

## Figma research

Figma is an optional companion, not a permanent context source. Pull the exact frame/node needed. Prefer variables, components, assets and Code Connect over screenshot imitation. If Figma and runtime behavior disagree, report the conflict rather than silently choosing.

## Component retrieval

`component_find(source: "shadcn")` searches configured shadcn-schema sources and ranks candidates globally. Repeated queries reuse cached registry metadata.

Preference order:

1. existing project component;
2. existing primitive composed differently;
3. current design-system primitive;
4. one registry component;
5. custom implementation.

For shadcn-managed projects, honor `components.json` and its configured icon library. `icon_find` is semantic discovery, not permission to mix families.

## Browser research

Start with `audit_design` / `audit_responsive` for compact deterministic rendered measurements.

Use the optional Playwright companion for behavior only: navigation, keyboard/focus, overlays, forms, state transitions and bug reproduction. Its low-output default suppresses automatic snapshots/image responses/codegen; explicitly request visual evidence when necessary.

Do not use screenshots as a substitute for interaction verification and do not use browser snapshots as a substitute for deterministic measurements.

## Avoid

- dumping an entire Figma file, registry, skill collection, or browser snapshot stream into context;
- loading Anthropic frontend-design + Taste + UI/UX Pro Max simultaneously without distinct jobs;
- mixing several design systems because each has one attractive demo;
- selecting a reference by overall score and cloning it end-to-end;
- fetching component source before the interaction job is known;
- keeping ThreeUI/WebGL in a normal application bundle for decorative novelty;
- treating higher design variance or motion intensity as inherently better.
