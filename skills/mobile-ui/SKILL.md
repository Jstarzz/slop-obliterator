---
name: mobile-ui
description: Use when building, reviewing, or redesigning a mobile app or touch-first interface — iOS, Android, React Native, Flutter, Capacitor, PWA, phone/tablet screens, mobile navigation, forms, bottom sheets, offline flows, or responsive web that behaves like an app. Prevents desktop-shrunk-to-phone layouts and common generated mobile UI patterns.
---

# Mobile UI that behaves like a mobile product

Mobile is not a breakpoint. Treat it as a different operating environment: one hand, transient keyboard, interruptions, unreliable connectivity, safe areas, platform back behavior, and less room for decorative structure.

## Workflow

1. Name the primary task loop in one line: `receive -> triage -> act`, `capture -> confirm -> review`, etc.
2. Pick the closest product structure from `../ui-design/references/app-archetypes.md`. Load only that archetype, not the entire catalogue into working context.
3. Read `../ui-design/references/mobile.md` for mobile-specific constraints and slop tells.
4. Reuse the project's design tokens and existing components before searching for new ones.
5. If a component is missing, follow `../ui-design/references/component-retrieval.md`: shortlist first, fetch source only for the winner.
6. Build the phone layout from task priority, not by stacking every desktop card.
7. Verify phone portrait, keyboard-open forms, long content, offline/error states, and at least one larger mobile/tablet width where relevant.

## Non-negotiables

- comfortable touch targets; aim for ~44x44 for touch surfaces
- safe-area aware top/bottom chrome
- system/platform back behavior works
- no essential hover or gesture-only action
- keyboard cannot cover the focused field or only submit action
- forms use appropriate input modes and preserve expensive work when interruption is likely
- bottom navigation is for a small number of durable peer destinations, not every route
- bottom sheets are transient context, not a replacement for all screens
- tables become task-oriented mobile views rather than blind horizontal-scroll dumps when possible
- loading, stale, offline, retrying, failed, and synced are distinct when the domain needs them
- tablet/foldable modes use extra width for context or parallelism instead of stretching a phone column

## Mobile slop to delete first

- five-tab bottom nav by reflex
- giant glowing centre action in the tab bar
- every row inside a rounded card
- fake device status bars / home indicators inside product UI
- desktop modal simply narrowed to 360px
- onboarding carousel explaining obvious features
- decorative empty-state illustration where one sentence + action would do
- top-right icon-only primary action used repeatedly all day
- nested tabs + bottom nav + hamburger + FAB with overlapping responsibilities
- desktop sidebar content shoved wholesale into a drawer

## Reference selection

Do not invent a generic mobile layout from memory. Use the nearest archetype as a structural prior, then adapt it to the user's task. A dispatcher, field-worker app, messaging client, healthcare chart, shopping app, and mobile admin tool should not converge on the same card feed.

For visual direction, token generation, typography, motion, and rendered audits, also load the `ui-design` skill.
