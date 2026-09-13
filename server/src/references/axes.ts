import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { DESIGN_REFERENCES, type DesignReference } from './design.js';

export type ReferenceAxis = 'domain' | 'structure' | 'interaction' | 'components' | 'mobile';

export interface ReferenceAxisScores {
  reference: DesignReference;
  total: number;
  axes: Record<ReferenceAxis, number>;
}

const AXES: readonly ReferenceAxis[] = ['domain', 'structure', 'interaction', 'components', 'mobile'];

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function fieldScore(query: readonly string[], values: readonly string[], exactWeight: number, partialWeight: number): number {
  const haystack = values.join(' ').toLowerCase();
  const words = new Set(tokens(haystack));
  let score = 0;
  for (const term of query) {
    if (words.has(term)) score += exactWeight;
    else if (haystack.includes(term)) score += partialWeight;
  }
  return score;
}

function clampScore(value: number): number {
  // These are intentionally heuristic confidence scores, not probabilities.
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreReferenceAxes(
  reference: DesignReference,
  query: string,
  platform: 'web' | 'mobile' | 'any' = 'any',
): ReferenceAxisScores {
  const queryTerms = tokens(query);
  const domain = fieldScore(queryTerms, [reference.name, ...reference.aliases, ...reference.tasks], 13, 7);
  const structure = fieldScore(queryTerms, [...reference.structure, ...reference.tasks], 11, 6) + domain * 0.35;
  const interaction = fieldScore(queryTerms, [...reference.interactions, ...reference.tasks], 11, 6) + domain * 0.25;
  const components = fieldScore(queryTerms, reference.components, 12, 6) + structure * 0.15;
  const mobileBase = fieldScore(queryTerms, reference.mobile ?? [], 12, 6) + interaction * 0.2;
  const mobile = mobileBase + (platform === 'mobile' && reference.mobile?.length ? 18 : 0);

  const axes = {
    domain: clampScore(domain),
    structure: clampScore(structure),
    interaction: clampScore(interaction),
    components: clampScore(components),
    mobile: clampScore(mobile),
  } satisfies Record<ReferenceAxis, number>;

  const total = clampScore(
    axes.domain * 0.3 +
      axes.structure * 0.25 +
      axes.interaction * 0.22 +
      axes.components * 0.13 +
      axes.mobile * (platform === 'mobile' ? 0.1 : 0.04),
  );

  return { reference, total, axes };
}

export function rankReferenceAxes(
  query: string,
  platform: 'web' | 'mobile' | 'any' = 'any',
  limit = 5,
): ReferenceAxisScores[] {
  if (tokens(query).length === 0) return [];
  return DESIGN_REFERENCES
    .map((reference) => scoreReferenceAxes(reference, query, platform))
    .filter((result) => result.total > 0 || Object.values(result.axes).some((score) => score > 0))
    .sort((a, b) => b.total - a.total || a.reference.name.localeCompare(b.reference.name))
    .slice(0, Math.min(Math.max(limit, 1), 8));
}

function roleWinners(results: readonly ReferenceAxisScores[], platform: 'web' | 'mobile' | 'any'): string[] {
  const relevantAxes: ReferenceAxis[] = platform === 'mobile' ? [...AXES] : AXES.filter((axis) => axis !== 'mobile');
  return relevantAxes.flatMap((axis) => {
    const winner = [...results].sort((a, b) => b.axes[axis] - a.axes[axis])[0];
    if (!winner || winner.axes[axis] <= 0) return [];
    return [`${axis}: ${winner.reference.id} (${winner.axes[axis]})`];
  });
}

export function registerReferenceAxisTools(server: McpServer): void {
  server.registerTool(
    'reference_rank_axes',
    {
      title: 'Rank design references by synthesis role',
      description:
        'Scores structural references separately for domain fit, information structure, interaction model, component vocabulary, and mobile behavior. ' +
        'Use this after reference_find when several references are plausible. The scores are heuristics, not probabilities: they exist to help assign different references different jobs before synthesis.',
      inputSchema: {
        query: z.string().describe('Product + task + constraints, e.g. "ambulance dispatch map exception triage offline".'),
        platform: z.enum(['web', 'mobile', 'any']).default('any'),
        limit: z.number().int().min(1).max(8).default(5),
      },
    },
    async (args) => {
      const results = rankReferenceAxes(args.query, args.platform, args.limit);
      if (results.length === 0) {
        return { content: [{ type: 'text' as const, text: `No reference axes matched "${args.query}".` }] };
      }

      const header = args.platform === 'mobile'
        ? 'reference                 total domain structure interaction components mobile'
        : 'reference                 total domain structure interaction components';
      const rows = results.map((result) => {
        const id = result.reference.id.padEnd(25);
        const base = `${id} ${String(result.total).padStart(3)}   ${String(result.axes.domain).padStart(3)}      ${String(result.axes.structure).padStart(3)}         ${String(result.axes.interaction).padStart(3)}        ${String(result.axes.components).padStart(3)}`;
        return args.platform === 'mobile' ? `${base}     ${String(result.axes.mobile).padStart(3)}` : base;
      });

      const body = [
        'Heuristic synthesis scores (0-100; not probabilities). Pick references by role, not one overall winner.',
        '',
        header,
        ...rows,
        '',
        'Suggested role leaders:',
        ...roleWinners(results, args.platform).map((line) => `  ${line}`),
        '',
        'Normalize the final design back to one token, type, radius, icon, motion, and state grammar.',
      ].join('\n');
      return { content: [{ type: 'text' as const, text: body }] };
    },
  );
}
