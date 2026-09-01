/**
 * Turns raw measurements into a verdict by running the rule registry.
 *
 * Two rules govern the output:
 *
 * 1. Every finding names a specific thing on the page and a specific fix.
 *    "Improve visual hierarchy" is not a finding; "6 of 7 text blocks are
 *    centre-aligned" is.
 * 2. It stays small. An agent reads this on every iteration of a design loop,
 *    so findings are capped, evidence is capped, and nothing that passed gets
 *    reported except as a one-line roll-up.
 */

import type { RawMeasurements } from './collect.js';
import { RULES, runRules } from './rules/registry.js';
import type { DesignContract, Dimension, Kind, Severity } from './rules/types.js';
import {
  detectTemplateSignatures,
  signalIsOnlyHeroPills,
  signalIsOnlyPairedHeroCtas,
  TEMPLATE_SIGNATURE_IDS,
} from './template-signatures.js';

export type { Dimension, Severity, Kind };

export interface Finding {
  id: string;
  severity: Severity;
  kind: Kind;
  dimension: Dimension;
  title: string;
  evidence: string[];
  fix: string;
}

export interface AuditReport {
  url: string;
  viewport: string;
  score: number;
  slopScore: number;
  verdict: string;
  dimensions: Record<Dimension, number>;
  findings: Finding[];
  counts: { slop: number; quality: number; blockers: number; majors: number; minors: number };
  rulesRun: number;
  passed: string[];
  stats: {
    distinctColors: number;
    distinctFontSizes: number;
    distinctRadii: number;
    fontFamilies: string[];
    maxChroma: number;
    hueFamilies: number;
    darkPage: boolean;
  };
  notes: string[];
}

export interface AnalyzeOptions {
  design?: DesignContract | null;
  disabled?: Set<string>;
  /** Only report these kinds. */
  kinds?: Kind[];
}

const SEVERITY_WEIGHT: Record<Severity, number> = { blocker: 16, major: 8, minor: 3 };

const DIMENSIONS: Dimension[] = [
  'color',
  'type',
  'space',
  'layout',
  'motion',
  'state',
  'a11y',
  'copy',
  'imagery',
  'system',
];

export function analyze(
  raw: RawMeasurements,
  viewportName: string,
  options: AnalyzeOptions = {},
): AuditReport {
  const notes: string[] = [];

  if (!raw.elementsScanned) {
    notes.push('Page exceeded the 4000-element scan cap; findings cover the first 4000 elements.');
  }
  if (!raw.stylesheetsReadable) {
    notes.push(
      'Some stylesheets are cross-origin and could not be read; reduced-motion, keyframe, and hover-rule detection may under-report.',
    );
  }
  if (!options.design) {
    notes.push('No design contract supplied; the four drift rules were skipped. Pass design_md to enable them.');
  }

  const disabled = options.disabled ?? new Set<string>();
  const hits = runRules({ raw, design: options.design ?? null }, disabled);
  const templateFindings = detectTemplateSignatures(raw, disabled);

  // The compound signatures reuse two existing collector channels for wire
  // compatibility. When the signal contains only the newer template shape,
  // suppress the older generic finding so one DOM pattern does not get scored
  // twice under two names. Mixed pages still report both distinct problems.
  const suppressLegacyEyebrow = signalIsOnlyHeroPills(raw);
  const suppressLegacyOversizedHero = signalIsOnlyPairedHeroCtas(raw);

  const wanted = options.kinds && options.kinds.length > 0 ? new Set(options.kinds) : null;

  const findings: Finding[] = [
    ...hits
      .filter(({ rule }) => {
        if (rule.id === 'type.eyebrow-label' && suppressLegacyEyebrow) return false;
        if (rule.id === 'type.oversized-hero-headline' && suppressLegacyOversizedHero) return false;
        return true;
      })
      .map(({ rule, hit }) => ({
        id: rule.id,
        severity: hit.severity ?? rule.severity,
        kind: rule.kind,
        dimension: rule.dimension,
        title: hit.title ?? rule.title,
        evidence: hit.evidence,
        fix: rule.fix,
      })),
    ...templateFindings,
  ].filter((finding) => !wanted || wanted.has(finding.kind));

  const order: Record<Severity, number> = { blocker: 0, major: 1, minor: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));

  const dimensions = Object.fromEntries(DIMENSIONS.map((d) => [d, 100])) as Record<Dimension, number>;
  for (const finding of findings) {
    dimensions[finding.dimension] = Math.max(
      0,
      dimensions[finding.dimension] - SEVERITY_WEIGHT[finding.severity] * 1.8,
    );
  }

  const penalty = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));

  // A separate score for "does this read as machine-default", independent of
  // whether the engineering is sound. A page can be perfectly built and still
  // be indistinguishable from every other page.
  const slopPenalty = findings
    .filter((f) => f.kind === 'slop')
    .reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  const slopScore = Math.max(0, Math.min(100, 100 - slopPenalty * 1.5));

  const counts = {
    slop: findings.filter((f) => f.kind === 'slop').length,
    quality: findings.filter((f) => f.kind === 'quality').length,
    blockers: findings.filter((f) => f.severity === 'blocker').length,
    majors: findings.filter((f) => f.severity === 'major').length,
    minors: findings.filter((f) => f.severity === 'minor').length,
  };

  const chromas = raw.colors
    .map((c) => c.value)
    .map((v) => chromaOf(v))
    .filter((c): c is number => c !== null);

  const knownRuleIds = new Set([...RULES.map((rule) => rule.id), ...TEMPLATE_SIGNATURE_IDS]);
  const disabledKnownRules = [...disabled].filter((id) => knownRuleIds.has(id)).length;

  return {
    url: raw.url,
    viewport: `${viewportName} (${raw.viewport.width}x${raw.viewport.height})`,
    score,
    slopScore,
    verdict: verdictFor(score, slopScore, counts),
    dimensions,
    findings,
    counts,
    rulesRun: knownRuleIds.size - disabledKnownRules,
    passed: summarisePasses(raw, findings),
    stats: {
      distinctColors: raw.colors.length,
      distinctFontSizes: raw.fontSizes.length,
      distinctRadii: raw.radii.length,
      fontFamilies: raw.fontFamilies.slice(0, 4).map((f) => f.value),
      maxChroma: chromas.length > 0 ? Math.round(Math.max(...chromas) * 1000) / 1000 : 0,
      hueFamilies: hueFamilyCount(raw),
      darkPage: raw.isDarkPage,
    },
    notes,
  };
}

