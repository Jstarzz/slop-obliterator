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
  'copy.ai-throat-clearing',
  'copy.future-is-here',
  'copy.focus-on-what-matters',
  'copy.whether-you-are',
  'copy.ready-to-cta',
] as const;

const SOCIAL_PROOF_PATTERNS = [
  /\btrusted by\s+(?:more than\s+|over\s+)?([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\b/gi,
  /\b(?:used by|chosen by|loved by)\s+(?:more than\s+|over\s+)?([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\b/gi,
  /\bjoin\s+(?:more than\s+|over\s+)?([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\b/gi,
  /\b([\d,.]+\+?|\d+(?:\.\d+)?[km]\+?)\s+(teams|companies|businesses|developers|customers|users|creators|organizations)\s+(?:trust|use|choose|love)\b/gi,
];

interface CopySignature {
  id: (typeof TEMPLATE_SIGNATURE_IDS)[number];
  title: string;
  patterns: RegExp[];
  fix: string;
}

const COPY_SIGNATURES: CopySignature[] = [
  {
    id: 'copy.ai-throat-clearing',
    title: 'Generic AI throat-clearing opener',
    patterns: [
      /\bin today['’]s (?:fast[- ]paced|rapidly (?:changing|evolving)|ever[- ]changing) (?:world|landscape|environment)\b/gi,
      /\bin today['’]s digital (?:age|world|landscape)\b/gi,
      /\bin an increasingly (?:digital|connected|complex|competitive) world\b/gi,
      /\bin a world where\b/gi,
      /\bnow more than ever\b/gi,
    ],
    fix: 'Delete the scene-setting preamble. Start with the concrete problem, fact, or claim this paragraph actually exists to communicate.',
  },
  {
    id: 'copy.future-is-here',
    title: '“The future is here” marketing cliché',
    patterns: [
      /\bthe future of [^.!?\n]{2,60} is here\b/gi,
      /\bwelcome to the future of [^.!?\n]{2,60}\b/gi,
      /\b(?:step|enter) into the future of [^.!?\n]{2,60}\b/gi,
    ],
    fix: 'Replace the futurism with the actual capability and why it matters now. A concrete present-tense advantage is stronger than declaring the future has arrived.',
  },
  {
    id: 'copy.focus-on-what-matters',
    title: '“Focus on what matters” filler promise',
    patterns: [
      /\bso you can focus on what matters(?: most)?\b/gi,
      /\blet(?:ting|s)? you focus on what matters(?: most)?\b/gi,
      /\bfree(?:ing)? you (?:up )?to focus on what matters(?: most)?\b/gi,
    ],
    fix: 'Name the thing the user gets time back for. “What matters” is a placeholder, not a benefit.',
  },
  {
    id: 'copy.whether-you-are',
    title: 'Generic “whether you’re X or Y” audience sweep',
    patterns: [
      /\bwhether you(?:['’]re| are) [^.!?\n]{2,70}\s+or\s+[^.!?\n]{2,70}[,.!?]/gi,
      /\bwhether you(?:['’]re| are) [^.!?\n]{2,70}\s+or\s+[^.!?\n]{2,70}$/gim,
    ],
    fix: 'Write for the actual audience. If two groups genuinely need different value propositions, say what each one gets instead of sweeping them into one generic sentence.',
  },
  {
    id: 'copy.ready-to-cta',
    title: 'Canned “ready to…” CTA question',
    patterns: [
      /\bready to (?:get started|take the next step|transform|elevate|unlock|supercharge|revolutionize)[^?]{0,70}\?/gi,
      /\bwhat are you waiting for\?/gi,
    ],
    fix: 'State the action directly. The button already asks for a decision; a rhetorical warm-up adds generated-marketing cadence without information.',
  },
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

function copySignatureMatches(text: string, patterns: RegExp[]): string[] {
  const matches = new Set<string>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const value = match[0].trim();
      if (!value) continue;
      matches.add(value);
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

  for (const signature of COPY_SIGNATURES) {
    if (disabled.has(signature.id)) continue;
    const matches = copySignatureMatches(raw.visibleText, signature.patterns);
    if (matches.length === 0) continue;
    findings.push({
      id: signature.id,
      severity: 'minor',
      kind: 'slop',
      dimension: 'copy',
      title: signature.title,
      evidence: matches.map((match) => `“${match.slice(0, 110)}”`),
      fix: signature.fix,
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
