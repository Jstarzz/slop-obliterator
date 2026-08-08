/**
 * Turns raw measurements into a verdict.
 *
 * Two rules govern everything here:
 *
 * 1. Every finding names a specific thing on the page and a specific fix. "Improve
 *    visual hierarchy" is not a finding; "6 of 7 text blocks are centre-aligned"
 *    is.
 * 2. The output stays small. An agent reads this on every iteration of a design
 *    loop, so findings are capped, evidence is capped, and nothing that passed
 *    gets reported.
 */

import {
  SLOP_HEXES,
  contrast,
  hueDistance,
  parseColor,
  round,
  toHex,
} from '../color/oklch.js';
import type { RawMeasurements } from './collect.js';

export type Severity = 'blocker' | 'major' | 'minor';
export type Dimension = 'color' | 'type' | 'space' | 'layout' | 'motion' | 'state' | 'a11y';

export interface Finding {
  id: string;
  severity: Severity;
  dimension: Dimension;
  title: string;
  evidence: string[];
  fix: string;
}

export interface AuditReport {
  url: string;
  viewport: string;
  score: number;
  verdict: string;
  dimensions: Record<Dimension, number>;
  findings: Finding[];
  passed: string[];
  stats: {
    distinctColors: number;
    distinctFontSizes: number;
    distinctRadii: number;
    fontFamilies: string[];
    maxChroma: number;
    hueFamilies: number;
  };
  notes: string[];
}

/**
 * Typefaces that are fine in isolation and fatal as a default. A model reaches for
 * these when nobody made a typography decision, so their unprompted presence is
 * evidence of an absent decision rather than a bad one.
 */
const DEFAULT_FAMILIES = new Set([
  'inter',
  'roboto',
  'open sans',
  'lato',
  'arial',
  'helvetica',
  'helvetica neue',
  'system-ui',
  '-apple-system',
  'segoe ui',
  'sans-serif',
  'nunito sans',
  'montserrat',
  'poppins',
]);

const SEVERITY_WEIGHT: Record<Severity, number> = { blocker: 18, major: 9, minor: 3 };

export function analyze(raw: RawMeasurements, viewportName: string): AuditReport {
  const findings: Finding[] = [];
  const passed: string[] = [];
  const notes: string[] = [];

  if (!raw.elementsScanned) {
    notes.push('Page exceeded the 4000-element scan cap; findings cover the first 4000 elements.');
  }
  if (!raw.stylesheetsReadable) {
    notes.push('Some stylesheets are cross-origin and could not be read; reduced-motion detection may be a false negative.');
  }

  const colorStats = analyzeColor(raw, findings, passed);
  analyzeTypography(raw, findings, passed);
  analyzeLayout(raw, findings, passed);
  analyzeSpacing(raw, findings, passed);
  analyzeStates(raw, findings, passed);
  analyzeMotion(raw, findings, passed);
  analyzeAccessibility(raw, findings, passed);

  const dimensions: Record<Dimension, number> = {
    color: 100,
    type: 100,
    space: 100,
    layout: 100,
    motion: 100,
    state: 100,
    a11y: 100,
  };

  for (const finding of findings) {
    dimensions[finding.dimension] = Math.max(
      0,
      dimensions[finding.dimension] - SEVERITY_WEIGHT[finding.severity] * 1.6,
    );
  }

  const totalPenalty = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - totalPenalty));

  const order: Record<Severity, number> = { blocker: 0, major: 1, minor: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));

  return {
    url: raw.url,
    viewport: `${viewportName} (${raw.viewport.width}×${raw.viewport.height})`,
    score,
    verdict: verdictFor(score, findings),
    dimensions,
    findings,
    passed,
    stats: {
      distinctColors: raw.colors.length,
      distinctFontSizes: raw.fontSizes.length,
      distinctRadii: raw.radii.length,
      fontFamilies: raw.fontFamilies.slice(0, 4).map((f) => f.value),
      maxChroma: colorStats.maxChroma,
      hueFamilies: colorStats.hueFamilies,
    },
    notes,
  };
}

