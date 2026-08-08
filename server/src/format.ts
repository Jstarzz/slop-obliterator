/**
 * Report rendering.
 *
 * These strings land in an agent's context on every loop of a design iteration,
 * so the format is chosen for density: no JSON braces, no repeated keys, and
 * nothing about checks that passed except a one-line roll-up.
 */

import type { AuditReport, Finding, Severity } from './audits/analyze.js';

const MARK: Record<Severity, string> = {
  blocker: 'BLOCK',
  major: 'MAJOR',
  minor: 'minor',
};

export function renderReport(report: AuditReport, options: { verbose?: boolean } = {}): string {
  const lines: string[] = [];

  lines.push(`# Design audit - quality ${report.score}/100, slop-free ${report.slopScore}/100`);
  lines.push(report.verdict);
  lines.push('');
  lines.push(`${report.url}  ·  ${report.viewport}  ·  ${report.rulesRun} rules`);
  lines.push(
    `${report.counts.slop} slop tell${report.counts.slop === 1 ? '' : 's'}, ` +
      `${report.counts.quality} quality issue${report.counts.quality === 1 ? '' : 's'}  ` +
      `(${report.counts.blockers} blocker, ${report.counts.majors} major, ${report.counts.minors} minor)`,
  );

  const weak = Object.entries(report.dimensions)
    .filter(([, score]) => score < 100)
    .sort((a, b) => a[1] - b[1])
    .map(([name, score]) => `${name} ${Math.round(score)}`);
  if (weak.length > 0) lines.push(`Weakest: ${weak.join(' · ')}`);

  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No findings. Nothing here reads as machine-default.');
  } else {
    const slop = report.findings.filter((f) => f.kind === 'slop');
    const quality = report.findings.filter((f) => f.kind === 'quality');

    if (slop.length > 0) {
      lines.push('## Reads as AI-generated');
      for (const finding of slop) lines.push(renderFinding(finding));
      lines.push('');
    }
    if (quality.length > 0) {
      lines.push('## Quality defects');
      for (const finding of quality) lines.push(renderFinding(finding));
    }
  }

  if (report.passed.length > 0) {
    lines.push('');
    lines.push(`Passed: ${report.passed.join(' ')}`);
  }

  if (options.verbose) {
    lines.push('');
    lines.push(
      `Stats: ${report.stats.distinctColors} colours · ${report.stats.distinctFontSizes} type sizes · ` +
        `${report.stats.distinctRadii} radii · max chroma ${report.stats.maxChroma} · ` +
        `${report.stats.hueFamilies} hue families · ${report.stats.darkPage ? 'dark' : 'light'} ground · ` +
        `fonts ${report.stats.fontFamilies.join(', ') || 'none detected'}`,
    );
  }

  for (const note of report.notes) lines.push(`Note: ${note}`);

  return lines.join('\n');
}

function renderFinding(finding: Finding): string {
  const parts = [`[${MARK[finding.severity]}] ${finding.title}  (${finding.id})`];
  for (const evidence of finding.evidence.slice(0, 6)) parts.push(`    · ${evidence}`);
  parts.push(`    -> ${finding.fix}`);
  return parts.join('\n');
}

