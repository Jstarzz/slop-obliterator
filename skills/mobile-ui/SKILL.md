---
name: mobile-ui
description: Use when building, reviewing, or redesigning a mobile app or touch-first interface — iOS, Android, React Native, Flutter, Capacitor, PWA, phone/tablet screens, mobile navigation, forms, bottom sheets, offline flows, or responsive web that behaves like an app. Prevents desktop-shrunk-to-phone layouts and common generated mobile UI patterns.
---

# Mobile UI that behaves like a mobile product

Mobile is not a breakpoint. Treat it as a different operating environment: one hand, transient keyboard, interruptions, unreliable connectivity, safe areas, platform back behavior, and less room for decorative structure.

## Workflow

1. Name the primary task loop in one line: `receive -> triage -> act`, `capture -> confirm -> review`, etc.
2. Pick the closest product structure from `../ui-design/references/app-archetypes.md`. Load only that archetype, not the entire catalogue into working context.
3. When references exist, use the `design-synthesis` skill: inspect 2-4 meaningfully different products and assign them separate jobs (navigation/structure, interaction, density, interruption model, visual language) instead of copying one app end-to-end.
4. Read `../ui-design/references/mobile.md` for mobile-specific constraints and slop tells.
5. Reuse the project's design tokens and existing components before searching for new ones.
6. If a component is missing, follow `../ui-design/references/component-retrieval.md`: shortlist first, fetch source only for the winner.
7. Build the phone layout from task priority, not by stacking every desktop card.
8. Verify phone portrait, keyboard-open forms, long content, offline/error states, and at least one larger mobile/tablet width where relevant.

## Multi-reference mobile synthesis

References should contribute **decisions**, not whole screens. A useful split is:

- reference A: navigation and primary task hierarchy
- reference B: interaction/state transitions
- reference C: list/detail density or information disclosure
- optional reference D: visual language only

Normalize the result into one project grammar: one spacing scale, one radius system, one icon family, one motion language, one set of states. Never ship a screen where the header looks like one app, the cards another, and the bottom sheet a third.

For Android-first products, Android behavior wins even if an iOS reference looks better. Keep system back semantics, safe/system bars, keyboard behavior, permissions, touch expectations, and platform navigation coherent. Borrow visual ideas separately from interaction semantics.

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

For visual direction, token generation, typography, motion, and rendered audits, also load the `ui-design` skill. For multi-reference work, load `design-synthesis` before implementation.
