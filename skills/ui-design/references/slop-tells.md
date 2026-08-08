# The catalogue of tells

Every entry names a default a model reaches for when no decision was made. One is noise. Three or four together in the same view is the fingerprint.

Rule ids in brackets are detected automatically by `audit_design`. Run `list_rules` for the full machine-readable list. Entries marked **judgement** have no detector and are covered by `/critique`.

Taxonomy drawn from [Impeccable's catalog](https://impeccable.style/slop) (Apache-2.0), UIZZE's anti-ui-slop kill list, and Anthropic's frontend-design skill.

---

## The moving target

Read this before the list. The specific defaults change roughly annually, because the loop tightens: a distinctive pattern gets attention, enters the next round of training data, becomes the new default, and reads as slop within a year. Purple gradients were 2023. Glassmorphism took eighteen months. Space Grotesk is already there.

**In 2026, generated design converges on three looks, and two of them pass every rule below:**

1. Warm cream ground near `#F4F1EA`, high-contrast serif display, terracotta accent
2. Near-black ground with one bright acid-green or vermilion accent
3. Broadsheet: hairline rules, zero radius, dense newspaper columns

Only the first is detectable `[color.cream-default]`. The other two need your eyes.

So do not treat this list as a permanent blocklist. It is evidence for one rule: **an unchosen choice is the tell.** The specifics will move. The absence of a decision always looks the same.

---

## Colour

**Indigo/violet accent** `[color.slop-hue]` `[color.signature-hex]`
Hue 258-310 in OKLCH. Traces to `bg-indigo-500` in Tailwind UI's 2019 examples, which saturated tutorials, which saturated training data. Tailwind's creator publicly apologised. The specific hexes — `#6366f1`, `#8b5cf6`, `#a855f7`, `#4f46e5` — function as a signature.

**Blue-to-purple gradient** `[color.slop-gradient]`
`linear-gradient(135deg, #667eea, #764ba2)` and relatives. For depth instead: a low-chroma tonal wash in the brand hue, a grain layer, or a hard-edged geometric field.

**Gradient text** `[color.gradient-text]`
Decorative rather than meaningful, and it wrecks scannability. Especially on headings and metrics.

**Radial glow halo** `[color.radial-halo]`
The ambient orb behind a hero. A shortcut for atmosphere that every generator reaches for.

**Neon glow on dark** `[color.glow-on-dark]`
Coloured `box-shadow` with no offset on a dark ground. The default "cool" look. Use purposeful lighting or skip the dark theme.

**Cream ground by reflex** `[color.cream-default]`
The 2026 "tasteful" default. Keep it only if warmth was actually the brief.

**Timid palette** `[color.timid]`
Nothing exceeds ~0.075 chroma. Everything is a pastel of equal weight, so nothing leads.

**Hue sprawl** `[color.hue-sprawl]`
Six unrelated hue families because each component picked its own.

**Untinted greys** `[color.flat-neutrals]`
Pure `#808080`-family at zero chroma. Real systems tint neutrals toward the brand hue at 0.005-0.012.

**Grey text on colour** `[color.grey-on-colored]`
Grey washes out over a coloured surface. Use a much darker or lighter shade of the background hue.

**Contrast failures** `[color.contrast]`
4.5:1 body, 3:1 for large text and UI boundaries.

---

## Typography

**Overused faces** `[type.overused-font]`
Inter, Roboto, Open Sans, Lato, system-ui — then Poppins, Montserrat, Nunito — then Space Grotesk, DM Sans, Geist, Instrument Serif. Each wave is what models pick after being told to avoid the last one.

**One face doing everything** `[type.single-family]`
Hierarchy carried by size alone.

**Compressed scale** `[type.flat-hierarchy]`
Largest under 3x the smallest. Real editorial hierarchy runs 4-6x.

**Weight range 400-600** `[type.weak-weight-contrast]`
Use the extremes. 300 against 800 reads as intentional.

**Icon tile above a heading** `[type.icon-tile-above-heading]`
A small rounded square containing an icon, stacked over a heading. The universal AI feature-card template. Every generator outputs this exact shape.

**Eyebrow / kicker label** `[type.eyebrow-label]`
A tracked uppercase label above a heading, borrowing editorial authority it has not earned. Fold it into the heading or delete it.

**Oversized hero headline** `[type.oversized-hero-headline]`
A full sentence at display size eats the fold. A punchy one or two words at that size is fine; a long headline blown up is not.

**Italic serif display** `[type.italic-serif-display]`
Reads as taste in isolation. Now the universal AI-startup hero.

**Crushed tracking** `[type.crushed-tracking]`
Past -0.05em characters stop keeping their own shapes.

**Fifteen font sizes** `[type.off-scale]`
Chosen per element rather than from a scale.

**Full-bleed body copy** `[type.measure-too-wide]`
Cap at 65ch. Comfortable measure is 45-75 characters.

**Cramped leading** `[type.tight-leading]`, **all-caps body** `[type.all-caps-body]`, **wide tracking on body** `[type.wide-tracking-body]`, **justified without hyphenation** `[type.justified-text]`, **body under 12px** `[type.tiny-body-text]`, **labels under 11px** `[type.undersized-functional-text]`
Legibility defects that survive every redesign because nobody measures them.

---

## Visual details

**Side-tab accent border** `[visual.side-tab-border]`
A thick coloured stripe down one edge of a card. The single most recognisable tell there is.

**Thick border on a rounded corner** `[visual.border-on-rounded]`
The border and the radius fight. Pick one.

**Hairline plus wide shadow** `[visual.hairline-with-wide-shadow]`
A defined edge and a soft elevation at the same time. Commit to one.

**Glassmorphism as decoration** `[visual.glassmorphism]`
Backdrop blur earns its place when something genuinely floats over scrolling content.

**Decorative grid background** `[visual.decorative-grid]`
A grid belongs behind a canvas, a map, or a measurement task. Behind marketing copy it is wallpaper.

**Repeating-gradient stripes** `[visual.repeating-stripes]`

**Over-rounded cards** `[visual.extreme-radius]`
24px and up on a small card rounds everything into the same soft blob. Cards top out around 12-16px.

**One radius everywhere** `[layout.uniform-radius]` · **the 10%-black shadow** `[layout.default-shadow]`

**Amateur hand-drawn SVG** — judgement
Hand-coded scenes and mascots read as doodles, not whimsy. No illustration beats a sketchy one.

---

## Layout and space

**Three equal cards with icons** `[layout.three-card-row]`
The most recognisable generated layout, because Tailwind's docs used a three-column grid to demonstrate `grid-cols-3`.

**Endless identical card grids** `[layout.identical-card-grid]`
Same-sized icon-heading-text cards repeated down the page.

**Nested cards** `[layout.nested-cards]`
Cards inside cards inside cards, each with its own padding and shadow. Flatten with spacing and typography.

**Everything centred** `[layout.centered-everything]`
Removes the vertical edge the eye tracks down the page.

**Tiny numbered labels** `[layout.numbered-labels]`
`01 / 02 / 03` beside headings. Only honest when the content genuinely is a sequence.

**Monotonous spacing** `[layout.monotonous-spacing]`
One value everywhere means nothing is grouped. Space is how grouping is communicated.

**Off-grid spacing** `[space.off-grid]` · **too many steps** `[space.too-many-steps]` · **cramped padding** `[layout.cramped-padding]` · **text touching the viewport edge** `[layout.text-touching-edge]` · **heading crowded against the block above** `[layout.heading-crowded]`

**Horizontal overflow** `[layout.horizontal-overflow]` · **occluded text** `[layout.occluded-text]` · **popover clipped by an overflow container** `[layout.clipped-positioned-child]` · **lopsided opening columns** `[layout.lopsided-first-viewport]` · **scroller cards flush to the edge** `[layout.flush-scroller-cards]`

**Hero metric layout** — judgement
Big number, small label, three supporting stats, gradient accent. Used everywhere, trusted nowhere.

**Section-stack monotony** — judgement
Hero, three cards, testimonial, CTA, each a full-width band of the same height.

---

## Motion

**Pulsing status dot** `[motion.pulsing-dot]`
Makes static status look live. Animate only when the data is changing.

**Blinking caret on non-editable copy** `[motion.blinking-caret]`
Makes a hero headline cosplay as a terminal.

**Auto-scrolling marquee** `[motion.marquee]`
Demands attention and hides content behind time.

**Bounce and elastic easing** `[motion.bounce-easing]`
A dialog that springs in and overshoots. Reserve spring physics for things that are actually physical.

**Image hover transform** `[motion.image-hover-transform]`

**Animating layout properties** `[motion.layout-property-animation]`
Width, height, padding, margin. Forces layout every frame.

**No reduced-motion guard** `[motion.no-reduced-motion]` · **perpetual animation** `[motion.perpetual]` · **`transition: all`** `[motion.transition-all]`

---

## Copy

**Marketing buzzwords** `[copy.marketing-buzzword]`
Streamline, empower, supercharge, world-class, enterprise-grade, seamless.

**Em-dash overuse** `[copy.em-dash-overuse]`
Human prose runs 4-10 per 1,000 words. Past 20 it reads as machine cadence.

**Manufactured contrast** `[copy.aphoristic-cadence]`
"Not a feature. A platform." "No fluff, no filler, just results." Once is a choice; repeated is a template.

**Theater framing** `[copy.theater-framing]`
Dismissing something as "growth theater" is a recurring generated tic.

**Weightless headline** `[copy.weightless-headline]`
"Build faster. Ship smarter." Would run unchanged on a competitor's page.

**Repeated label in one container** `[copy.repeated-text]`
Label, sublabel, helper text and hint all saying the same thing.

---

## Imagery

**Shape-assembled illustration** `[imagery.shape-assembled]`
Hero art built from generic SVG primitives. Reads as placeholder clip art.

**Broken or placeholder src** `[imagery.broken-src]`

---

## State and accessibility

Where generated UI fails hardest, and it is invisible in a screenshot. A model trained on static markup has seen thousands of form structures and never once filled one out and hit an error.

**No focus indicator** `[a11y.no-focus-indicator]` · **targets under 24px** `[state.small-targets]` · **unlabelled fields** `[state.unlabeled-fields]` · **required fields unmarked** `[state.required-not-marked]` · **no error region** `[state.no-error-region]` · **no validation constraints** `[state.no-validation]`

**Content shipped at opacity 0** `[a11y.invisible-at-rest]`
Reveal code that never ran. Ship content visible, then enhance its entrance.

**Uncaught script error** `[a11y.script-error]`
Fix it before judging anything else; every other finding is suspect until it is gone.

**Heading order** `[a11y.no-h1]` `[a11y.multiple-h1]` `[a11y.heading-skip]` · **missing alt** `[a11y.missing-alt]` · **images with no intrinsic size** `[a11y.layout-shift-risk]` · **no main landmark** `[a11y.no-main-landmark]`

**Missing empty, loading, and partial states** — judgement
Every list, table and chart has at least four. Generated UI ships one: the populated happy path with perfect fake data. Design the empty state first; it is what a new user actually sees.

---

## Design-system drift

Only active when you pass `design_md`. These catch the more insidious failure: a page that is fine in the abstract but does not belong to *this* product.

`[system.font-drift]` `[system.color-drift]` `[system.radius-drift]` `[system.font-size-drift]`