export function renderResponsiveSummary(
  reports: Array<{ viewport: string; report: AuditReport }>,
): string {
  const lines: string[] = ['# Responsive audit', ''];

  for (const { viewport, report } of reports) {
    lines.push(
      `${viewport.padEnd(14)} quality ${String(report.score).padStart(3)}  slop-free ${String(report.slopScore).padStart(3)}  ` +
        `${report.counts.blockers} blocker, ${report.counts.majors} major`,
    );
  }

  // Only findings that do not appear at every viewport are interesting here;
  // shared ones belong to the design, not to the breakpoint.
  const counts = new Map<string, { finding: Finding; viewports: string[] }>();
  for (const { viewport, report } of reports) {
    for (const finding of report.findings) {
      const existing = counts.get(finding.id);
      if (existing) existing.viewports.push(viewport);
      else counts.set(finding.id, { finding, viewports: [viewport] });
    }
  }

  const breakpointSpecific = [...counts.values()].filter((c) => c.viewports.length < reports.length);
  const everywhere = [...counts.values()].filter((c) => c.viewports.length === reports.length);

  if (breakpointSpecific.length > 0) {
    lines.push('');
    lines.push('## Breaks at specific sizes');
    for (const { finding, viewports } of breakpointSpecific) {
      lines.push(`[${MARK[finding.severity]}] ${finding.title} - ${viewports.join(', ')}`);
      for (const evidence of finding.evidence.slice(0, 3)) lines.push(`    · ${evidence}`);
      lines.push(`    -> ${finding.fix}`);
    }
  }

  if (everywhere.length > 0) {
    lines.push('');
    lines.push(`## Present at every size (${everywhere.length})`);
    lines.push(everywhere.map((e) => e.finding.id).join(', '));
    lines.push('Run audit_design on a single viewport for the detail on these.');
  }

  return lines.join('\n');
}

/**
 * The judgements no detector can make. `audit_design` reports what it measured;
 * this list is what a reviewer still has to look at.
 */
export const LLM_ONLY_CHECKS: Array<{ id: string; question: string; why: string }> = [
  {
    id: 'critique.identity',
    question: 'With the logo and copy removed, could this be any other product?',
    why: 'If yes, the design is doing none of the work of recognition. Something structural has to be specific to this thing.',
  },
  {
    id: 'critique.hero-thesis',
    question: 'Is the hero a thesis about this product, or the template answer?',
    why: 'Big number, small label, three supporting stats, gradient accent is the default. Used everywhere, trusted nowhere.',
  },
  {
    id: 'critique.glass-purpose',
    question: 'Does every blur, glow, and glass surface solve a real layering problem?',
    why: 'Backdrop blur earns its place when something genuinely floats over scrolling content. Otherwise it is a costume.',
  },
  {
    id: 'critique.illustration',
    question: 'Would you ship these illustrations to a paying customer?',
    why: 'Hand-coded SVG scenes and mascots read as amateur doodles. No illustration beats a sketchy one.',
  },
  {
    id: 'critique.rank-one',
    question: 'What is the single most important element, and is it obviously the most important?',
    why: 'If two things compete, neither wins. If nothing dominates, the layout is a list.',
  },
  {
    id: 'critique.states',
    question: 'What does the empty state look like at 9am on day one?',
    why: 'Not the populated happy path with perfect fake data. If it is undesigned, half the product is undesigned.',
  },
  {
    id: 'critique.content-fit',
    question: 'Does anything exist because a layout slot needed filling?',
    why: 'The third feature card, the icon that illustrates nothing, the stat that is not a real stat.',
  },
  {
    id: 'critique.copy-specificity',
    question: 'Could the headline run unchanged on a competitor site?',
    why: 'Grammatically perfect copy that says nothing only this product could say is the verbal half of the same problem.',
  },
  {
    id: 'critique.direction',
    question: 'Can you name the aesthetic direction in one sentence, and would someone disagree with it?',
    why: 'An adjective is not a direction. A referent is.',
  },
  {
    id: 'critique.rejected',
    question: 'What did you decide not to do?',
    why: 'A design with no rejected options was not designed. It was the first thing that came out.',
  },
  {
    id: 'critique.squint',
    question: 'Shrink it to 25%. Is there still a shape?',
    why: 'An undifferentiated grey stripe means no hierarchy and no rhythm, whatever the individual measurements say.',
  },
];

export function renderCritiqueChecklist(): string {
  const lines: string[] = ['## Judgement pass', '', 'The detector cannot answer these. You have to look.', ''];
  for (const check of LLM_ONLY_CHECKS) {
    lines.push(`- **${check.question}**`);
    lines.push(`  ${check.why}`);
  }
  return lines.join('\n');
}
