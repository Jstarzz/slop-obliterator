---
name: design-synthesis
description: Use when designing a new interface from references, comparing multiple existing products, choosing between design examples, remixing patterns from several apps, or when the user asks to borrow ideas without copying. Turns 2-4 references into one coherent original structure while keeping context and component-search cost small.
---

# Synthesize references instead of cloning templates

A reference is evidence for a decision, not a template to reproduce.

When multiple references are available, do not choose one winner and do not average them. Give different references different jobs, extract a few decisions from each, resolve conflicts, then rebuild those decisions inside one design system.

Read `../ui-design/references/reference-synthesis.md` for the full workflow.

## Required workflow

1. State the user's primary task loop in one line.
2. Call `reference_find` with the product/domain plus the primary task. Keep 2-4 structurally plausible routes.
3. When several routes are plausible, call `reference_rank_axes` with the same task and target platform. Treat the 0-100 values as heuristic comparison scores, not probabilities. Use the per-axis leaders to decide which reference is strongest for domain fit, structure, interaction, component vocabulary, and mobile behavior.
4. Call `reference_expand` only for finalists. Do not expand the whole catalogue.
5. Inspect any external visual/product references the user supplied. They may influence visual language, density, or a specific interaction, but they do not automatically become the structural reference.
6. Extract at most three decisions from each reference. Assign each decision to one track: structure, interaction, density, visual language, mobile behavior, or domain convention.
7. Call `reference_contract` with 2-5 non-overlapping role assignments. It deliberately rejects duplicate roles and reference soup. Use the returned contract as the implementation boundary.
8. Add any project-specific visual-language/density decisions to that contract; those may come from user-supplied references rather than the structural catalogue.
9. Resolve contradictory reference choices explicitly; never blend them by accident.
10. Call `pattern_find` for the main repeated task before searching component libraries. Choose the smallest interaction pattern that fits the information shape — e.g. master-detail, exception queue, map+dock, table, timeline, wizard, or checklist. Use `pattern_expand` only for a finalist. This prevents jumping from a broad app archetype straight to arbitrary cards/components.
11. Search components only for capabilities the selected pattern still needs. Shortlist 3-5 summaries, fetch only 1-2 finalists, and normalize them into the project's tokens and icon family.
12. Build one coherent interface grammar. Imported components must not retain foreign radii, spacing, typography, colours, shadows, icon weights, or motion.
13. Verify the result does not reproduce one source's major-region order/proportions or distinctive surface treatment.
14. Run the normal `ui-design` / `mobile-ui` audits and critique pass.

## Good synthesis

`dispatch structure + operations-console exception handling + messaging chronology + field-work offline behavior`, rebuilt in the project's own tokens and task model. If the core operator loop is triage, that might resolve to an `exception-queue` pattern with a selected detail pane — not a dashboard of status cards.

Or visually: `Linear-like command density + Stripe-like form hierarchy + a map product's persistent spatial context`, where each borrowed idea has a specific job rather than the whole interface becoming a clone.

The result should not look like any one reference. It should behave as though someone understood why their decisions worked.

## Bad synthesis

- pick the highest overall score and clone it end-to-end
- copy reference A's shell, recolour it, then paste reference B's cards inside
- jump from an app archetype directly to a component library without deciding the interaction pattern
- mix three component libraries without normalizing them
- load 20 screenshots and let the model vaguely "take inspiration"
- copy branded illustrations, wording, icon motifs, or exact layout proportions
- use different references solely because their colours differ
- treat heuristic axis scores as objective quality ratings or probabilities
- assign two references the same role without deciding which one wins
- combine several patterns just because they all scored reasonably well

## Token rule

Reference research is a bounded phase. Query compact structural summaries first, axis-rank only the plausible set, expand 2-4 finalists, extract at most three decisions each, commit roles with `reference_contract`, shortlist interaction patterns, expand at most one or two, and fetch component source only for the selected 1-2 implementations. Stop researching once every synthesis-contract bullet and core interaction choice has evidence.
