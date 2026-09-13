# Mobile app design that does not feel generated

Mobile is not a desktop layout squeezed to 390px. The constraints are different: reachability, transient keyboards, interrupted sessions, offline states, platform conventions, and much less room for decorative structure.

Use this reference when the target is iOS, Android, React Native, Flutter, Capacitor, or a touch-first PWA.

## Start with the task loop

Name the primary loop before choosing components:

- capture -> confirm -> review
- browse -> compare -> choose
- receive -> triage -> act
- create -> edit -> publish
- monitor -> inspect -> intervene

If the screen does not serve that loop, it is probably navigation, setup, or noise.

## Mobile slop tells

### Desktop-in-a-phone

- a sidebar simply becomes a hamburger with the same information architecture
- wide tables become horizontally scrollable instead of becoming task-oriented summaries
- every desktop card survives and stacks into a 12-card feed
- desktop modal dialogs are merely narrowed instead of becoming a sheet or full-screen flow
- hover-dependent affordances remain essential

Fix by re-ranking information for the mobile task. Mobile often needs a different composition, not a smaller one.

### Bottom-nav autopilot

Do not default to five tabs because five fit. Use bottom navigation for a small number of durable top-level destinations that users switch between frequently. Put infrequent destinations behind a profile/menu surface. Never use the tab bar as a dumping ground for every route.

Avoid:

- five equal tabs plus a floating action button because that is what generated apps do
- a centre tab styled as a giant glowing orb
- badges on every destination
- labels hidden until selected

### Card feed disease

Generated mobile apps turn every piece of information into a rounded card. This wastes width and destroys grouping.

Prefer lists, grouped rows, inset sections, edge-to-edge media, or plain typographic hierarchy when the content does not need an independent container.

### Giant rounded everything

Phone screens already have rounded hardware. Do not echo that radius on every panel, button, sheet, avatar, chip, input, and navigation surface. A mobile UI needs shape hierarchy just as much as desktop does.

### Fake-native chrome

Do not draw a fake status bar, home indicator, Dynamic Island, Android gesture bar, or device frame inside the product UI. Those belong to the OS or a presentation mockup, not the app.

### Sheet abuse

A bottom sheet is for transient context attached to the current task: filters, quick choices, lightweight details, confirmation. It is not a substitute for every page. If the flow has navigation, deep forms, or independent state, use a screen.

### Gesture-only actions

Swipe, long-press, and drag can accelerate common actions but must not be the only discoverable way to perform destructive or essential operations.

### Keyboard blindness

Forms that look fine in a static mockup often fail the moment the software keyboard appears. Verify:

- focused fields remain visible
- primary action does not disappear behind the keyboard
- scrolling reaches validation errors
- next/done behavior matches field order
- numeric/email/URL keyboards are selected intentionally

### Infinite onboarding

Generated apps love 4-7 glossy onboarding slides explaining obvious features. Delete them unless the user needs permissions, irreversible setup, domain education, or a choice that changes later behavior. Prefer learning at the moment of use.

### Empty state as poster

An empty operational screen does not need a giant illustration plus a paragraph. State what is empty, why if useful, and provide the next action. Reserve artwork for products where tone is itself part of the experience.

## Touch and reachability

Treat 44x44 CSS points/pixels as the practical touch target goal even when the formal accessibility minimum is lower. Give destructive or irreversible actions separation from common actions.

Put frequent actions where they are reachable without hand gymnastics. A top-right icon may be conventional, but a primary repeated action often belongs lower in the screen or in the content flow.

Do not place two tiny icon-only actions shoulder-to-shoulder when a list row, menu, or labeled action would be clearer.

## Navigation patterns

Choose from the information architecture, not trend memory:

- **bottom navigation**: 3-5 durable peer destinations, high switching frequency
- **top app bar + back stack**: hierarchical drill-down
- **navigation rail**: large-screen/tablet mode, not phone default
- **tabs/segmented control**: sibling views of the same object or task
- **drawer/menu**: secondary or infrequent destinations, not the primary daily loop
- **search-first**: when the object space is too large to browse hierarchically

Do not combine bottom nav, top tabs, a hamburger, and a floating action button unless each has a distinct information-architecture job.

## Forms

Mobile forms should be linear and interruption-tolerant.

- ask only for data needed now
- use platform keyboard/input modes
- preserve partially entered data across navigation or transient disconnects when loss would hurt
- put validation near the field; do not make users hunt for a summary at the top
- prefer explicit labels over placeholder-only forms
- split long forms by task boundary, not arbitrary "Step 1 of 4" theatre

## Offline, latency, and interruption

A mobile app can lose connectivity at any moment. Define what happens when:

- a request is in flight and the app backgrounds
- the same action is retried
- cached data is stale
- an optimistic write fails
- the user reopens after hours or days

Do not use a spinner as the entire state model. Distinguish loading, stale-but-usable, offline, retrying, failed, and synced where the domain requires it.

## Platform respect without cargo culting

Use platform conventions where users rely on muscle memory: back behavior, system share, date/time picking, permissions, text selection, keyboard semantics, destructive confirmations, safe areas. Custom styling is fine; custom behavior that surprises users is expensive.

Do not mechanically clone iOS on Android or Material on iOS. Shared product identity can sit above platform-correct behavior.

## Tablet and foldable mode

Do not simply stretch the phone column. Larger mobile surfaces should expose useful parallelism: list/detail, persistent secondary navigation, wider editing canvases, inspectors, or richer previews. Keep the phone task model, but spend the extra width on context rather than empty margins.

## Audit checklist

- [ ] The primary task loop is obvious within one screenful
- [ ] No desktop-only structure survived purely because it already existed
- [ ] Every important action has a comfortable touch target
- [ ] Navigation elements each have a distinct information-architecture role
- [ ] The keyboard cannot cover the active field or only submission path
- [ ] No essential action is gesture-only
- [ ] Empty, loading, offline, stale, error, and retry states are intentional where relevant
- [ ] Long lists and media are virtualized/lazy where scale requires it
- [ ] The app respects safe areas and platform back behavior
- [ ] Tablet/large-screen layouts use the space instead of stretching the phone UI
