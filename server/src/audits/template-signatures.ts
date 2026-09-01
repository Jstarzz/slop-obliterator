import type { RawMeasurements } from './collect.js';
import type { Dimension, Kind, Severity } from './rules/types.js';

export interface TemplateSignatureFinding {
  id: string;
  severity: Severity;
  kind: Kind;
  dimension: Dimension;
  title: string;
  evidence: string[];
  fix: string;
}

export const TEMPLATE_SIGNATURE_IDS = [
  'type.hero-pill-badge',
  'layout.paired-hero-ctas',
  'copy.canned-social-proof',
] as const;

const SOCIAL_PROOF_PATTERNS = [
  /\btrusted by\s+(?:more than\s+|over\s+)?([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\b/gi,
  /\b(?:used by|chosen by|loved by)\s+(?:more than\s+|over\s+)?([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\b/gi,
  /\bjoin\s+(?:more than\s+|over\s+)?([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\b/gi,
  /\b([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\s+(?:trust|use|choose|love)\b/gi,
];

function metricValue(raw: string): number {
  const token = raw.toLowerCase().replace(/[,+]/g, '');
  const suffix = token.endsWith('k') ? 1_000 : token.endsWith('m') ? 1_000_000 : 1;
  const number = Number.parseFloat(token.replace(/[km]$/, ''));
  return Number.isFinite(number) ? number * suffix : 0;
}

function quantifiedSocialProof(text: string): string[] {
  const matches = new Set<string>();
  for (const pattern of SOCIAL_PROOF_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (metricValue(match[1] ?? '0') < 100) continue;
      matches.add(match[0].trim());
      if (matches.size >= 3) return [...matches];
    }
  }
  return [...matches];
}

export function detectTemplateSignatures(
  raw: RawMeasurements,
  disabled: ReadonlySet<string> = new Set(),
): TemplateSignatureFinding[] {
  const findings: TemplateSignatureFinding[] = [];

  const pillSamples = raw.signals.eyebrowLabel.samples.filter((sample) => sample.detail.startsWith('pill label '));
  if (pillSamples.length > 0 && !disabled.has('type.hero-pill-badge')) {
    findings.push({
      id: 'type.hero-pill-badge',
      severity: 'minor',
      kind: 'slop',
      dimension: 'type',
      title: 'Pill badge floating above the hero headline',
      evidence: pillSamples.map((sample) => `${sample.selector} — ${sample.detail}`),
      fix: 'Delete the ornamental badge unless it communicates a real state, release, or category. If the words matter, fold them into the headline or supporting copy instead of wrapping them in a pill for borrowed importance.',
    });
  }

  const pairedSamples = raw.signals.oversizedHeroHeadline.samples.filter((sample) =>
    sample.detail.startsWith('centered hero with paired CTAs '),
  );
  if (pairedSamples.length > 0 && !disabled.has('layout.paired-hero-ctas')) {
    findings.push({
      id: 'layout.paired-hero-ctas',
      severity: 'minor',
      kind: 'slop',
      dimension: 'layout',
      title: 'Centered hero with the default two-button CTA row',
      evidence: pairedSamples.map((sample) => `${sample.selector} — ${sample.detail}`),
      fix: 'Make the action hierarchy explicit. One primary action is usually enough; move the secondary action into text, navigation, or a different part of the composition unless the two choices are genuinely peers.',
    });
  }

  const proof = quantifiedSocialProof(raw.visibleText);
  if (proof.length > 0 && !disabled.has('copy.canned-social-proof')) {
    findings.push({
      id: 'copy.canned-social-proof',
      severity: 'minor',
      kind: 'slop',
      dimension: 'copy',
      title: 'Generic quantified social proof',
      evidence: proof.map((match) => `“${match.slice(0, 90)}”`),
      fix: 'If the number is real, make it auditable: name the cohort, source it, and time-box it. Otherwise use named customers, a concrete testimonial or case study, or omit the proof claim entirely.',
    });
  }

  return findings;
}

export function signalIsOnlyHeroPills(raw: RawMeasurements): boolean {
  const samples = raw.signals.eyebrowLabel.samples;
  return samples.length > 0 && samples.every((sample) => sample.detail.startsWith('pill label '));
}

export function signalIsOnlyPairedHeroCtas(raw: RawMeasurements): boolean {
  const samples = raw.signals.oversizedHeroHeadline.samples;
  return samples.length > 0 && samples.every((sample) => sample.detail.startsWith('centered hero with paired CTAs '));
}
