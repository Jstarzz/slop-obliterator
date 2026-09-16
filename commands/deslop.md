---
description: Inspect or fix machine-generated-looking UI, prose, or code; one command owns critique and repair while loading only the specialist context the target actually needs
argument-hint: [file, URL, directory, or request such as "audit only"]
---

Target: $ARGUMENTS

Infer **review only** vs **review + repair**. `audit`, `critique`, `review`, `diagnose`, or `what is wrong` mean review-only unless the user also asks to fix/change. Do not edit in review-only mode.

Classify the target first, then load the minimum matching skill set. If it spans multiple kinds, handle each separately.

## Rendered UI

Load `ui-design` first. It is the router; do not pre-load the rest of the design stack.

Load additional skills only when the unresolved job requires them:

- `critique` when deterministic findings are insufficient and visual/product judgement is actually requested;
- `browser-qa` when runtime interaction/keyboard/forms/navigation behavior must be exercised;
- `design-craft` when repair requires a new/refined motion, density, or micro-interaction direction;
- `mobile-ui` for touch-first/native surfaces;
- `figma-handoff` only when Figma is source truth;
- `design-resource-router` only when choosing an external design/component/motion/3D source.

1. Run `audit_design` at the primary viewport with `design_md` when available; add `audit_responsive` only when width-dependent layout is in scope.
2. Use Playwright only for behavior the deterministic audit cannot prove.
3. Add the judgement pass only when it can change the conclusion.
4. Report blockers, generated-looking decisions, quality defects, then judgement-only issues. Name what already works.
5. In review-only mode, stop.
6. In repair mode, fix blockers/majors in one coherent batch. Preserve identity during refinement; replace it deliberately during a requested redesign.
7. Re-run only the failed audit/behavior checks once.

## Prose

Load `write-human` only.

1. Diagnose substance, specificity, structure, cadence, vocabulary, and repeated AI signatures.
2. In review-only mode, report the smallest high-leverage set with evidence.
3. In repair mode, fix substance before style, then specificity/structure/vocabulary while preserving meaning and voice.
4. Show changed passages rather than pretending every sentence needed replacement.

## Code

Load `code-clean`. Add `code-smells` only when diagnosis/risk discovery is the primary request.

1. Start with deletion and unnecessary abstraction: wrappers, single-use layers, duplicated defensive code, swallowed errors, boolean modes, stringly typed state, accidental complexity.
2. Rank correctness/security/performance risk above aesthetic refactors.
3. In review-only mode, return `smell | evidence | consequence | smallest fix` and stop.
4. In repair mode, make the smallest coherent change that removes the smell.
5. Run authoritative tests/typecheck/build for the changed surface.

Always distinguish **found**, **fixed**, and **intentionally left alone**. Never claim browser/subagent/Figma evidence you did not actually collect.
