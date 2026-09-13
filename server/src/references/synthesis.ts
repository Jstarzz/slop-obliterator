import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { DESIGN_REFERENCES, type DesignReference } from './design.js';

export type SynthesisRole = 'domain' | 'structure' | 'interaction' | 'components' | 'mobile';

export interface SynthesisAssignment {
  id: string;
  role: SynthesisRole;
  note?: string;
}

function referenceById(id: string): DesignReference | undefined {
  return DESIGN_REFERENCES.find((reference) => reference.id === id);
}

function decisions(reference: DesignReference, role: SynthesisRole): readonly string[] {
  switch (role) {
    case 'domain':
      return reference.tasks.slice(0, 3);
    case 'structure':
      return reference.structure.slice(0, 3);
    case 'interaction':
      return reference.interactions.slice(0, 3);
    case 'components':
      return reference.components.slice(0, 5);
    case 'mobile':
      return (reference.mobile ?? []).slice(0, 3);
  }
}

export function buildSynthesisContract(assignments: readonly SynthesisAssignment[]): string {
  if (assignments.length < 2) throw new Error('Use at least two reference assignments; one reference is selection, not synthesis.');
  if (assignments.length > 5) throw new Error('Use at most five assignments. More than that is reference soup.');

  const seenRoles = new Set<SynthesisRole>();
  const lines = ['# Design synthesis contract'];
  for (const assignment of assignments) {
    if (seenRoles.has(assignment.role)) {
      throw new Error(`Role "${assignment.role}" is assigned more than once. Resolve the conflict before synthesis.`);
    }
    seenRoles.add(assignment.role);

    const reference = referenceById(assignment.id);
    if (!reference) throw new Error(`Unknown design reference "${assignment.id}". Use reference_find first.`);
    const take = decisions(reference, assignment.role);
    if (assignment.role === 'mobile' && take.length === 0) {
      throw new Error(`${reference.name} has no mobile-specific decisions. Pick another reference for the mobile role.`);
    }

    lines.push(
      `- ${assignment.role}: ${reference.name} -> ${take.join('; ')}${assignment.note ? ` | constraint: ${assignment.note}` : ''}`,
    );
  }

  lines.push(
    '- original: product-specific hierarchy, copy, branding, proportions, and composition must be decided for this product rather than inherited from a reference.',
    '- normalize: one spacing scale, radius scale, typography system, icon family, colour/token system, motion grammar, and state language across every borrowed idea.',
    '- reject: do not preserve a source product\'s branded motifs, exact major-region order/proportions, copy, illustrations, or distinctive component chrome.',
    '- verify: audit the rendered result and check that removing the reference names would still leave a coherent rationale for every major UI decision.',
  );
  return lines.join('\n');
}

export function registerReferenceSynthesisTools(server: McpServer): void {
  server.registerTool(
    'reference_contract',
    {
      title: 'Commit reference roles into a synthesis contract',
      description:
        'Turns 2-5 shortlisted reference-role assignments into a compact implementation contract. ' +
        'Rejects duplicate roles, unknown references, and mobile assignments without mobile guidance. ' +
        'Use after reference_rank_axes and before component search or UI implementation.',
      inputSchema: {
        assignments: z.array(z.object({
          id: z.string().describe('Reference id from reference_find/reference_rank_axes.'),
          role: z.enum(['domain', 'structure', 'interaction', 'components', 'mobile']),
          note: z.string().max(240).optional().describe('Optional project-specific constraint on what may be borrowed.'),
        })).min(2).max(5),
      },
    },
    async (args) => {
      try {
        return { content: [{ type: 'text' as const, text: buildSynthesisContract(args.assignments) }] };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: error instanceof Error ? error.message : String(error) }],
          isError: true,
        };
      }
    },
  );
}
