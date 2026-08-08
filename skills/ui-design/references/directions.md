# Aesthetic directions

Twelve worked-out starting points. Each is a complete position: palette seed, typography, layout logic, and the thing that makes it recognisable.

**How to use these.** Pick one, then push it further than feels comfortable. A half-committed direction reads as an accident; a fully committed one reads as a decision. Do not blend two — that lands you back at the average.

Feed the seed into `design_system`. The typefaces listed are all on Google Fonts unless noted.

---

## 1. Swiss pharmaceutical

Clinical, precise, expensive-looking.

- **Seed** `#c8102e` (a single hard red) · **Intensity** restrained
- **Type** Archivo or Inter Tight for everything, one face, weight extremes 300/800. Tabular figures.
- **Layout** Strict 12-column grid, enormous outer margins, generous top space, everything left-aligned to the grid. Zero radius.
- **Signature** Almost no colour. One red, used four times on the whole page, always for the same meaning.
- **Watch for** It fails if you soften it. No shadows, no gradients, no rounded corners at all.

## 2. Terminal / phosphor

Operational, dense, for people who read numbers.

- **Seed** `#00cc66` on near-black · **Intensity** vivid, dark-first
- **Type** JetBrains Mono or IBM Plex Mono throughout. 13–14px base. Tight leading, 1.4.
- **Layout** Information-dense tables, 4px spacing scale, no cards, hairline rules instead of borders. Zero radius.
- **Signature** Monospace everywhere, including body. Row-level hover, keyboard-first, visible shortcut hints.
- **Watch for** Contrast on dark; green on black clips easily. Let the auditor check it.

## 3. 1970s ski lodge

Warm, tactile, analogue.

- **Seed** `#c1440e` (burnt orange) · **Accent** `#6b7c3a` (avocado) · **Intensity** vivid
- **Type** Fraunces or Bricolage Grotesque for display, Work Sans for body. Chunky, high optical size.
- **Layout** Thick rules, stacked bands of colour, generous padding, radius 2px or 16px — nothing in between.
- **Signature** Warm brown/cream base instead of white. Texture: a subtle grain overlay at 3% opacity.
- **Watch for** Keep the palette to four colours or it turns into a craft fair.

## 4. Editorial broadsheet

Text-first, authoritative, for reading.

- **Seed** `#1a1a1a` with `#8b2635` accent · **Intensity** restrained
- **Type** Newsreader or Source Serif 4 for body at 19–20px, Archivo Black or Anton for headlines. Real serif body copy.
- **Layout** Asymmetric two-column with a wide measure and a narrow rail. Drop caps. Hairline rules. `65ch` hard cap.
- **Signature** Type does all the work. One accent colour, used only on links.
- **Watch for** Line height 1.65+ on serif body or it becomes unreadable.

## 5. Brutalist utility

Loud, structural, unpolished on purpose.

- **Seed** `#0000ee` (link blue, unironically) · **Intensity** vivid
- **Type** Space Mono or system default, deliberately. Underlined links.
- **Layout** Visible borders on everything, 2–3px black, no radius, no shadow. Content boxes that look like boxes.
- **Signature** Refuses polish. Hard edges, exposed structure, high contrast.
- **Watch for** Still needs focus rings and 4.5:1 contrast. Brutalist is not an accessibility exemption.

## 6. Japanese print

Quiet, asymmetric, huge negative space.

- **Seed** `#2b2b2b` with `#a8322d` seal-red accent · **Intensity** restrained
- **Type** Zen Kaku Gothic New or Noto Sans JP paired with Cormorant for display. Very light weights.
- **Layout** Off-centre compositions, one dominant element and a lot of nothing, vertical rhythm over horizontal.
- **Signature** 60% of the viewport is empty and that is the point.
- **Watch for** Requires real content discipline. Do not fill the space.

## 7. Financial terminal (light)

Dense, trustworthy, information-first.

