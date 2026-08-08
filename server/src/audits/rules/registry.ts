/**
 * Every pattern the detector knows, as a list of small, independent rules.
 *
 * A rule owns its own threshold, its own evidence, and its own fix. Nothing
 * reaches across to anything else, which is what makes each one testable in
 * isolation and suppressible without collateral damage.
 *
 * Provenance: the pattern taxonomy draws on Impeccable's published catalog
 * (github.com/pbakaus/impeccable, Apache-2.0), UIZZE's anti-ui-slop kill list,
 * and Anthropic's frontend-design skill. Detection here is an independent
 * implementation against rendered pages; no rule code was copied.
 */

import { SLOP_HEXES, contrast, parseColor, round, toHex } from '../../color/oklch.js';
import { isUsable } from './design-contract.js';
import {
  describe,
  evidenceFrom,
  fromSignal,
  plural,
  type Rule,
  type RuleContext,
  type RuleHit,
} from './types.js';

/* ------------------------------------------------------------------ shared */

/**
 * Faces that are fine in isolation and fatal as a default. The list has to keep
 * moving: each wave of generated UI converges on whatever the last wave was
 * told to use instead.
 */
const OVERUSED_FONTS = new Set([
  // First wave.
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
  // Second wave.
  'poppins',
  'montserrat',
  'nunito',
  'nunito sans',
  'raleway',
  // What models pick when told to avoid the first two waves.
  'space grotesk',
  'dm sans',
  'plus jakarta sans',
  'geist',
  'satoshi',
  'general sans',
  // The 2026 reflex.
  'instrument serif',
]);

const BUZZWORDS = [
  'streamline',
  'supercharge',
  'empower',
  'unlock',
  'elevate',
  'seamless',
  'seamlessly',
  'world-class',
  'enterprise-grade',
  'next-generation',
  'best-in-class',
  'cutting-edge',
  'game-changing',
  'revolutionize',
  'transform your',
  'take it to the next level',
  'built for scale',
  'effortlessly',
  'delightful',
  'robust',
  'leverage',
  'harness',
  'frictionless',
  'turnkey',
  'holistic',
  'synergy',
  'ship faster',
  'move faster',
  'work smarter',
];

const THEATER_WORDS = /\b(?:security|growth|productivity|compliance|innovation|performance|hustle|meeting|status)\s+theater\b/gi;

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/* ============================================================ design system */

const systemRules: Rule[] = [
  {
    id: 'system.font-drift',
    title: 'Typeface outside the documented type system',
    kind: 'quality',
    severity: 'major',
    dimension: 'system',
    fix: 'Use a face the design contract already names, or add the new one to it deliberately.',
    detect({ raw, design }) {
      if (!isUsable(design) || design.fonts.length === 0) return null;
      const approved = new Set(design.fonts.map((f) => f.toLowerCase()));
      const offenders = raw.fontFamilies.filter(
        (f) => !approved.has(f.value.toLowerCase()) && !/^(ui-|monospace|serif|sans-serif|cursive)/.test(f.value.toLowerCase()),
      );
      if (offenders.length === 0) return null;
      return {
        title: `${plural(offenders.length, 'typeface')} outside ${design.source}`,
        evidence: offenders.slice(0, 5).map((f) => `${f.value} on ${f.count} elements`),
      };
    },
  },
  {
    id: 'system.color-drift',
    title: 'Colour outside the documented palette',
    kind: 'quality',
    severity: 'minor',
    dimension: 'system',
    fix: 'Reference a token instead of a literal, or add the colour to the palette on purpose.',
    detect({ raw, design }) {
      if (!isUsable(design) || design.colors.length < 3) return null;
      const approved = new Set<string>();
      for (const value of design.colors) {
        const parsed = parseColor(value);
        if (parsed) approved.add(toHex(parsed).toLowerCase());
      }
      if (approved.size < 3) return null;

      const offenders: string[] = [];
      for (const used of raw.colors) {
        if (used.count < 2) continue;
        const parsed = parseColor(used.value);
        if (!parsed) continue;
        // Neutrals drift constantly and harmlessly; only judge chromatic colour.
        if (parsed.c < 0.03) continue;
        const hex = toHex(parsed).toLowerCase();
        if (!approved.has(hex)) offenders.push(`${hex} (${used.role}, ${used.count} uses)`);
      }
      if (offenders.length === 0) return null;
      return {
        title: `${plural(offenders.length, 'colour')} outside ${design.source}`,
        evidence: offenders.slice(0, 6),
      };
    },
  },
  {
    id: 'system.radius-drift',
    title: 'Corner radius outside the documented shape scale',
    kind: 'quality',
    severity: 'minor',
    dimension: 'system',
    fix: 'Snap to a documented radius token, or add the new step to the scale.',
    detect({ raw, design }) {
      if (!isUsable(design) || design.radii.length === 0) return null;
      const approved = new Set(design.radii);
      const offenders = raw.radii.filter((r) => {
        const value = Number.parseFloat(r.value);
        if (!Number.isFinite(value) || value === 0) return false;
        if (value > 400) return false; // pill radii
        return ![...approved].some((a) => Math.abs(a - value) < 1);
      });
      if (offenders.length === 0) return null;
      return {
        title: `${plural(offenders.length, 'corner radius', 'corner radii')} outside ${design.source}`,
        evidence: offenders.slice(0, 5).map((r) => `${r.value} on ${r.count} elements`),
      };
    },
  },
  {
    id: 'system.font-size-drift',
    title: 'Font size between documented type steps',
    kind: 'quality',
    severity: 'minor',
    dimension: 'system',
    fix: 'Use a step from the scale, or add a deliberate new step to the contract.',
    detect({ raw, design }) {
      if (!isUsable(design) || design.fontSizes.length < 3) return null;
      const offenders = raw.fontSizes.filter(
        (s) => s.count > 1 && !design.fontSizes.some((a) => Math.abs(a - s.px) < 0.6),
      );
      if (offenders.length === 0) return null;
      return {
        title: `${plural(offenders.length, 'font size')} off the documented scale`,
        evidence: offenders.slice(0, 6).map((s) => `${s.px}px on ${s.count} elements`),
      };
    },
  },
];

/* =========================================================== visual details */

