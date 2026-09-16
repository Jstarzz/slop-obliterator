---
name: browser-qa
description: Use when UI correctness depends on real browser behavior: navigation, keyboard/focus, menus, dialogs, forms, loading/error states, responsive transitions, network behavior, or reproducing a visual bug. Chooses deliberately between slop-obliterator's compact deterministic audits and the optional Playwright companion instead of using screenshots or giant browser snapshots by reflex.
---

# Browser QA

Use the cheapest browser evidence that can prove the claim.

## Deterministic audit first

Use `audit_design` / `audit_responsive` for measurable facts: design/slop rules, contrast, type, spacing, overflow, targets, landmarks, focus style, form-state signals, motion rules, `DESIGN.md` drift, and breakpoint-specific defects.

This path measures inside the page and returns conclusions rather than a browser dump.

## Playwright is an optional behavior specialist

Enable `slop-visual-companions` only when you need to operate the product:

- multi-step navigation;
- menus/popovers/dialogs/drawers/tabs/comboboxes/forms;
- keyboard-only operation and focus movement;
- interaction-bug reproduction;
- loading/error/network-dependent states;
- history/back, route transitions, storage or permissions;
- verification that an action changes the page correctly.

The companion defaults to `--snapshot-mode=none --image-responses=omit --codegen=none`. That is intentional. Request a snapshot, screenshot, or generated test only when it answers the current question.

Keep browser state isolated unless the task explicitly requires an authenticated/persistent profile.

## Screenshots are evidence, not the interface

Take a screenshot only when the unresolved question is visual and computed measurements/behavior cannot settle it: composition, visual balance, pixel comparison, or a clipping/motion end-state issue.

Do not take ten screenshots to prove what one audit or one state transition already proves.

## Bounded loop

1. Run authoritative build/typecheck/tests.
2. Run `audit_design`; add `audit_responsive` when layout changed.
3. If behavior remains unproven, enable/use Playwright for the primary user path plus the risky state introduced by the change.
4. Collect one visual artifact only if judgement is still unresolved.
5. Fix one coherent batch.
6. Re-run failed checks once. Stop unless an acceptance claim still fails.

When Playwright is warranted, verify only relevant states: pointer/keyboard activation, focus/return, Escape/back/dismiss, disabled/loading submit, validation recovery, long content, mobile keyboard behavior, reduced motion, and stale/offline/retry where applicable.

For Figma implementations, `figma-handoff` owns design-file truth, Playwright owns runtime behavior, and deterministic audits own measurable rendered drift. Do not ask one source to impersonate the others.
