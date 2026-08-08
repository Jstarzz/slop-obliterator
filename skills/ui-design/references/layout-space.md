# Layout, space, and page flow

## Space is the primary tool

Most of what reads as "designed" is spacing. Before adding a border, a background, or a card, try adding space. Proximity groups things more convincingly than a box does, and costs nothing visually.

The rule that does the most work: **space between groups must be larger than space within a group.** If a label sits 8px from its input, the next field starts 24px down — not 12px. Generated layouts routinely get this backwards, which is why they feel like a list of unrelated things.

## The scale

One scale, 4px base, ~8 steps, exposed as tokens. Every padding, margin, and gap comes from it.

```css
--space-1: 0.25rem;  /*  4px — icon to label */
--space-2: 0.5rem;   /*  8px — inside a control */
--space-3: 1rem;     /* 16px — between related items */
--space-4: 1.5rem;   /* 24px — card padding, between groups */
--space-5: 2rem;     /* 32px — between subsections */
--space-6: 3rem;     /* 48px — between sections */
--space-7: 5rem;     /* 80px — between major page regions */
--space-8: 8rem;     /* 128px — page top/bottom on desktop */
```

Dense/operational products compress this (base 4px, top out at 48px). Editorial products stretch it (base 8px, top out at 200px). Pick one at the start — it is the density decision, and it propagates everywhere.

`padding: 13px` is always a mistake. The auditor catches it as `space.off-grid`.

## Grid

12 columns is a convention, not a requirement. What matters is that elements align to *something* shared.

```css
.container { width: min(100% - 2 * var(--space-4), 1200px); margin-inline: auto; }
```

Max widths worth knowing:

- **Prose**: 65ch. Non-negotiable.
- **Marketing pages**: 1100–1280px. Wider and the eye loses the left edge.
- **Dashboards**: full width, but constrain individual reading regions.
- **Forms**: 400–560px single column. Multi-column forms increase errors.

Modern CSS that removes most media queries:

```css
/* Cards that wrap on their own, no breakpoints */
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr)); gap: var(--space-4); }

/* A sidebar that collapses when the main region gets too narrow */
.with-sidebar { display: flex; flex-wrap: wrap; gap: var(--space-6); }
.with-sidebar > .main { flex: 1 1 30rem; }
.with-sidebar > .rail { flex: 0 1 18rem; }

/* Component-level responsiveness */
.card { container-type: inline-size; }
@container (min-width: 30rem) { .card { grid-template-columns: auto 1fr; } }
```

## Breaking the three-card reflex

The three-equal-cards row is the most recognisable generated layout there is. It exists because Tailwind's docs demonstrated `grid-cols-3`.

Alternatives that carry the same content:

1. **Weighted grid** — one item spans two columns, two sit beside it. The layout now says which matters.
2. **Stagger** — `nth-child(even) { margin-block-start: var(--space-6); }`. Two lines of CSS, completely different read.
3. **Editorial list** — full-width rows, image alternating left/right, generous vertical space. Better for anything with more than a sentence per item.
4. **Let content set the count** — four things? Show four. Two? Show two, larger.
5. **Vary internal composition** — if it genuinely must be three equal columns, make one contain a number, one a quote, one a diagram.

## Rhythm down the page

A page is a sequence, not a stack. If every section is the same height with the same padding and the same alignment, the reader's eye has nothing to hold onto.

Vary deliberately:

- **Height** — a tall opening, a short punctuating band, a long body region.
- **Alignment** — centre the hero if you like, then left-align everything below it.
- **Ground** — alternate background tone every second or third section, not every one.
- **Density** — a dense region reads as substantial when the region before it was sparse.
- **Width** — full-bleed image against a 65ch text column is a strong, cheap contrast.

A useful test: squint at the page, or shrink it to 25%. You should still see a shape. If it is an undifferentiated grey stripe, there is no rhythm.

## Visual hierarchy

Rank every element on screen 1 / 2 / 3 before styling. Then:

- **One element is rank 1.** Exactly one. If two things compete, neither wins.
- Hierarchy comes from **size, weight, colour, space, and position** — in that order of strength. Reach for space before you reach for colour.
- Rank 3 elements should be actively quiet: smaller, lower contrast (still ≥4.5:1), less space around them.

## Alignment

- Everything aligns to something. Optical alignment beats mathematical alignment where they differ — icons and round shapes usually need a half-pixel nudge.
- Left-align text the user reads. Centring removes the vertical edge the eye tracks down.
- Right-align numbers in columns.
- Do not centre-align multi-line body copy. Ever.

## Elevation

Build a scale; do not scatter shadows.

```css
--elev-0: none;                                            /* flat — most surfaces */
--elev-1: 0 1px 2px oklch(0.2 0.02 60 / 0.06),
          0 1px 1px oklch(0.2 0.02 60 / 0.04);             /* resting card */
--elev-2: 0 4px 12px oklch(0.2 0.02 60 / 0.08),
          0 1px 3px oklch(0.2 0.02 60 / 0.06);             /* dropdown, popover */
--elev-3: 0 16px 40px oklch(0.2 0.02 60 / 0.12);           /* modal */
```

Two details that separate this from the default: the shadow is **tinted with the background hue** rather than pure black, and it is a **two-layer** shadow (a tight contact shadow plus a wide ambient one), which is how real shadows behave.

In dark mode, shadows are invisible. Separate layers with **lighter surfaces** instead.

## Radius

Scale it with element size. A 4px checkbox and a 24px panel should not share a corner.

```css
--radius-sm: 4px;   /* inputs, checkboxes, chips */
--radius-md: 8px;   /* buttons, small cards */
--radius-lg: 16px;  /* panels, modals */
--radius-full: 999px; /* avatars, pills */
```

For nested corners, the inner radius should be `outer − padding`, otherwise the corners look wrong even though the numbers are consistent.

Committing to `0` everywhere is a valid and strong choice. Committing to one mid-value everywhere is the default.

## Responsive

Design mobile-first, but design the *content order* first — what does someone see in the first 100vh on a 390px screen?

Breakpoints worth checking: 320, 390, 768, 1280, 1440. `audit_responsive` runs all of them and separates breakpoint-specific problems from problems baked into the design.

Common failures it catches:

- Horizontal overflow from a fixed width or an unwrapped flex row
- Tap targets that were fine on desktop and are 18px on mobile
- Text that hits 100+ characters on a wide screen because nothing capped it
- Grids that stay multi-column past the point of legibility

## Checklist

- [ ] Space between groups exceeds space within groups
- [ ] All spacing from one 4px-based token scale
- [ ] Prose capped at 65ch
- [ ] Layout does not contain three equal cards in a row with icons
- [ ] Exactly one rank-1 element per screen
- [ ] Section rhythm varies in height, alignment, or ground
- [ ] Elevation is a scale, tinted, two-layer; dark mode uses lighter surfaces instead
- [ ] Radius scales with element size
- [ ] No horizontal overflow at 320px
- [ ] Squint test: the page still has a shape
