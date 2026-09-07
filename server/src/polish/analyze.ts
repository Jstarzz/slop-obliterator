import type { PolishMeasurements, PolishSignal } from './collect.js';

export type PolishSeverity = 'major' | 'minor';
export type PolishKind = 'slop' | 'quality';
export type PolishDimension = 'icon' | 'space' | 'layout' | 'a11y';

export interface PolishFinding {
  id: string;
  title: string;
  severity: PolishSeverity;
  kind: PolishKind;
  dimension: PolishDimension;
  evidence: string[];
  fix: string;
}

export interface PolishReport {
  score: number;
  findings: PolishFinding[];
  counts: { major: number; minor: number; slop: number; quality: number };
  summary: {
    icons: number;
    iconFamilies: string[];
    spacingSteps: number;
  };
}

interface PolishRule {
  id: string;
  title: string;
  severity: PolishSeverity;
  kind: PolishKind;
  dimension: PolishDimension;
  signal: keyof PolishMeasurements['signals'];
  fix: string;
}

export const POLISH_RULES: readonly PolishRule[] = [
  {
    id: 'icon.emoji-control',
    title: 'Emoji used as a UI icon',
    severity: 'major',
    kind: 'slop',
    dimension: 'icon',
    signal: 'emojiControl',
    fix: 'Replace the emoji with a real vector icon from the bundled Tabler or Lucide set. Emoji rendering changes by OS and instantly makes controls look improvised.',
  },
  {
    id: 'icon.raster-ui-icon',
    title: 'Raster image used as a small UI icon',
    severity: 'major',
    kind: 'quality',
    dimension: 'icon',
    signal: 'rasterUiIcon',
    fix: 'Use an SVG icon. Small PNG/WebP icons blur under scaling, dark mode, zoom, and high-DPI rendering.',
  },
  {
    id: 'icon.unlabeled-button',
    title: 'Icon-only control has no accessible name',
    severity: 'major',
    kind: 'quality',
    dimension: 'a11y',
    signal: 'unlabeledIconButton',
    fix: 'Add an aria-label or visible label, and a tooltip when the action is not universally obvious.',
  },
  {
    id: 'icon.oversized-control-icon',
    title: 'Control icon is comically large for its container',
    severity: 'minor',
    kind: 'quality',
    dimension: 'icon',
    signal: 'oversizedUiIcon',
    fix: 'Keep ordinary control icons around 16-24px and let padding create the hit target. Do not scale the glyph to fill the button.',
  },
  {
    id: 'icon.sibling-size-drift',
    title: 'Sibling icons use visibly different optical sizes',
    severity: 'minor',
    kind: 'quality',
    dimension: 'icon',
    signal: 'inconsistentSiblingIconSize',
    fix: 'Normalize icons in the same control/card family to one optical box, usually 20px or 24px. Size exceptions should be semantic, not accidental.',
  },
  {
    id: 'icon.mixed-families',
    title: 'Multiple incompatible icon families are mixed in one view',
    severity: 'minor',
    kind: 'slop',
    dimension: 'icon',
    signal: 'mixedIconFamilies',
    fix: 'Pick one icon family for the screen. Tabler and Lucide are deliberately treated as compatible here; mixing either with unrelated filled/material/Font Awesome sets is not.',
  },
  {
    id: 'icon.mixed-sibling-styles',
    title: 'Filled and outline icons are mixed inside one sibling group',
    severity: 'minor',
    kind: 'quality',
    dimension: 'icon',
    signal: 'mixedSiblingIconStyles',
    fix: 'Use one visual grammar inside a repeated group. If fill communicates selected state, reserve it only for that state and make the distinction systematic.',
  },
  {
    id: 'icon.repeated-boxed-feature-icons',
    title: 'Every repeated card gets the same boxed icon tile',
    severity: 'major',
    kind: 'slop',
    dimension: 'icon',
    signal: 'repeatedIconTiles',
    fix: 'Stop decorating every card with a rounded icon square. Put the icon inline with the heading, use it only where it carries information, or remove it.',
  },
  {
    id: 'icon.sparkle-decoration',
    title: 'Sparkle glyphs used as generic decoration',
    severity: 'minor',
    kind: 'slop',
    dimension: 'icon',
    signal: 'sparkleDecoration',
    fix: 'Delete generic sparkle furniture unless the product literally means magic, AI generation, or a special effect. Decorative ✨ is one of the cheapest machine-default tells.',
  },
  {
    id: 'space.scale-sprawl',
    title: 'Spacing scale has too many repeated steps',
    severity: 'major',
    kind: 'quality',
    dimension: 'space',
    signal: 'spacingScaleSprawl',
    fix: 'Collapse spacing onto a small deliberate scale. Most interfaces need roughly 6-10 useful steps, not a new value for every component.',
  },
  {
    id: 'space.off-grid-rhythm',
    title: 'Repeated spacing values drift off a coherent rhythm',
    severity: 'minor',
    kind: 'quality',
    dimension: 'space',
    signal: 'offGridSpacing',
    fix: 'Snap recurring padding, margins, and gaps to a 2px/4px token rhythm. Keep odd values only where typography or geometry genuinely demands them.',
  },
  {
    id: 'space.cookie-cutter-sections',
    title: 'Every section uses the same vertical padding recipe',
    severity: 'minor',
    kind: 'slop',
    dimension: 'space',
    signal: 'repeatedSectionPadding',
    fix: 'Vary section rhythm according to hierarchy. A hero, dense proof block, gallery, and CTA should not all be the same 96px slab.',
  },
  {
    id: 'space.card-padding-drift',
    title: 'Sibling cards disagree on internal padding',
    severity: 'major',
    kind: 'quality',
    dimension: 'space',
    signal: 'cardPaddingDrift',
    fix: 'Use one card inset token within the same repeated component. If one card needs different density, make it a different component or state.',
  },
  {
    id: 'layout.control-height-drift',
    title: 'Controls in the same row have mismatched heights',
    severity: 'major',
    kind: 'quality',
    dimension: 'layout',
    signal: 'controlHeightDrift',
    fix: 'Normalize control heights and vertical padding within a button/input group. Optical mismatch is more obvious than a 1-2px color error.',
  },
  {
    id: 'space.heading-body-gap-outlier',
    title: 'Heading-to-body spacing is either crushed or detached',
    severity: 'minor',
    kind: 'quality',
    dimension: 'space',
    signal: 'headingBodyGapOutlier',
    fix: 'Keep body copy visually attached to its heading. For ordinary h2-h4 blocks, roughly 8-32px is a sane starting band; tune from the type size.',
  },
  {
    id: 'layout.pill-soup',
    title: 'The page is drowning in pills and badges',
    severity: 'minor',
    kind: 'slop',
    dimension: 'layout',
    signal: 'pillSoup',
    fix: 'Reserve pill shapes for tags, filters, compact statuses, and controls that genuinely need the silhouette. Plain text beats another capsule.',
  },
  {
    id: 'layout.centered-section-repeat',
    title: 'Nearly every content section uses the same centered stack',
    severity: 'minor',
    kind: 'slop',
    dimension: 'layout',
    signal: 'repeatedCenteredSections',
    fix: 'Break the landing-page template rhythm. Alternate alignment, density, media placement, or information structure based on the content instead of centering every heading and paragraph.',
  },
] as const;