const visualRules: Rule[] = [
  {
    id: 'visual.side-tab-border',
    title: 'Side-tab accent border',
    kind: 'slop',
    severity: 'major',
    dimension: 'layout',
    fix: 'Remove it. A thick coloured stripe down one edge of a card is the most recognisable single tell there is. If the card needs a status, use the text, an icon, or a tinted surface.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.sideTabBorder, (n) => `${plural(n, 'card')} with a thick coloured border on one edge`),
  },
  {
    id: 'visual.border-on-rounded',
    title: 'Thick accent border fighting a rounded corner',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Pick one. A thick border wants a square corner; a rounded corner wants a hairline or no border at all.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.borderOnRounded, (n) => `${plural(n, 'element')} with a thick border on a rounded corner`),
  },
  {
    id: 'visual.hairline-with-wide-shadow',
    title: 'Hairline border plus a wide soft shadow',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Commit to one: a defined edge, or a soft elevation. Both at once is a generated-UI signature.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.hairlineWithWideShadow, (n) => `${plural(n, 'surface')} with both a hairline edge and a diffuse shadow`),
  },
  {
    id: 'visual.decorative-grid',
    title: 'Decorative grid-line background',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'A grid belongs behind a canvas, a map, or a measurement task. Behind marketing copy it is wallpaper. Use product structure or leave the field plain.',
    detect: ({ raw }) => fromSignal(raw.signals.decorativeGrid, (n) => `${plural(n, 'surface')} tiled with a decorative grid`),
  },
  {
    id: 'visual.repeating-stripes',
    title: 'Repeating-gradient stripes as decoration',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Reach for a deliberate texture, or leave the surface plain.',
    detect: ({ raw }) => fromSignal(raw.signals.repeatingGradientStripes, (n) => `${plural(n, 'striped surface')}`),
  },
  {
    id: 'visual.extreme-radius',
    title: 'Cards over-rounded into blobs',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Cards top out around 12-16px. Reserve the full pill for tags and buttons; at 24px and up everything becomes the same soft shape.',
    detect: ({ raw }) => fromSignal(raw.signals.extremeRadius, (n) => `${plural(n, 'card')} at 24px radius or more`),
  },
  {
    id: 'visual.glassmorphism',
    title: 'Frosted glass used as decoration',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Backdrop blur earns its place when something genuinely floats over scrolling content. Everywhere else it is a 2021 costume. Use an opaque surface.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.glassmorphism, (n) => `${plural(n, 'surface')} using backdrop-filter blur`, 2),
  },
  {
    id: 'layout.uniform-radius',
    title: 'One border-radius on every element',
    kind: 'quality',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Scale radius with element size. A 4px control and a 24px panel should not share a corner. Or commit the other way and go fully square.',
    detect({ raw }) {
      if (raw.radii.length !== 1) return null;
      const only = raw.radii[0]!;
      if (only.count < 12) return null;
      return { evidence: [`${only.value} applied to ${only.count} elements`] };
    },
  },
  {
    id: 'layout.default-shadow',
    title: 'The same 10%-black shadow on everything',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Build a two- or three-step elevation scale, tint the shadow with the background hue rather than pure black, and let most surfaces sit flat.',
    detect({ raw }) {
      const soft = raw.shadows.filter((s) => /rgba?\([^)]*0?\.1\s*\)/.test(s.value));
      if (soft.length === 0 || (soft[0]?.count ?? 0) < 6) return null;
      return { evidence: soft.slice(0, 2).map((s) => `${s.value.slice(0, 70)} x${s.count}`) };
    },
  },
];

/* ================================================================ typography */

