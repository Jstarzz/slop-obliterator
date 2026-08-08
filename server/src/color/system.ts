/**
 * Turns a single decision ("this product is warm and editorial, anchored on
 * terracotta") into a complete, contrast-verified token set.
 *
 * The generator is opinionated on purpose. Every knob it does not expose is a
 * knob a model would otherwise fill with the statistical average.
 */

import {
  buildNeutralRamp,
  buildRamp,
  contrast,
  firstStepMeeting,
  hueDistance,
  judgeSeed,
  lightnessDelta,
  normalizeHue,
  parseColor,
  round,
  suggestHue,
  type Swatch,
} from './oklch.js';

export type Mode = 'light' | 'dark';

export interface SystemInput {
  /** Any CSS colour. Drives the primary ramp. */
  seed: string;
  /** Optional second hue for the accent ramp. Auto-chosen if omitted. */
  accentSeed?: string;
  /** Set true only if the slop-hue guard is a false positive for this brand. */
  allowSlopHue?: boolean;
  /** How saturated the system runs. */
  intensity?: 'restrained' | 'balanced' | 'vivid';
  modes?: Mode[];
  /** Prefix for emitted custom properties. */
  prefix?: string;
}

export interface ContrastCheck {
  pair: string;
  foreground: string;
  background: string;
  ratio: number;
  requires: number;
  lightnessDelta: number;
  passes: boolean;
}

export interface DesignSystem {
  warnings: string[];
  hues: { primary: number; accent: number; neutral: number };
  ramps: Record<string, Swatch[]>;
  tokens: Record<Mode, Record<string, string>>;
  checks: ContrastCheck[];
  css: string;
  tailwind: string;
}

const CHROMA_BY_INTENSITY: Record<NonNullable<SystemInput['intensity']>, number> = {
  restrained: 0.09,
  balanced: 0.145,
  vivid: 0.21,
};

/** Semantic pairs every interface needs and most generated ones forget. */
const REQUIRED_PAIRS: Array<{ fg: string; bg: string; requires: number; label: string }> = [
  { fg: 'text', bg: 'background', requires: 4.5, label: 'body text on page' },
  { fg: 'text-muted', bg: 'background', requires: 4.5, label: 'secondary text on page' },
  { fg: 'text', bg: 'surface', requires: 4.5, label: 'body text on card' },
  { fg: 'text-muted', bg: 'surface', requires: 4.5, label: 'secondary text on card' },
  { fg: 'primary-foreground', bg: 'primary', requires: 4.5, label: 'button label' },
  { fg: 'accent-foreground', bg: 'accent', requires: 4.5, label: 'accent button label' },
  { fg: 'primary', bg: 'background', requires: 3, label: 'primary as a link/border on page' },
  // Decorative rules only need to be perceptible. Control boundaries are held to
  // WCAG 1.4.11's 3:1, which is what border-strong exists for.
  { fg: 'border', bg: 'background', requires: 1.3, label: 'divider visible against page' },
  { fg: 'border-strong', bg: 'background', requires: 3, label: 'input/control boundary (WCAG 1.4.11)' },
  { fg: 'focus-ring', bg: 'background', requires: 3, label: 'focus ring against page' },
  { fg: 'danger', bg: 'background', requires: 4.5, label: 'error text' },
  { fg: 'success', bg: 'background', requires: 4.5, label: 'success text' },
];

