---
description: Produce three genuinely different design directions, audited and ready to compare
argument-hint: [what to mock up]
---

Mock up: $ARGUMENTS

Load the `ui-design` skill and read `references/mockups.md` and `references/directions.md`.

Three directions that **disagree with each other** — different aesthetic, different layout logic, different density. Not one design in three palettes. If you can describe all three with the same sentence, start over.

For each:

1. Name the direction and the trade-off it makes.
2. Generate its tokens with `design_system` from a seed that belongs to that direction.
3. Build it as one self-contained HTML file in the working directory, `mockup-<letter>-<direction>.html`.
4. Use real, plausible content — real-looking names, numbers, dates. Include the awkward cases: the long name, the zero state, the wrapping row.
5. Run `audit_design` on it and fix anything it flags before showing me.

Then present three lines per option — the direction, what it optimises for and gives up, and the one decision I should react to. Ask me which structural decision I want, not which one I like.

Once I pick, throw the other two away and build properly. Do not merge them.
