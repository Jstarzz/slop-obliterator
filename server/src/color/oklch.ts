/**
 * Perceptual colour engine.
 *
 * Everything here works in OKLCH because it is the only widely-supported space
 * where "same L means same apparent brightness" actually holds. That property is
 * what lets us build a ramp whose steps are evenly spaced to the eye, and what
 * lets us say something meaningful about two colours being "too close" without
 * rendering them.
 *
 * Contrast gating uses WCAG 2.x ratios. APCA (the WCAG 3 candidate) is a better
 * perceptual model, but its reference implementation ships under a restricted
 * "Limited W3 License" that is incompatible with an MIT tool, so we do not vendor
 * it. Instead we pair the WCAG ratio with an OKLCH lightness delta, which catches
 * most of the cases WCAG 2 is known to get wrong (notably light text on mid-tone
 * and dark backgrounds).
 */

import {
  converter,
  parse,
  formatHex,
  formatCss,
  clampChroma,
  inGamut,
  wcagContrast,
  wcagLuminance,
} from 'culori';

const toOklch = converter('oklch');
const toRgb = converter('rgb');
const srgbInGamut = inGamut('rgb');

export interface Oklch {
  /** Perceptual lightness, 0..1 */
  l: number;
  /** Chroma, 0..~0.37 in sRGB */
  c: number;
  /** Hue in degrees, 0..360 */
  h: number;
  alpha?: number;
}

export interface Swatch {
  step: number;
  hex: string;
  oklch: string;
  l: number;
  c: number;
  h: number;
  /** WCAG contrast against pure white */
  onWhite: number;
  /** WCAG contrast against pure black */
  onBlack: number;
}

export interface RampOptions {
  /** Base hue in degrees. */
  hue: number;
  /** Peak chroma at the middle of the ramp. */
  chroma: number;
  /**
   * Degrees of hue rotation applied across the ramp. Real pigment shifts hue as
   * it lightens or darkens; a ramp with zero shift is the single loudest sign a
   * palette was generated rather than designed.
   */
  hueShift?: number;
  /** Lightest step's L. */
  lMax?: number;
  /** Darkest step's L. */
  lMin?: number;
  /** Ramp step keys. */
  steps?: number[];
}

export const DEFAULT_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** Hue bands (OKLCH degrees) that read as machine-default in 2026. */
export const SLOP_HUE_BANDS: Array<{ from: number; to: number; label: string }> = [
  { from: 258, to: 310, label: 'indigo/violet/purple — the Tailwind indigo-500 lineage' },
];

/** Literal hexes that appear so often in generated UI they function as a signature. */
export const SLOP_HEXES: Record<string, string> = {
  '#6366f1': 'tailwind indigo-500',
  '#4f46e5': 'tailwind indigo-600',
  '#818cf8': 'tailwind indigo-400',
  '#8b5cf6': 'tailwind violet-500',
  '#7c3aed': 'tailwind violet-600',
  '#a855f7': 'tailwind purple-500',
  '#9333ea': 'tailwind purple-600',
  '#c084fc': 'tailwind purple-400',
  '#667eea': 'the "purple haze" gradient start',
  '#764ba2': 'the "purple haze" gradient end',
};

export function parseColor(input: string): Oklch | null {
  const parsed = parse(input.trim());
  if (!parsed) return null;
  const c = toOklch(parsed);
  if (!c) return null;
  return {
    l: clamp01(c.l ?? 0),
    c: Math.max(0, c.c ?? 0),
    h: normalizeHue(c.h ?? 0),
    alpha: c.alpha,
  };
}

export function toHex(color: Oklch): string {
  const clamped = clampChroma({ mode: 'oklch', l: color.l, c: color.c, h: color.h }, 'oklch', 'rgb');
  return formatHex(clamped) ?? '#000000';
}

export function toOklchCss(color: Oklch): string {
  const clamped = clampChroma({ mode: 'oklch', l: color.l, c: color.c, h: color.h }, 'oklch', 'rgb');
  return formatCss(clamped) ?? 'oklch(0 0 0)';
}

export function isDisplayable(color: Oklch): boolean {
  return srgbInGamut({ mode: 'oklch', l: color.l, c: color.c, h: color.h });
}

export function contrast(a: string, b: string): number {
  const ratio = wcagContrast(a, b);
  return Number.isFinite(ratio) ? round(ratio, 2) : 1;
}

export function relativeLuminance(color: string): number {
  return round(wcagLuminance(color) ?? 0, 4);
}

/** Perceptual lightness difference, 0..1. Under ~0.28 two colours will read as the same value. */
export function lightnessDelta(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 0;
  return round(Math.abs(ca.l - cb.l), 4);
}