export function generateSystem(input: SystemInput): DesignSystem {
  const warnings: string[] = [];
  const prefix = input.prefix ?? 'app';
  const modes: Mode[] = input.modes?.length ? input.modes : ['light', 'dark'];
  const intensity = input.intensity ?? 'balanced';
  const peakChroma = CHROMA_BY_INTENSITY[intensity];

  const parsedSeed = parseColor(input.seed);
  if (!parsedSeed) {
    throw new Error(`Could not parse seed colour "${input.seed}". Use hex, rgb(), hsl(), oklch(), or a CSS colour name.`);
  }

  let primaryHue = parsedSeed.h;
  const verdict = judgeSeed(input.seed);
  if (verdict.isSlop && !input.allowSlopHue) {
    const replacement = suggestHue([], Math.round(parsedSeed.h));
    warnings.push(
      `Seed rejected: ${verdict.reasons.join('; ')}. Substituted hue ${replacement}°. ` +
        `Pass allow_slop_hue if this hue is a real brand decision rather than a default.`,
    );
    primaryHue = replacement;
  } else if (verdict.isSlop) {
    warnings.push(`Seed kept on request, but flagged: ${verdict.reasons.join('; ')}.`);
  }

  // The accent has to be far enough away to read as a second colour rather than
  // as a mistake. Anything under ~90° looks like the primary drifted.
  const MIN_ACCENT_SEPARATION = 90;
  const accentParsed = input.accentSeed ? parseColor(input.accentSeed) : null;
  let accentHue = accentParsed ? accentParsed.h : defaultAccentHue(primaryHue);

  if (hueDistance(accentHue, primaryHue) < MIN_ACCENT_SEPARATION) {
    const shifted = defaultAccentHue(primaryHue);
    warnings.push(
      `Accent hue ${Math.round(accentHue)}° sat ${Math.round(hueDistance(accentHue, primaryHue))}° from primary ${Math.round(primaryHue)}° — too close to read as a second colour. Moved to ${Math.round(shifted)}°.`,
    );
    accentHue = shifted;
  }

  const neutralHue = primaryHue;

  const ramps: Record<string, Swatch[]> = {
    primary: buildRamp({ hue: primaryHue, chroma: peakChroma, hueShift: 14 }),
    accent: buildRamp({ hue: accentHue, chroma: peakChroma * 0.95, hueShift: 12 }),
    neutral: buildNeutralRamp(neutralHue, intensity === 'restrained' ? 0.005 : 0.011),
    success: buildRamp({ hue: 148, chroma: 0.13, hueShift: 10 }),
    warning: buildRamp({ hue: 78, chroma: 0.15, hueShift: 8 }),
    danger: buildRamp({ hue: 26, chroma: 0.17, hueShift: 10 }),
  };

  const tokens: Record<Mode, Record<string, string>> = {
    light: {},
    dark: {},
  };

  for (const mode of modes) {
    tokens[mode] = buildTokens(ramps, mode);
  }

  const checks: ContrastCheck[] = [];
  for (const mode of modes) {
    for (const pair of REQUIRED_PAIRS) {
      const fg = tokens[mode][pair.fg];
      const bg = tokens[mode][pair.bg];
      if (!fg || !bg) continue;
      const ratio = contrast(fg, bg);
      checks.push({
        pair: `${mode}: ${pair.label}`,
        foreground: fg,
        background: bg,
        ratio,
        requires: pair.requires,
        lightnessDelta: lightnessDelta(fg, bg),
        passes: ratio >= pair.requires,
      });
    }
  }

  for (const failed of checks.filter((c) => !c.passes)) {
    warnings.push(
      `${failed.pair} is ${failed.ratio}:1, needs ${failed.requires}:1 (${failed.foreground} on ${failed.background}).`,
    );
  }

  return {
    warnings,
    hues: { primary: round(primaryHue, 1), accent: round(accentHue, 1), neutral: round(neutralHue, 1) },
    ramps,
    tokens,
    checks,
    css: emitCss(tokens, modes, prefix),
    tailwind: emitTailwind(ramps, tokens, prefix),
  };
}

/**
 * Land the accent ~150° away — a complementary-ish relationship that still shares
 * a temperature story — while stepping around the indigo/violet band.
 */
function defaultAccentHue(primaryHue: number): number {
  const candidates = [150, 165, 135, 180, 120, 195, 105, 210].map((offset) =>
    normalizeHue(primaryHue + offset),
  );
  for (const candidate of candidates) {
    const inSlopBand = candidate >= 250 && candidate <= 318;
    if (!inSlopBand) return candidate;
  }
  return suggestHue([primaryHue], Math.round(primaryHue));
}

function step(ramp: Swatch[], value: number): string {
  const found = ramp.find((s) => s.step === value);
  return found?.hex ?? ramp[Math.floor(ramp.length / 2)]?.hex ?? '#000000';
}

