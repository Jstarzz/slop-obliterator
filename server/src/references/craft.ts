import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export type CraftMode = 'persuade' | 'operate' | 'read' | 'experience';
export type CraftPlatform = 'web' | 'mobile' | 'any';

export interface CraftDials {
  designVariance: number;
  motionIntensity: number;
  visualDensity: number;
}

export interface CraftProfile {
  mode: CraftMode;
  dials: CraftDials;
  kowalski: string[];
  impeccable: string[];
  taste: string[];
  evidence: string[];
}

export interface CraftOverrides {
  designVariance?: number;
  motionIntensity?: number;
  visualDensity?: number;
}

function clampDial(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function hasAny(query: string, terms: readonly string[]): boolean {
  const value = query.toLowerCase();
  return terms.some((term) => value.includes(term));
}

export function inferCraftMode(query: string): CraftMode {
  if (hasAny(query, ['docs', 'documentation', 'article', 'editorial', 'blog', 'guide', 'help center', 'changelog'])) return 'read';
  if (hasAny(query, ['portfolio', 'gallery', 'showcase', 'exhibition', 'case study'])) return 'experience';
  if (hasAny(query, ['landing', 'marketing', 'pricing', 'campaign', 'conversion', 'sales page', 'launch page'])) return 'persuade';
  return 'operate';
}

export function inferCraftDials(
  query: string,
  mode: CraftMode,
  platform: CraftPlatform = 'any',
  overrides: CraftOverrides = {},
): CraftDials {
  const defaults: Record<CraftMode, CraftDials> = {
    persuade: { designVariance: 7, motionIntensity: 6, visualDensity: 4 },
    operate: { designVariance: 4, motionIntensity: 3, visualDensity: 7 },
    read: { designVariance: 4, motionIntensity: 2, visualDensity: 3 },
    experience: { designVariance: 8, motionIntensity: 6, visualDensity: 3 },
  };
  const result = { ...defaults[mode] };

  if (hasAny(query, ['public sector', 'government', 'regulated', 'clinical', 'healthcare', 'banking', 'finance', 'security', 'access control'])) {
    result.designVariance = Math.min(result.designVariance, 4);
    result.motionIntensity = Math.min(result.motionIntensity, 3);
    result.visualDensity = Math.max(result.visualDensity, 5);
  }

  if (hasAny(query, ['operations', 'operator', 'dispatch', 'admin', 'devtool', 'developer tool', 'infrastructure', 'dashboard', 'triage', 'control room'])) {
    result.visualDensity = Math.max(result.visualDensity, 8);
    result.motionIntensity = Math.min(result.motionIntensity, 3);
  }

  if (hasAny(query, ['creative', 'experimental', 'playful', 'agency', 'awwwards', 'kinetic'])) {
    result.designVariance = Math.max(result.designVariance, 8);
    result.motionIntensity = Math.max(result.motionIntensity, 7);
  }

  if (hasAny(query, ['minimal', 'calm', 'restrained', 'quiet'])) {
    result.designVariance = Math.min(result.designVariance, 5);
    result.motionIntensity = Math.min(result.motionIntensity, 4);
  }

  if (platform === 'mobile') result.motionIntensity = Math.min(result.motionIntensity, 6);

  if (overrides.designVariance !== undefined) result.designVariance = overrides.designVariance;
  if (overrides.motionIntensity !== undefined) result.motionIntensity = overrides.motionIntensity;
  if (overrides.visualDensity !== undefined) result.visualDensity = overrides.visualDensity;

  return {
    designVariance: clampDial(result.designVariance),
    motionIntensity: clampDial(result.motionIntensity),
    visualDensity: clampDial(result.visualDensity),
  };
}

export function buildCraftProfile(
  query: string,
  platform: CraftPlatform = 'any',
  requestedMode: CraftMode | 'auto' = 'auto',
  overrides: CraftOverrides = {},
): CraftProfile {
  const mode = requestedMode === 'auto' ? inferCraftMode(query) : requestedMode;
  const dials = inferCraftDials(query, mode, platform, overrides);

  // Keep these arrays deliberately short: craft_profile and design_plan are
  // routing contracts, not essays. Deeper guidance lives in the skill files.
  const kowalski = [
    'Animate only when motion explains state, space, feedback, or a rare moment; frequent expert actions should be instant or nearly instant.',
    'Polish trigger relationships, press feedback, transform origins and perceived performance before adding more motion.',
  ];

  const impeccable = [
    `Design for the surface mode (${mode}); the brief and incumbent product truth outrank fashionable defaults.`,
    'Complete states, responsive behavior, accessibility and performance before decorative flourish; verify in one bounded fix pass plus one confirmation pass.',
  ];

  const taste = [
    `Bias controls: variance ${dials.designVariance}/10, motion ${dials.motionIntensity}/10, density ${dials.visualDensity}/10.`,
    'Infer direction from the brief and references, then normalize chosen decisions into the project system instead of cloning a style source.',
  ];

  const evidence = [
    'Use optional Figma MCP only when Figma is source truth; pull the exact node/variables/components needed, not the whole file.',
    'Use optional Playwright MCP only for behavior; use audit_design/audit_responsive first for compact rendered measurements and screenshots only for unresolved pixel judgement.',
  ];

  return { mode, dials, kowalski, impeccable, taste, evidence };
}

function formatProfile(profile: CraftProfile): string {
  return [
    `Craft profile — mode: ${profile.mode}`,
    `Dials: variance ${profile.dials.designVariance}/10 | motion ${profile.dials.motionIntensity}/10 | density ${profile.dials.visualDensity}/10`,
    '',
    'Interaction craft:',
    ...profile.kowalski.map((line) => `  - ${line}`),
    'Quality floor:',
    ...profile.impeccable.map((line) => `  - ${line}`),
    'Taste controls:',
    ...profile.taste.map((line) => `  - ${line}`),
    'Evidence:',
    ...profile.evidence.map((line) => `  - ${line}`),
  ].join('\n');
}

export function registerCraftProfileTool(server: McpServer): void {
  server.registerTool(
    'craft_profile',
    {
      title: 'Build a compact design craft profile',
      description: 'Returns surface mode, variance/motion/density dials, a short craft contract, and bounded evidence routing.',
      inputSchema: {
        query: z.string().min(1).describe('Surface + audience + task + constraints.'),
        platform: z.enum(['web', 'mobile', 'any']).default('any'),
        mode: z.enum(['auto', 'persuade', 'operate', 'read', 'experience']).default('auto'),
        designVariance: z.number().int().min(1).max(10).optional(),
        motionIntensity: z.number().int().min(1).max(10).optional(),
        visualDensity: z.number().int().min(1).max(10).optional(),
      },
    },
    async (args) => ({
      content: [{
        type: 'text' as const,
        text: formatProfile(buildCraftProfile(args.query, args.platform, args.mode, {
          designVariance: args.designVariance,
          motionIntensity: args.motionIntensity,
          visualDensity: args.visualDensity,
        })),
      }],
    }),
  );
}