function evidence(signal: PolishSignal): string[] {
  return signal.samples.map((sample) => (sample.detail ? `${sample.selector} - ${sample.detail}` : sample.selector));
}

export function analyzePolish(raw: PolishMeasurements): PolishReport {
  const findings: PolishFinding[] = [];
  for (const rule of POLISH_RULES) {
    const signal = raw.signals[rule.signal];
    if (signal.count === 0) continue;
    findings.push({
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      kind: rule.kind,
      dimension: rule.dimension,
      evidence: evidence(signal),
      fix: rule.fix,
    });
  }

  findings.sort((a, b) => {
    const severity = { major: 0, minor: 1 } as const;
    return severity[a.severity] - severity[b.severity] || a.id.localeCompare(b.id);
  });

  const counts = {
    major: findings.filter((finding) => finding.severity === 'major').length,
    minor: findings.filter((finding) => finding.severity === 'minor').length,
    slop: findings.filter((finding) => finding.kind === 'slop').length,
    quality: findings.filter((finding) => finding.kind === 'quality').length,
  };
  const score = Math.max(0, 100 - counts.major * 10 - counts.minor * 4);
  const iconFamilies = Object.entries(raw.icons.families)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name}:${count}`);

  return {
    score,
    findings,
    counts,
    summary: {
      icons: raw.icons.total,
      iconFamilies,
      spacingSteps: raw.spacing.values.filter((entry) => entry.count >= 2 && entry.px >= 4 && entry.px <= 96).length,
    },
  };
}
