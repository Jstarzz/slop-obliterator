# Typography

Typography is the fastest signal of quality and the fastest tell of a missing decision. It is also the cheapest thing to fix.

## The banned list

Not because they are bad. Because their unprompted presence proves nothing was chosen.

**Tier 1 — never without a stated reason:** Inter, Roboto, Open Sans, Lato, Arial, Helvetica, `system-ui`, Segoe UI.

**Tier 2 — the second wave, now equally worn:** Poppins, Montserrat, Nunito Sans, Raleway.

**Tier 3 — what models pick when told to avoid tier 1:** Space Grotesk, DM Sans, Plus Jakarta Sans. Already the new default.

The exception that matters: **`system-ui` is correct** for interfaces that should feel native to the OS, and for anything where a webfont's loading cost is a real problem. State that reason if you use it.

## Faces worth reaching for

All on Google Fonts unless noted.

**Display / headline**
Fraunces (variable, wonky axis) · Instrument Serif · Playfair Display · Bricolage Grotesque · Anton · Archivo Black · Syne · Redaction · Cormorant · Big Shoulders Display

**Body serif**
Newsreader · Source Serif 4 · Crimson Pro · Literata · Spectral · EB Garamond

**Grotesque / UI**
Archivo · Public Sans · Work Sans · Inter Tight · General Sans (Fontshare) · Cabinet Grotesk (Fontshare) · Geist · Figtree

**Monospace**
JetBrains Mono · IBM Plex Mono · Space Mono · Geist Mono · Martian Mono

**Full families with real range** — a good default when you want one decision to cover everything
IBM Plex (Sans, Serif, Mono, Condensed) · Source (Sans 3, Serif 4, Code Pro) · Recursive (one variable font spanning sans, mono, and casual)

## Pairing

The principle: **pair on contrast of skeleton, not on similarity.** Two faces that look alike read as a mistake. Two faces that are obviously different read as a decision.

Combinations that work:

- Display serif + grotesque — Fraunces / Public Sans
- Grotesque + mono — Archivo / JetBrains Mono (mono for data, labels, metadata)
- Serif body + geometric sans UI — Newsreader / Archivo
- One variable family across extreme weights — Recursive 300 vs Recursive 900

Combinations that fail:

- Two grotesques (Inter + Work Sans) — reads as a font-loading bug
- Two display faces — they fight
- Three or more faces — unless one is strictly mono for data

## Scale

Pick a ratio and hold it. 1.25 (major third) for dense interfaces, 1.333 (perfect fourth) for editorial, 1.5 for maximum drama.

A 1.25 scale from a 16px base:

```css
--text-xs:   0.64rem;   /* 10.2px — legal, metadata */
--text-sm:   0.8rem;    /* 12.8px — labels, captions */
--text-base: 1rem;      /* 16px   — body */
--text-lg:   1.25rem;   /* 20px   — lede */
--text-xl:   1.563rem;  /* 25px   — h3 */
--text-2xl:  1.953rem;  /* 31px   — h2 */
--text-3xl:  2.441rem;  /* 39px   — h1 */
--text-4xl:  3.052rem;  /* 49px   — display */
--text-5xl:  3.815rem;  /* 61px   — hero */
```

**Range matters more than ratio.** Largest ÷ smallest should be at least 3×, ideally 4–6×. Under 3× and the page reads flat no matter what else you do.

Fluid type, when the design genuinely needs it:

```css
--text-display: clamp(2.5rem, 1.5rem + 4vw, 5rem);
```

Use `clamp` sparingly — one or two display sizes. Fluid-scaling the whole system makes vertical rhythm impossible to control.

## Weight

Use the extremes. **300 against 800** reads as a decision. **400 against 600** reads as an accident.

With a variable font you get the whole axis for one download, so there is no cost reason to stay in the middle.

Weight carries hierarchy better than size at small sizes. A 14px 700 label beats a 16px 400 one.

## Measure and leading

| | Value |
|---|---|
| Prose measure | 45–75 characters; cap containers at `max-width: 65ch` |
| Body leading | 1.5–1.7 |
| Display leading | 1.0–1.2 |
| UI label leading | 1.3–1.4 |
| Paragraph spacing | 0.75–1× the line height, never both margin and `<br>` |

Longer measure needs more leading. A 75ch line at 1.4 is punishing; the same line at 1.65 is fine.

## Letter-spacing

- Display sizes ≥40px: tighten to `-0.02em` to `-0.03em`. Large type looks loose at default tracking.
- Body: leave alone. The designer already spaced it.
- All-caps labels: open to `0.08em`–`0.12em`. Caps at default tracking are unreadable.
- Never letter-space lowercase body text.

## Numbers

- Tabular figures for anything in a column: `font-variant-numeric: tabular-nums`.
- Monospace for financial and technical data — alignment is information.
- Right-align numeric table columns. Align to the decimal.
- Slashed or dotted zero in monospace contexts where `0`/`O` confusion costs something.

## Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Public+Sans:wght@300..800&display=swap" rel="stylesheet">
```

- `display=swap` — text is readable during load.
- Request only the axes and ranges you use; variable-font ranges (`300..900`) are one file.
- Set a metric-compatible fallback so the swap does not shift layout:

```css
@font-face {
  font-family: "Public Sans Fallback";
  src: local("Arial");
  size-adjust: 96%;
  ascent-override: 92%;
  descent-override: 24%;
}
body { font-family: "Public Sans", "Public Sans Fallback", sans-serif; }
```

- Self-host for anything where the third-party request is a privacy or performance problem.

## Checklist

- [ ] Primary face is not on the banned list, or the reason is stated
- [ ] Two faces with genuinely different skeletons
- [ ] Weight range spans at least 400 points
- [ ] Size range spans at least 3×
- [ ] 6–8 scale steps, referenced as tokens, no arbitrary sizes
- [ ] Prose capped at 65ch
- [ ] Body leading 1.5–1.7; display leading 1.0–1.2
- [ ] Display sizes tracked in; all-caps tracked out
- [ ] Tabular figures wherever numbers align
- [ ] `display=swap` plus a metric-matched fallback
