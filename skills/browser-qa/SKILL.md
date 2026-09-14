---
name: browser-qa
description: Use when UI correctness depends on real browser behavior: navigation, keyboard/focus, menus, dialogs, forms, loading/error states, responsive transitions, network behavior, or reproducing a visual bug. Chooses deliberately between slop-obliterator's compact deterministic audits and the bundled Playwright MCP instead of using screenshots or giant browser snapshots by reflex.
---

# Browser QA

There are two browser tools in this plugin and they have different jobs.

## Use slop-obliterator's browser audit for measurements

Use `audit_design` / `audit_responsive` when you need to know:

- whether measurable design/slop rules fail;
- contrast, type, spacing, overflow, tap targets, landmarks, focus style, form-state and motion-rule signals;
- whether the page drifts from `DESIGN.md`;
- whether the same defect appears across breakpoints.

This path measures inside the page and returns only conclusions. Prefer it when a few hundred tokens can answer the question.

## Use Playwright MCP for behavior

Use the bundled Playwright MCP when you need to:

- navigate through a real multi-step flow;
- operate menus, popovers, dialogs, drawers, tabs, comboboxes or forms;
- verify keyboard-only operation and focus movement;
- reproduce an interaction bug;
- inspect loading/error/network-dependent states;
- test history/back behavior, route transitions, browser storage, permissions or viewport-specific state;
- verify that an action changes the page the way the user expects.

Prefer accessibility snapshots and targeted interactions over full DOM dumps. Keep the browser state isolated unless the task explicitly requires an authenticated/persistent profile.

## Screenshots are evidence, not the default interface

Take a screenshot when the question is visual and cannot be resolved by computed measurements or the accessibility tree:

- hierarchy feels wrong despite valid structure;
- alignment/composition looks unbalanced;
- a reference needs pixel-level comparison;
- a motion end-state or clipping bug needs visual confirmation.

Do not take ten screenshots to prove what one audit or one state transition already proves.

## Bounded QA loop

For a meaningful UI change:

1. Run the authoritative build/typecheck/tests first.
2. Run `audit_design` at the primary viewport and `audit_responsive` when layout changed.
3. Use Playwright MCP for **the primary user path plus the risky state introduced by the change**.
4. Collect one screenshot only if visual judgement is still unresolved.
5. Fix the batch of defects.
6. Re-run the failed checks once. Do not polish forever.

## Interaction checklist

When Playwright is warranted, verify the states relevant to the change rather than a generic tour:

- pointer and keyboard activation;
- initial focus and focus return after overlays;
- Escape/back/dismiss behavior;
- disabled/loading submit behavior;
- validation/error recovery;
- long labels/content wrapping;
- mobile viewport + keyboard where forms are involved;
- reduced motion if animation behavior changed;
- stale/offline/retry state when the feature can lose connectivity.

## Figma comparison

If the task is implementing a Figma frame, use the `figma-handoff` skill first. Figma provides intended design context; Playwright proves runtime behavior; rendered audits catch measurable drift. Do not ask any one of them to impersonate the other two.