function buildTokens(ramps: Record<string, Swatch[]>, mode: Mode): Record<string, string> {
  const n = ramps.neutral!;
  const p = ramps.primary!;
  const a = ramps.accent!;
  const s = ramps.success!;
  const w = ramps.warning!;
  const d = ramps.danger!;

  if (mode === 'light') {
    const primary = step(p, 600);
    const accent = step(a, 600);
    return {
      background: step(n, 50),
      surface: '#ffffff',
      // In light mode elevation is carried by shadow, not by lightness, so a
      // raised surface stays white. Sunken wells go the other way.
      'surface-raised': '#ffffff',
      'surface-sunken': step(n, 100),
      border: step(n, 300),
      'border-strong': pickForContrast(n, step(n, 50), 3, 'darker'),
      text: step(n, 900),
      'text-muted': pickForContrast(n, step(n, 50), 4.5, 'darker'),
      'text-subtle': pickForContrast(n, step(n, 50), 3, 'darker'),
      primary,
      'primary-hover': step(p, 700),
      'primary-foreground': contrast('#ffffff', primary) >= 4.5 ? '#ffffff' : step(p, 950),
      'primary-subtle': step(p, 100),
      accent,
      'accent-foreground': contrast('#ffffff', accent) >= 4.5 ? '#ffffff' : step(a, 950),
      'accent-subtle': step(a, 100),
      success: pickForContrast(s, step(n, 50), 4.5, 'darker'),
      warning: pickForContrast(w, step(n, 50), 4.5, 'darker'),
      danger: pickForContrast(d, step(n, 50), 4.5, 'darker'),
      'focus-ring': step(a, 500),
    };
  }

  const primary = step(p, 400);
  const accent = step(a, 400);
  return {
    background: step(n, 950),
    surface: step(n, 900),
    'surface-raised': step(n, 800),
    'surface-sunken': step(n, 950),
    border: step(n, 700),
    'border-strong': pickForContrast(n, step(n, 950), 3, 'lighter'),
    text: step(n, 50),
    'text-muted': pickForContrast(n, step(n, 950), 4.5, 'lighter'),
    'text-subtle': pickForContrast(n, step(n, 950), 3, 'lighter'),
    primary,
    'primary-hover': step(p, 300),
    'primary-foreground': contrast(step(n, 950), primary) >= 4.5 ? step(n, 950) : '#ffffff',
    'primary-subtle': step(p, 900),
    accent,
    'accent-foreground': contrast(step(n, 950), accent) >= 4.5 ? step(n, 950) : '#ffffff',
    'accent-subtle': step(a, 900),
    success: pickForContrast(s, step(n, 950), 4.5, 'lighter'),
    warning: pickForContrast(w, step(n, 950), 4.5, 'lighter'),
    danger: pickForContrast(d, step(n, 950), 4.5, 'lighter'),
    'focus-ring': step(a, 400),
  };
}

function pickForContrast(
  ramp: Swatch[],
  background: string,
  minRatio: number,
  direction: 'darker' | 'lighter',
): string {
  const found = firstStepMeeting(ramp, background, minRatio, direction);
  if (found) return found.hex;
  return direction === 'darker' ? step(ramp, 950) : step(ramp, 50);
}

function emitCss(tokens: Record<Mode, Record<string, string>>, modes: Mode[], prefix: string): string {
  const lines: string[] = [];
  const light = tokens.light;
  const dark = tokens.dark;

  if (modes.includes('light')) {
    lines.push(':root {');
    for (const [key, value] of Object.entries(light)) lines.push(`  --${prefix}-${key}: ${value};`);
    lines.push('}');
  }

  if (modes.includes('dark')) {
    lines.push('');
    lines.push('@media (prefers-color-scheme: dark) {');
    lines.push('  :root {');
    for (const [key, value] of Object.entries(dark)) lines.push(`    --${prefix}-${key}: ${value};`);
    lines.push('  }');
    lines.push('}');
    lines.push('');
    lines.push('/* Explicit override so a theme toggle can beat the media query. */');
    lines.push('[data-theme="dark"] {');
    for (const [key, value] of Object.entries(dark)) lines.push(`  --${prefix}-${key}: ${value};`);
    lines.push('}');
  }

  return lines.join('\n');
}

function emitTailwind(
  ramps: Record<string, Swatch[]>,
  tokens: Record<Mode, Record<string, string>>,
  prefix: string,
): string {
  const lines: string[] = ['@import "tailwindcss";', '', '@theme {'];

  for (const [name, ramp] of Object.entries(ramps)) {
    for (const swatch of ramp) {
      lines.push(`  --color-${name}-${swatch.step}: ${swatch.oklch};`);
    }
    lines.push('');
  }

  lines.push('  /* Semantic aliases. Components should only ever reference these. */');
  for (const key of Object.keys(tokens.light)) {
    lines.push(`  --color-${key}: var(--${prefix}-${key});`);
  }
  lines.push('}');
  return lines.join('\n');
}
