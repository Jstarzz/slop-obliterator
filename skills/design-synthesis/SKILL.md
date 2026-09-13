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
7. Write a 5-8 bullet synthesis contract before implementation. It must say which reference contributes what and what remains original to this product.
8. Resolve contradictory reference choices explicitly; never blend them by accident.
9. Search components only for missing capabilities. Shortlist 3-5 summaries, fetch only 1-2 finalists, and normalize them into the project's tokens and icon family.
10. Build one coherent interface grammar. Imported components must not retain foreign radii, spacing, typography, colours, shadows, icon weights, or motion.
11. Verify the result does not reproduce one source's major-region order/proportions or distinctive surface treatment.
12. Run the normal `ui-design` / `mobile-ui` audits and critique pass.

## Good synthesis

`dispatch structure + operations-console exception handling + messaging chronology + field-work offline behavior`, rebuilt in the project's own tokens and task model.

Or visually: `Linear-like command density + Stripe-like form hierarchy + a map product's persistent spatial context`, where each borrowed idea has a specific job rather than the whole interface becoming a clone.

The result should not look like any one reference. It should behave as though someone understood why their decisions worked.

## Bad synthesis

- pick the highest overall score and clone it end-to-end
- copy reference A's shell, recolour it, then paste reference B's cards inside
- mix three component libraries without normalizing them
- load 20 screenshots and let the model vaguely "take inspiration"
- copy branded illustrations, wording, icon motifs, or exact layout proportions
- use different references solely because their colours differ
- treat heuristic axis scores as objective quality ratings or probabilities

## Token rule

Reference research is a bounded phase. Query compact structural summaries first, axis-rank only the plausible set, expand 2-4 finalists, extract at most three decisions each, and fetch component source only for the selected 1-2 implementations. Stop researching once every synthesis-contract bullet has evidence.
