import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { resolveViewport, type OpenTarget } from '../browser/driver.js';
import type { PlaywrightDriver } from '../browser/playwright.js';
import { getIconSvg, searchIcons, type IconSet } from '../sources/icons.js';
import { analyzePolish } from './analyze.js';
import { collectPolishMeasurements } from './collect.js';

const targetShape = {
  url: z.string().optional().describe('http(s) URL to audit.'),
  file: z.string().optional().describe('Absolute path to a local .html file.'),
  html: z.string().optional().describe('Raw HTML string to render.'),
};

function toTarget(args: { url?: string; file?: string; html?: string }): OpenTarget {
  const provided = [args.url, args.file, args.html].filter((value) => value !== undefined);
  if (provided.length !== 1) throw new Error('Provide exactly one of: url, file, html.');
  return { url: args.url, file: args.file, html: args.html };
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

export function registerPolishTools(server: McpServer, driver: PlaywrightDriver): void {
  server.registerTool(
    'audit_polish',
    {
      title: 'Audit icons, spacing rhythm, alignment, and repeated AI-layout tells',
      description:
        'Runs a second cheap rendered-page pass for the fiddly visual problems that are easy to miss in code review: ' +
        'emoji/raster icons, unlabeled icon buttons, oversized or mismatched glyphs, mixed icon families/styles, repeated boxed ' +
        'feature icons, sparkle decoration, spacing-scale sprawl, off-grid rhythm, cookie-cutter section padding, sibling card ' +
        'padding drift, mismatched control heights, bad heading/body gaps, pill soup, and repeated centered-section stacks. ' +
        'Use after audit_design when a page is technically sound but still feels generated or sloppy.',
      inputSchema: {
        ...targetShape,
        viewport: z.string().default('desktop').describe('Named viewport or explicit WxH.'),
        color_scheme: z.enum(['light', 'dark']).default('light'),
        settle_ms: z.number().int().min(0).max(10_000).default(350),
        ignore_rules: z.array(z.string()).optional().describe('Polish rule ids to suppress.'),
        verbose: z.boolean().default(false).describe('Append icon-family and spacing-step summaries.'),
      },
    },
    async (args) => {
      try {
        const session = await driver.open(toTarget(args), {
          viewport: resolveViewport(args.viewport),
          colorScheme: args.color_scheme,
          settleMs: args.settle_ms,
          reducedMotion: true,
        });
        try {
          const raw = await session.evaluate(collectPolishMeasurements);
          const report = analyzePolish(raw);
          const ignored = new Set(args.ignore_rules ?? []);
          const findings = report.findings.filter((finding) => !ignored.has(finding.id));
          const major = findings.filter((finding) => finding.severity === 'major').length;
          const minor = findings.filter((finding) => finding.severity === 'minor').length;
          const adjustedScore = Math.max(0, 100 - major * 10 - minor * 4);

          const lines = [
            `Polish ${adjustedScore}/100 · ${findings.length} finding${findings.length === 1 ? '' : 's'} · ${report.summary.icons} small SVG icons`,
          ];

          if (findings.length === 0) {
            lines.push('No deterministic icon/spacing polish problems found.');
          } else {
            lines.push('');
            for (const finding of findings) {
              lines.push(`${finding.severity.toUpperCase()} [${finding.id}] ${finding.title}`);
              for (const item of finding.evidence.slice(0, 4)) lines.push(`  · ${item}`);
              lines.push(`  -> ${finding.fix}`);
            }
          }

          if (args.verbose) {
            lines.push('');
            lines.push(`Icon families: ${report.summary.iconFamilies.join(', ') || 'none detected'}`);
            lines.push(`Repeated spacing steps (4-96px): ${report.summary.spacingSteps}`);
            const topSpacing = raw.spacing.values
              .filter((entry) => entry.count >= 2)
              .sort((a, b) => b.count - a.count)
              .slice(0, 12)
              .map((entry) => `${entry.px}px×${entry.count}`)
              .join(', ');
            lines.push(`Most-used spacing: ${topSpacing || 'none'}`);
          }

          return text(lines.join('\n'));
        } finally {
          await session.close();
        }
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    'icon_recommend',
    {
      title: 'Recommend a consistent icon from the bundled offline library',
      description:
        'Searches the bundled Tabler or Lucide package and returns ranked choices plus sane sizing/usage guidance. ' +
        'Use this instead of inventing emoji, hand-drawing SVG paths, or scavenging mismatched icon sets.',
      inputSchema: {
        query: z.string().min(1).describe('What the icon means, e.g. "phone call", "calendar", "payment", "route".'),
        set: z.enum(['tabler', 'lucide']).default('tabler').describe('Choose one family and keep it consistent within the view.'),
        context: z.enum(['dense', 'control', 'navigation', 'feature', 'status']).default('control'),
        limit: z.number().int().min(1).max(12).default(6),
        include_svg: z.boolean().default(false),
        svg_count: z.number().int().min(1).max(4).default(2),
        size: z.number().int().min(12).max(48).optional().describe('Override the context-derived SVG size.'),
        stroke_width: z.number().min(1).max(3).default(2),
      },
    },
    async (args) => {
      try {
        const sizeByContext = {
          dense: 16,
          control: 20,
          navigation: 20,
          feature: 24,
          status: 16,
        } as const;
        const size = args.size ?? sizeByContext[args.context];
        const hits = await searchIcons(args.query, { set: args.set, limit: args.limit });
        if (hits.length === 0) return text(`No ${args.set} icons matched "${args.query}". Try a plainer noun or verb.`);

        const lines = [
          `${args.set} · ${args.context} · default ${size}px / ${args.stroke_width}px stroke`,
          '',
          ...hits.map((hit, index) => `${index + 1}. ${hit.name}${hit.category ? ` [${hit.category}]` : ''}`),
          '',
          'Use currentColor. Keep one optical size per repeated group. Do not put every icon in a colored rounded square.',
          'For icon-only controls, add an accessible name and tooltip when the action is not obvious.',
        ];

        if (args.include_svg) {
          lines.push('');
          for (const hit of hits.slice(0, args.svg_count)) {
            const svg = await getIconSvg(hit.name, args.set as IconSet, {
              size,
              strokeWidth: args.stroke_width,
            });
            lines.push(`<!-- ${args.set}:${hit.name} -->`);
            lines.push(svg);
          }
        }

        return text(lines.join('\n'));
      } catch (error) {
        return failure(error);
      }
    },
  );
}
