#!/usr/bin/env node
/**
 * slop-obliterator MCP server.
 *
 * Design note on token cost: every tool here returns a verdict, not a data dump.
 * Published benchmarks put a naive browser MCP at ~114k tokens for a ten-step
 * task, almost all of it raw page snapshots. An audit from this server is a few
 * hundred tokens because the measuring happens in the page and the judging
 * happens in Node — the model only ever sees the conclusion and the fix.
 *
 * Screenshots are opt-in for the same reason.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';

import { analyze, type AnalyzeOptions } from './audits/analyze.js';
import { collectMeasurements } from './audits/collect.js';
import { loadDesignContract } from './audits/rules/design-contract.js';
import { RULES } from './audits/rules/registry.js';
import type { DesignContract } from './audits/rules/types.js';
import { PlaywrightDriver } from './browser/playwright.js';
import { VIEWPORTS, resolveViewport, type OpenTarget, type Session } from './browser/driver.js';
import {
  buildRamp,
  contrast,
  firstStepMeeting,
  judgeSeed,
  lightnessDelta,
  parseColor,
  round,
} from './color/oklch.js';
import { generateSystem } from './color/system.js';
import { LLM_ONLY_CHECKS, renderCritiqueChecklist, renderReport, renderResponsiveSummary } from './format.js';
import { registerIntelligenceRuntimeTools } from './intelligence-runtime.js';
import { componentSources } from './sources/components.js';
import { getIconSvg, installedSetsSummary, searchIcons, type IconSet } from './sources/icons.js';

const driver = new PlaywrightDriver();
const sources = componentSources();
const ARTIFACT_DIR = resolve(process.env.SLOP_ARTIFACT_DIR ?? join(process.cwd(), '.slop-artifacts'));

const server = new McpServer(
  { name: 'slop-obliterator', version: '0.1.0' },
  {
    instructions:
      'Measures whether an interface reads as designed or as machine-default, and supplies the raw ' +
      'material to fix it. Run audit_design after every meaningful UI change — it is cheap and it ' +
      'catches what looking at the code cannot. Start colour work with design_system rather than ' +
      'picking hex values by hand.',
  },
);

registerIntelligenceRuntimeTools(server, driver);

/* ------------------------------------------------------------ target schema */

const targetShape = {
  url: z.string().optional().describe('http(s) URL to audit.'),
  file: z.string().optional().describe('Absolute path to a local .html file.'),
  html: z.string().optional().describe('Raw HTML string to render.'),
};

function toTarget(args: { url?: string; file?: string; html?: string }): OpenTarget {
  const provided = [args.url, args.file, args.html].filter((v) => v !== undefined);
  if (provided.length !== 1) {
    throw new Error('Provide exactly one of: url, file, html.');
  }
  return { url: args.url, file: args.file, html: args.html };
}

