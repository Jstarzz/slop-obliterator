# Mockups

Use this when the user wants to *see options*, not receive an implementation.

## The failure to avoid

Asked for "three variations," a model returns the same layout in three palettes. That is one design shown three times, and it wastes the entire point of the exercise — which is to make the user react to something they had not considered.

**Three mockups means three different structural decisions.** Different aesthetic direction, different layout logic, different density. If you can describe all three with the same sentence, start over.

## Process

### 1. Pick three directions that disagree

From `references/directions.md`, choose three that sit far apart. For a SaaS dashboard, for example:

- **A — Financial terminal.** Dense, tabular, mono numerals, hairlines, radius 2px. Optimised for someone who lives in it.
- **B — Editorial.** Spacious, serif body, one big number per card, generous white space. Optimised for a weekly glance.
- **C — Nocturne.** Dark, layered surfaces, jewel accent, chart-led. Optimised for a wall display.

State the trade-off each one makes. That is what the user is actually choosing between.

### 2. Build each as one self-contained HTML file

- Everything inline: `<style>` in the head, no build step, no external CSS.
- Tailwind via CDN only if the design needs it; otherwise plain CSS with custom properties is smaller and clearer.
- Fonts from Google Fonts with `display=swap`.
- Icons inline from `icon_find` — do not link an icon CDN.
- **Real content.** Plausible names, plausible numbers, plausible dates. Lorem ipsum hides every layout problem that matters, and "Feature One" tells the user nothing about whether the design works.
- Include the awkward cases: the long name, the zero state, the negative number, the row that wraps.

Name them `mockup-a-<direction>.html` and so on, in the working directory.

### 3. Audit each one before showing it

```
audit_design(file: "/abs/path/mockup-a-terminal.html", viewport: "desktop")
```

A mockup with a contrast blocker or an invisible focus ring is not a design option, it is a bug. Fix before presenting.

### 4. Present the trade-off, not the pixels

For each, three lines:

- **The direction** in one sentence.
- **What it optimises for**, and what it gives up.
- **The one thing to look at** — the decision the user should actually react to.

Then ask which structural decision they want, not which one they like. "Do you want density or breathing room?" gets a more useful answer than "which do you prefer?"

### 5. Converge

Once a direction is chosen, throw the other two away and build properly against the chosen one. Do not merge — merging three directions produces the average, which is where this started.

## Fidelity

Match fidelity to the question being asked.

| Question | Fidelity |
|---|---|
| "What should this feel like?" | Full visual, real type and colour, fake but plausible data |
| "Does this flow make sense?" | Greyscale wireframe, one type size, boxes and labels |
| "Will this fit?" | Real content at real volume, worst case first |
| "Which of these two?" | Build only the region that differs |

Do not build a full-colour hero when the question is about navigation. It moves the conversation to the wrong thing.

## Multi-screen flows

When mocking a flow rather than a page, put every screen in one HTML file separated by labelled sections, so the user scrolls through the whole sequence in one view. Annotate the transitions in plain text between screens.

Design the unhappy path in the flow, not just the happy one. That is usually where the real design question is hiding.