const typeRules: Rule[] = [
  {
    id: 'type.overused-font',
    title: 'Primary typeface is a default',
    kind: 'slop',
    severity: 'major',
    dimension: 'type',
    fix: 'Pick a face with a point of view and pair it against something structurally different. See references/typography.md for options that are not on every generated page.',
    detect({ raw }) {
      const primary = raw.fontFamilies[0];
      if (!primary || !OVERUSED_FONTS.has(primary.value.toLowerCase())) return null;
      return {
        title: `Primary typeface is "${primary.value}"`,
        evidence: raw.fontFamilies.slice(0, 3).map((f) => `${f.value} on ${f.count} elements`),
      };
    },
  },
  {
    id: 'type.single-family',
    title: 'One typeface doing every job',
    kind: 'slop',
    severity: 'minor',
    dimension: 'type',
    fix: 'Add a second face with a different skeleton for headings or for data. Contrast between faces makes hierarchy legible before a word is read.',
    detect({ raw }) {
      const distinct = new Set(raw.fontFamilies.map((f) => f.value.toLowerCase()));
      if (distinct.size !== 1 || raw.fontFamilies.length === 0) return null;
      return { evidence: [`only "${raw.fontFamilies[0]!.value}" in use`] };
    },
  },
  {
    id: 'type.flat-hierarchy',
    title: 'Type scale is compressed',
    kind: 'slop',
    severity: 'major',
    dimension: 'type',
    fix: 'Open the scale to at least 3x, ideally 4-6x between body and the largest display size. Timid scale jumps are why generated pages read flat.',
    detect({ raw }) {
      const sizes = raw.fontSizes.map((s) => s.px).filter((p) => p > 0);
      if (sizes.length < 2) return null;
      const ratio = Math.max(...sizes) / Math.min(...sizes);
      if (ratio >= 2.6) return null;
      return {
        evidence: [`largest ${Math.max(...sizes)}px vs smallest ${Math.min(...sizes)}px - ${round(ratio, 2)}x range`],
      };
    },
  },
  {
    id: 'type.weak-weight-contrast',
    title: 'Weight range too narrow to build hierarchy',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Use the extremes. 300 against 800 reads as intentional; 400 against 600 reads as an accident.',
    detect({ raw }) {
      const weights = raw.fontWeights.map((w) => w.weight);
      if (weights.length === 0) return null;
      const spread = Math.max(...weights) - Math.min(...weights);
      if (spread >= 300) return null;
      return { evidence: [`weights in use: ${[...new Set(weights)].sort((a, b) => a - b).join(', ')}`] };
    },
  },
  {
    id: 'type.off-scale',
    title: 'Too many distinct font sizes',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Collapse to a 6-8 step modular scale (1.25 or 1.333 ratio) and reference steps by token.',
    detect({ raw }) {
      if (raw.fontSizes.length <= 9) return null;
      return {
        title: `${raw.fontSizes.length} distinct font sizes`,
        evidence: [raw.fontSizes.slice(0, 12).map((s) => `${s.px}px`).join(', ')],
      };
    },
  },
  {
    id: 'type.eyebrow-label',
    title: 'Tracked uppercase eyebrow above a heading',
    kind: 'slop',
    severity: 'minor',
    dimension: 'type',
    fix: 'Delete it, or fold the words into the heading. A kicker borrows editorial authority the page has not earned.',
    detect: ({ raw }) => fromSignal(raw.signals.eyebrowLabel, (n) => `${plural(n, 'eyebrow label')} above a heading`),
  },
  {
    id: 'type.icon-tile-above-heading',
    title: 'Rounded icon tile stacked above a heading',
    kind: 'slop',
    severity: 'major',
    dimension: 'type',
    fix: 'This exact shape is the universal AI feature-card template. Put the icon beside the heading, let it sit in flow without its own container, or drop it.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.iconTileAboveHeading, (n) => `${plural(n, 'icon tile')} sitting above a heading`),
  },
  {
    id: 'type.italic-serif-display',
    title: 'Italic serif hero headline',
    kind: 'slop',
    severity: 'minor',
    dimension: 'type',
    fix: 'Reads as taste in isolation, but it is now the universal AI-startup hero. Set it roman, or move to a non-serif display face. Editorial registers may legitimately want it.',
    detect: ({ raw }) => fromSignal(raw.signals.italicSerifDisplay, () => 'Oversized italic serif as the hero headline'),
  },
  {
    id: 'type.oversized-hero-headline',
    title: 'Long headline blown up to display size',
    kind: 'slop',
    severity: 'minor',
    dimension: 'type',
    fix: 'A punchy one or two-word headline at that size is fine. A full sentence at display size eats the fold. Set it smaller, or tighten the copy.',
    detect: ({ raw }) => fromSignal(raw.signals.oversizedHeroHeadline, () => 'Full-sentence headline at display size'),
  },
  {
    id: 'type.crushed-tracking',
    title: 'Letter spacing tightened past legibility',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Tighten display type optically, around -0.02em. Past -0.05em the characters stop keeping their own shapes.',
    detect: ({ raw }) => fromSignal(raw.signals.crushedTracking, (n) => `${plural(n, 'heading')} with crushed tracking`),
  },
  {
    id: 'type.wide-tracking-body',
    title: 'Wide letter spacing on body copy',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Tracking above 0.05em breaks the character groupings the eye reads by. Reserve it for short uppercase labels.',
    detect: ({ raw }) => fromSignal(raw.signals.wideTrackingBody, (n) => `${plural(n, 'passage')} with wide tracking`),
  },
  {
    id: 'type.all-caps-body',
    title: 'Long passages set in uppercase',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'We recognise words by their shape, and caps removes the ascenders and descenders that shape comes from. Reserve uppercase for short labels.',
    detect: ({ raw }) => fromSignal(raw.signals.allCapsBody, (n) => `${plural(n, 'uppercase passage')}`),
  },
  {
    id: 'type.justified-text',
    title: 'Justified text without hyphenation',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Browsers hyphenate badly, so justification produces rivers of white space. Use text-align: left, or turn on hyphens: auto if you must justify.',
    detect: ({ raw }) => fromSignal(raw.signals.justifiedText, (n) => `${plural(n, 'justified passage')}`),
  },
  {
    id: 'type.undersized-functional-text',
    title: 'Functional text under 11px',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Links, labels, and table cells fail on small and high-density screens below 11px. Keep them readable.',
    detect: ({ raw }) => fromSignal(raw.signals.undersizedFunctionalText, (n) => `${plural(n, 'label or link')} under 11px`),
  },
  {
    id: 'type.tiny-body-text',
    title: 'Body copy under 12px',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Use at least 14px for body content; 16px is the comfortable default.',
    detect: ({ raw }) => fromSignal(raw.signals.tinyBodyText, (n) => `${plural(n, 'passage')} of body copy under 12px`),
  },
  {
    id: 'type.tight-leading',
    title: 'Cramped leading on body copy',
    kind: 'quality',
    severity: 'minor',
    dimension: 'type',
    fix: 'Body copy wants 1.5-1.7. Reserve tight leading for display sizes, where it actually helps.',
    detect({ raw }) {
      if (raw.text.tightLineHeight === 0) return null;
      return {
        title: `${plural(raw.text.tightLineHeight, 'paragraph')} set under 1.4 line-height`,
        evidence: ['body copy needs room between lines to track back'],
      };
    },
  },
  {
    id: 'type.measure-too-wide',
    title: 'Text runs past a readable measure',
    kind: 'quality',
    severity: 'major',
    dimension: 'type',
    fix: 'Cap prose containers with max-width: 65ch. The eye loses its place tracking back past ~80 characters.',
    detect({ raw }) {
      if (raw.text.linesTooLong === 0) return null;
      return {
        title: `${plural(raw.text.linesTooLong, 'text block')} past a readable measure`,
        evidence: [`widest measure is about ${raw.text.maxMeasureCh} characters (comfortable is 45-75)`],
      };
    },
  },
];

/* ============================================================ colour */