/**
 * Build a perceptually even ramp.
 *
 * Lightness is eased rather than linear: the eye needs bigger jumps at the dark
 * end to perceive the same step size, so a linear L ramp produces shades that
 * look bunched at the bottom and washed at the top.
 *
 * Chroma follows a bell curve. Near-white and near-black cannot hold saturation
 * inside the sRGB gamut, so forcing peak chroma at the ends produces colours
 * that clip to mud.
 */
export function buildRamp(options: RampOptions): Swatch[] {
  const steps = options.steps ?? DEFAULT_STEPS;
  const hue = normalizeHue(options.hue);
  const peakChroma = Math.max(0, options.chroma);
  const hueShift = options.hueShift ?? 0;
  const lMax = options.lMax ?? 0.975;
  const lMin = options.lMin ?? 0.22;

  return steps.map((step, index) => {
    const t = steps.length === 1 ? 0 : index / (steps.length - 1);
    // Ease-in-out on lightness so mid-tones get more of the range.
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const l = lMax - eased * (lMax - lMin);

    // Bell curve on chroma, peaked slightly past the middle where displays have
    // the most room.
    const peakAt = 0.58;
    const spread = 0.42;
    const chromaFactor = Math.exp(-Math.pow((t - peakAt) / spread, 2));
    const c = peakChroma * chromaFactor;

    // Hue rotates across the ramp: lighter steps warm, darker steps cool.
    const h = normalizeHue(hue + hueShift * (t - peakAt) * -2);

    const swatch: Oklch = { l, c, h };
    const hex = toHex(swatch);
    const actual = parseColor(hex) ?? swatch;

    return {
      step,
      hex,
      oklch: toOklchCss(swatch),
      l: round(actual.l, 4),
      c: round(actual.c, 4),
      h: round(actual.h, 2),
      onWhite: contrast(hex, '#ffffff'),
      onBlack: contrast(hex, '#000000'),
    };
  });
}

/**
 * Neutrals carry a trace of the brand hue. Pure #808080 greys are the fastest way
 * to make an interface feel like it came out of a template — real design systems
 * tint their greys so surfaces feel like they belong to the same world as the accent.
 */
export function buildNeutralRamp(hue: number, tint = 0.008): Swatch[] {
  return buildRamp({
    hue,
    chroma: tint,
    hueShift: 0,
    lMax: 0.99,
    lMin: 0.15,
  });
}

export interface SlopVerdict {
  isSlop: boolean;
  reasons: string[];
}

/** Judge a single colour against the known machine-default signatures. */
export function judgeSeed(input: string): SlopVerdict {
  const reasons: string[] = [];
  const color = parseColor(input);
  if (!color) return { isSlop: false, reasons: [`could not parse "${input}"`] };

  const hex = toHex(color).toLowerCase();
  const named = SLOP_HEXES[hex];
  if (named) reasons.push(`${hex} is ${named} — the single most over-represented accent in AI-generated UI`);

  for (const band of SLOP_HUE_BANDS) {
    if (color.h >= band.from && color.h <= band.to && color.c > 0.05) {
      reasons.push(`hue ${Math.round(color.h)}° falls in the ${band.label} band`);
      break;
    }
  }

  if (color.c > 0 && color.c < 0.04 && color.l > 0.4 && color.l < 0.8) {
    reasons.push(`chroma ${color.c.toFixed(3)} is too timid for an accent — it will read as grey`);
  }

  return { isSlop: reasons.length > 0, reasons };
}

/**
 * Pick a hue that is deliberately away from the slop band and from any hue already
 * in use, using a golden-angle walk so successive suggestions stay far apart.
 */
export function suggestHue(avoid: number[] = [], seed = 0): number {
  const golden = 137.508;
  for (let i = 0; i < 64; i += 1) {
    const candidate = normalizeHue(seed * 47 + i * golden + 21);
    const inSlopBand = SLOP_HUE_BANDS.some((b) => candidate >= b.from - 8 && candidate <= b.to + 8);
    if (inSlopBand) continue;
    const tooClose = avoid.some((h) => hueDistance(h, candidate) < 28);
    if (tooClose) continue;
    return round(candidate, 1);
  }
  return 32;
}

export function hueDistance(a: number, b: number): number {
  const d = Math.abs(normalizeHue(a) - normalizeHue(b)) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Find the ramp step that first clears a contrast requirement against a background.
 * This is how you pick "which shade is the button text" without eyeballing it.
 */
export function firstStepMeeting(
  ramp: Swatch[],
  background: string,
  minRatio: number,
  direction: 'darker' | 'lighter' = 'darker',
): Swatch | null {
  const ordered = direction === 'darker' ? ramp : [...ramp].reverse();
  for (const swatch of ordered) {
    if (contrast(swatch.hex, background) >= minRatio) return swatch;
  }
  return null;
}

export function normalizeHue(h: number): number {
  const v = h % 360;
  return v < 0 ? v + 360 : v;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

export function round(v: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

export { toRgb };
