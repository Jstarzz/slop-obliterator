import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { rankReferenceAxes, type ReferenceAxis, type ReferenceAxisScores } from './axes.js';
import { buildCraftProfile, type CraftMode, type CraftProfile } from './craft.js';
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
  craft: CraftProfile;
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
    craft: buildCraftProfile(query, platform),
  };
}

export function registerDesignPlanTool(server: McpServer): void {
  server.registerTool(
    'design_plan',
    {
      title: 'Build a compact design decision plan',
      description:
        'Collapses deterministic design research into one bounded call: ranks structural references by synthesis role, ' +
        'prefers different references for different jobs, shortlists interaction patterns, and adds a craft profile covering ' +
        'motion/detail discipline, surface quality, variance/motion/density controls, and Figma/Playwright evidence routing. ' +
        'Use it at the start of a new surface before reference_contract and component_find.',
      inputSchema: {
        query: z.string().min(1).describe('Product + primary task + audience + constraints, e.g. "port checkpoint NFC verification offline Android".'),
        platform: z.enum(['web', 'mobile', 'any']).default('any'),
        referenceLimit: z.number().int().min(2).max(8).default(5),
        patternLimit: z.number().int().min(1).max(6).default(4),
        mode: z.enum(['auto', 'persuade', 'operate', 'read', 'experience']).default('auto'),
        designVariance: z.number().int().min(1).max(10).optional(),
        motionIntensity: z.number().int().min(1).max(10).optional(),
        visualDensity: z.number().int().min(1).max(10).optional(),
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
      const craft = buildCraftProfile(args.query, args.platform, args.mode as CraftMode | 'auto', {
        designVariance: args.designVariance,
        motionIntensity: args.motionIntensity,
        visualDensity: args.visualDensity,
      });
      const roleLines = roles.map((entry) => `  ${entry.role}: ${entry.referenceId} (${entry.score})`);
      const patternLines = patterns.map((pattern) =>
        `  ${pattern.id}: ${pattern.useWhen[0] ?? pattern.name}; avoid when ${pattern.avoidWhen[0] ?? 'the information shape does not fit'}`,
      );

      const body = [
        'Compact design plan — heuristic scores are not probabilities.',
        '',
        `Craft: ${craft.mode} | variance ${craft.dials.designVariance}/10 | motion ${craft.dials.motionIntensity}/10 | density ${craft.dials.visualDensity}/10`,
        `  motion/detail: ${craft.kowalski[0]}`,
        `  quality floor: ${craft.impeccable[0]}`,
        `  evidence: ${craft.evidence.join(' ')}`,
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