async function withSession<T>(
  target: OpenTarget,
  options: {
    viewport: string;
    colorScheme?: 'light' | 'dark';
    settleMs?: number;
    reducedMotion?: boolean;
    /** Multiplies the viewport's device pixel ratio. Lower = cheaper screenshot. */
    pixelScale?: number;
  },
  body: (session: Session) => Promise<T>,
): Promise<T> {
  const base = resolveViewport(options.viewport);
  const viewport =
    options.pixelScale && options.pixelScale !== 1
      ? { ...base, deviceScaleFactor: (base.deviceScaleFactor ?? 1) * options.pixelScale }
      : base;
  const session = await driver.open(target, {
    viewport,
    colorScheme: options.colorScheme ?? 'light',
    settleMs: options.settleMs ?? 350,
    reducedMotion: options.reducedMotion ?? false,
  });
  try {
    return await body(session);
  } finally {
    await session.close();
  }
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

/** Shared across the audit tools so their schemas stay identical. */
const auditOptionsShape = {
  design_md: z
    .string()
    .optional()
    .describe('Path to a DESIGN.md. Enables the four drift rules that flag fonts, colours, radii, and type sizes outside your own system.'),
  kinds: z
    .array(z.enum(['slop', 'quality']))
    .optional()
    .describe('Report only these classes. "slop" is machine-default tells; "quality" is defects that hurt regardless of author.'),
  ignore_rules: z.array(z.string()).optional().describe('Rule ids to suppress, e.g. ["color.cream-default"].'),
};

async function resolveAnalyzeOptions(args: {
  design_md?: string;
  kinds?: Array<'slop' | 'quality'>;
  ignore_rules?: string[];
}): Promise<AnalyzeOptions> {
  let design: DesignContract | null = null;
  if (args.design_md) {
    try {
      design = await loadDesignContract(resolve(args.design_md));
    } catch (error) {
      throw new Error(
        `Could not read the design contract at ${args.design_md}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return {
    design,
    kinds: args.kinds,
    disabled: new Set(args.ignore_rules ?? []),
  };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

/* -------------------------------------------------------------- audit tools */

server.registerTool(
  'audit_design',
  {
    title: 'Audit a rendered page against every known AI-slop and quality pattern',
    description:
      `Renders a page and measures it against ${RULES.length} deterministic rules. Catches the tells: ` +
      'side-tab accent borders, icon tiles above headings, indigo/violet accents, blue-purple and ' +
      'gradient text, radial glow halos, glassmorphism, decorative grids, cream-default grounds, ' +
      'nested cards, the three-equal-cards row, eyebrow labels, oversized hero headlines, italic serif ' +
      'display, overused typefaces, monotonous spacing, pulsing dots, blinking carets, marquees, bounce ' +
      'easing, image hover transforms, marketing buzzwords, em-dash overuse, manufactured-contrast copy. ' +
      'Plus quality defects: contrast, focus rings, 24px targets, form labels and error states, line ' +
      'measure, cramped padding, occluded text, clipped popovers, layout-property animation, heading ' +
      'order, alt text. Returns two scores (quality and slop-free), named findings with evidence, and a ' +
      'fix for each. A few hundred tokens, so run it after every meaningful change.',
    inputSchema: {
      ...targetShape,
      viewport: z
        .string()
        .default('desktop')
        .describe(`One of ${Object.keys(VIEWPORTS).join(', ')} or an explicit "1280x800".`),
      color_scheme: z.enum(['light', 'dark']).default('light'),
      settle_ms: z.number().int().min(0).max(10_000).default(350).describe('Extra wait for fonts and entry animations.'),
      verbose: z.boolean().default(false).describe('Append raw palette/type statistics.'),
      include_judgement_checks: z
        .boolean()
        .default(false)
        .describe('Append the questions no detector can answer. /critique sets this.'),
      ...auditOptionsShape,
    },
  },
  async (args) => {
    try {
      const options = await resolveAnalyzeOptions(args);
      const { report, consoleErrors } = await withSession(
        toTarget(args),
        { viewport: args.viewport, colorScheme: args.color_scheme, settleMs: args.settle_ms },
        async (session) => {
          const raw = await session.evaluate(collectMeasurements);
          const errors = session.consoleErrors().filter((e) => e.type === 'pageerror' || e.type === 'error');
          raw.consoleErrors = errors.length;
          return { report: analyze(raw, args.viewport, options), consoleErrors: errors };
        },
      );

      let body = renderReport(report, { verbose: args.verbose });
      if (consoleErrors.length > 0) {
        body += `\n\nConsole:\n${consoleErrors.slice(0, 5).map((e) => `    · [${e.type}] ${e.text}`).join('\n')}`;
      }
      if (args.include_judgement_checks) {
        body += `\n\n${renderCritiqueChecklist()}`;
      }
      return text(body);
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'list_rules',
  {
    title: 'List every pattern the detector knows',
    description:
      'The full rule catalog with ids, class (slop or quality), severity, and dimension. Use it to pick ' +
      'ids for ignore_rules, or to see what is and is not covered deterministically.',
    inputSchema: {
      dimension: z
        .enum(['color', 'type', 'space', 'layout', 'motion', 'state', 'a11y', 'copy', 'imagery', 'system'])
        .optional(),
      kind: z.enum(['slop', 'quality']).optional(),
      include_fixes: z.boolean().default(false),
    },
  },
  async (args) => {
    const matching = RULES.filter(
      (r) => (!args.dimension || r.dimension === args.dimension) && (!args.kind || r.kind === args.kind),
    );
    const lines = [
      `${matching.length} of ${RULES.length} deterministic rules` +
        `, plus ${LLM_ONLY_CHECKS.length} judgement checks (see /critique).`,
      '',
    ];
    for (const rule of matching) {
      lines.push(`${rule.id.padEnd(34)} ${rule.kind.padEnd(8)} ${rule.severity.padEnd(8)} ${rule.title}`);
      if (args.include_fixes) lines.push(`    -> ${rule.fix}`);
    }
    return text(lines.join('\n'));
  },
);

server.registerTool(
  'audit_responsive',
  {
    title: 'Audit the same page across breakpoints',
    description:
      'Runs the design audit at several viewports and reports which problems are breakpoint-specific ' +
      'versus baked into the design. Use this before calling a layout done — most responsive bugs are ' +
      'invisible at the size the page was built at.',
    inputSchema: {
      ...targetShape,
      viewports: z
        .array(z.string())
        .default(['mobile', 'tablet', 'desktop'])
        .describe(`Any of ${Object.keys(VIEWPORTS).join(', ')} or explicit "WxH" strings.`),
      color_scheme: z.enum(['light', 'dark']).default('light'),
      ...auditOptionsShape,
    },
  },
  async (args) => {
    try {
      const target = toTarget(args);
      const options = await resolveAnalyzeOptions(args);
      const reports: Array<{ viewport: string; report: ReturnType<typeof analyze> }> = [];

      for (const viewport of args.viewports.slice(0, 6)) {
        const report = await withSession(
          target,
          { viewport, colorScheme: args.color_scheme },
          async (session) => analyze(await session.evaluate(collectMeasurements), viewport, options),
        );
        reports.push({ viewport, report });
      }

      return text(renderResponsiveSummary(reports));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'capture',
  {
    title: 'Screenshot a page or element',
    description:
      'Writes a PNG to disk and returns the path. Only set return_image when you actually need to look ' +
      'at pixels — audit_design answers most questions for a fraction of the tokens an image costs.',
    inputSchema: {
      ...targetShape,
      viewport: z.string().default('desktop'),
      color_scheme: z.enum(['light', 'dark']).default('light'),
      full_page: z.boolean().default(false),
      selector: z.string().optional().describe('CSS selector to crop to.'),
      scale: z
        .number()
        .min(0.25)
        .max(1)
        .default(1)
        .describe('Device-pixel-ratio multiplier. Below 1 gives a smaller file at the same layout.'),
      return_image: z.boolean().default(false).describe('Also return the PNG inline. Expensive.'),
      name: z.string().optional().describe('Filename stem for the artifact.'),
    },
  },
  async (args) => {
    try {
      const buffer = await withSession(
        toTarget(args),
        {
          viewport: args.viewport,
          colorScheme: args.color_scheme,
          settleMs: 500,
          pixelScale: args.scale,
        },
        (session) => session.screenshot({ fullPage: args.full_page, selector: args.selector }),
      );

      await mkdir(ARTIFACT_DIR, { recursive: true });
      const stem = (args.name ?? 'capture').replace(/[^a-z0-9_-]/gi, '-').slice(0, 60);
      const path = join(ARTIFACT_DIR, `${stem}-${args.viewport}-${Date.now()}.png`);
      await writeFile(path, buffer);

      const content: Array<
        { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }
      > = [{ type: 'text', text: `Saved ${path} (${Math.round(buffer.byteLength / 1024)} KB)` }];

      if (args.return_image) {
        content.push({ type: 'image', data: buffer.toString('base64'), mimeType: 'image/png' });
      }

      return { content };
    } catch (error) {
      return failure(error);
    }
  },
);

/* -------------------------------------------------------------- colour tools */

server.registerTool(
  'design_system',
  {
    title: 'Generate a contrast-verified OKLCH token set',
    description:
      'Builds primary, accent, neutral and semantic ramps in OKLCH from one seed colour, with eased ' +
      'lightness, a chroma bell curve, and hue shift across each ramp so the result reads as pigment ' +
      'rather than as arithmetic. Verifies every semantic pair against WCAG AA and refuses seeds that ' +
      'land in the indigo/violet slop band unless you override. Emits CSS custom properties and a ' +
      'Tailwind v4 @theme block. Use this before writing any colour by hand.',
    inputSchema: {
      seed: z
        .string()
        .describe('Any CSS colour. Pick it from something real — a material, a place, a photograph — not from a palette site.'),
      accent_seed: z.string().optional().describe('Second hue. Auto-chosen 120-180° away if omitted.'),
      intensity: z.enum(['restrained', 'balanced', 'vivid']).default('balanced'),
      modes: z.array(z.enum(['light', 'dark'])).default(['light', 'dark']),
      prefix: z.string().default('app').describe('Custom-property namespace.'),
      allow_slop_hue: z
        .boolean()
        .default(false)
        .describe('Keep an indigo/violet seed. Only set this when the hue is a real brand decision.'),
      include_ramps: z.boolean().default(false).describe('Include every ramp step. Verbose.'),
    },
  },
  async (args) => {
    try {
      const system = generateSystem({
        seed: args.seed,
        accentSeed: args.accent_seed,
        intensity: args.intensity,
        modes: args.modes,
        prefix: args.prefix,
        allowSlopHue: args.allow_slop_hue,
      });

      const lines: string[] = [];
      lines.push(
        `# Design system — primary ${system.hues.primary}°, accent ${system.hues.accent}°, ${args.intensity}`,
      );

      if (system.warnings.length > 0) {
        lines.push('');
        for (const warning of system.warnings) lines.push(`! ${warning}`);
      }

      const failed = system.checks.filter((c) => !c.passes);
      lines.push('');
      lines.push(
        failed.length === 0
          ? `All ${system.checks.length} semantic pairs clear WCAG AA.`
          : `${failed.length} of ${system.checks.length} semantic pairs fail WCAG AA (listed above).`,
      );

      lines.push('');
      lines.push('## CSS custom properties');
      lines.push('```css');
      lines.push(system.css);
      lines.push('```');

      lines.push('');
      lines.push('## Tailwind v4');
      lines.push('```css');
      lines.push(system.tailwind);
      lines.push('```');

      if (args.include_ramps) {
        lines.push('');
        lines.push('## Ramps');
        for (const [name, ramp] of Object.entries(system.ramps)) {
          lines.push(`${name}: ${ramp.map((s) => `${s.step}=${s.hex}`).join(' ')}`);
        }
      }

      return text(lines.join('\n'));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'contrast_check',
  {
    title: 'Check colour pairs and find the nearest passing shade',
    description:
      'Reports WCAG 2.2 ratio plus OKLCH lightness delta for each foreground/background pair, and when ' +
      'a pair fails, walks a ramp in the foreground hue to name the exact shade that passes. Use this ' +
      'instead of nudging hex values and re-checking.',
    inputSchema: {
      pairs: z
        .array(
          z.object({
            foreground: z.string(),
            background: z.string(),
            label: z.string().optional(),
            large_text: z.boolean().default(false).describe('≥24px, or ≥18.66px bold.'),
          }),
        )
        .min(1)
        .max(30),
    },
  },
  async (args) => {
    try {
      const lines: string[] = [];
      let failures = 0;

      for (const pair of args.pairs) {
        const required = pair.large_text ? 3 : 4.5;
        const ratio = contrast(pair.foreground, pair.background);
        const delta = lightnessDelta(pair.foreground, pair.background);
        const label = pair.label ?? `${pair.foreground} on ${pair.background}`;
        const ok = ratio >= required;
        if (!ok) failures += 1;

        lines.push(
          `${ok ? 'PASS' : 'FAIL'}  ${label}: ${ratio}:1 (needs ${required}:1), ΔL ${delta}`,
        );

        if (!ok) {
          const fg = parseColor(pair.foreground);
          const bg = parseColor(pair.background);
          if (fg && bg) {
            // Keep the foreground's own chroma. Boosting it to a "usable" level
            // turns a grey into a blue and quietly changes the design.
            const ramp = buildRamp({ hue: fg.h, chroma: fg.c, hueShift: fg.c > 0.04 ? 10 : 0 });
            const direction = bg.l > 0.5 ? 'darker' : 'lighter';
            const fix = firstStepMeeting(ramp, pair.background, required, direction);
            if (fix) {
              lines.push(`      → use ${fix.hex} (same hue, step ${fix.step}) for ${contrast(fix.hex, pair.background)}:1`);
            } else {
              lines.push(
                `      → no shade of hue ${Math.round(fg.h)}° clears ${required}:1 on this background; change the background instead`,
              );
            }
          }
        }

        if (delta < 0.28 && ratio >= required) {
          lines.push(
            `      note: ΔL ${delta} is small — this passes WCAG 2 but the two will read as the same value on many screens`,
          );
        }
      }

      lines.unshift(
        failures === 0
          ? `All ${args.pairs.length} pairs pass.`
          : `${failures} of ${args.pairs.length} pairs fail.`,
        '',
      );

      return text(lines.join('\n'));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'judge_color',
  {
    title: 'Check whether a colour is a machine default',
    description:
      'Fast guard before committing to an accent. Flags the known signature hexes, the indigo/violet ' +
      'hue band, and chroma too low to function as an accent. Suggests a replacement hue when it fires.',
    inputSchema: {
      colors: z.array(z.string()).min(1).max(20),
    },
  },
  async (args) => {
    try {
      const lines = args.colors.map((color: string) => {
        const verdict = judgeSeed(color);
        const parsed = parseColor(color);
        const detail = parsed
          ? `L ${round(parsed.l, 3)} C ${round(parsed.c, 3)} H ${Math.round(parsed.h)}°`
          : 'unparseable';
        return verdict.isSlop
          ? `SLOP  ${color} (${detail}) — ${verdict.reasons.join('; ')}`
          : `OK    ${color} (${detail})`;
      });
      return text(lines.join('\n'));
    } catch (error) {
      return failure(error);
    }
  },
);

/* --------------------------------------------------------------- asset tools */

server.registerTool(
  'icon_find',
  {
    title: 'Search Tabler and Lucide icons offline',
    description:
      'Ranked search across ~7000 MIT-licensed icons resolved from local packages, so it works with no ' +
      'network. Both sets are 24×24 / 2px stroke / currentColor, so they mix cleanly. Set include_svg to ' +
      'get markup back for the top hits.',
    inputSchema: {
      query: z.string().describe('What the icon should mean, e.g. "archive folder" or "trending up".'),
      set: z.enum(['tabler', 'lucide', 'both']).default('both'),
      limit: z.number().int().min(1).max(40).default(12),
      include_svg: z.boolean().default(false),
      svg_count: z.number().int().min(1).max(10).default(3).describe('How many hits to return markup for.'),
      size: z.number().int().min(8).max(256).default(24),
      stroke_width: z.number().min(0.5).max(4).default(2),
    },
  },
  async (args) => {
    try {
      const hits = await searchIcons(args.query, { set: args.set, limit: args.limit });
      if (hits.length === 0) {
        return text(`No icons matched "${args.query}". Try a plainer noun — the tags are literal.`);
      }

      const lines = hits.map(
        (hit) =>
          `${hit.set}:${hit.name}${hit.category ? `  [${hit.category}]` : ''}${
            hit.styles.length > 1 ? `  (${hit.styles.join('/')})` : ''
          }`,
      );

      if (args.include_svg) {
        lines.push('');
        for (const hit of hits.slice(0, args.svg_count)) {
          const svg = await getIconSvg(hit.name, hit.set as IconSet, {
            size: args.size,
            strokeWidth: args.stroke_width,
          });
          lines.push(`<!-- ${hit.set}:${hit.name} -->`);
          lines.push(svg);
        }
      }

      return text(lines.join('\n'));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'component_find',
  {
    title: 'Search Uiverse and shadcn-schema component registries',
    description:
      'Finds ready-made components. "uiverse" is ~3000 MIT community CSS/Tailwind elements (buttons, ' +
      'cards, loaders, toggles) - good for texture and detail you would not think to write. "smoothui" ' +
      'is motion-driven React components built on Motion, useful when a layout needs a real interaction ' +
      'rather than another static card. "shadcn" searches any shadcn-schema registry, defaulting to ' +
      'ui.shadcn.com; point SLOP_REGISTRY_URL at an internal one to search your own. Treat results as ' +
      'raw material to adapt into your own system, never as a finished design.',
    inputSchema: {
      query: z.string(),
      source: z.enum(['uiverse', 'shadcn', 'smoothui']).default('shadcn'),
      category: z.string().optional().describe('Uiverse only: Buttons, Cards, Inputs, Loaders, Forms, Tooltips, ...'),
      limit: z.number().int().min(1).max(30).default(10),
    },
  },
  async (args) => {
    try {
      const source = sources[args.source];
      if (!source) throw new Error(`Unknown source "${args.source}".`);

      const results = await source.search(args.query, args.category, args.limit);
      if (results.length === 0) {
        const hint =
          args.source === 'uiverse'
            ? ` Categories: ${source.categories().join(', ')}.`
            : '';
        return text(`No components matched "${args.query}" in ${source.label}.${hint}`);
      }

      const lines = results.map(
        (r) => `${r.id}${r.category ? `  [${r.category}]` : ''}${r.author ? `  by ${r.author}` : ''}`,
      );
      lines.unshift(`${results.length} from ${source.label} — fetch with component_fetch.`, '');
      return text(lines.join('\n'));
    } catch (error) {
      return failure(error);
    }
  },
);

server.registerTool(
  'component_fetch',
  {
    title: 'Fetch a component by id',
    description: 'Returns the code for an id from component_find, with its licence and attribution.',
    inputSchema: {
      id: z.string().describe('An id from component_find, e.g. "uiverse:Buttons/foo_bar.html" or "shadcn:button".'),
    },
  },
  async (args) => {
    try {
      const prefix = args.id.split(':')[0] ?? '';
      const source = sources[prefix];
      if (!source) {
        throw new Error(`Unknown component id "${args.id}". Ids look like "uiverse:..." or "shadcn:...".`);
      }

      const detail = await source.get(args.id);
      const lines = [
        `# ${detail.name} (${detail.source})`,
        detail.url ? detail.url : '',
        `License: ${detail.license}${detail.attribution ? ` · ${detail.attribution}` : ''}`,
        detail.dependencies?.length ? `Dependencies: ${detail.dependencies.join(', ')}` : '',
        '',
        '```' + detail.language,
        detail.code,
        '```',
      ].filter(Boolean);

      return text(lines.join('\n'));
    } catch (error) {
      return failure(error);
    }
  },
);

/* ------------------------------------------------------------------ lifecycle */

async function main(): Promise<void> {
  process.stderr.write(
    `[slop-obliterator] icons ${installedSetsSummary()} · artifacts ${ARTIFACT_DIR}\n`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = () => {
    void driver.shutdown().finally(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  process.stderr.write(`[slop-obliterator] fatal: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});