function verdictFor(score: number, findings: Finding[]): string {
  const blockers = findings.filter((f) => f.severity === 'blocker').length;
  if (blockers > 0) return `${blockers} blocker${blockers === 1 ? '' : 's'} — not shippable yet.`;
  if (score >= 90) return 'Reads as designed. Ship it.';
  if (score >= 75) return 'Solid, with specific things left on the table.';
  if (score >= 55) return 'Recognisably generated. The defaults are showing.';
  return 'This is the median aesthetic. Start from a real design decision, not a patch.';
}

function analyzeColor(
  raw: RawMeasurements,
  findings: Finding[],
  passed: string[],
): { maxChroma: number; hueFamilies: number } {
  const parsed = raw.colors
    .map((c) => ({ ...c, oklch: parseColor(c.value) }))
    .filter((c): c is typeof c & { oklch: NonNullable<typeof c.oklch> } => c.oklch !== null);

  const chromatic = parsed.filter((c) => c.oklch.c > 0.05);
  const maxChroma = parsed.reduce((max, c) => Math.max(max, c.oklch.c), 0);

  const hueBins = new Set<number>();
  for (const c of chromatic) hueBins.add(Math.floor(c.oklch.h / 30));

  // 1. Literal signature hexes.
  const slopHexes: string[] = [];
  for (const c of parsed) {
    const hex = toHex(c.oklch).toLowerCase();
    const label = SLOP_HEXES[hex];
    if (label && !slopHexes.some((s) => s.startsWith(hex))) slopHexes.push(`${hex} (${label})`);
  }
  if (slopHexes.length > 0) {
    findings.push({
      id: 'color.signature-hex',
      severity: 'major',
      dimension: 'color',
      title: 'Palette contains the exact colours every generated interface uses',
      evidence: slopHexes.slice(0, 5),
      fix: 'Replace with a hue chosen for this product. Call `design_system` with a seed that means something — a material, a place, a photograph — and use its tokens.',
    });
  }

  // 2. Accent sitting in the indigo/violet band.
  const accents = chromatic.filter((c) => c.oklch.c > 0.09).sort((a, b) => b.area - a.area);
  const dominantAccent = accents[0];
  if (dominantAccent && dominantAccent.oklch.h >= 258 && dominantAccent.oklch.h <= 310) {
    findings.push({
      id: 'color.slop-hue',
      severity: 'major',
      dimension: 'color',
      title: 'Dominant accent sits in the indigo/violet band',
      evidence: [
        `${dominantAccent.value} → hue ${Math.round(dominantAccent.oklch.h)}°, chroma ${round(dominantAccent.oklch.c, 3)}`,
      ],
      fix: 'Rotate the accent out of 258–310°. That band traces straight back to Tailwind\'s indigo-500 default and now reads as "nobody picked a colour".',
    });
  }

  // 3. Blue → purple gradients.
  const slopGradients: string[] = [];
  for (const gradient of raw.gradients) {
    const stops = extractColors(gradient.value)
      .map((s) => parseColor(s))
      .filter((c): c is NonNullable<typeof c> => c !== null && c.c > 0.04);
    if (stops.length < 2) continue;
    const hues = stops.map((s) => s.h);
    const hasBlue = hues.some((h) => h >= 230 && h <= 275);
    const hasPurple = hues.some((h) => h >= 275 && h <= 330);
    if (hasBlue && hasPurple) slopGradients.push(gradient.value.slice(0, 90));
  }
  if (slopGradients.length > 0) {
    findings.push({
      id: 'color.slop-gradient',
      severity: 'major',
      dimension: 'color',
      title: 'Blue-to-purple gradient present',
      evidence: slopGradients.slice(0, 3),
      fix: 'Drop it. If the surface needs depth, use a low-chroma tonal wash in the brand hue, a subtle noise or grain layer, or a hard-edged geometric field — anything that is a choice rather than the default.',
    });
  }

  // 4. Timid palette.
  if (chromatic.length > 0 && maxChroma < 0.075) {
    findings.push({
      id: 'color.timid',
      severity: 'major',
      dimension: 'color',
      title: 'No colour in the palette is saturated enough to carry emphasis',
      evidence: [`highest chroma on the page is ${round(maxChroma, 3)} (an accent needs ~0.12+)`],
      fix: 'Commit to one dominant colour at real saturation and let everything else recede. Evenly-distributed pastels read as indecision, not restraint.',
    });
  } else if (maxChroma >= 0.12) {
    passed.push('Palette commits to a saturated accent.');
  }

  // 5. Hue sprawl.
  if (hueBins.size > 5) {
    findings.push({
      id: 'color.hue-sprawl',
      severity: 'minor',
      dimension: 'color',
      title: `${hueBins.size} unrelated hue families in one view`,
      evidence: [`chromatic colours span ${hueBins.size} 30° hue bins`],
      fix: 'Cut to one brand hue, one accent roughly 120–180° away, and semantic colours for success/warning/danger. Everything else should be a tinted neutral.',
    });
  }

  // 6. Untinted greys.
  const neutrals = parsed.filter((c) => c.oklch.c < 0.004 && c.oklch.l > 0.08 && c.oklch.l < 0.98);
  if (neutrals.length >= 3 && chromatic.length > 0) {
    findings.push({
      id: 'color.flat-neutrals',
      severity: 'minor',
      dimension: 'color',
      title: 'Greys are pure grey',
      evidence: neutrals.slice(0, 4).map((n) => n.value),
      fix: 'Tint neutrals toward the brand hue at chroma 0.005–0.012. Untinted greys are the quiet tell that the palette was assembled rather than designed.',
    });
  }

  // 7. Contrast — the one place we are not making an aesthetic judgement.
  const failures: string[] = [];
  const seen = new Set<string>();
  for (const sample of raw.contrastSamples) {
    const key = `${sample.foreground}|${sample.background}|${sample.fontSizePx}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const ratio = contrast(sample.foreground, sample.background);
    const isLarge = sample.fontSizePx >= 24 || (sample.fontSizePx >= 18.66 && sample.fontWeight >= 700);
    const required = isLarge ? 3 : 4.5;
    if (ratio < required) {
      failures.push(
        `${sample.selector} "${sample.text}" — ${ratio}:1, needs ${required}:1 (${sample.foreground} on ${sample.background})`,
      );
    }
  }
  if (failures.length > 0) {
    findings.push({
      id: 'color.contrast',
      severity: 'blocker',
      dimension: 'color',
      title: `${failures.length} text/background pair${failures.length === 1 ? '' : 's'} below WCAG AA`,
      evidence: failures.slice(0, 6),
      fix: 'Darken the foreground or lighten the surface until the ratio clears 4.5:1 (3:1 for text ≥24px or ≥18.66px bold). Use `contrast_check` to find the nearest passing shade instead of guessing.',
    });
  } else if (raw.contrastSamples.length > 0) {
    passed.push(`All ${raw.contrastSamples.length} sampled text pairs clear WCAG AA.`);
  }

  return { maxChroma: round(maxChroma, 3), hueFamilies: hueBins.size };
}

function analyzeTypography(raw: RawMeasurements, findings: Finding[], passed: string[]): void {
  const families = raw.fontFamilies;
  const primary = families[0];

  if (primary && DEFAULT_FAMILIES.has(primary.value.toLowerCase())) {
    findings.push({
      id: 'type.default-family',
      severity: 'major',
      dimension: 'type',
      title: `Primary typeface is "${primary.value}"`,
      evidence: families.slice(0, 3).map((f) => `${f.value} (${f.count} elements)`),
      fix: 'Pick a face with a point of view and pair it against something structurally different — a display serif over a grotesque, or a grotesque over a mono. See references/typography.md for pairings that are not on every generated page.',
    });
  } else if (primary) {
    passed.push(`Typeface "${primary.value}" is a deliberate choice.`);
  }

  const distinctFamilies = new Set(families.map((f) => f.value.toLowerCase()));
  if (distinctFamilies.size === 1 && families.length > 0) {
    findings.push({
      id: 'type.no-pairing',
      severity: 'minor',
      dimension: 'type',
      title: 'One typeface doing every job',
      evidence: [`only "${families[0]!.value}" in use`],
      fix: 'Add a second face with a different skeleton for headings or for data. Contrast between faces is what makes hierarchy legible before anyone reads a word.',
    });
  }

  const weights = raw.fontWeights.map((w) => w.weight);
  if (weights.length > 0) {
    const spread = Math.max(...weights) - Math.min(...weights);
    if (spread < 300) {
      findings.push({
        id: 'type.weak-weight-contrast',
        severity: 'minor',
        dimension: 'type',
        title: 'Weight range is too narrow to build hierarchy',
        evidence: [`weights in use: ${[...new Set(weights)].sort((a, b) => a - b).join(', ')}`],
        fix: 'Use the extremes. 300 against 800 reads as intentional; 400 against 600 reads as an accident.',
      });
    } else {
      passed.push('Weight contrast is wide enough to carry hierarchy.');
    }
  }

  const sizes = raw.fontSizes.map((s) => s.px).filter((px) => px > 0);
  if (sizes.length > 1) {
    const ratio = Math.max(...sizes) / Math.min(...sizes);
    if (ratio < 2.6) {
      findings.push({
        id: 'type.weak-size-contrast',
        severity: 'major',
        dimension: 'type',
        title: 'Type scale is compressed',
        evidence: [`largest ${Math.max(...sizes)}px vs smallest ${Math.min(...sizes)}px — ${round(ratio, 2)}× range`],
        fix: 'Open the scale to at least 3×, ideally 4–5× between body and the largest display size. Timid scale jumps are why generated pages read flat.',
      });
    }

    if (raw.fontSizes.length > 9) {
      findings.push({
        id: 'type.off-scale',
        severity: 'minor',
        dimension: 'type',
        title: `${raw.fontSizes.length} distinct font sizes`,
        evidence: [sizes.slice(0, 12).map((s) => `${s}px`).join(', ')],
        fix: 'Collapse to a 6–8 step modular scale (1.25 or 1.333 ratio) and reference steps by token. Arbitrary sizes are the fastest way to make a page feel assembled.',
      });
    }
  }

  if (raw.text.linesTooLong > 0) {
    findings.push({
      id: 'type.measure-too-wide',
      severity: 'major',
      dimension: 'type',
      title: `${raw.text.linesTooLong} text block${raw.text.linesTooLong === 1 ? '' : 's'} run past a readable measure`,
      evidence: [`widest measure ≈ ${raw.text.maxMeasureCh} characters (comfortable range is 45–75)`],
      fix: 'Cap prose containers with `max-width: 65ch`. Full-bleed body copy is the most common reason a generated layout feels unread and unreadable.',
    });
  } else if (raw.text.blocks > 0) {
    passed.push('Line lengths sit in a readable range.');
  }

  if (raw.text.tightLineHeight > 0) {
    findings.push({
      id: 'type.tight-leading',
      severity: 'minor',
      dimension: 'type',
      title: `${raw.text.tightLineHeight} paragraph${raw.text.tightLineHeight === 1 ? '' : 's'} set with cramped leading`,
      evidence: ['body copy under 1.4 line-height'],
      fix: 'Body copy wants 1.5–1.7. Reserve tight leading (1.0–1.2) for display sizes, where it actually helps.',
    });
  }
}

function analyzeLayout(raw: RawMeasurements, findings: Finding[], passed: string[]): void {
  const tripleCards = raw.cardRows.filter(
    (row) => row.childCount === 3 && row.equalWidths && row.childrenHaveIcon && row.childrenHaveHeading,
  );
  if (tripleCards.length > 0) {
    findings.push({
      id: 'layout.three-card-row',
      severity: 'major',
      dimension: 'layout',
      title: 'The three-equal-cards-with-icons row',
      evidence: tripleCards.map((r) => r.selector).slice(0, 3),
      fix: 'Break the triptych. Give the strongest item more space, stagger the rhythm, or let the content decide the count. If there are genuinely three equal things, at least vary their internal composition.',
    });
  }

  if (raw.text.blocks >= 5) {
    const centeredRatio = raw.text.centeredBlocks / raw.text.blocks;
    if (centeredRatio > 0.6) {
      findings.push({
        id: 'layout.centered-everything',
        severity: 'major',
        dimension: 'layout',
        title: 'Almost everything is centre-aligned',
        evidence: [`${raw.text.centeredBlocks} of ${raw.text.blocks} text blocks centred`],
        fix: 'Centre a hero if you must; left-align everything the reader has to actually read. Uniform centring removes the vertical edge the eye tracks down the page.',
      });
    } else {
      passed.push('Alignment varies with content role.');
    }
  }

  if (raw.radii.length === 1 && (raw.radii[0]?.count ?? 0) >= 12) {
    findings.push({
      id: 'layout.uniform-radius',
      severity: 'minor',
      dimension: 'layout',
      title: 'One border-radius on every single element',
      evidence: [`${raw.radii[0]!.value} applied to ${raw.radii[0]!.count} elements`],
      fix: 'Scale radius with element size — a 4px control and a 24px panel should not share a corner. Or commit the other way and go fully square.',
    });
  }

  const softShadows = raw.shadows.filter((s) => /rgba?\([^)]*0?\.1\s*\)/.test(s.value));
  if (softShadows.length > 0 && (softShadows[0]?.count ?? 0) >= 6) {
    findings.push({
      id: 'layout.default-shadow',
      severity: 'minor',
      dimension: 'layout',
      title: 'The same 10%-black shadow on everything',
      evidence: softShadows.slice(0, 2).map((s) => `${s.value.slice(0, 70)} ×${s.count}`),
      fix: 'Build a two- or three-step elevation scale, tint the shadow with the background hue rather than pure black, and let most surfaces sit flat.',
    });
  }

  if (raw.overflowX.length > 0) {
    findings.push({
      id: 'layout.horizontal-overflow',
      severity: 'blocker',
      dimension: 'layout',
      title: `${raw.overflowX.length} element${raw.overflowX.length === 1 ? '' : 's'} overflow the viewport horizontally`,
      evidence: raw.overflowX.slice(0, 6),
      fix: 'Find the fixed width or unwrapped flex row causing it. Horizontal scroll on a page that should not scroll horizontally is a bug, not a style choice.',
    });
  } else {
    passed.push('No horizontal overflow at this viewport.');
  }
}

function analyzeSpacing(raw: RawMeasurements, findings: Finding[], passed: string[]): void {
  const values = raw.spacings;
  if (values.length === 0) return;

  const total = values.reduce((sum, s) => sum + s.count, 0);
  const offGrid = values.filter((s) => s.px % 4 !== 0);
  const offGridCount = offGrid.reduce((sum, s) => sum + s.count, 0);
  const offGridRatio = total > 0 ? offGridCount / total : 0;

  if (offGridRatio > 0.3) {
    findings.push({
      id: 'space.off-grid',
      severity: 'minor',
      dimension: 'space',
      title: `${Math.round(offGridRatio * 100)}% of spacing values are off any 4px grid`,
      evidence: [offGrid.slice(0, 8).map((s) => `${s.px}px`).join(', ')],
      fix: 'Snap padding, margin and gap to a 4px (or 8px) scale exposed as tokens. Arbitrary values are what make an interface feel subtly wrong without anyone being able to say why.',
    });
  } else {
    passed.push('Spacing sits on a consistent grid.');
  }

  const distinct = values.length;
  if (distinct > 16) {
    findings.push({
      id: 'space.too-many-steps',
      severity: 'minor',
      dimension: 'space',
      title: `${distinct} distinct spacing values`,
      evidence: [values.slice(0, 10).map((s) => `${s.px}px`).join(', ')],
      fix: 'A design system needs about 8 spacing steps. More than that means spacing is being chosen per-element rather than per-relationship.',
    });
  }
}

function analyzeStates(raw: RawMeasurements, findings: Finding[], passed: string[]): void {
  const { interactive, forms } = raw;

  if (interactive.smallTargets.length > 0) {
    findings.push({
      id: 'state.small-targets',
      severity: 'major',
      dimension: 'state',
      title: `${interactive.smallTargets.length} interactive target${interactive.smallTargets.length === 1 ? '' : 's'} under 24×24px`,
      evidence: interactive.smallTargets.slice(0, 5).map((t) => `${t.selector} — ${t.width}×${t.height}`),
      fix: 'WCAG 2.2 SC 2.5.8 sets 24×24 CSS px as the floor; 44×44 is the comfortable target on touch. Grow the hit area with padding rather than the icon.',
    });
  } else if (interactive.total > 0) {
    passed.push('All interactive targets clear the 24px minimum.');
  }

  if (forms.fieldCount > 0) {
    if (forms.unlabeled.length > 0) {
      findings.push({
        id: 'state.unlabeled-fields',
        severity: 'blocker',
        dimension: 'state',
        title: `${forms.unlabeled.length} form field${forms.unlabeled.length === 1 ? '' : 's'} with no programmatic label`,
        evidence: forms.unlabeled.slice(0, 5),
        fix: 'Every field needs a <label for>, a wrapping label, or aria-label. Placeholder text is not a label — it disappears the moment someone types.',
      });
    }

    if (forms.requiredTotal > 0 && forms.requiredMarked < forms.requiredTotal) {
      findings.push({
        id: 'state.required-not-marked',
        severity: 'major',
        dimension: 'state',
        title: `${forms.requiredTotal - forms.requiredMarked} required field${forms.requiredTotal - forms.requiredMarked === 1 ? '' : 's'} not visibly marked`,
        evidence: [`${forms.requiredMarked}/${forms.requiredTotal} required fields carry a visible indicator`],
        fix: 'Mark required fields visibly and in the accessibility tree. Finding out on submit is the most common self-inflicted form failure.',
      });
    }

    if (!forms.hasErrorRegion) {
      findings.push({
        id: 'state.no-error-region',
        severity: 'major',
        dimension: 'state',
        title: 'Form has nowhere to show an error',
        evidence: ['no [role="alert"], [aria-live], or [aria-invalid] anywhere on the page'],
        fix: 'Add a live region per field plus a summary at the top of the form. A form without an error state is a form that has only been tested on the happy path.',
      });
    }

    if (forms.hasNoValidationAttrs) {
      findings.push({
        id: 'state.no-validation',
        severity: 'major',
        dimension: 'state',
        title: 'No validation constraints on any field',
        evidence: [`${forms.fieldCount} fields, none with required/pattern/min/max/minlength`],
        fix: 'Declare constraints in HTML so the browser enforces them, then layer custom messaging on top. This is the single most common gap in generated forms.',
      });
    }

    if (forms.unlabeled.length === 0 && forms.hasErrorRegion) {
      passed.push('Form fields are labelled and there is somewhere to surface errors.');
    }
  }

  if (interactive.missingFocusStyle.length > 3) {
    findings.push({
      id: 'a11y.no-focus-indicator',
      severity: 'blocker',
      dimension: 'a11y',
      title: `${interactive.missingFocusStyle.length} interactive elements with the focus outline removed and nothing in its place`,
      evidence: interactive.missingFocusStyle.slice(0, 5),
      fix: 'Add `:focus-visible` with a 2px ring at 3:1 against its surround plus an offset. Removing outlines without a replacement makes the interface unusable by keyboard.',
    });
  }
}

function analyzeMotion(raw: RawMeasurements, findings: Finding[], passed: string[]): void {
  const { motion } = raw;

  if (motion.animatedElements > 0 && !motion.reducedMotionRuleFound) {
    findings.push({
      id: 'motion.no-reduced-motion',
      severity: 'major',
      dimension: 'motion',
      title: `${motion.animatedElements} animated element${motion.animatedElements === 1 ? '' : 's'} with no prefers-reduced-motion escape`,
      evidence: ['no @media (prefers-reduced-motion) rule found in readable stylesheets'],
      fix: 'Wrap motion in `@media (prefers-reduced-motion: no-preference)`, or neutralise it in a `reduce` block. For users with vestibular disorders this is a health issue, not a preference.',
    });
  } else if (motion.animatedElements > 0) {
    passed.push('Motion respects prefers-reduced-motion.');
  }

  if (motion.infiniteAnimations > 2) {
    findings.push({
      id: 'motion.perpetual',
      severity: 'minor',
      dimension: 'motion',
      title: `${motion.infiniteAnimations} elements animating forever`,
      evidence: ['animation-iteration-count: infinite'],
      fix: 'Perpetual motion costs attention and battery for no information. Keep looping animation for genuine progress indicators; everything else should resolve.',
    });
  }

  if (motion.transitionAllCount > 4) {
    findings.push({
      id: 'motion.transition-all',
      severity: 'minor',
      dimension: 'motion',
      title: `transition: all on ${motion.transitionAllCount} elements`,
      evidence: ['transition-property resolves to "all"'],
      fix: 'Name the properties. `transition: all` animates layout properties by accident, which is both janky and a common source of surprise reflows.',
    });
  }
}

function analyzeAccessibility(raw: RawMeasurements, findings: Finding[], passed: string[]): void {
  const { headings, media, landmarks } = raw;

  if (headings.h1Count === 0) {
    findings.push({
      id: 'a11y.no-h1',
      severity: 'major',
      dimension: 'a11y',
      title: 'No h1 on the page',
      evidence: [`heading levels found: ${headings.levels.join(', ') || 'none'}`],
      fix: 'Every page needs exactly one h1 naming what the page is. Screen-reader users and search crawlers both start there.',
    });
  } else if (headings.h1Count > 1) {
    findings.push({
      id: 'a11y.multiple-h1',
      severity: 'minor',
      dimension: 'a11y',
      title: `${headings.h1Count} h1 elements`,
      evidence: [`heading levels: ${headings.levels.join(', ')}`],
      fix: 'Demote all but the primary heading. Multiple h1s flatten the document outline.',
    });
  }

  if (headings.skips.length > 0) {
    findings.push({
      id: 'a11y.heading-skip',
      severity: 'minor',
      dimension: 'a11y',
      title: 'Heading levels skip',
      evidence: headings.skips.slice(0, 4),
      fix: 'Do not jump levels to get a size. Use the correct level and style it with a token.',
    });
  }

  if (media.missingAlt.length > 0) {
    findings.push({
      id: 'a11y.missing-alt',
      severity: 'major',
      dimension: 'a11y',
      title: `${media.missingAlt.length} image${media.missingAlt.length === 1 ? '' : 's'} with no alt attribute`,
      evidence: media.missingAlt.slice(0, 5),
      fix: 'Describe what the image conveys, or use alt="" if it is purely decorative. A missing attribute and an empty one mean different things.',
    });
  }

  if (media.missingIntrinsicSize > 0) {
    findings.push({
      id: 'a11y.layout-shift-risk',
      severity: 'minor',
      dimension: 'a11y',
      title: `${media.missingIntrinsicSize} image${media.missingIntrinsicSize === 1 ? '' : 's'} without width/height`,
      evidence: ['images with no intrinsic size reserve no space before they load'],
      fix: 'Set width and height attributes (or aspect-ratio) so the browser can reserve the box and avoid content jumping under the reader.',
    });
  }

  const missingLandmarks = Object.entries({
    main: landmarks.main,
    nav: landmarks.nav,
    header: landmarks.header,
    footer: landmarks.footer,
  })
    .filter(([, present]) => !present)
    .map(([name]) => name);

  if (missingLandmarks.includes('main')) {
    findings.push({
      id: 'a11y.no-main-landmark',
      severity: 'minor',
      dimension: 'a11y',
      title: 'No main landmark',
      evidence: [`missing: ${missingLandmarks.join(', ')}`],
      fix: 'Wrap the primary content in <main>. Landmarks are how keyboard and screen-reader users skip the furniture.',
    });
  } else if (missingLandmarks.length === 0) {
    passed.push('Document landmarks are complete.');
  }
}

/** Pull colour literals out of a gradient declaration. */
function extractColors(input: string): string[] {
  const matches = input.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b|oklch\([^)]+\)|hsla?\([^)]+\)/g);
  return matches ?? [];
}

export { hueDistance };
