# Colour

## Work in OKLCH

`oklch(L C H)` — perceptual lightness 0–1, chroma 0–~0.37, hue 0–360°.

The property that matters: **equal L means equal apparent brightness across every hue.** In HSL, `hsl(60 100% 50%)` (yellow) and `hsl(240 100% 50%)` (blue) claim the same lightness and differ by roughly 8:1 in perceived brightness. That is why HSL-generated palettes have shades that look wrong and nobody can say why.

Consequences you can use:

- Hold L constant, vary H → a set of colours that read as equally weighted.
- Change L by a fixed amount → a change the eye reads as the same size, in any hue.
- Compare two L values → a fast sanity check on contrast before computing anything.

CSS support is universal in current browsers. Emit `oklch()` directly; keep a hex fallback only if you must support something old.

## Never hand-pick hex values

Call `design_system`. It handles the parts that are easy to get subtly wrong:

- **Eased lightness.** Linear L ramps look bunched at the dark end. The generator eases so steps read evenly.
- **Chroma bell curve.** Near-white and near-black cannot hold saturation in sRGB. Forcing peak chroma at the ends produces mud.
- **Hue shift across the ramp.** Real pigment shifts hue as it lightens or darkens. A ramp holding one hue for eleven steps is the quiet mathematical tell.
- **Tinted neutrals.** Greys carry 0.005–0.012 chroma of the brand hue so surfaces belong to the same world as the accent.
- **Gamut clamping.** Every step is verified displayable in sRGB.
- **Contrast verification.** All 24 semantic pairs checked against WCAG AA before you see them.

## Structure of a palette

**One dominant.** The brand hue. Appears on the primary action, active states, and almost nothing else. Scarcity is what makes it read as important.

**One accent, 120–180° away.** For the second-most-important thing, and for focus rings. Close hues (under ~22°) read as a mistake rather than a pair.

**Tinted neutrals.** 90% of a real interface is neutral. Backgrounds, surfaces, borders, body text.

**Semantics.** Success ~148°, warning ~78°, danger ~26°. Same ramp treatment. Never the only signal — pair with an icon and a word, because roughly 1 in 12 men cannot separate red from green.

## The hues to avoid

258–310° is the indigo/violet/purple band. It is not an ugly range. It is the range every model reaches for because Tailwind UI shipped `bg-indigo-500` in 2019 and that choice propagated through tutorials into training data. `judge_color` flags it; `design_system` substitutes unless you pass `allow_slop_hue`.

If a brand genuinely is purple, override and say so. The guard exists to catch the unexamined case.

## Contrast

**WCAG 2.2, which is the legal floor:**

| Element | Ratio |
|---|---|
| Body text | 4.5:1 |
| Large text (≥24px, or ≥18.66px bold) | 3:1 |
| UI component boundaries, focus rings, icons carrying meaning | 3:1 |
| Decorative dividers | no requirement, but ≥1.3:1 to be perceptible |

**Where WCAG 2 lies.** The formula is known to be unreliable for light-on-dark and for mid-tone pairs — it will pass combinations that are genuinely hard to read and fail some that are fine. APCA (the WCAG 3 candidate) models this better, but its reference implementation ships under a restricted licence that cannot be vendored into an MIT tool, so this toolkit pairs the WCAG ratio with an **OKLCH lightness delta** instead.

Rule of thumb: **ΔL below 0.28 will read as the same value on many screens**, whatever the ratio says. `contrast_check` reports both and warns when they disagree.

**Fixing a failure.** Do not nudge hex values. `contrast_check` walks a ramp in the same hue and names the exact step that passes.

## Dark mode is a design, not an inversion

| | Light | Dark |
|---|---|---|
| Background | `neutral-50`, never pure white | `neutral-950`, never `#000` |
| Surface | `#fff` above the background | `neutral-900`, lighter than background |
| Elevation | Shadow | Lighter surface — shadows are invisible on dark |
| Large-surface chroma | Normal | **Reduce** — saturated darks look muddy and vibrate |
| Accent chroma | Normal | **Raise slightly** — accents need to punch through |
| Text | `neutral-900` | `neutral-50`, never pure white (causes halation) |
| Borders | Darker than surface | Lighter than surface |

`design_system` produces both and verifies both.

## Gradients

Not banned. The blue-to-purple one is. If you use a gradient:

- Interpolate in OKLCH so the midpoint does not go grey: `linear-gradient(in oklch, ...)`.
- Keep the hue travel under ~40°. Wide travel is what makes a gradient look like a screensaver.
- Prefer a tonal wash — same hue, different lightness — over a hue journey.
- Consider the alternatives that read as designed: a grain or noise overlay at 2–4%, a hard-edged geometric field, a single soft radial glow behind one focal element.

## Where to get a seed

The seed is the decision. Take it from something real:

- A material — oxidised copper, raw concrete, kraft paper, indigo dye, brass.
- A place — a specific coastline, a specific city at a specific hour.
- A discipline — surgical, cartographic, editorial, industrial safety.
- An object the user cares about — the product's physical packaging, the founder's photograph, the book on the shelf.

Then name it in a comment above the token block, so the next person to touch the file knows what they are working inside.

## Checklist

- [ ] Tokens came from `design_system`, not from typing hex values
- [ ] Components reference semantic tokens, never ramp steps or literals
- [ ] Primary hue is outside 258–310°, or the override is deliberate and stated
- [ ] Neutrals carry 0.005–0.012 chroma of the brand hue
- [ ] One dominant colour, used scarcely
- [ ] Accent is 120–180° from primary
- [ ] Every text pair clears 4.5:1 (3:1 large), verified not assumed
- [ ] Focus ring and control boundaries clear 3:1
- [ ] Dark mode is designed, not inverted
- [ ] Colour is never the only carrier of meaning
