---
description: Inspect or fix machine-generated-looking UI, prose, or code; one command owns both critique and repair so review does not duplicate the fix workflow
argument-hint: [file, URL, directory, or request such as "audit only"]
---

Target: $ARGUMENTS

Infer whether the user wants **review only** or **review + repair** from the request. Words like `audit`, `critique`, `review`, `diagnose`, or `what is wrong` mean review-only unless they also ask to fix/change. Do not edit in review-only mode.

Work out what kind of thing this is, then load only the matching skills. If the target spans multiple kinds, handle each separately.

## Rendered UI

Load `ui-design`, `design-craft`, `critique`, and `browser-qa`. Load `mobile-ui` for touch-first/native surfaces. Load `figma-handoff` only when Figma is part of the source of truth.

1. Run `audit_design` at the primary viewport with `design_md` when available, then `audit_responsive` if the surface/layout changed across widths.
2. Use Playwright MCP only for behavior the deterministic audit cannot prove: keyboard/focus, overlays, forms, route/state transitions, network/error paths, or a reported interaction bug.
3. Answer the judgement checks in the `critique` skill against the actual rendered result.
4. Report one ranked list: blockers, generated-looking decisions, quality defects, then judgement-only issues. Name what already works.
5. In review-only mode, stop here. Do not ask whether to fix; the user can invoke the same command with a fix request.
6. In repair mode, fix all blockers and majors in one coherent batch. Preserve the incumbent design during refinement; if the request is a redesign, replace it deliberately rather than half-polishing it.
7. Re-run the failed audit/behavior checks once after the batch. Do not enter an open-ended polish loop.

## Prose

Load `write-human`.

1. Diagnose substance, specificity, structure, cadence, vocabulary, and repeated AI signatures.
2. In review-only mode, report the smallest set of high-leverage issues with evidence.
3. In repair mode, fix substance before style, then specificity, structure, and vocabulary. Preserve factual meaning and voice.
4. Show the diff/changed passages rather than pretending every sentence needed replacement.

## Code

Load `code-clean`; load `code-smells` when diagnosis is the primary request.

1. Start with deletion and unnecessary abstraction: wrappers, single-use layers, duplicated defensive code, swallowed errors, boolean modes, stringly typed domain state, and accidental complexity.
2. Rank correctness/security/performance risk above aesthetic refactors.
3. In review-only mode, return `smell | evidence | consequence | smallest fix` and stop.
4. In repair mode, make the smallest coherent change that removes the smell. Do not add features or architecture to solve architecture bloat.
5. Run the project's authoritative tests/typecheck/build for the changed surface.

Always distinguish **found**, **fixed**, and **intentionally left alone**. Never claim browser/subagent evidence you did not actually collect.
