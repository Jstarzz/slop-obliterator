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
2. Pick one closest product structure from `../ui-design/references/app-archetypes.md`.
3. Inspect 2-4 meaningfully different references.
4. Extract at most three decisions from each. Assign each decision to one track: structure, interaction, density, visual language, or domain convention.
5. Write a 5-8 bullet synthesis contract before implementation. It must say which reference contributes what and what remains original to this product.
6. Resolve contradictory reference choices explicitly; never blend them by accident.
7. Search components only for missing capabilities. Shortlist 3-5 summaries, fetch only 1-2 finalists, and normalize them into the project's tokens and icon family.
8. Build one coherent interface grammar. Imported components must not retain foreign radii, spacing, typography, colours, shadows, icon weights, or motion.
9. Verify the result does not reproduce one source's major-region order/proportions or distinctive surface treatment.
10. Run the normal `ui-design` / `mobile-ui` audits and critique pass.

## Good synthesis

`Linear-like command density + Stripe-like form hierarchy + a map product's persistent spatial context`, rebuilt in the project's own tokens and task model.

The result should not look like any of those products. It should behave as though someone understood why their decisions worked.

## Bad synthesis

- copy reference A's shell, recolour it, then paste reference B's cards inside
- mix three component libraries without normalizing them
- load 20 screenshots and let the model vaguely "take inspiration"
- copy branded illustrations, wording, icon motifs, or exact layout proportions
- use different references solely because their colours differ

## Token rule

Reference research is a bounded phase. Load the nearest archetype, 2-4 references with three decisions each, and only the component summaries needed to fill capability gaps. Stop researching once every synthesis-contract bullet has evidence.
