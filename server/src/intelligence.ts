import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';

export type AuditSeverity = 'blocker' | 'major' | 'minor';

export interface RuntimeAuditResult {
  score: number;
  slopScore: number;
  counts: {
    slop: number;
    quality: number;
    blockers: number;
    majors: number;
    minors: number;
  };
  findings: Array<{
    id: string;
    severity: AuditSeverity;
    title: string;
  }>;
}

export interface RuntimeAuditRequest {
  url?: string;
  file?: string;
  html?: string;
  viewport: string;
  colorScheme: 'light' | 'dark';
  reducedMotion: boolean;
  designMd?: string;
  ignoreRules?: string[];
}

export interface IntelligenceDependencies {
  runAudit(request: RuntimeAuditRequest): Promise<RuntimeAuditResult>;
}

type DesignNeed = 'primitive' | 'application' | 'marketing' | 'motion' | 'data' | 'inspiration' | 'any';

type DesignSource = {
  id: string;
  name: string;
  needs: Exclude<DesignNeed, 'any'>[];
  stacks: string[];
  tags: string[];
  authority: 'official-system' | 'library' | 'inspiration';
  integration: string;
  license: string;
  dependencyNote: string;
  adapt: string;
};

const DESIGN_SOURCES: readonly DesignSource[] = [
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    needs: ['primitive', 'application'],
    stacks: ['react', 'next', 'tailwind'],
    tags: ['registry', 'source-owned', 'forms', 'dialog', 'popover', 'table'],
    authority: 'library',
    integration: 'component_find(source="shadcn") / shadcn registry',
    license: 'MIT',
    dependencyNote: 'Copy-owned components; dependency weight depends on the chosen primitive.',
    adapt: 'Keep behavior, replace visual defaults with the project tokens and composition.',
  },
  {
    id: 'radix',
    name: 'Radix Primitives',
    needs: ['primitive', 'application'],
    stacks: ['react', 'next'],
    tags: ['accessible', 'headless', 'dialog', 'menu', 'popover', 'combobox', 'focus'],
    authority: 'library',
    integration: 'React packages / official docs',
    license: 'MIT',
    dependencyNote: 'Focused primitive packages; good when interaction correctness matters more than styling.',
    adapt: 'Own all visual language; use Radix for semantics, focus and keyboard behavior.',
  },
  {
    id: 'base-ui',
    name: 'Base UI',
    needs: ['primitive', 'application'],
    stacks: ['react', 'next'],
    tags: ['accessible', 'unstyled', 'headless', 'menu', 'dialog', 'field', 'combobox'],
    authority: 'library',
    integration: 'React package / official docs',
    license: 'MIT',
    dependencyNote: 'Unstyled primitives intended for building a design system rather than adopting one.',
    adapt: 'Bring the project tokens and components; do not invent a second visual system.',
  },
  {
    id: 'ariakit',
    name: 'Ariakit',
    needs: ['primitive', 'application'],
    stacks: ['react', 'next'],
    tags: ['accessible', 'headless', 'combobox', 'dialog', 'menu', 'composite', 'keyboard'],
    authority: 'library',
    integration: 'React package / official examples',
    license: 'MIT',
    dependencyNote: 'Accessibility-focused primitives with strong examples for complex interaction patterns.',
    adapt: 'Use its behavior model; style against the product contract.',
  },
  {
    id: 'ark-ui',
    name: 'Ark UI',
    needs: ['primitive', 'application'],
    stacks: ['react', 'vue', 'solid', 'svelte'],
    tags: ['accessible', 'headless', 'state-machine', 'cross-framework', 'zag'],
    authority: 'library',
    integration: 'Framework package / official docs',
    license: 'MIT',
    dependencyNote: 'Useful when the same interaction model must span multiple frontend frameworks.',
    adapt: 'Keep the state-machine behavior and bind it to the local styling/token layer.',
  },
  {
    id: 'primer',
    name: 'Primer',
    needs: ['application', 'data'],
    stacks: ['react'],
    tags: ['developer-tools', 'dense-ui', 'accessibility', 'tokens', 'github', 'tables'],
    authority: 'official-system',
    integration: 'Official Primer packages/docs; @primer/mcp where available',
    license: 'Check the specific Primer package',
    dependencyNote: 'A full product design language; best when you actually want Primer semantics and density.',
    adapt: 'Use authoritatively when the product adopts Primer; otherwise borrow patterns, not branding.',
  },
  {
    id: 'carbon',
    name: 'Carbon Design System',
    needs: ['application', 'data'],
    stacks: ['react', 'web-components'],
    tags: ['enterprise', 'data', 'forms', 'tables', 'charts', 'accessibility', 'tokens'],
    authority: 'official-system',
    integration: 'Official Carbon packages/docs/MCP',
    license: 'Apache-2.0 for core; verify individual packages',
    dependencyNote: 'Broad enterprise system with substantial component and token surface area.',
    adapt: 'Adopt intentionally for enterprise products; do not pull the whole system for one component.',
  },
  {
    id: 'park-ui',
    name: 'Park UI',
    needs: ['application', 'primitive'],
    stacks: ['react', 'solid', 'panda'],
    tags: ['ark-ui', 'panda', 'styled', 'accessible', 'components'],
    authority: 'library',
    integration: 'Package/source library',
    license: 'MIT',
    dependencyNote: 'Styled layer over Ark/Panda-style primitives; makes most sense when that stack already fits.',
    adapt: 'Map recipes/tokens into the existing system rather than stacking theme layers.',
  },
  {
    id: 'magic-ui',
    name: 'Magic UI',
    needs: ['marketing', 'motion'],
    stacks: ['react', 'next', 'tailwind'],
    tags: ['animation', 'marketing', 'hero', 'effects', 'shadcn', 'motion'],
    authority: 'library',
    integration: 'shadcn-schema registry / upstream package',
    license: 'MIT',
    dependencyNote: 'Many pieces use Motion; inspect each component before adding it.',
    adapt: 'Use one deliberate moment, not an entire page of effects.',
  },
  {
    id: 'kokonut-ui',
    name: 'KokonutUI',
    needs: ['marketing', 'motion', 'application'],
    stacks: ['react', 'next', 'tailwind'],
    tags: ['animated', 'components', 'shadcn', 'motion', 'interaction'],
    authority: 'library',
    integration: 'shadcn-schema registry / upstream',
    license: 'MIT',
    dependencyNote: 'Often builds on shadcn-style primitives plus Motion.',
    adapt: 'Strip demo styling and keep only the interaction/composition that solves the problem.',
  },
  {
    id: 'react-bits',
    name: 'React Bits',
    needs: ['marketing', 'motion', 'inspiration'],
    stacks: ['react', 'next'],
    tags: ['text-animation', 'background', '3d', 'gsap', 'three', 'motion', 'effects'],
    authority: 'library',
    integration: 'Direct upstream install/registry; discovery is safe, source redistribution is restricted',
    license: 'MIT + Commons Clause',
    dependencyNote: 'Dependency cost varies widely; some effects need GSAP, Three.js, Motion or other specialized packages.',
    adapt: 'Reserve for a genuinely distinctive effect and measure the bundle/runtime cost.',
  },
  {
    id: 'smooth-ui',
    name: 'SmoothUI',
    needs: ['motion', 'marketing', 'application'],
    stacks: ['react', 'next'],
    tags: ['motion', 'interaction', 'animated', 'components'],
    authority: 'library',
    integration: 'component_find(source="smoothui")',
    license: 'MIT',
    dependencyNote: 'Motion-oriented React components.',
    adapt: 'Borrow interaction patterns and re-skin them into the active system.',
  },
  {
    id: 'motion-primitives',
    name: 'Motion Primitives',
    needs: ['motion', 'marketing'],
    stacks: ['react', 'next', 'tailwind'],
    tags: ['motion', 'animation', 'transitions', 'microinteraction'],
    authority: 'library',
    integration: 'Package/source library',
    license: 'MIT',
    dependencyNote: 'Focused animation primitives; lighter conceptually than adopting a whole design language.',
    adapt: 'Use motion only where it communicates state, causality or hierarchy.',
  },
  {
    id: 'uiverse',
    name: 'Uiverse',
    needs: ['inspiration', 'marketing'],
    stacks: ['css', 'tailwind', 'html'],
    tags: ['buttons', 'loaders', 'toggles', 'cards', 'css', 'texture', 'detail'],
    authority: 'inspiration',
    integration: 'component_find(source="uiverse")',
    license: 'MIT; preserve requested attribution where applicable',
    dependencyNote: 'Mostly small CSS/Tailwind ideas; quality varies by community contribution.',
    adapt: 'Use for local texture/details, never as the product-wide design language.',
  },
] as const;

