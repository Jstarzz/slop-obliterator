# The catalogue of tells

Every entry names a default a model reaches for when no decision was made. Presence of one is noise. Three or four together in the same view is the fingerprint.

The auditor (`audit_design`) detects the measurable ones automatically; its finding ids are given in brackets. The rest need your eyes.

---

## Colour

**Indigo/violet accent** `[color.slop-hue]`
Hue 258–310° in OKLCH. Traces to `bg-indigo-500` in Tailwind UI's 2019 examples, which saturated tutorials, which saturated training data. Tailwind's creator publicly apologised for it. The specific hexes — `#6366f1`, `#8b5cf6`, `#a855f7`, `#4f46e5` — function as a signature `[color.signature-hex]`.

**Blue-to-purple gradient** `[color.slop-gradient]`
`linear-gradient(135deg, #667eea, #764ba2)` and its relatives. The loudest single tell in 2026. If a surface needs depth, use a low-chroma tonal wash in the brand hue, a grain or noise layer, or a hard-edged geometric field.

**Timid palette** `[color.timid]`
Nothing on the page exceeds ~0.075 chroma. Everything is a pastel of equal weight, so nothing leads. Commit to one dominant colour at real saturation and let the rest recede.

**Hue sprawl** `[color.hue-sprawl]`
Six unrelated hue families because each component picked its own. One brand hue, one accent 120–180° away, semantics for success/warning/danger, tinted neutrals for everything else.

**Untinted greys** `[color.flat-neutrals]`
Pure `#808080`-family greys at zero chroma. Real systems tint neutrals toward the brand hue at 0.005–0.012 chroma so surfaces feel like they belong to the same world as the accent.

**Dark mode by inversion**
Light theme with the lightness flipped. Real dark mode reduces chroma on large surfaces, raises it on accents, uses elevation rather than shadow to separate layers, and never uses pure black or pure white.

---

## Typography

**Inter, Roboto, Open Sans, Lato, system-ui** `[type.default-family]`
All fine typefaces. Their unprompted presence is evidence that no typography decision was made. Same applies to the second wave — Poppins, Montserrat, Nunito Sans — and to Space Grotesk, which models now converge on when told to avoid Inter.

**One face doing everything** `[type.no-pairing]`
Hierarchy carried by size alone. Two faces with different skeletons — a display serif over a grotesque, a grotesque over a mono — make hierarchy legible before a word is read.

**Compressed scale** `[type.weak-size-contrast]`
Largest text under 3× the smallest. Real editorial hierarchy runs 4–6×. Timid scale jumps are the main reason generated pages read flat.

**Weight range 400–600** `[type.weak-weight-contrast]`
Use the extremes. 300 against 800 reads as intentional; 400 against 600 reads as an accident.

**Full-bleed body copy** `[type.measure-too-wide]`
Prose running the full container width. Cap at `65ch`. Comfortable measure is 45–75 characters.

**Cramped leading** `[type.tight-leading]`
Body copy under 1.4. Wants 1.5–1.7. Tight leading belongs on display sizes only.

**Fifteen font sizes** `[type.off-scale]`
Sizes chosen per element rather than from a scale. Collapse to 6–8 steps on a 1.25 or 1.333 ratio.

---

## Layout

**Three equal cards with icons** `[layout.three-card-row]`
The single most recognisable generated layout. It exists because Tailwind's docs used a three-column grid to demonstrate `grid-cols-3`. Break it: give the strongest item more room, stagger the rhythm, or let the content decide the count.

**Everything centred** `[layout.centered-everything]`
Centre a hero if you must. Left-align everything the reader has to actually read — centring removes the vertical edge the eye tracks down the page.

**One border-radius everywhere** `[layout.uniform-radius]`
A 4px control and a 24px panel should not share a corner radius. Scale radius with element size, or commit the other way and go fully square.

**The 10%-black shadow** `[layout.default-shadow]`
`box-shadow: 0 4px 6px rgba(0,0,0,0.1)` on every surface. Build a two- or three-step elevation scale, tint the shadow with the background hue, and let most surfaces sit flat.

**Off-grid spacing** `[space.off-grid]`
`padding: 13px`, `margin: 27px`. Snap to a 4px scale exposed as tokens.

**Symmetric everything**
Equal columns, equal gaps, equal weights. Asymmetry is what makes a layout look composed rather than filled.

**Section-stack monotony**
Hero → three cards → testimonial → CTA, each a full-width band of the same height. Vary section height, alignment, and background treatment so the page has a rhythm.

---

## Content and voice

**Weightless headlines**
"Build faster. Ship smarter." "Empowering teams to unlock their potential." Grammatically perfect, says nothing only this product could say. Write the specific claim instead.

**Interchangeable thin-line icons**
Icons chosen because a card slot needed one, illustrating nothing. If an icon does not disambiguate, delete it.

**Lorem-adjacent real copy**
"Enterprise-grade security built in from the very first line of code." Fill with the actual claim or leave the slot obviously empty.

**Three features, always**
Because the layout wanted three. Let the content decide the count.

---

## Interaction and state — where generated UI fails hardest

**No focus indicator** `[a11y.no-focus-indicator]`
`outline: none` with nothing in its place. Makes the interface unusable by keyboard.

**Tap targets under 24px** `[state.small-targets]`
WCAG 2.2 SC 2.5.8 sets 24×24 CSS px as the floor. Grow the hit area with padding, not the icon.

**Forms with no error state** `[state.no-error-region]`
No `role="alert"`, no `aria-invalid`, nowhere for a message to go. The form has only ever been tested on the happy path.

**Placeholder as label** `[state.unlabeled-fields]`
Disappears the moment someone types, and screen readers do not announce it as a name.

**Required fields unmarked** `[state.required-not-marked]`
Users find out on submit.

**No validation constraints** `[state.no-validation]`
Not one `required`, `pattern`, `min`, or `maxlength` on the whole form.

**Missing empty, loading, and partial states**
Every list, table, and chart has at least four states. Generated UI ships one: the populated happy path with perfect fake data. Design the empty state first — it is the state a new user actually sees.

**Hover-only affordances**
Actions that only appear on hover are invisible on touch and to keyboard users.

---

## Motion

**No reduced-motion guard** `[motion.no-reduced-motion]`
For users with vestibular disorders this is a health issue, not a preference.

**Perpetual animation** `[motion.perpetual]`
Things spinning forever that are not reporting progress. Costs attention and battery for no information.

**`transition: all`** `[motion.transition-all]`
Animates layout properties by accident. Name the properties.

**Scattered micro-interactions**
Every element fading in independently. One orchestrated entrance with staggered delays reads as designed; twelve unrelated ones read as noise.

---

## Why the tells keep moving

The feedback loop tightens. A distinctive pattern gets attention, enters the next round of training data, becomes the new default, and reads as slop within a year. Space Grotesk is already there; glassmorphism got there in eighteen months.

So do not treat this list as a permanent blocklist. Treat it as evidence for the underlying rule: **an unchosen choice is the tell.** The specific defaults will change. The absence of a decision always looks the same.