const colorRules: Rule[] = [
  {
    id: 'color.signature-hex',
    title: 'Palette contains the exact colours every generated interface uses',
    kind: 'slop',
    severity: 'major',
    dimension: 'color',
    fix: 'Replace with a hue chosen for this product. Call design_system with a seed that means something - a material, a place, a photograph.',
    detect({ raw }) {
      const found: string[] = [];
      for (const used of raw.colors) {
        const parsed = parseColor(used.value);
        if (!parsed) continue;
        const hex = toHex(parsed).toLowerCase();
        const label = SLOP_HEXES[hex];
        if (label && !found.some((f) => f.startsWith(hex))) found.push(`${hex} (${label})`);
      }
      return found.length > 0 ? { evidence: found.slice(0, 5) } : null;
    },
  },
  {
    id: 'color.slop-hue',
    title: 'Dominant accent sits in the indigo/violet band',
    kind: 'slop',
    severity: 'major',
    dimension: 'color',
    fix: "Rotate the accent out of 258-310 degrees. That band traces to Tailwind's indigo-500 default and now reads as nobody having picked a colour.",
    detect({ raw }) {
      const accents = raw.colors
        .map((c) => ({ ...c, oklch: parseColor(c.value) }))
        .filter((c) => c.oklch && c.oklch.c > 0.09)
        .sort((a, b) => b.area - a.area);
      const dominant = accents[0];
      if (!dominant?.oklch) return null;
      const hue = dominant.oklch.h;
      if (hue < 258 || hue > 310) return null;
      return {
        evidence: [`${dominant.value} - hue ${Math.round(hue)} degrees, chroma ${round(dominant.oklch.c, 3)}`],
      };
    },
  },
  {
    id: 'color.slop-gradient',
    title: 'Blue-to-purple gradient present',
    kind: 'slop',
    severity: 'major',
    dimension: 'color',
    fix: 'Drop it. For depth, use a low-chroma tonal wash in the brand hue, a grain layer, or a hard-edged geometric field.',
    detect({ raw }) {
      const found: string[] = [];
      for (const gradient of raw.gradients) {
        const stops = (gradient.value.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}\b|oklch\([^)]+\)/g) ?? [])
          .map((s) => parseColor(s))
          .filter((c): c is NonNullable<typeof c> => c !== null && c.c > 0.04);
        if (stops.length < 2) continue;
        const hues = stops.map((s) => s.h);
        if (hues.some((h) => h >= 230 && h <= 275) && hues.some((h) => h >= 275 && h <= 330)) {
          found.push(gradient.value.slice(0, 80));
        }
      }
      return found.length > 0 ? { evidence: found.slice(0, 3) } : null;
    },
  },
  {
    id: 'color.gradient-text',
    title: 'Gradient text',
    kind: 'slop',
    severity: 'major',
    dimension: 'color',
    fix: 'Gradient headings and metrics are decorative rather than meaningful, and they wreck scannability. Use a solid colour.',
    detect: ({ raw }) => fromSignal(raw.signals.gradientText, (n) => `${plural(n, 'gradient-filled text element')}`),
  },
  {
    id: 'color.radial-halo',
    title: 'Saturated radial glow behind a section',
    kind: 'slop',
    severity: 'minor',
    dimension: 'color',
    fix: 'The ambient orb is a generated-UI shortcut for atmosphere. Light the composition with real material, or let the surface stand on its own.',
    detect: ({ raw }) => fromSignal(raw.signals.radialHalo, (n) => `${plural(n, 'radial glow')} used as background`),
  },
  {
    id: 'color.glow-on-dark',
    title: 'Dark surfaces with coloured glow shadows',
    kind: 'slop',
    severity: 'major',
    dimension: 'color',
    fix: 'Neon-on-dark is the default "cool" look of generated UI. Use subtle, purposeful lighting, or skip the dark theme entirely.',
    detect({ raw }) {
      if (!raw.isDarkPage) return null;
      return fromSignal(raw.signals.glowShadow, (n) => `${plural(n, 'element')} with a coloured glow on a dark page`);
    },
  },
  {
    id: 'color.cream-default',
    title: 'Warm cream page background',
    kind: 'slop',
    severity: 'minor',
    dimension: 'color',
    fix: 'Cream with a serif display and a terracotta accent is the reflex "tasteful" answer in 2026, and it appears regardless of subject. Keep it only if the brief actually asked for warmth.',
    detect: ({ raw }) => fromSignal(raw.signals.creamBackground, () => 'Page ground is the default warm off-white'),
  },
  {
    id: 'color.grey-on-colored',
    title: 'Grey text on a coloured background',
    kind: 'quality',
    severity: 'major',
    dimension: 'color',
    fix: 'Grey washes out over colour. Use a much darker or lighter shade of the background hue instead, so the text stays in the same colour family.',
    detect: ({ raw }) => fromSignal(raw.signals.greyOnColored, (n) => `${plural(n, 'grey text element')} on a coloured surface`),
  },
  {
    id: 'color.timid',
    title: 'No colour saturated enough to carry emphasis',
    kind: 'slop',
    severity: 'major',
    dimension: 'color',
    fix: 'Commit to one dominant colour at real saturation and let everything else recede. Evenly-distributed pastels read as indecision, not restraint.',
    detect({ raw }) {
      const chromas = raw.colors.map((c) => parseColor(c.value)?.c ?? 0);
      if (chromas.length === 0) return null;
      const max = Math.max(...chromas);
      if (max >= 0.075 || chromas.every((c) => c === 0)) return null;
      return { evidence: [`highest chroma on the page is ${round(max, 3)}; an accent needs about 0.12`] };
    },
  },
  {
    id: 'color.hue-sprawl',
    title: 'Too many unrelated hue families',
    kind: 'quality',
    severity: 'minor',
    dimension: 'color',
    fix: 'Cut to one brand hue, one accent 120-180 degrees away, and semantic colours. Everything else should be a tinted neutral.',
    detect({ raw }) {
      const bins = new Set<number>();
      for (const used of raw.colors) {
        const parsed = parseColor(used.value);
        if (parsed && parsed.c > 0.05) bins.add(Math.floor(parsed.h / 30));
      }
      if (bins.size <= 5) return null;
      return { title: `${bins.size} unrelated hue families in one view`, evidence: [`chromatic colours span ${bins.size} 30-degree bins`] };
    },
  },
  {
    id: 'color.flat-neutrals',
    title: 'Greys are pure grey',
    kind: 'slop',
    severity: 'minor',
    dimension: 'color',
    fix: 'Tint neutrals toward the brand hue at chroma 0.005-0.012. Untinted greys are the quiet tell that a palette was assembled rather than designed.',
    detect({ raw }) {
      const parsed = raw.colors.map((c) => ({ ...c, oklch: parseColor(c.value) })).filter((c) => c.oklch);
      const neutrals = parsed.filter((c) => c.oklch!.c < 0.004 && c.oklch!.l > 0.08 && c.oklch!.l < 0.98);
      const chromatic = parsed.filter((c) => c.oklch!.c > 0.05);
      if (neutrals.length < 3 || chromatic.length === 0) return null;
      return { evidence: neutrals.slice(0, 4).map((n) => n.value) };
    },
  },
  {
    id: 'color.contrast',
    title: 'Text below WCAG AA contrast',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'color',
    fix: 'Darken the foreground or lighten the surface until the ratio clears 4.5:1 (3:1 for text at 24px or 18.66px bold). Use contrast_check to find the nearest passing shade.',
    detect({ raw }) {
      const failures: string[] = [];
      const seen = new Set<string>();
      for (const sample of raw.contrastSamples) {
        const key = `${sample.foreground}|${sample.background}|${sample.fontSizePx}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const ratio = contrast(sample.foreground, sample.background);
        const large = sample.fontSizePx >= 24 || (sample.fontSizePx >= 18.66 && sample.fontWeight >= 700);
        const required = large ? 3 : 4.5;
        if (ratio < required) {
          failures.push(
            `${sample.selector} "${sample.text}" - ${ratio}:1, needs ${required}:1 (${sample.foreground} on ${sample.background})`,
          );
        }
      }
      if (failures.length === 0) return null;
      return {
        title: `${plural(failures.length, 'text/background pair')} below WCAG AA`,
        evidence: failures.slice(0, 6),
      };
    },
  },
];

/* ============================================================ layout & space */

const layoutRules: Rule[] = [
  {
    id: 'layout.three-card-row',
    title: 'The three-equal-cards-with-icons row',
    kind: 'slop',
    severity: 'major',
    dimension: 'layout',
    fix: 'Break the triptych. Give the strongest item more space, stagger the rhythm, or let the content decide the count. If there really are three equal things, vary their internal composition.',
    detect({ raw }) {
      const rows = raw.cardRows.filter(
        (r) => r.childCount === 3 && r.equalWidths && r.childrenHaveIcon && r.childrenHaveHeading,
      );
      if (rows.length === 0) return null;
      return { evidence: rows.slice(0, 3).map((r) => r.selector) };
    },
  },
  {
    id: 'layout.identical-card-grid',
    title: 'Endless grid of identical cards',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Same-sized icon-heading-text cards repeated down the page is the default generated homepage. Vary weight, size, or composition so the eye has somewhere to land.',
    detect({ raw }) {
      const uniform = raw.cardRows.filter((r) => r.equalWidths && r.childrenHaveHeading && r.childCount >= 3);
      if (uniform.length < 2) return null;
      return {
        title: `${plural(uniform.length, 'row')} of identical cards`,
        evidence: uniform.slice(0, 4).map((r) => `${r.selector} - ${r.childCount} equal cards`),
      };
    },
  },
  {
    id: 'layout.nested-cards',
    title: 'Cards nested inside cards',
    kind: 'slop',
    severity: 'major',
    dimension: 'layout',
    fix: 'Flatten it. Use spacing, typography, and dividers to group things instead of wrapping each level in another bordered box.',
    detect: ({ raw }) => fromSignal(raw.signals.nestedCards, (n) => `${plural(n, 'card')} nested three or more levels deep`),
  },
  {
    id: 'layout.centered-everything',
    title: 'Almost everything is centre-aligned',
    kind: 'quality',
    severity: 'major',
    dimension: 'layout',
    fix: 'Centre a hero if you must; left-align everything the reader has to actually read. Uniform centring removes the vertical edge the eye tracks down the page.',
    detect({ raw }) {
      if (raw.text.blocks < 5) return null;
      const ratio = raw.text.centeredBlocks / raw.text.blocks;
      if (ratio <= 0.6) return null;
      return { evidence: [`${raw.text.centeredBlocks} of ${raw.text.blocks} text blocks centred`] };
    },
  },
  {
    id: 'layout.numbered-labels',
    title: 'Tiny numbered section labels',
    kind: 'slop',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Numbering is only honest when the content is genuinely a sequence. Otherwise it imitates editorial structure without adding any. Let hierarchy and rhythm do the sequencing.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.numberedSectionLabels, (n) => `${plural(n, 'tiny sequence number')} used as furniture`, 2),
  },
  {
    id: 'layout.monotonous-spacing',
    title: 'One spacing value used everywhere',
    kind: 'slop',
    severity: 'minor',
    dimension: 'space',
    fix: 'Space is how grouping is communicated. Tight inside a group, generous between groups. One value throughout means nothing is grouped.',
    detect({ raw }) {
      const total = raw.spacings.reduce((sum, s) => sum + s.count, 0);
      if (total < 20 || raw.spacings.length === 0) return null;
      const dominant = raw.spacings[0]!;
      if (dominant.count / total < 0.55) return null;
      return { evidence: [`${dominant.px}px accounts for ${Math.round((dominant.count / total) * 100)}% of all spacing`] };
    },
  },
  {
    id: 'space.off-grid',
    title: 'Spacing values off any 4px grid',
    kind: 'quality',
    severity: 'minor',
    dimension: 'space',
    fix: 'Snap padding, margin and gap to a 4px or 8px scale exposed as tokens. Arbitrary values are what make an interface feel subtly wrong without anyone being able to say why.',
    detect({ raw }) {
      const total = raw.spacings.reduce((sum, s) => sum + s.count, 0);
      if (total === 0) return null;
      const off = raw.spacings.filter((s) => s.px % 4 !== 0);
      const offCount = off.reduce((sum, s) => sum + s.count, 0);
      const ratio = offCount / total;
      if (ratio <= 0.3) return null;
      return {
        title: `${Math.round(ratio * 100)}% of spacing values are off a 4px grid`,
        evidence: [off.slice(0, 8).map((s) => `${s.px}px`).join(', ')],
      };
    },
  },
  {
    id: 'space.too-many-steps',
    title: 'Too many distinct spacing values',
    kind: 'quality',
    severity: 'minor',
    dimension: 'space',
    fix: 'A design system needs about 8 spacing steps. More means spacing is being chosen per element rather than per relationship.',
    detect({ raw }) {
      if (raw.spacings.length <= 16) return null;
      return {
        title: `${raw.spacings.length} distinct spacing values`,
        evidence: [raw.spacings.slice(0, 10).map((s) => `${s.px}px`).join(', ')],
      };
    },
  },
  {
    id: 'layout.cramped-padding',
    title: 'Text pressed against its container edge',
    kind: 'quality',
    severity: 'minor',
    dimension: 'space',
    fix: 'Give bordered or filled containers at least 8px, ideally 12-16px, of inside padding.',
    detect: ({ raw }) => fromSignal(raw.signals.crampedPadding, (n) => `${plural(n, 'container')} with cramped padding`),
  },
  {
    id: 'layout.text-touching-edge',
    title: 'Body text flush against the viewport edge',
    kind: 'quality',
    severity: 'major',
    dimension: 'space',
    fix: 'Wrap content in a container with at least 16px of horizontal padding, or a max-width with auto margins.',
    detect: ({ raw }) => fromSignal(raw.signals.textTouchingEdge, (n) => `${plural(n, 'passage')} touching the viewport edge`),
  },
  {
    id: 'layout.heading-crowded',
    title: 'Heading closer to the block above than to its own content',
    kind: 'quality',
    severity: 'minor',
    dimension: 'space',
    fix: 'A heading belongs to what follows it. Give it more space above than below.',
    detect: ({ raw }) => fromSignal(raw.signals.headingCrowded, (n) => `${plural(n, 'heading')} crowded against the previous block`),
  },
  {
    id: 'layout.horizontal-overflow',
    title: 'Elements overflow the viewport horizontally',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'layout',
    fix: 'Find the fixed width or unwrapped flex row causing it. Horizontal scroll on a page that should not scroll horizontally is a bug, not a style choice.',
    detect({ raw }) {
      if (raw.overflowX.length === 0) return null;
      return {
        title: `${plural(raw.overflowX.length, 'element')} overflowing the viewport`,
        evidence: raw.overflowX.slice(0, 6),
      };
    },
  },
  {
    id: 'layout.occluded-text',
    title: 'Text covered by an overlapping element',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'layout',
    fix: 'Move the layer or give the text clear space. Readable copy hidden under an opaque box is a defect, not a style.',
    detect: ({ raw }) => fromSignal(raw.signals.occludedText, (n) => `${plural(n, 'text block')} covered by an opaque layer`),
  },
  {
    id: 'layout.clipped-positioned-child',
    title: 'Overflow container clipping a popover or menu',
    kind: 'quality',
    severity: 'major',
    dimension: 'layout',
    fix: 'An overflow:hidden ancestor cuts off tooltips, menus, and dropdowns that need to escape. Let the overflow be visible, or portal the layer out of the clip.',
    detect: ({ raw }) => fromSignal(raw.signals.clippedPositionedChild, (n) => `${plural(n, 'positioned layer')} clipped by its container`),
  },
  {
    id: 'layout.lopsided-first-viewport',
    title: 'One opening column runs far past its neighbour',
    kind: 'quality',
    severity: 'minor',
    dimension: 'layout',
    fix: 'Balance the columns, or let the longer one continue below the row instead of leaving dead space beside it.',
    detect: ({ raw }) => fromSignal(raw.signals.lopsidedFirstViewport, (n) => `${plural(n, 'lopsided column pair')} in the first viewport`),
  },
  {
    id: 'layout.flush-scroller-cards',
    title: 'Scroller cards flush against the panel edge',
    kind: 'quality',
    severity: 'minor',
    dimension: 'space',
    fix: 'Give the scroller a matching inset on both sides so the first and last cards do not lose an edge.',
    detect: ({ raw }) => fromSignal(raw.signals.flushScrollerCards, (n) => `${plural(n, 'scroller')} with no leading inset`),
  },
];

/* ================================================================== motion */

const motionRules: Rule[] = [
  {
    id: 'motion.no-reduced-motion',
    title: 'Animation with no prefers-reduced-motion escape',
    kind: 'quality',
    severity: 'major',
    dimension: 'motion',
    fix: 'Wrap motion in @media (prefers-reduced-motion: no-preference), or neutralise it in a reduce block. For users with vestibular disorders this is a health issue, not a preference.',
    detect({ raw }) {
      if (raw.motion.animatedElements === 0 || raw.motion.reducedMotionRuleFound) return null;
      return {
        title: `${plural(raw.motion.animatedElements, 'animated element')} with no reduced-motion guard`,
        evidence: ['no @media (prefers-reduced-motion) rule found in readable stylesheets'],
      };
    },
  },
  {
    id: 'motion.pulsing-dot',
    title: 'Decorative pulsing status dot',
    kind: 'slop',
    severity: 'minor',
    dimension: 'motion',
    fix: 'A pulse makes static status look live. Animate only when the data behind it is actually changing.',
    detect: ({ raw }) => fromSignal(raw.motion.pulsingDots, (n) => `${plural(n, 'pulsing dot')}`),
  },
  {
    id: 'motion.blinking-caret',
    title: 'Fake blinking cursor on non-editable copy',
    kind: 'slop',
    severity: 'minor',
    dimension: 'motion',
    fix: 'A caret on a hero headline makes prose cosplay as a terminal. Let real inputs own the cursor.',
    detect: ({ raw }) => fromSignal(raw.motion.blinkingCarets, (n) => `${plural(n, 'decorative caret animation')}`),
  },
  {
    id: 'motion.marquee',
    title: 'Auto-scrolling marquee',
    kind: 'slop',
    severity: 'minor',
    dimension: 'motion',
    fix: 'Continuous auto-scroll demands attention and hides content behind time. Let people read at their own pace.',
    detect: ({ raw }) => fromSignal(raw.motion.marquees, (n) => `${plural(n, 'auto-scrolling marquee')}`),
  },
  {
    id: 'motion.bounce-easing',
    title: 'Bounce or elastic easing on interface elements',
    kind: 'slop',
    severity: 'minor',
    dimension: 'motion',
    fix: 'A dialog that springs in and overshoots feels dated. Reserve spring physics for things that are actually physical; ease interface motion out smoothly.',
    detect: ({ raw }) => fromSignal(raw.motion.bounceEasing, (n) => `${plural(n, 'element')} using overshoot easing`),
  },
  {
    id: 'motion.layout-property-animation',
    title: 'Animating layout properties',
    kind: 'quality',
    severity: 'major',
    dimension: 'motion',
    fix: 'Animating width, height, padding or margin forces layout on every frame. Use transform and opacity, or grid-template-rows for height.',
    detect: ({ raw }) => fromSignal(raw.motion.layoutPropertyAnimation, (n) => `${plural(n, 'animation')} driving a layout property`),
  },
  {
    id: 'motion.image-hover-transform',
    title: 'Images scaling or rotating on hover',
    kind: 'slop',
    severity: 'minor',
    dimension: 'motion',
    fix: 'A recurring generated-UI signature. Let imagery sit still, or use a subtler interaction that means something.',
    detect: ({ raw }) => fromSignal(raw.motion.imageHoverTransform, (n) => `${plural(n, 'image hover transform')}`),
  },
  {
    id: 'motion.perpetual',
    title: 'Elements animating forever',
    kind: 'quality',
    severity: 'minor',
    dimension: 'motion',
    fix: 'Perpetual motion costs attention and battery for no information. Keep looping animation for genuine progress indicators; everything else should resolve.',
    detect({ raw }) {
      if (raw.motion.infiniteAnimations <= 2) return null;
      return {
        title: `${plural(raw.motion.infiniteAnimations, 'element')} animating forever`,
        evidence: ['animation-iteration-count: infinite'],
      };
    },
  },
  {
    id: 'motion.transition-all',
    title: 'transition: all',
    kind: 'quality',
    severity: 'minor',
    dimension: 'motion',
    fix: 'Name the properties. transition: all animates layout properties by accident and is a common source of surprise reflows.',
    detect({ raw }) {
      if (raw.motion.transitionAllCount <= 4) return null;
      return {
        title: `transition: all on ${raw.motion.transitionAllCount} elements`,
        evidence: ['transition-property resolves to "all"'],
      };
    },
  },
];

/* ==================================================================== copy */

const copyRules: Rule[] = [
  {
    id: 'copy.em-dash-overuse',
    title: 'Em-dash density above the human range',
    kind: 'slop',
    severity: 'minor',
    dimension: 'copy',
    fix: 'Human published prose runs 4-10 dash constructions per 1,000 words. Past 20 it reads as machine cadence. Use commas, colons, or full stops.',
    detect({ raw }) {
      const text = raw.visibleText;
      const wordCount = words(text).length;
      if (wordCount < 120) return null;
      const dashes = (text.match(/[—–]/g) ?? []).length;
      const per1000 = (dashes / wordCount) * 1000;
      if (per1000 < 20) return null;
      return {
        title: `${dashes} em-dashes across ${wordCount} words`,
        evidence: [`${round(per1000, 1)} per 1,000 words; the most dash-heavy human novels sit near 10`],
      };
    },
  },
  {
    id: 'copy.marketing-buzzword',
    title: 'Generic SaaS buzzwords',
    kind: 'slop',
    severity: 'major',
    dimension: 'copy',
    fix: 'Pick a specific verb and noun that says what the product literally does. "Supercharge your workflow" describes nothing.',
    detect({ raw }) {
      const lower = raw.visibleText.toLowerCase();
      const found = BUZZWORDS.filter((word) => lower.includes(word));
      if (found.length < 2) return null;
      return {
        title: `${plural(found.length, 'marketing buzzword')} in the copy`,
        evidence: [found.slice(0, 10).join(', ')],
      };
    },
  },
  {
    id: 'copy.aphoristic-cadence',
    title: 'Manufactured-contrast copy',
    kind: 'slop',
    severity: 'minor',
    dimension: 'copy',
    fix: 'Once is a rhetorical choice. Repeated, "Not a feature. A platform." is machine cadence wearing a voice. Say the thing directly.',
    detect({ raw }) {
      const text = raw.visibleText;
      const patterns = [
        /\bnot (?:just |only )?(?:a|an|about)\b[^.!?\n]{0,60}[.—-]\s*(?:it'?s|a|an)\b/gi,
        /\bno [a-z]+[,.]? no [a-z]+[,.]?\s*(?:just|only)\b/gi,
        /\bit'?s not\b[^.!?\n]{0,50}\bit'?s\b/gi,
      ];
      let hits = 0;
      const examples: string[] = [];
      for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
          hits += 1;
          if (examples.length < 3) examples.push(`"${match[0].trim().slice(0, 60)}"`);
        }
      }
      if (hits < 2) return null;
      return { title: `${plural(hits, 'manufactured-contrast construction')}`, evidence: examples };
    },
  },
  {
    id: 'copy.theater-framing',
    title: '"Theater" framing',
    kind: 'slop',
    severity: 'minor',
    dimension: 'copy',
    fix: 'Dismissing something as theater is a recurring generated-copy tic. Say plainly what the thing does or does not do.',
    detect({ raw }) {
      const matches = [...raw.visibleText.matchAll(THEATER_WORDS)];
      if (matches.length === 0) return null;
      return { evidence: matches.slice(0, 3).map((m) => `"${m[0]}"`) };
    },
  },
  {
    id: 'copy.repeated-text',
    title: 'The same label repeated inside one container',
    kind: 'quality',
    severity: 'minor',
    dimension: 'copy',
    fix: 'Label, sublabel, helper text and hint all saying the same thing is noise. Keep it once, where it matters.',
    detect: ({ raw }) =>
      fromSignal(raw.signals.repeatedTextInContainer, (n) => `${plural(n, 'container')} repeating the same label`),
  },
  {
    id: 'copy.weightless-headline',
    title: 'Headline that could belong to any product',
    kind: 'slop',
    severity: 'minor',
    dimension: 'copy',
    fix: 'Write the specific claim. If the headline would work unchanged on a competitor\'s page, it says nothing.',
    detect({ raw }) {
      const lines = sentences(raw.visibleText).slice(0, 12);
      const templates = [
        /^build (?:faster|better|smarter)/i,
        /^ship (?:faster|smarter|better)/i,
        /^the (?:all-in-one|complete|modern|future) [a-z ]+ (?:platform|solution|tool)/i,
        /^everything you need to/i,
        /^the (?:easiest|fastest|simplest) way to/i,
        /^your [a-z ]+, reimagined/i,
        /^where [a-z ]+ meets [a-z ]+$/i,
      ];
      const found = lines.filter((line) => templates.some((t) => t.test(line.trim())));
      if (found.length === 0) return null;
      return { evidence: found.slice(0, 3).map((f) => `"${f.slice(0, 70)}"`) };
    },
  },
];

/* ================================================================= imagery */

const imageryRules: Rule[] = [
  {
    id: 'imagery.shape-assembled',
    title: 'Illustration assembled from generic SVG shapes',
    kind: 'slop',
    severity: 'minor',
    dimension: 'imagery',
    fix: 'Hand-coded scenes and mascots read as amateur doodles, not whimsy. Use real illustration or photography, or ship no illustration at all.',
    detect({ raw }) {
      if (raw.media.shapeAssembledSvg.length === 0) return null;
      return {
        title: `${plural(raw.media.shapeAssembledSvg.length, 'shape-assembled illustration')}`,
        evidence: evidenceFrom(raw.media.shapeAssembledSvg),
      };
    },
  },
  {
    id: 'imagery.broken-src',
    title: 'Broken or placeholder image',
    kind: 'quality',
    severity: 'major',
    dimension: 'imagery',
    fix: 'An empty, missing, or placeholder src ships as a broken-image box. Use a real asset or remove the tag.',
    detect({ raw }) {
      if (raw.media.brokenSrc.length === 0) return null;
      return {
        title: `${plural(raw.media.brokenSrc.length, 'image')} with a broken or placeholder source`,
        evidence: evidenceFrom(raw.media.brokenSrc),
      };
    },
  },
];

/* ============================================================ state & a11y */

const stateRules: Rule[] = [
  {
    id: 'a11y.script-error',
    title: 'Uncaught script error on load',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'a11y',
    fix: 'Fix it before judging the interface. An uncaught load error can break interactions and hide content, and every other finding is suspect until it is gone.',
    detect({ raw }) {
      if (raw.consoleErrors === 0) return null;
      return {
        title: `${plural(raw.consoleErrors, 'console error')} during load`,
        evidence: ['see the browser console output returned alongside this report'],
      };
    },
  },
  {
    id: 'a11y.invisible-at-rest',
    title: 'Content shipped invisible',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'a11y',
    fix: 'Reveal code left content at opacity 0 with no handler to bring it back. Ship content visible, then enhance its entrance.',
    detect: ({ raw }) => fromSignal(raw.signals.invisibleAtRest, (n) => `${plural(n, 'block')} of content sitting at opacity 0`),
  },
  {
    id: 'a11y.no-focus-indicator',
    title: 'Focus outline removed with nothing in its place',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'a11y',
    fix: 'Add :focus-visible with a 2px ring at 3:1 against its surround, plus an offset. Removing outlines without a replacement makes the interface unusable by keyboard.',
    detect({ raw }) {
      if (raw.interactive.missingFocusStyle.length <= 3) return null;
      return {
        title: `${plural(raw.interactive.missingFocusStyle.length, 'interactive element')} with no focus indicator`,
        evidence: raw.interactive.missingFocusStyle.slice(0, 5),
      };
    },
  },
  {
    id: 'state.small-targets',
    title: 'Interactive targets under 24px',
    kind: 'quality',
    severity: 'major',
    dimension: 'state',
    fix: 'WCAG 2.2 SC 2.5.8 sets 24x24 CSS px as the floor; 44x44 is comfortable on touch. Grow the hit area with padding, not the icon.',
    detect({ raw }) {
      if (raw.interactive.smallTargets.length === 0) return null;
      return {
        title: `${plural(raw.interactive.smallTargets.length, 'target')} under 24x24px`,
        evidence: raw.interactive.smallTargets.slice(0, 5).map((t) => `${t.selector} - ${t.width}x${t.height}`),
      };
    },
  },
  {
    id: 'state.unlabeled-fields',
    title: 'Form fields with no programmatic label',
    kind: 'quality',
    severity: 'blocker',
    dimension: 'state',
    fix: 'Every field needs a <label for>, a wrapping label, or aria-label. A placeholder is not a label; it disappears the moment someone types.',
    detect({ raw }) {
      if (raw.forms.unlabeled.length === 0) return null;
      return {
        title: `${plural(raw.forms.unlabeled.length, 'form field')} with no label`,
        evidence: raw.forms.unlabeled.slice(0, 5),
      };
    },
  },
  {
    id: 'state.required-not-marked',
    title: 'Required fields not visibly marked',
    kind: 'quality',
    severity: 'major',
    dimension: 'state',
    fix: 'Mark required fields visibly and in the accessibility tree. Finding out on submit is the most common self-inflicted form failure.',
    detect({ raw }) {
      const { requiredTotal, requiredMarked } = raw.forms;
      if (requiredTotal === 0 || requiredMarked >= requiredTotal) return null;
      return {
        title: `${plural(requiredTotal - requiredMarked, 'required field')} with no visible marker`,
        evidence: [`${requiredMarked} of ${requiredTotal} required fields carry an indicator`],
      };
    },
  },
  {
    id: 'state.no-error-region',
    title: 'Form has nowhere to show an error',
    kind: 'quality',
    severity: 'major',
    dimension: 'state',
    fix: 'Add a live region per field plus a summary at the top of the form. A form without an error state has only been tested on the happy path.',
    detect({ raw }) {
      if (raw.forms.fieldCount === 0 || raw.forms.hasErrorRegion) return null;
      return { evidence: ['no [role="alert"], [aria-live], or [aria-invalid] anywhere on the page'] };
    },
  },
  {
    id: 'state.no-validation',
    title: 'No validation constraints on any field',
    kind: 'quality',
    severity: 'major',
    dimension: 'state',
    fix: 'Declare constraints in HTML so the browser enforces them and assistive tech announces them, then layer custom messaging on top.',
    detect({ raw }) {
      if (!raw.forms.hasNoValidationAttrs) return null;
      return {
        evidence: [`${raw.forms.fieldCount} fields, none with required/pattern/min/max/minlength`],
      };
    },
  },
  {
    id: 'a11y.no-h1',
    title: 'No h1 on the page',
    kind: 'quality',
    severity: 'major',
    dimension: 'a11y',
    fix: 'Every page needs exactly one h1 naming what the page is. Screen-reader users and crawlers both start there.',
    detect({ raw }) {
      if (raw.headings.h1Count !== 0) return null;
      return { evidence: [`heading levels found: ${raw.headings.levels.join(', ') || 'none'}`] };
    },
  },
  {
    id: 'a11y.multiple-h1',
    title: 'More than one h1',
    kind: 'quality',
    severity: 'minor',
    dimension: 'a11y',
    fix: 'Demote all but the primary heading. Multiple h1s flatten the document outline.',
    detect({ raw }) {
      if (raw.headings.h1Count <= 1) return null;
      return {
        title: `${raw.headings.h1Count} h1 elements`,
        evidence: [`heading levels: ${raw.headings.levels.join(', ')}`],
      };
    },
  },
  {
    id: 'a11y.heading-skip',
    title: 'Heading levels skip',
    kind: 'quality',
    severity: 'minor',
    dimension: 'a11y',
    fix: 'Do not jump a level to get a size. Use the correct level and style it with a token.',
    detect({ raw }) {
      if (raw.headings.skips.length === 0) return null;
      return { evidence: raw.headings.skips.slice(0, 4) };
    },
  },
  {
    id: 'a11y.missing-alt',
    title: 'Images with no alt attribute',
    kind: 'quality',
    severity: 'major',
    dimension: 'a11y',
    fix: 'Describe what the image conveys, or use alt="" if it is purely decorative. A missing attribute and an empty one mean different things.',
    detect({ raw }) {
      if (raw.media.missingAlt.length === 0) return null;
      return {
        title: `${plural(raw.media.missingAlt.length, 'image')} with no alt attribute`,
        evidence: raw.media.missingAlt.slice(0, 5),
      };
    },
  },
  {
    id: 'a11y.layout-shift-risk',
    title: 'Images without width and height',
    kind: 'quality',
    severity: 'minor',
    dimension: 'a11y',
    fix: 'Set width and height attributes, or aspect-ratio, so the browser reserves the box and content does not jump under the reader.',
    detect({ raw }) {
      if (raw.media.missingIntrinsicSize === 0) return null;
      return {
        title: `${plural(raw.media.missingIntrinsicSize, 'image')} with no intrinsic size`,
        evidence: ['images with no reserved box shift the layout when they load'],
      };
    },
  },
  {
    id: 'a11y.no-main-landmark',
    title: 'No main landmark',
    kind: 'quality',
    severity: 'minor',
    dimension: 'a11y',
    fix: 'Wrap the primary content in <main>. Landmarks are how keyboard and screen-reader users skip the furniture.',
    detect({ raw }) {
      if (raw.landmarks.main) return null;
      const missing = Object.entries(raw.landmarks)
        .filter(([key, present]) => !present && key !== 'skipLink')
        .map(([key]) => key);
      return { evidence: [`missing landmarks: ${missing.join(', ')}`] };
    },
  },
];

/* ================================================================= registry */

export const RULES: Rule[] = [
  ...systemRules,
  ...visualRules,
  ...typeRules,
  ...colorRules,
  ...layoutRules,
  ...motionRules,
  ...copyRules,
  ...imageryRules,
  ...stateRules,
];

export const RULE_IDS = RULES.map((r) => r.id);

export function ruleById(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id);
}

export function runRules(context: RuleContext, disabled: Set<string> = new Set()): Array<{ rule: Rule; hit: RuleHit }> {
  const results: Array<{ rule: Rule; hit: RuleHit }> = [];
  for (const rule of RULES) {
    if (disabled.has(rule.id)) continue;
    let hit: RuleHit | null = null;
    try {
      hit = rule.detect(context);
    } catch {
      // A rule that throws on a weird page must not take the whole audit down.
      continue;
    }
    if (hit) results.push({ rule, hit });
  }
  return results;
}

export { describe };