function tokenize(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9.+-]+/g) ?? [];
}

export function findDesignSources(
  query: string,
  need: DesignNeed = 'any',
  stack?: string,
  limit = 5,
): DesignSource[] {
  const terms = tokenize(query);
  const stackTerm = stack?.toLowerCase().trim();

  return DESIGN_SOURCES.map((source) => {
    const haystack = [source.name, source.id, ...source.tags, ...source.needs, ...source.stacks].join(' ').toLowerCase();
    let score = source.authority === 'official-system' ? 2 : 0;
    if (need !== 'any' && source.needs.includes(need)) score += 30;
    if (stackTerm && source.stacks.some((item) => item.includes(stackTerm) || stackTerm.includes(item))) score += 16;
    for (const term of terms) {
      if (source.id === term || source.name.toLowerCase() === term) score += 50;
      else if (haystack.includes(term)) score += 8;
    }
    if (terms.length === 0 && need === 'any' && !stackTerm) score += 1;
    return { source, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.source.name.localeCompare(b.source.name))
    .slice(0, Math.max(1, Math.min(10, limit)))
    .map(({ source }) => source);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonObject(path: string, maxBytes: number): Promise<Record<string, unknown> | null> {
  try {
    const content = await readFile(path, 'utf8');
    if (Buffer.byteLength(content) > maxBytes) return null;
    const value: unknown = JSON.parse(content);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function dependencyMap(packageJson: Record<string, unknown> | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!packageJson) return result;
  for (const key of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const group = packageJson[key];
    if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
    for (const [name, version] of Object.entries(group)) {
      if (typeof version === 'string' && result[name] === undefined) result[name] = version;
    }
  }
  return result;
}

function detectedVersions(deps: Record<string, string>, names: readonly string[]): string[] {
  return names.filter((name) => deps[name]).map((name) => `${name}@${deps[name]}`);
}

export async function profileProject(rootInput: string): Promise<string> {
  const root = resolve(rootInput);
  const packageJson = await readJsonObject(join(root, 'package.json'), 512 * 1024);
  const deps = dependencyMap(packageJson);
  const componentsJson = await exists(join(root, 'components.json'));
  const designMd = await exists(join(root, 'DESIGN.md'));

  const frameworks = detectedVersions(deps, ['next', 'react', 'vue', 'nuxt', 'svelte', '@sveltejs/kit', 'astro', 'vite']);
  const styling = detectedVersions(deps, [
    'tailwindcss',
    '@pandacss/dev',
    'styled-components',
    '@emotion/react',
    '@vanilla-extract/css',
  ]);
  const ui = detectedVersions(deps, [
    '@radix-ui/react-dialog',
    '@base-ui-components/react',
    'ariakit',
    '@ark-ui/react',
    '@chakra-ui/react',
    '@mui/material',
    '@mantine/core',
    '@primer/react',
    '@carbon/react',
  ]);
  if (componentsJson) ui.unshift('shadcn/components.json');

  const motion = detectedVersions(deps, ['motion', 'framer-motion', 'gsap', 'three', 'lenis']);
  const docsTargets = [...frameworks, ...styling, ...ui.filter((item) => item.includes('@'))].slice(0, 12);

  const lines = [
    '# Project context',
    `Root: ${root}`,
    `Framework: ${frameworks.join(', ') || 'not detected from package.json'}`,
    `Styling: ${styling.join(', ') || 'not detected'}`,
    `UI layer: ${ui.join(', ') || 'not detected'}`,
    `Motion/graphics: ${motion.join(', ') || 'none detected'}`,
    `Design contract: ${designMd ? join(root, 'DESIGN.md') : 'none at project root'}`,
    '',
    'Version-specific docs targets:',
    docsTargets.length > 0 ? docsTargets.map((item) => `- ${item}`).join('\n') : '- none detected',
    '',
    'Use these exact package versions when querying Context7 or official docs. Use design_source_find before adding a new UI library; existing project primitives win.',
  ];
  return lines.join('\n');
}

export function registerIntelligenceTools(server: McpServer, dependencies: IntelligenceDependencies): void {
  server.registerTool(
    'design_source_find',
    {
      title: 'Choose the right design system or component source for a UI job',
      description:
        'Routes a UI problem to a small curated set of authoritative systems, accessible primitives, ' +
        'component registries, or motion libraries. Returns integration path, license, dependency cost ' +
        'and what must be adapted. This is source selection, not a giant component dump.',
      inputSchema: {
        query: z.string().default('').describe('Specific job, e.g. "accessible combobox", "animated hero", "dense admin table".'),
        need: z.enum(['primitive', 'application', 'marketing', 'motion', 'data', 'inspiration', 'any']).default('any'),
        stack: z.string().optional().describe('Project stack, e.g. react, next, vue, svelte, tailwind.'),
        limit: z.number().int().min(1).max(8).default(5),
      },
    },
    async (args) => {
      const matches = findDesignSources(args.query, args.need, args.stack, args.limit);
      if (matches.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No curated design source matched. Broaden the job or stack instead of adding a random library.' }] };
      }
      const lines = matches.flatMap((source, index) => [
        `${index + 1}. ${source.name} [${source.authority}]`,
        `   Use: ${source.needs.join(', ')} · Stack: ${source.stacks.join(', ')}`,
        `   Integration: ${source.integration}`,
        `   License: ${source.license}`,
        `   Cost: ${source.dependencyNote}`,
        `   Adapt: ${source.adapt}`,
      ]);
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );

  server.registerTool(
    'project_context',
    {
      title: 'Read the minimum project context needed for UI work',
      description:
        'Reads only bounded project metadata (package.json, components.json presence, DESIGN.md presence) ' +
        'to identify framework, styling/UI/motion dependencies and exact versions for current docs. ' +
        'It deliberately does not dump source files, lockfiles, env files or the conversation.',
      inputSchema: {
        root: z.string().default(process.cwd()).describe('Project root. Defaults to the MCP process working directory.'),
      },
    },
    async (args) => {
      try {
        return { content: [{ type: 'text' as const, text: await profileProject(args.root) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: message }], isError: true };
      }
    },
  );

  server.registerTool(
    'verify_ui',
    {
      title: 'Run an independent production gate across UI variants',
      description:
        'Runs bounded rendered audits across selected breakpoints/color schemes plus a reduced-motion pass, ' +
        'then returns one PASS/FAIL decision. This is the MCP-native ship verifier: implementation is not ' +
        'considered done merely because one desktop screenshot looks good.',
      inputSchema: {
        url: z.string().optional(),
        file: z.string().optional(),
        html: z.string().optional(),
        viewports: z.array(z.string()).min(1).max(3).default(['mobile', 'desktop']),
        color_schemes: z.array(z.enum(['light', 'dark'])).min(1).max(2).default(['light']),
        check_reduced_motion: z.boolean().default(true),
        minimum_quality: z.number().int().min(0).max(100).default(85),
        minimum_slop_free: z.number().int().min(0).max(100).default(85),
        design_md: z.string().optional(),
        ignore_rules: z.array(z.string()).optional(),
      },
    },
    async (args) => {
      try {
        const provided = [args.url, args.file, args.html].filter((value) => value !== undefined);
        if (provided.length !== 1) throw new Error('Provide exactly one of: url, file, html.');

        const baseTarget = { url: args.url, file: args.file, html: args.html };
        const variants: Array<{ viewport: string; colorScheme: 'light' | 'dark'; reducedMotion: boolean; label: string }> = [];
        for (const viewport of args.viewports) {
          for (const colorScheme of args.color_schemes) {
            variants.push({ viewport, colorScheme, reducedMotion: false, label: `${viewport}/${colorScheme}` });
          }
        }
        if (args.check_reduced_motion) {
          variants.push({
            viewport: args.viewports[0]!,
            colorScheme: args.color_schemes[0]!,
            reducedMotion: true,
            label: `${args.viewports[0]}/${args.color_schemes[0]}/reduced-motion`,
          });
        }

        const results: Array<{ label: string; report: RuntimeAuditResult; passes: boolean }> = [];
        for (const variant of variants.slice(0, 7)) {
          const report = await dependencies.runAudit({
            ...baseTarget,
            viewport: variant.viewport,
            colorScheme: variant.colorScheme,
            reducedMotion: variant.reducedMotion,
            designMd: args.design_md,
            ignoreRules: args.ignore_rules,
          });
          const passes =
            report.counts.blockers === 0 &&
            report.score >= args.minimum_quality &&
            report.slopScore >= args.minimum_slop_free;
          results.push({ label: variant.label, report, passes });
        }

        const failed = results.filter((result) => !result.passes);
        const findingCounts = new Map<string, { count: number; severity: AuditSeverity; title: string }>();
        for (const result of failed) {
          for (const finding of result.report.findings.slice(0, 12)) {
            const previous = findingCounts.get(finding.id);
            findingCounts.set(finding.id, {
              count: (previous?.count ?? 0) + 1,
              severity: finding.severity,
              title: finding.title,
            });
          }
        }
        const severityRank: Record<AuditSeverity, number> = { blocker: 0, major: 1, minor: 2 };
        const topFindings = [...findingCounts.entries()]
          .sort((a, b) => severityRank[a[1].severity] - severityRank[b[1].severity] || b[1].count - a[1].count)
          .slice(0, 8);

        const lines = [
          failed.length === 0 ? `PASS — ${results.length}/${results.length} UI variants clear the production gate.` : `FAIL — ${failed.length}/${results.length} UI variants miss the production gate.`,
          `Thresholds: quality >= ${args.minimum_quality}, slop-free >= ${args.minimum_slop_free}, blockers = 0`,
          '',
          ...results.map((result) =>
            `${result.passes ? 'PASS' : 'FAIL'}  ${result.label.padEnd(34)} quality ${String(result.report.score).padStart(3)} · slop-free ${String(result.report.slopScore).padStart(3)} · blockers ${result.report.counts.blockers}`,
          ),
        ];
        if (topFindings.length > 0) {
          lines.push('', 'Top failing signals:');
          for (const [id, value] of topFindings) {
            lines.push(`- [${value.severity}] ${id} (${value.count}/${failed.length} failed variants) — ${value.title}`);
          }
        }
        return { content: [{ type: 'text' as const, text: lines.join('\n') }], isError: failed.length > 0 };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: message }], isError: true };
      }
    },
  );
}