- **Seed** `#0b3d5c` · **Accent** `#b45309` · **Intensity** balanced
- **Type** IBM Plex Sans with IBM Plex Mono for all numerals. Tabular figures everywhere.
- **Layout** Data tables with sticky headers, 4px scale, right-aligned numbers, hairline rules, radius 2–4px.
- **Signature** Numbers are monospace and aligned to the decimal. Colour only for delta direction.
- **Watch for** Never use red/green alone for up/down — add a glyph.

## 8. Sun-bleached / coastal

Warm, soft, unhurried.

- **Seed** `#d97706` · **Accent** `#0e7490` · **Intensity** balanced
- **Type** Cabinet Grotesk or General Sans for display, Inter Tight or Public Sans for body.
- **Layout** Large radius (16–24px), soft tonal backgrounds rather than white, wide gutters, images bleeding off-canvas.
- **Signature** Cream base (`oklch(0.97 0.012 80)`), never white. Sand, terracotta, sea.
- **Watch for** Contrast on cream is tighter than on white. Verify.

## 9. Blueprint / technical drawing

Precise, diagrammatic, engineering-flavoured.

- **Seed** `#1e3a8a` on a pale blue-grey ground · **Intensity** restrained
- **Type** IBM Plex Mono for labels and data, IBM Plex Sans for prose.
- **Layout** Visible 8px grid as a background pattern, dashed rules, measurement-style annotations, zero radius.
- **Signature** The grid is visible. Elements look positioned rather than placed.
- **Watch for** The grid pattern must sit under 4% opacity or it fights the content.

## 10. Nocturne

Dark, high-craft, jewel-toned.

- **Seed** `#0f766e` · **Accent** `#b45309` · **Intensity** vivid, dark-first
- **Type** Instrument Serif or Playfair Display for display, Geist or Inter Tight for UI.
- **Layout** Layered dark surfaces separated by elevation, not shadow. Thin 1px borders at low opacity. Radius 8–12px.
- **Signature** Dark surfaces carry a hue — never `#000` or `#111`. Accents glow because everything around them is desaturated.
- **Watch for** Reduce chroma on large dark surfaces; raise it only on small accents.

## 11. Municipal / civic

Plain, legible, accountable.

- **Seed** `#1d4ed8` · **Intensity** restrained
- **Type** Public Sans or Source Sans 3. Large base size, 18px minimum.
- **Layout** Single column, wide line spacing, big touch targets, obvious buttons, no decoration.
- **Signature** Deliberately boring, aggressively usable. Every affordance labelled in words.
- **Watch for** This is the right direction for anything with legal or health consequences. Do not prettify it.

## 12. Risograph / zine

Playful, limited-palette, printed.

- **Seed** `#ff5c39` · **Accent** `#0d7ec4` · **Intensity** vivid
- **Type** Redaction, Syne, or Chivo. Mixed weights, deliberate misalignment.
- **Layout** Two or three flat spot colours with visible overprint, halftone texture, off-register shadows, no gradients.
- **Signature** Looks printed on cheap paper. Colour overlap creates a third colour.
- **Watch for** Texture must be CSS or SVG, not an image request. Keep total palette to three inks plus paper.

---

## Choosing when the brief gives you nothing

Ask two questions:

1. **Does the user read this, or operate it?** Reading → editorial, Japanese print, ski lodge, coastal. Operating → terminal, financial, blueprint, Swiss.
2. **Does it need to feel safe, or memorable?** Safe → municipal, Swiss, financial. Memorable → brutalist, riso, nocturne, ski lodge.

Then commit. A confidently wrong direction is fixable in one pass. The average is not fixable at all, because there is nothing there to push against.

## Building your own

A direction needs four things:

1. **A referent** — a real object, place, era, or discipline. Not an adjective.
2. **A palette rule** — which colour dominates, which is scarce, what the ground is.
3. **A type position** — one or two faces, and what job each does.
4. **A structural rule** — the thing that stays true across every screen (zero radius, visible grid, off-centre composition, hairlines instead of borders).

Write those four lines before you write any CSS. Put them in a comment at the top of the stylesheet so the next edit does not erase them.
