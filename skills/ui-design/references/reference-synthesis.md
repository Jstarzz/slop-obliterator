# Reference synthesis: crossover without Frankenstein UI

Use this when a screen should learn from multiple good products instead of cloning one template.

The goal is not to average references. Averaging produces the same anonymous middle this plugin exists to kill. The goal is to **assign different references different jobs**, extract their decisions, then rebuild those decisions inside one coherent system.

## The four tracks

Choose at most one primary reference per track. A single product may fill more than one track when it is genuinely the best fit, but do not let one screenshot silently become the whole design.

| Track | What to extract | Examples of useful decisions |
|---|---|---|
| Structure | information architecture and page composition | split pane vs single stream, master/detail, persistent context, command surface, map-first, timeline-first |
| Interaction | task flow and state transitions | inline edit, bulk select, optimistic action, drill-down, sheet vs screen, keyboard shortcuts, undo, offline queue |
| Density | rhythm and information compression | row height, hierarchy, disclosure, table density, grouping, whitespace, mobile reachability |
| Visual language | typography, shape, colour behavior, icon treatment | serif/grotesk relationship, border strategy, radius family, muted surfaces, accent placement, icon weight |

A fifth optional track, **domain convention**, captures things users already expect in that product class: trading ticket placement, messaging composer behavior, map controls, medical chart chronology, dispatch status language, etc.

## The synthesis pass

1. **Name the problem, not the screen.** Write the user's primary loop in one line. Example: `dispatcher spots an exception -> identifies vehicle -> contacts crew -> records resolution`.
2. **Pick the closest app archetype** from `app-archetypes.md`. This is the structural prior, not the final layout.
3. **Collect 2-4 references.** Prefer references that solve different parts of the problem. Three near-identical SaaS dashboards are one reference wearing three logos.
4. **Extract decisions, not pixels.** For each reference, write no more than three decisions worth borrowing. Never carry over brand copy, proprietary assets, exact spacing values, or a whole composition.
5. **Assign tracks.** Give each useful decision a role: structure, interaction, density, visual language, or domain convention.
6. **Resolve conflicts before implementation.** If one reference is dense and another is spacious, choose which governs. If one uses persistent navigation and another task-local navigation, choose based on the user loop. Do not blend contradictions accidentally.
7. **Write a synthesis contract** in 5-8 bullets. This is the design's own identity. Example:
   - master/detail shell from reference A
   - command palette and keyboard-first actions inspired by reference B
   - compact 40px operational rows from reference C
   - visual language is ours: square-ish 6px radii, one amber status accent, neutral typography
   - no floating glass cards; no decorative metrics
8. **Search components by missing capability**, not by visual similarity. Query `command palette`, `virtualized data table`, `date range`, `bottom sheet`; do not query `modern dashboard card`.
9. **Normalize every imported component.** Replace foreign spacing, radii, colours, font assumptions, icon family, shadows, and motion with project tokens before composing it with anything else.
10. **Audit the whole composition.** A locally good component can create a globally incoherent screen.

## Reference matrix

Keep the matrix tiny enough to fit in working context:

```text
problem: dispatch exception handling
archetype: logistics / dispatch

A — map product
  structure: map dominates, details dock contextually
  borrow: persistent spatial context

B — incident console
  interaction: acknowledge -> assign -> resolve states
  borrow: explicit state transitions + action history

C — messaging client
  density: compact chronological thread
  borrow: dense event history with clear author/time hierarchy

our synthesis
  structure=A, interaction=B, history density=C
  visual language=project tokens, not A/B/C
```

Do not paste screenshots, DOM dumps, or full component source into the matrix.

## Divergence requirement

A synthesis is too close to a reference if any of these are true:

- the same major regions appear in the same order with the same proportions
- more than two distinctive visual traits come from one reference
- the hero/header/sidebar/table/card composition could be overlaid on the reference with minor changes
- copy, iconography, decorative motifs, or illustration style were carried over
- the implementation can be described as “reference X, but with our colours”

When this happens, change one structural decision and one visual-language decision before shipping.

## Avoid Frankenstein UI

Mixing sources is useful only if the final interface has one grammar.

Normalize these before combining components:

- spacing scale
- radius scale
- border/shadow policy
- typography hierarchy
- icon family and stroke/fill behavior
- focus treatment
- hover/pressed/disabled/loading states
- motion duration/easing
- surface elevation
- semantic colour tokens

If two components still look like they came from different sites after normalization, one of them is wrong for the design.

## Component-source policy

Use `component_find` as a retrieval engine, not a design oracle.

- Search one capability at a time.
- Ask for 3-5 summaries.
- Compare name/category/dependency/source before fetching code.
- Fetch at most 1-2 finalists.
- Prefer the project's existing shadcn primitives before adding another registry dependency.
- Registry components are raw material. Rebuild or adapt them into project primitives instead of nesting foreign mini-design-systems.
- Honor the project's configured icon library. `icon_find` may discover the semantic icon; the final implementation should stay in the project's family.

## Mobile synthesis

On mobile, references should usually be split differently:

- structure: navigation + task hierarchy
- interaction: sheets/screens/back behavior/keyboard behavior
- interruption model: offline, resume, drafts, notifications
- density: thumb reach, list compression, disclosure

Do not use a desktop reference merely because its colours look good. Carry visual language separately from interaction structure.

For Android-first work, prefer platform-consistent navigation, back behavior, touch targets, system bars/safe areas, text input, and permissions. Borrowing an iOS visual motif must not import iOS interaction semantics.

## Token budget

Reference research becomes useless if it consumes the context needed to implement the result.

Target budget for one screen:

- archetype: one relevant section
- references: 2-4, three extracted decisions each
- component search: 3-5 summaries per missing capability
- source fetch: 1-2 finalists only
- screenshots/images: only when visual evidence is necessary

Stop researching once every synthesis-contract bullet has evidence. More references after that usually add noise, not quality.
