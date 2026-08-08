/**
 * Browser-free self test. Run with `npm run build && node dist/selftest.js`.
 *
 * The analyser is the part that encodes judgement, so it gets tested against
 * fixtures rather than against a live browser: fast, deterministic, and runnable
 * in CI without a 300MB Chromium download. `smoke.ts` covers the browser path.
 */

import { analyze } from './audits/analyze.js';
import type { RawMeasurements } from './audits/collect.js';
import {
  buildRamp,
  contrast,
  hueDistance,
  judgeSeed,
  parseColor,
  suggestHue,
} from './color/oklch.js';
import { generateSystem } from './color/system.js';
import { getIconSvg, searchIcons } from './sources/icons.js';

let failures = 0;

function check(ok: boolean, message: string): void {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${message}`);
}

function baseMeasurements(): RawMeasurements {
  return {
    url: 'about:test',
    title: 'test',
    viewport: { width: 1440, height: 900 },
    documentWidth: 1440,
    documentHeight: 2400,
    elementsScanned: true,
    colors: [],
    gradients: [],
    fontFamilies: [],
    fontSizes: [],
    fontWeights: [],
    radii: [],
    shadows: [],
    spacings: [],
    text: { blocks: 0, centeredBlocks: 0, linesTooLong: 0, linesTooShort: 0, tightLineHeight: 0, maxMeasureCh: 0 },
    contrastSamples: [],
    cardRows: [],
    interactive: { total: 0, missingFocusStyle: [], missingHoverStyle: [], smallTargets: [] },
    forms: {
      fieldCount: 0,
      unlabeled: [],
      requiredMarked: 0,
      requiredTotal: 0,
      hasErrorRegion: true,
      hasNoValidationAttrs: false,
    },
    media: { images: 0, missingAlt: [], missingIntrinsicSize: 0 },
    motion: { reducedMotionRuleFound: true, animatedElements: 0, infiniteAnimations: 0, transitionAllCount: 0 },
    headings: { levels: [1, 2, 3], h1Count: 1, skips: [] },
    overflowX: [],
    landmarks: { main: true, nav: true, header: true, footer: true, skipLink: true },
    stylesheetsReadable: true,
  };
}

/** What the collector sees on a page assembled out of every default. */
function slopFixture(): RawMeasurements {
  return {
    ...baseMeasurements(),
    colors: [
      { value: 'rgb(99, 102, 241)', role: 'background', count: 4, area: 60_000 },
      { value: 'rgb(129, 140, 248)', role: 'background', count: 3, area: 3_000 },
      { value: 'rgb(255, 255, 255)', role: 'background', count: 12, area: 900_000 },
      { value: 'rgb(156, 163, 175)', role: 'text', count: 9, area: 40_000 },
      { value: 'rgb(75, 85, 99)', role: 'text', count: 6, area: 30_000 },
      { value: 'rgb(229, 231, 235)', role: 'border', count: 5, area: 0 },
    ],
    gradients: [{ value: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)', count: 1 }],
    fontFamilies: [{ value: 'Inter', count: 28, area: 400_000 }],
    fontSizes: [
      { px: 44, count: 1 },
      { px: 20, count: 3 },
      { px: 18, count: 1 },
      { px: 16, count: 4 },
      { px: 15, count: 3 },
    ],
    fontWeights: [
      { weight: 400, count: 18 },
      { weight: 600, count: 6 },
    ],
    radii: [{ value: '8px', count: 14 }],
    shadows: [{ value: 'rgba(0, 0, 0, 0.1) 0px 4px 6px 0px', count: 8 }],
    spacings: [
      { px: 24, count: 10 },
      { px: 27, count: 6 },
      { px: 13, count: 4 },
      { px: 11, count: 3 },
    ],
    text: { blocks: 9, centeredBlocks: 8, linesTooLong: 2, linesTooShort: 0, tightLineHeight: 3, maxMeasureCh: 132 },
    contrastSamples: [
      {
        selector: '.card p',
        text: 'Lightning quick performance',
        foreground: 'rgb(156, 163, 175)',
        background: 'rgb(255, 255, 255)',
        fontSizePx: 15,
        fontWeight: 400,
      },
    ],
    cardRows: [
      { selector: 'section.features', childCount: 3, equalWidths: true, childrenHaveIcon: true, childrenHaveHeading: true },
    ],
    interactive: {
      total: 3,
      missingFocusStyle: ['.cta', '.tiny', 'input:nth-child(1)', 'a.link'],
      missingHoverStyle: [],
      smallTargets: [{ selector: '.tiny', width: 18, height: 18 }],
    },
    forms: {
      fieldCount: 1,
      unlabeled: ['input:nth-child(1)'],
      requiredMarked: 0,
      requiredTotal: 0,
      hasErrorRegion: false,
      hasNoValidationAttrs: true,
    },
    media: { images: 1, missingAlt: ['img:nth-child(2)'], missingIntrinsicSize: 1 },
    motion: { reducedMotionRuleFound: false, animatedElements: 1, infiniteAnimations: 1, transitionAllCount: 0 },
    headings: { levels: [2, 3, 3, 3], h1Count: 0, skips: [] },
  };
}

/** What the collector sees on a page where somebody made decisions. */
function designedFixture(): RawMeasurements {
  return {
    ...baseMeasurements(),
    colors: [
      { value: 'rgb(251, 248, 244)', role: 'background', count: 1, area: 1_200_000 },
      { value: 'rgb(255, 255, 255)', role: 'background', count: 3, area: 300_000 },
      { value: 'rgb(154, 52, 18)', role: 'background', count: 2, area: 8_000 },
      { value: 'rgb(36, 29, 22)', role: 'text', count: 8, area: 70_000 },
      { value: 'rgb(93, 80, 70)', role: 'text', count: 4, area: 30_000 },
      { value: 'rgb(230, 221, 209)', role: 'border', count: 4, area: 0 },
    ],
    gradients: [],
    fontFamilies: [
      { value: 'Georgia', count: 14, area: 300_000 },
      { value: 'IBM Plex Mono', count: 7, area: 90_000 },
    ],
    fontSizes: [
      { px: 56, count: 1 },
      { px: 21, count: 2 },
      { px: 20, count: 1 },
      { px: 17, count: 6 },
      { px: 15, count: 2 },
      { px: 14, count: 2 },
    ],
    fontWeights: [
      { weight: 400, count: 12 },
      { weight: 500, count: 2 },
      { weight: 700, count: 5 },
      { weight: 800, count: 1 },
    ],
    radii: [
      { value: '12px', count: 3 },
      { value: '6px', count: 3 },
      { value: '4px', count: 2 },
    ],
    shadows: [],
    spacings: [
      { px: 4, count: 4 },
      { px: 8, count: 6 },
      { px: 16, count: 8 },
      { px: 24, count: 7 },
      { px: 48, count: 3 },
      { px: 80, count: 2 },
    ],
    text: { blocks: 11, centeredBlocks: 0, linesTooLong: 0, linesTooShort: 0, tightLineHeight: 0, maxMeasureCh: 62 },
    contrastSamples: [
      {
        selector: 'p.lede',
        text: 'Double-entry accounting',
        foreground: 'rgb(93, 80, 70)',
        background: 'rgb(251, 248, 244)',
        fontSizePx: 20,
        fontWeight: 400,
      },
      {
        selector: 'button',
        text: 'Open the books',
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(154, 52, 18)',
        fontSizePx: 15,
        fontWeight: 700,
      },
    ],
    cardRows: [],
    interactive: { total: 3, missingFocusStyle: [], missingHoverStyle: [], smallTargets: [] },
    forms: {
      fieldCount: 1,
      unlabeled: [],
      requiredMarked: 1,
      requiredTotal: 1,
      hasErrorRegion: true,
      hasNoValidationAttrs: false,
    },
    media: { images: 0, missingAlt: [], missingIntrinsicSize: 0 },
    motion: { reducedMotionRuleFound: true, animatedElements: 0, infiniteAnimations: 0, transitionAllCount: 0 },
    headings: { levels: [2, 1, 3, 3], h1Count: 1, skips: [] },
  };
}

async function main(): Promise<void> {
  console.log('--- colour primitives ---');
  check(judgeSeed('#6366f1').isSlop, 'indigo-500 flagged');
  check(judgeSeed('#8b5cf6').isSlop, 'violet-500 flagged');
  check(!judgeSeed('#9a3412').isSlop, 'burnt sienna not flagged');
  check(!judgeSeed('#14625c').isSlop, 'deep teal not flagged');

  const suggested = suggestHue([]);
  check(suggested < 258 || suggested > 310, `suggestHue avoids the slop band (got ${suggested}°)`);
  check(hueDistance(350, 10) === 20, 'hue distance wraps around 360°');

  const ramp = buildRamp({ hue: 42, chroma: 0.15, hueShift: 12 });
  check(ramp.length === 11, 'ramp has 11 steps');
  check(ramp[0]!.l > ramp[10]!.l, 'ramp runs light to dark');
  const monotonic = ramp.every((s, i) => i === 0 || s.l < ramp[i - 1]!.l);
  check(monotonic, 'ramp lightness is strictly monotonic');
  const hueVaries = new Set(ramp.map((s) => Math.round(s.h))).size > 1;
  check(hueVaries, 'ramp shifts hue across steps rather than holding one value');
  check(contrast('#ffffff', '#000000') === 21, 'white on black is 21:1');

  console.log('\n--- design system ---');
  const rejected = generateSystem({ seed: '#6366f1' });
  check(rejected.warnings.some((w) => w.includes('Seed rejected')), 'slop seed rejected and substituted');
  check(
    rejected.hues.primary < 258 || rejected.hues.primary > 310,
    `substituted hue ${rejected.hues.primary}° is outside the slop band`,
  );

  const kept = generateSystem({ seed: '#6366f1', allowSlopHue: true });
  check(Math.abs(kept.hues.primary - (parseColor('#6366f1')?.h ?? 0)) < 1, 'allow_slop_hue keeps the seed hue');

  for (const [label, seed] of [
    ['sienna', '#9a3412'],
    ['teal', '#14625c'],
    ['olive', 'oklch(0.52 0.11 122)'],
    ['ink', '#1f3a5f'],
  ] as const) {
    for (const intensity of ['restrained', 'balanced', 'vivid'] as const) {
      const system = generateSystem({ seed, intensity });
      const failed = system.checks.filter((c) => !c.passes);
      check(failed.length === 0, `${label}/${intensity}: ${system.checks.length} pairs, ${failed.length} failing`);
      const separation = Math.round(hueDistance(system.hues.primary, system.hues.accent));
      check(
        separation >= 90,
        `${label}/${intensity}: accent ${system.hues.accent}° is ${separation}° from primary ${system.hues.primary}°`,
      );
      const accentInSlopBand = system.hues.accent >= 250 && system.hues.accent <= 318;
      check(!accentInSlopBand, `${label}/${intensity}: accent avoids the indigo/violet band`);
    }
  }

  const tokens = generateSystem({ seed: '#9a3412' });
  check(
    tokens.tokens.light['surface-sunken'] !== tokens.tokens.light['surface'],
    'light mode distinguishes sunken from surface',
  );
  check(
    tokens.tokens.dark['surface-raised'] !== tokens.tokens.dark['surface'],
    'dark mode distinguishes raised from surface',
  );
  check(tokens.css.includes('--app-primary:'), 'css exposes semantic custom properties');
  check(tokens.css.includes('prefers-color-scheme: dark'), 'css includes a dark scheme');
  check(tokens.tailwind.includes('@theme'), 'tailwind v4 @theme block emitted');
  check(tokens.tailwind.includes('oklch('), 'tailwind ramps are emitted in oklch');

  console.log('\n--- analyser: slop fixture ---');
  const slop = analyze(slopFixture(), 'desktop');
  const slopIds = new Set(slop.findings.map((f) => f.id));
  const expected = [
    'color.signature-hex',
    'color.slop-hue',
    'color.slop-gradient',
    'color.contrast',
    'type.default-family',
    'type.no-pairing',
    'type.weak-weight-contrast',
    'type.measure-too-wide',
    'type.tight-leading',
    'layout.three-card-row',
    'layout.centered-everything',
    'layout.uniform-radius',
    'layout.default-shadow',
    'space.off-grid',
    'state.small-targets',
    'state.unlabeled-fields',
    'state.no-error-region',
    'state.no-validation',
    'a11y.no-focus-indicator',
    'a11y.no-h1',
    'a11y.missing-alt',
    'motion.no-reduced-motion',
  ];
  for (const id of expected) check(slopIds.has(id), `fires ${id}`);
  check(slop.score < 40, `slop page scores ${slop.score} (< 40)`);
  check(slop.verdict.includes('not shippable'), 'slop verdict names the blockers');

  console.log('\n--- analyser: designed fixture ---');
  const clean = analyze(designedFixture(), 'desktop');
  const cleanIds = new Set(clean.findings.map((f) => f.id));
  for (const id of expected) {
    if (id === 'space.off-grid') continue;
    check(!cleanIds.has(id), `does not fire ${id} on a designed page`);
  }
  check(clean.score >= 90, `designed page scores ${clean.score} (>= 90)`);
  check(clean.passed.length >= 5, `designed page records ${clean.passed.length} passing checks`);
  check(clean.score - slop.score > 45, `discrimination gap is ${clean.score - slop.score} points`);

  console.log('\n--- icons ---');
  const arrows = await searchIcons('arrow right', { limit: 5 });
  check(arrows.length > 0, `search returned ${arrows.length} hits`);
  check(arrows[0]?.name === 'arrow-right', `top hit for "arrow right" is ${arrows[0]?.set}:${arrows[0]?.name}`);

  const tabler = await searchIcons('shopping cart', { set: 'tabler', limit: 3 });
  check(tabler.every((h) => h.set === 'tabler'), 'set filter is respected');

  if (arrows[0]) {
    const svg = await getIconSvg(arrows[0].name, arrows[0].set, { size: 20, strokeWidth: 1.5, className: 'ic' });
    check(svg.startsWith('<svg'), 'icon returns svg markup');
    check(svg.includes('width="20"'), 'icon size applied');
    check(svg.includes('stroke-width="1.5"'), 'icon stroke width applied');
    check(svg.includes('class="ic"'), 'icon class applied');
    check(!svg.includes('\n'), 'icon markup is collapsed to one line');
  }

  let threw = false;
  try {
    await getIconSvg('definitely-not-an-icon', 'lucide');
  } catch {
    threw = true;
  }
  check(threw, 'unknown icon name raises a useful error');

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
