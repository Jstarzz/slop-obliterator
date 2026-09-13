import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { rankReferenceAxes, type ReferenceAxis, type ReferenceAxisScores } from './axes.js';
import { findInteractionPatterns } from './patterns.js';

export type DesignPlanPlatform = 'web' | 'mobile' | 'any';

export interface DesignPlanRole {
  role: ReferenceAxis;
  referenceId: string;
  score: number;
}

export interface DesignPlanResult {
  roles: DesignPlanRole[];
  patterns: string[];
}

function relevantRoles(platform: DesignPlanPlatform): ReferenceAxis[] {
  return platform === 'mobile'
    ? ['domain', 'structure', 'interaction', 'components', 'mobile']
    : ['domain', 'structure', 'interaction', 'components'];
}

/**
 * Assign role leaders while preferring different references for different jobs.
 * Reuse is allowed only when every remaining candidate for that role is weaker
 * than zero; diversity is a guardrail, not a reason to choose an irrelevant ref.
 */
export function proposeDesignRoles(
  ranked: readonly ReferenceAxisScores[],
  platform: DesignPlanPlatform,
): DesignPlanRole[] {
  const used = new Set<string>();
  const roles: DesignPlanRole[] = [];

  for (const role of relevantRoles(platform)) {
    const ordered = [...ranked]
      .filter((entry) => entry.axes[role] > 0)
      .sort((a, b) => b.axes[role] - a.axes[role] || b.total - a.total || a.reference.id.localeCompare(b.reference.id));
    if (ordered.length === 0) continue;

    const winner = ordered.find((entry) => !used.has(entry.reference.id)) ?? ordered[0]!;
    roles.push({ role, referenceId: winner.reference.id, score: winner.axes[role] });
    used.add(winner.reference.id);
  }

  return roles;
}

export function buildDesignPlan(
  query: string,
  platform: DesignPlanPlatform = 'any',
  referenceLimit = 5,
  patternLimit = 4,
): DesignPlanResult {
  const ranked = rankReferenceAxes(query, platform, referenceLimit);
  const patterns = findInteractionPatterns(query, platform, patternLimit);
  return {
    roles: proposeDesignRoles(ranked, platform),
    patterns: patterns.map((pattern) => pattern.id),
  };
}

export function registerDesignPlanTool(server: McpServer): void {
  server.registerTool(
    'design_plan',
    {
      title: 'Build a compact design decision plan',
      description:
        'Collapses deterministic design research into one bounded call: ranks structural references by synthesis role, ' +
        'prefers different references for different jobs, and shortlists interaction patterns. Use it at the start of a new ' +
        'surface when you want a compact plan before reference_contract and component_find. It does not choose visual style ' +
        'or clone a source; the final reference contract remains an explicit implementation boundary.',
      inputSchema: {
        query: z.string().min(1).describe('Product + primary task + constraints, e.g. "port checkpoint NFC verification offline Android".'),
        platform: z.enum(['web', 'mobile', 'any']).default('any'),
        referenceLimit: z.number().int().min(2).max(8).default(5),
        patternLimit: z.number().int().min(1).max(6).default(4),
      },
    },
    async (args) => {
      const ranked = rankReferenceAxes(args.query, args.platform, args.referenceLimit);
      if (ranked.length === 0) {
        return {
          content: [{ type: 'text' as const, text: `No design references matched "${args.query}". Add the domain noun and primary user task.` }],
        };
      }

      const roles = proposeDesignRoles(ranked, args.platform);
      const patterns = findInteractionPatterns(args.query, args.platform, args.patternLimit);
      const roleLines = roles.map((entry) => `  ${entry.role}: ${entry.referenceId} (${entry.score})`);
      const patternLines = patterns.map((pattern) =>
        `  ${pattern.id}: ${pattern.useWhen[0] ?? pattern.name}; avoid when ${pattern.avoidWhen[0] ?? 'the information shape does not fit'}`,
      );

      const body = [
        'Compact design plan — heuristic scores are not probabilities.',
        '',
        'Reference roles:',
        ...roleLines,
        '',
        'Interaction-pattern shortlist:',
        ...patternLines,
        '',
        'Next: inspect only the role finalists you actually need, commit 2-5 non-overlapping roles with reference_contract,',
        'choose the smallest interaction pattern that fits the repeated task, then search components only for missing capabilities.',
        'Normalize the result to one spacing/radius/type/icon/color/motion/state grammar; do not reproduce any reference end-to-end.',
      ].join('\n');

      return { content: [{ type: 'text' as const, text: body }] };
    },
  );
}