function verdictFor(
  score: number,
  slopScore: number,
  counts: AuditReport['counts'],
): string {
  if (counts.blockers > 0) {
    return `${counts.blockers} blocker${counts.blockers === 1 ? '' : 's'} - not shippable yet.`;
  }
  if (slopScore < 45) return 'This is the median aesthetic. Start from a real design decision, not a patch.';
  if (slopScore < 75) return 'Recognisably generated. The defaults are showing.';
  if (score >= 90) return 'Reads as designed. Ship it.';
  if (score >= 75) return 'Distinctive, with specific quality issues left on the table.';
  return 'The direction is there; the execution is not.';
}

/**
 * Only report a pass when the page actually exercised the thing. Saying "all
 * form fields are labelled" on a page with no forms is noise.
 */
function summarisePasses(raw: RawMeasurements, findings: Finding[]): string[] {
  const fired = new Set(findings.map((f) => f.id));
  const passed: string[] = [];

  if (raw.contrastSamples.length > 0 && !fired.has('color.contrast')) {
    passed.push(`${raw.contrastSamples.length} sampled text pairs clear WCAG AA.`);
  }
  if (raw.fontFamilies.length > 0 && !fired.has('type.overused-font')) {
    passed.push(`Typeface "${raw.fontFamilies[0]!.value}" is a deliberate choice.`);
  }
  if (raw.text.blocks > 0 && !fired.has('type.measure-too-wide')) {
    passed.push('Line lengths sit in a readable range.');
  }
  if (!fired.has('layout.horizontal-overflow')) {
    passed.push('No horizontal overflow at this viewport.');
  }
  if (raw.interactive.total > 0 && !fired.has('state.small-targets')) {
    passed.push('All interactive targets clear the 24px minimum.');
  }
  if (raw.forms.fieldCount > 0 && !fired.has('state.unlabeled-fields') && !fired.has('state.no-error-region')) {
    passed.push('Form fields are labelled and there is somewhere to surface errors.');
  }
  if (raw.motion.animatedElements > 0 && !fired.has('motion.no-reduced-motion')) {
    passed.push('Motion respects prefers-reduced-motion.');
  }
  if (raw.cardRows.length > 0 && !fired.has('layout.three-card-row')) {
    passed.push('Card rows avoid the equal-triptych template.');
  }
  return passed;
}

function chromaOf(value: string): number | null {
  // Cheap sRGB saturation proxy so the stats block does not need a colour import
  // per swatch; the rules do the precise OKLCH work.
  const match = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value);
  if (!match) return null;
  const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  // Roughly maps sRGB saturation onto the 0..0.37 OKLCH chroma range.
  return ((max - min) / 255) * 0.37;
}

function hueFamilyCount(raw: RawMeasurements): number {
  const bins = new Set<number>();
  for (const used of raw.colors) {
    const match = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(used.value);
    if (!match) continue;
    const [r, g, b] = [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 0.08) continue;
    let hue: number;
    if (max === r) hue = ((g - b) / (max - min)) % 6;
    else if (max === g) hue = (b - r) / (max - min) + 2;
    else hue = (r - g) / (max - min) + 4;
    bins.add(Math.floor((((hue * 60) % 360) + 360) % 360 / 30));
  }
  return bins.size;
}
