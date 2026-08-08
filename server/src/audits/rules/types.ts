import type { RawMeasurements, Sample, Signal } from '../collect.js';

export type Severity = 'blocker' | 'major' | 'minor';

export type Dimension =
  | 'color'
  | 'type'
  | 'space'
  | 'layout'
  | 'motion'
  | 'state'
  | 'a11y'
  | 'copy'
  | 'imagery'
  | 'system';

/**
 * `slop` rules flag the tells of a machine-default interface. `quality` rules
 * flag mistakes that hurt regardless of who made them. Keeping them apart lets
 * a team turn one class off without losing the other.
 */
export type Kind = 'slop' | 'quality';

export interface DesignContract {
  source: string;
  fonts: string[];
  colors: string[];
  radii: number[];
  fontSizes: number[];
}

export interface RuleContext {
  raw: RawMeasurements;
  design: DesignContract | null;
}

export interface RuleHit {
  evidence: string[];
  /** Overrides the rule's default title when the finding needs a count. */
  title?: string;
  /** Overrides the rule's default severity. */
  severity?: Severity;
}

export interface Rule {
  id: string;
  title: string;
  kind: Kind;
  severity: Severity;
  dimension: Dimension;
  fix: string;
  detect(ctx: RuleContext): RuleHit | null;
}

/* ------------------------------------------------------------------ helpers */

export function plural(n: number, singular: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

/** Turn a collected signal into a hit, or nothing if it never fired. */
export function fromSignal(
  signal: Signal,
  title: (count: number) => string,
  minimum = 1,
): RuleHit | null {
  if (signal.count < minimum) return null;
  return {
    title: title(signal.count),
    evidence: signal.samples.map(describe),
  };
}

export function describe(sample: Sample): string {
  return sample.detail ? `${sample.selector} - ${sample.detail}` : sample.selector;
}

export function evidenceFrom(samples: Sample[], limit = 5): string[] {
  return samples.slice(0, limit).map(describe);
}

export type { RawMeasurements };
