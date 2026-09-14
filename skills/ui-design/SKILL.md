---
name: ui-design
description: Use when building, redesigning, or reviewing any user interface — web pages, app screens, components, dashboards, landing pages, design systems, or mockups. Triggers on "build a UI", "make this look better", "design a page", "it looks like AI made it", "generic", "slop", requests for colour palettes, typography, layout, spacing, or design tokens, and on front-end work where appearance matters. Produces interfaces that read as designed rather than defaulted and verifies the result in a real browser.
---

# UI design that does not read as machine-default

Generated UI fails when the model reaches an undecided fork and fills it with the statistical average. Your job is not to make the average prettier. Your job is to make the decision.

## Route the task first

Load only the specialist skills that match the job:

- `design-research` + `design-synthesis` for a new surface or structural redesign.
- `design-craft` for visual variance, density, motion, micro-interaction and quality-floor decisions.
- `mobile-ui` for touch-first/native/mobile work.
- `figma-handoff` when a Figma file/frame/selection is source truth or the result must go back to Figma.
- `browser-qa` whenever runtime browser behavior matters.
- `critique` for judgement that deterministic rules cannot make.

Do not make every UI request load every skill.

## 1. Decide before components

For a new or meaningfully redesigned surface, call `design_plan` with the product, primary user task, audience, platform, and hard constraints. It returns:

- a craft profile: surface mode plus variance/motion/density dials;
- role-specific structural references;
- an interaction-pattern shortlist;
- Figma/Playwright evidence routing.

Use the output as a compact hypothesis. Commit the reference roles with `reference_contract` before implementation. Choose the smallest interaction pattern that fits the repeated task before browsing component libraries.

For a narrow refinement where the existing product already has clear structure, skip structural research and call `craft_profile` only if the craft direction is unclear.

## 2. Name one coherent direction

Before writing meaningful UI, be able to state:

- **surface mode** — persuade, operate, read, or experience;
- **primary loop** — what the user repeatedly does;
- **hierarchy** — what dominates the first viewport;
- **density** — sparse/editorial vs dense/operational;
- **type stance** — not merely a font name, but scale/weight/voice;
- **color strategy** — neutral ground + semantic/accent role;
- **edge language** — square/hairline/soft/physical/etc.;
- **motion budget** — which interactions deserve motion and which should be instant;
- **state model** — loading, empty, error, partial, disabled, long content, permissions;
- **icon family** — one family consistent with the project.

"Clean and modern" is not a direction.

## 3. Respect source truth

Use evidence in this order:

1. User brief and product requirements.
2. Existing production behavior.
3. Existing code components/tokens and `DESIGN.md`.
4. Figma variables/components/Code Connect when Figma is authoritative.
5. The explicit reference contract and selected interaction pattern.
6. External visual references.
7. Inferred craft preferences.

A reference does not outrank the product. A Figma frame does not erase runtime states. A generated component does not outrank an existing semantic primitive.

## 4. Build the token layer deliberately

When the project lacks an authoritative token system, call `design_system` with a seed that belongs to the chosen direction. Use the emitted semantic tokens rather than scattering literals.

Do not generate a new palette when the project or Figma already provides one. Do not import a second icon family because `icon_find` found a convenient glyph.

`component_find` is for missing implementation capabilities, not inspiration dumping. Existing project component -> existing primitive composed differently -> project design-system primitive -> registry component -> custom implementation.

Fetch full source for finalists only.

## 5. Craft details by frequency and purpose

Use `design-craft` for the full reasoning. The short version:

- Frequent expert actions should be instant or extremely restrained.
- Motion must explain state, space, feedback, or a rare moment.
- Avoid `transition: all`, gratuitous bounce, perpetual loops, and slow entrances.
- Press/focus/hover/disabled/loading states are part of component feel, not cleanup.
- Popovers should feel connected to their trigger; modal/dialog behavior should remain spatially coherent and keyboard-correct.
- Density follows the task. An operations console is not a landing page stacked into cards.
- Refinement preserves identity; redesign replaces the visual world deliberately.

## 6. Mobile is a different information problem

Do not squeeze desktop into 390px. Load `mobile-ui` and decide what the phone is for.

At minimum verify:

- back/navigation semantics;
- safe area and fixed chrome;
- keyboard-open forms;
- touch targets and one-handed repeated actions;
- long content and localization;
- offline/retry/interruption when relevant;
- larger phone/tablet/foldable behavior when the product will run there.

## 7. Verify with the correct browser tool

Load `browser-qa` for meaningful UI work.

Use `audit_design` / `audit_responsive` for compact deterministic evidence: rendered layout, type, color, spacing, overflow, contrast, targets, states, landmarks, motion rules and slop signatures.

Use Playwright MCP for behavior: navigation, keyboard/focus, overlays, forms, route transitions, loading/error/network states, browser permissions/storage, and reproducing interaction bugs.

Use screenshots only when the unresolved question is actually visual.

For meaningful edits, do one batched inspect/fix pass and at most one confirmation pass. Endless polishing is not craft.

## 8. Figma workflows

When Figma is involved, load `figma-handoff`.

- Pull the exact frame/node, not the whole file.
- Reuse variables, components and Code Connect mappings.
- Map to existing code components before generating replacements.
- Implement the states/responsiveness a static frame cannot show.
- Verify the runtime result with Playwright and rendered audits.
- When sending live UI back to Figma, capture meaningful states rather than only the prettiest default screen.

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

Use these on demand rather than loading all of them:

| File | Read it when |
|---|---|
| `references/slop-tells.md` | Diagnosing generated-looking UI |
| `references/directions.md` | Choosing a visual direction |
| `references/color.md` | Palette, OKLCH, contrast, dark mode |
| `references/typography.md` | Typeface, scale, measure, hierarchy |
| `references/layout-space.md` | Grid, rhythm, spacing, hierarchy |
| `references/states.md` | Interaction/data/form states |
| `references/motion.md` | Motion implementation details |
| `references/mobile.md` | Mobile-specific anti-slop and platform behavior |
| `references/app-archetypes.md` | Structural product archetypes |
| `references/reference-synthesis.md` | Multi-reference composition |
| `references/component-retrieval.md` | Token-efficient component/icon search |
| `references/critique.md` | Judgement checks after deterministic audit |
| `references/mockups.md` | Multiple genuinely divergent directions |

The target is not "looks impressive." The target is a coherent product surface whose structure, visual language, behavior, and evidence all agree.
