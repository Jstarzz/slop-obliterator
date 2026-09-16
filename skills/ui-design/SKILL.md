---
name: ui-design
description: Use when building, redesigning, or reviewing any user interface — web pages, app screens, components, dashboards, landing pages, design systems, or mockups. Triggers on "build a UI", "make this look better", "design a page", "it looks like AI made it", "generic", "slop", requests for colour palettes, typography, layout, spacing, or design tokens, and on front-end work where appearance matters. Produces interfaces that read as designed rather than defaulted and verifies the result with bounded evidence.
---

# UI design that does not read as machine-default

Generated UI fails when an undecided fork gets filled with the statistical average. Make the decision; do not merely decorate the average.

## Route first, then keep the context small

Load only specialists that materially change the work:

- `design-research` + `design-synthesis` for a new surface or structural redesign.
- `design-craft` for variance, density, motion, micro-interaction and quality-floor decisions.
- `design-resource-router` only when choosing among external skills/libraries/MCPs such as ThreeUI, 21st, Taste, UI/UX Pro Max, Vercel React/React Native, GSAP, Figma, or Playwright.
- `mobile-ui` for touch-first/native/mobile work.
- `figma-handoff` only when Figma is actual source truth.
- `browser-qa` only when runtime browser behavior matters.
- `critique` only for judgement deterministic rules cannot answer.

Do **not** load every design skill or MCP on every UI task. Default external-resource budget is 1-3 sources. An overlap is not a composition.

## 1. Decide before components

For a new or meaningfully redesigned surface, call `design_plan` with product, primary user task, audience, platform and hard constraints. It returns a compact hypothesis:

- surface mode and variance/motion/density dials;
- role-specific structural references;
- an interaction-pattern shortlist;
- evidence routing.

Commit only the reference roles that matter before implementation. Choose the smallest interaction pattern that fits the repeated task before browsing component libraries.

For a narrow refinement where the existing product already has clear structure, skip structural research and use `craft_profile` only if the craft direction is unclear.

## 2. Name one coherent direction

Before meaningful UI work, be able to state:

- surface mode — persuade, operate, read, or experience;
- primary loop — what the user repeatedly does;
- hierarchy — what dominates the first viewport;
- density — sparse/editorial vs dense/operational;
- type stance — scale/weight/voice, not merely a font name;
- color strategy — neutral ground + semantic/accent role;
- edge language — square/hairline/soft/physical/etc.;
- motion budget — which interactions deserve motion and which should be instant;
- state model — loading, empty, error, partial, disabled, long content, permissions;
- icon family — one family consistent with the project.

"Clean and modern" is not a direction.

## 3. Respect source truth

Use evidence in this order:

1. user brief and product requirements;
2. existing production behavior;
3. existing code components/tokens and `DESIGN.md`;
4. Figma variables/components/Code Connect when Figma is authoritative;
5. explicit reference contract and chosen interaction pattern;
6. one selected external design source when it answers a real gap;
7. inferred craft preferences.

A reference does not outrank the product. A generated component does not outrank an existing semantic primitive.

## 4. Retrieve, do not dump

When the project lacks authoritative tokens, call `design_system` with a seed that belongs to the chosen direction. Do not create a second palette when the project/Figma already has one.

For implementation capability:

```text
existing project component
  -> existing primitive composed differently
  -> current design-system primitive
  -> one registry/library candidate
  -> custom implementation
```

Search summaries first. Fetch source for only 1-2 finalists. Never dump a registry or a whole component family into context.

Use `design-resource-router` before reaching for specialist external sources. In particular, ThreeUI is for real 3D/shader/immersive work, not decoration on dashboards or admin surfaces.

## 5. Craft details by frequency and purpose

- Frequent expert actions should be instant or extremely restrained.
- Motion must explain state, space, feedback, or a rare moment.
- Avoid `transition: all`, gratuitous bounce, perpetual loops, and slow entrances.
- Press/focus/hover/disabled/loading states are part of component feel, not cleanup.
- Popovers should feel connected to their trigger; modal behavior must stay spatially coherent and keyboard-correct.
- Density follows the task. An operations console is not a landing page stacked into cards.
- Refinement preserves identity; redesign replaces the visual world deliberately.

## 6. Mobile is a different information problem

Do not squeeze desktop into 390px. Load `mobile-ui` and decide what the phone is for.

At minimum verify navigation/back semantics, safe areas/fixed chrome, keyboard-open forms, touch targets, one-handed repeated actions, long/localized content, interruption/retry/offline behavior when relevant, and larger-phone/tablet/foldable behavior when applicable.

For React Native/Expo implementation details, route through `design-resource-router` and load the React Native specialist rather than web React guidance.

## 7. Verify with the cheapest evidence that answers the question

Start with `audit_design` / `audit_responsive` for compact deterministic evidence: layout, type, color, spacing, overflow, contrast, targets, states, landmarks, motion rules and slop signatures.

Use the optional Playwright companion only for behavior: navigation, keyboard/focus, overlays, forms, route transitions, loading/error/network states, permissions/storage, and interaction bugs. Its default companion config suppresses automatic snapshots/image responses/codegen; request visual state explicitly only when needed.

Use screenshots only when the unresolved question is genuinely visual. For meaningful edits, do one batched inspect/fix pass and at most one confirmation pass. Endless polishing is not craft.

## 8. Figma is opt-in source truth

Load `figma-handoff` and the optional Figma companion only when Figma is actually involved.

- Pull the exact frame/node, not the whole file.
- Reuse variables, components and Code Connect mappings.
- Map to existing code components before generating replacements.
- Implement runtime states/responsiveness a static frame cannot show.
- Verify behavior/rendered output separately.

## Non-negotiables

| Requirement | Standard |
|---|---|
| Text contrast | 4.5:1 body; 3:1 for large/bold text |
| Focus | Visible `:focus-visible`, logical order, no keyboard traps |
| Touch targets | WCAG minimum; target roughly 44x44 for repeated touch actions |
| Forms | Programmatic labels, visible errors, usable keyboard/input modes |
| Motion | Reduced-motion handling and no essential information conveyed only by animation |
| Images | Appropriate alt text and stable sizing/aspect ratio |
| Structure | Clear heading/landmark hierarchy and keyboard-reachable primary actions |
| States | Loading, empty, error, partial/permission/disabled where the domain requires them |

## Reference files

Read these only on demand: `references/slop-tells.md`, `directions.md`, `color.md`, `typography.md`, `layout-space.md`, `states.md`, `motion.md`, `mobile.md`, `app-archetypes.md`, `reference-synthesis.md`, `component-retrieval.md`, `critique.md`, and `mockups.md`.

The target is not "looks impressive." The target is a coherent product surface whose structure, visual language, behavior, and evidence all agree — without spending half the context window proving it.
