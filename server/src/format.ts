/**
 * Report rendering.
 *
 * These strings land in an agent's context on every loop of a design iteration,
 * so the format is chosen for density: no JSON braces, no repeated keys, nothing
 * about checks that passed except a one-line roll-up.
 */

import type { AuditReport, Finding, Severity } from './audits/analyze.js';

const MARK: Record<Severity, string> = {
  blocker: 'BLOCK',
  major: 'MAJOR',
  minor: 'minor',
};

export function renderReport(report: AuditReport, options: { verbose?: boolean } = {}): string {
  const lines: string[] = [];

  lines.push(`# Design audit — ${report.score}/100`);
  lines.push(report.verdict);
  lines.push('');
  lines.push(`${report.url}  ·  ${report.viewport}`);

  const weak = Object.entries(report.dimensions)
    .filter(([, score]) => score < 100)
    .sort((a, b) => a[1] - b[1])
    .map(([name, score]) => `${name} ${Math.round(score)}`);
  if (weak.length > 0) lines.push(`Weakest: ${weak.join(' · ')}`);

  lines.push('');

  if (report.findings.length === 0) {
    lines.push('No findings. Nothing here reads as machine-default.');
  } else {
    for (const finding of report.findings) {
      lines.push(renderFinding(finding));
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
        `${report.stats.hueFamilies} hue families · fonts ${report.stats.fontFamilies.join(', ') || 'none detected'}`,
    );
  }

  for (const note of report.notes) lines.push(`Note: ${note}`);

  return lines.join('\n');
}

function renderFinding(finding: Finding): string {
  const parts = [`[${MARK[finding.severity]}] ${finding.title}  (${finding.id})`];
  for (const evidence of finding.evidence.slice(0, 6)) parts.push(`    · ${evidence}`);
  parts.push(`    → ${finding.fix}`);
  return parts.join('\n');
}

export function renderResponsiveSummary(
  reports: Array<{ viewport: string; report: AuditReport }>,
): string {
  const lines: string[] = ['# Responsive audit', ''];

  for (const { viewport, report } of reports) {
    const blockers = report.findings.filter((f) => f.severity === 'blocker');
    const majors = report.findings.filter((f) => f.severity === 'major');
    lines.push(
      `${viewport.padEnd(14)} ${String(report.score).padStart(3)}/100  ` +
        `${blockers.length} blocker${blockers.length === 1 ? '' : 's'}, ${majors.length} major`,
    );
  }

  // Only findings that do not appear at every viewport are interesting here —
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
      lines.push(`[${MARK[finding.severity]}] ${finding.title} — ${viewports.join(', ')}`);
      for (const evidence of finding.evidence.slice(0, 3)) lines.push(`    · ${evidence}`);
      lines.push(`    → ${finding.fix}`);
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
