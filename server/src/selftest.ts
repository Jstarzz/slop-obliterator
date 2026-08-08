/**
 * Browser-free self test. Run with `npm run build && npm test`.
 *
 * The discipline that matters here: **every rule in the registry must have a
 * case proving it fires, and the same clean baseline must prove it stays
 * quiet.** A coverage gate at the bottom fails the run if a rule is added
 * without a test, so the suite cannot silently fall behind the detector.
 *
 * `smoke.ts` covers the browser path against real rendered pages.
 */

import { analyze } from './audits/analyze.js';
import type { RawMeasurements, Signal } from './audits/collect.js';
import { parseDesignContract } from './audits/rules/design-contract.js';
import { RULES } from './audits/rules/registry.js';
import type { DesignContract } from './audits/rules/types.js';
import {
  buildRamp,
  contrast,
  hueDistance,
  judgeSeed,
  parseColor,
  suggestHue,
} from './color/oklch.js';
import { generateSystem } from './color/system.js';
import { LLM_ONLY_CHECKS } from './format.js';
import { getIconSvg, searchIcons } from './sources/icons.js';

let failures = 0;

function check(ok: boolean, message: string): void {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${message}`);
}

/* ------------------------------------------------------------------ fixtures */

const sig = (): Signal => ({ count: 0, samples: [] });

const firing = (count: number, detail: string): Signal => ({
  count,
  samples: Array.from({ length: Math.min(count, 3) }, (_, i) => ({
    selector: `.thing-${i + 1}`,
    detail,
  })),
});

/**
 * A page where nothing is wrong. Every rule must stay silent on this, which is
 * what makes the per-rule "fires" assertions meaningful.
 */
function cleanPage(): RawMeasurements {
  return {
    url: 'about:test',
    title: 'Ledger',
    viewport: { width: 1440, height: 900 },
    documentWidth: 1440,
    documentHeight: 2400,
    elementsScanned: true,
    isDarkPage: false,
    pageBackground: 'rgb(247, 246, 250)',

    colors: [
      { value: 'rgb(247, 246, 250)', role: 'background', count: 1, area: 1_200_000 },
      { value: 'rgb(255, 255, 255)', role: 'background', count: 3, area: 300_000 },
      { value: 'rgb(12, 106, 92)', role: 'background', count: 2, area: 8_000 },
      { value: 'rgb(28, 27, 34)', role: 'text', count: 8, area: 70_000 },
      { value: 'rgb(84, 82, 94)', role: 'text', count: 4, area: 30_000 },
      { value: 'rgb(214, 212, 222)', role: 'border', count: 4, area: 0 },
    ],
    gradients: [],
    fontFamilies: [
      { value: 'Fraunces', count: 7, area: 120_000 },
      { value: 'Public Sans', count: 14, area: 300_000 },
    ],
    fontSizes: [
      { px: 56, count: 1 },
      { px: 32, count: 2 },
      { px: 21, count: 3 },
      { px: 17, count: 8 },
      { px: 15, count: 3 },
      { px: 14, count: 2 },
    ],
    fontWeights: [
      { weight: 300, count: 3 },
      { weight: 400, count: 12 },
      { weight: 700, count: 5 },
      { weight: 800, count: 1 },
    ],
    radii: [
      { value: '12px', count: 3 },
      { value: '6px', count: 4 },
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

    text: {
      blocks: 11,
      centeredBlocks: 1,
      linesTooLong: 0,
      linesTooShort: 0,
      tightLineHeight: 0,
      maxMeasureCh: 62,
    },

    contrastSamples: [
      {
        selector: 'p.lede',
        text: 'Double-entry accounting',
        foreground: 'rgb(84, 82, 94)',
        background: 'rgb(247, 246, 250)',
        fontSizePx: 20,
        fontWeight: 400,
        onColoredSurface: false,
        foregroundIsGrey: false,
      },
      {
        selector: 'button',
        text: 'Open the books',
        foreground: 'rgb(255, 255, 255)',
        background: 'rgb(12, 106, 92)',
        fontSizePx: 15,
        fontWeight: 700,
        onColoredSurface: true,
        foregroundIsGrey: false,
      },
    ],

    cardRows: [],

    interactive: { total: 4, missingFocusStyle: [], missingHoverStyle: [], smallTargets: [] },

    forms: {
      fieldCount: 1,
      unlabeled: [],
      requiredMarked: 1,
      requiredTotal: 1,
      hasErrorRegion: true,
      hasNoValidationAttrs: false,
    },

    media: { images: 2, missingAlt: [], missingIntrinsicSize: 0, brokenSrc: [], shapeAssembledSvg: [] },

    motion: {
      reducedMotionRuleFound: true,
      animatedElements: 2,
      infiniteAnimations: 0,
      transitionAllCount: 0,
      pulsingDots: sig(),
      blinkingCarets: sig(),
      marquees: sig(),
      bounceEasing: sig(),
      layoutPropertyAnimation: sig(),
      imageHoverTransform: sig(),
    },

    headings: { levels: [1, 2, 3, 3], h1Count: 1, skips: [] },
    overflowX: [],
    landmarks: { main: true, nav: true, header: true, footer: true, skipLink: true },
    stylesheetsReadable: true,
    consoleErrors: 0,

    signals: {
      decorativeGrid: sig(),
      borderOnRounded: sig(),
      sideTabBorder: sig(),
      hairlineWithWideShadow: sig(),
      repeatingGradientStripes: sig(),
      extremeRadius: sig(),
      glassmorphism: sig(),
      radialHalo: sig(),
      gradientText: sig(),
      glowShadow: sig(),
      creamBackground: sig(),
      greyOnColored: sig(),
      eyebrowLabel: sig(),
      iconTileAboveHeading: sig(),
      italicSerifDisplay: sig(),
      oversizedHeroHeadline: sig(),
      crushedTracking: sig(),
      wideTrackingBody: sig(),
      allCapsBody: sig(),
      justifiedText: sig(),
      undersizedFunctionalText: sig(),
      tinyBodyText: sig(),
      numberedSectionLabels: sig(),
      nestedCards: sig(),
      crampedPadding: sig(),
      textTouchingEdge: sig(),
      headingCrowded: sig(),
      occludedText: sig(),
      clippedPositionedChild: sig(),
      invisibleAtRest: sig(),
      lopsidedFirstViewport: sig(),
      flushScrollerCards: sig(),
      repeatedTextInContainer: sig(),
    },

    visibleText:
      'Every entry, twice, in ink. Double-entry accounting for people who would rather see the ledger ' +
      'than a dashboard. Each transaction lands in two places. The books balance or they do not, and you ' +
      'find out in the same second you type. Ledger has been in continuous use since 1904.',
  };
}

const DESIGN_MD = `# Design

Fonts: Fraunces, Public Sans
Palette: #0c6a5c, #1c1b22, #f7f6fa
Corner radius scale: 4px, 6px, 12px
Type scale steps: 14px, 15px, 17px, 21px, 32px, 56px
`;

const contract: DesignContract = parseDesignContract(DESIGN_MD, 'DESIGN.md');

/* ------------------------------------------------------------------- cases */

interface Case {
  id: string;
  setup: (raw: RawMeasurements) => void;
  design?: DesignContract;
}

const cases: Case[] = [
  // --- design system drift ---------------------------------------------------
  {
    id: 'system.font-drift',
    design: contract,
    setup: (r) => {
      r.fontFamilies = [{ value: 'Comic Sans MS', count: 9, area: 40_000 }];
    },
  },
  {
    id: 'system.color-drift',
    design: contract,
    setup: (r) => {
      r.colors.push({ value: 'rgb(220, 38, 38)', role: 'background', count: 4, area: 9_000 });
    },
  },
  {
    id: 'system.radius-drift',
    design: contract,
    setup: (r) => {
      r.radii.push({ value: '19px', count: 5 });
    },
  },
  {
    id: 'system.font-size-drift',
    design: contract,
    setup: (r) => {
      r.fontSizes.push({ px: 18.5, count: 4 });
    },
  },

  // --- visual details --------------------------------------------------------
  { id: 'visual.side-tab-border', setup: (r) => (r.signals.sideTabBorder = firing(2, '4px rgb(99,102,241) on the left edge')) },
  { id: 'visual.border-on-rounded', setup: (r) => (r.signals.borderOnRounded = firing(3, '4px border with 12px radius')) },
  { id: 'visual.hairline-with-wide-shadow', setup: (r) => (r.signals.hairlineWithWideShadow = firing(4, '1px border plus 24px blur')) },
  { id: 'visual.decorative-grid', setup: (r) => (r.signals.decorativeGrid = firing(1, 'tiled gradient at 32px')) },
  { id: 'visual.repeating-stripes', setup: (r) => (r.signals.repeatingGradientStripes = firing(2, 'repeating-linear-gradient')) },
  { id: 'visual.extreme-radius', setup: (r) => (r.signals.extremeRadius = firing(5, '44px radius on a 280x180 card')) },
  { id: 'visual.glassmorphism', setup: (r) => (r.signals.glassmorphism = firing(4, 'backdrop-filter: blur(20px)')) },
  {
    id: 'layout.uniform-radius',
    setup: (r) => {
      r.radii = [{ value: '8px', count: 22 }];
    },
  },
  {
    id: 'layout.default-shadow',
    setup: (r) => {
      r.shadows = [{ value: 'rgba(0, 0, 0, 0.1) 0px 4px 6px 0px', count: 14 }];
    },
  },

  // --- typography ------------------------------------------------------------
  {
    id: 'type.overused-font',
    setup: (r) => {
      r.fontFamilies = [
        { value: 'Inter', count: 28, area: 400_000 },
        { value: 'Public Sans', count: 3, area: 20_000 },
      ];
    },
  },
  {
    id: 'type.single-family',
    setup: (r) => {
      r.fontFamilies = [{ value: 'Fraunces', count: 24, area: 400_000 }];
    },
  },
  {
    id: 'type.flat-hierarchy',
    setup: (r) => {
      r.fontSizes = [
        { px: 24, count: 2 },
        { px: 18, count: 4 },
        { px: 16, count: 9 },
      ];
    },
  },
  {
    id: 'type.weak-weight-contrast',
    setup: (r) => {
      r.fontWeights = [
        { weight: 400, count: 18 },
        { weight: 600, count: 6 },
      ];
    },
  },
  {
    id: 'type.off-scale',
    setup: (r) => {
      r.fontSizes = Array.from({ length: 12 }, (_, i) => ({ px: 12 + i * 3, count: 2 }));
    },
  },
  { id: 'type.eyebrow-label', setup: (r) => (r.signals.eyebrowLabel = firing(2, '"INTRODUCING" above h1')) },
  { id: 'type.icon-tile-above-heading', setup: (r) => (r.signals.iconTileAboveHeading = firing(3, '48px rounded icon tile above h3')) },
  { id: 'type.italic-serif-display', setup: (r) => (r.signals.italicSerifDisplay = firing(1, 'italic serif hero at 72px')) },
  { id: 'type.oversized-hero-headline', setup: (r) => (r.signals.oversizedHeroHeadline = firing(1, '9 words at 68px')) },
  { id: 'type.crushed-tracking', setup: (r) => (r.signals.crushedTracking = firing(2, '-0.070em at 48px')) },
  { id: 'type.wide-tracking-body', setup: (r) => (r.signals.wideTrackingBody = firing(1, '0.080em on 240 characters')) },
  { id: 'type.all-caps-body', setup: (r) => (r.signals.allCapsBody = firing(1, '180 characters in uppercase')) },
  { id: 'type.justified-text', setup: (r) => (r.signals.justifiedText = firing(2, '300 characters justified')) },
  { id: 'type.undersized-functional-text', setup: (r) => (r.signals.undersizedFunctionalText = firing(6, '10px functional text')) },
  { id: 'type.tiny-body-text', setup: (r) => (r.signals.tinyBodyText = firing(3, '9px body copy')) },
  { id: 'type.tight-leading', setup: (r) => (r.text.tightLineHeight = 4) },
  {
    id: 'type.measure-too-wide',
    setup: (r) => {
      r.text.linesTooLong = 3;
      r.text.maxMeasureCh = 132;
    },
  },

  // --- colour ----------------------------------------------------------------
  {
    id: 'color.signature-hex',
    setup: (r) => {
      r.colors.unshift({ value: 'rgb(99, 102, 241)', role: 'background', count: 6, area: 60_000 });
    },
  },
  {
    id: 'color.slop-hue',
    setup: (r) => {
      r.colors.unshift({ value: 'rgb(124, 58, 237)', role: 'background', count: 8, area: 400_000 });
    },
  },
  {
    id: 'color.slop-gradient',
    setup: (r) => {
      r.gradients = [
        { value: 'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)', count: 2 },
      ];
    },
  },
  { id: 'color.gradient-text', setup: (r) => (r.signals.gradientText = firing(3, 'Build the Future')) },
  { id: 'color.radial-halo', setup: (r) => (r.signals.radialHalo = firing(2, 'radial glow over 400k px2')) },
  {
    id: 'color.glow-on-dark',
    setup: (r) => {
      r.isDarkPage = true;
      r.signals.glowShadow = firing(5, 'rgb(0, 255, 170) glow, 24px blur');
    },
  },
  { id: 'color.cream-default', setup: (r) => (r.signals.creamBackground = firing(1, 'page background is a warm cream')) },
  { id: 'color.grey-on-colored', setup: (r) => (r.signals.greyOnColored = firing(4, 'rgb(156,163,175) on rgb(12,106,92)')) },
  {
    id: 'color.timid',
    setup: (r) => {
      r.colors = [
        { value: 'rgb(240, 240, 244)', role: 'background', count: 4, area: 900_000 },
        { value: 'rgb(198, 202, 210)', role: 'background', count: 6, area: 40_000 },
        { value: 'rgb(120, 124, 132)', role: 'text', count: 9, area: 30_000 },
      ];
    },
  },
  {
    id: 'color.hue-sprawl',
    setup: (r) => {
      const hues: Array<[number, number, number]> = [
        [220, 40, 40],
        [220, 140, 40],
        [200, 210, 40],
        [40, 200, 90],
        [40, 190, 210],
        [90, 60, 220],
        [220, 60, 190],
      ];
      for (const [red, green, blue] of hues) {
        r.colors.push({ value: `rgb(${red}, ${green}, ${blue})`, role: 'background', count: 3, area: 5_000 });
      }
    },
  },
  {
    id: 'color.flat-neutrals',
    setup: (r) => {
      for (const level of [64, 128, 160, 200]) {
        r.colors.push({ value: `rgb(${level}, ${level}, ${level})`, role: 'text', count: 3, area: 4_000 });
      }
    },
  },
  {
    id: 'color.contrast',
    setup: (r) => {
      r.contrastSamples.push({
        selector: '.card p',
        text: 'Lightning quick performance',
        foreground: 'rgb(156, 163, 175)',
        background: 'rgb(255, 255, 255)',
        fontSizePx: 15,
        fontWeight: 400,
        onColoredSurface: false,
        foregroundIsGrey: true,
      });
    },
  },

  // --- layout & space --------------------------------------------------------
  {
    id: 'layout.three-card-row',
    setup: (r) => {
      r.cardRows = [
        { selector: 'section.features', childCount: 3, equalWidths: true, childrenHaveIcon: true, childrenHaveHeading: true },
      ];
    },
  },
  {
    id: 'layout.identical-card-grid',
    setup: (r) => {
      r.cardRows = [
        { selector: '.grid-1', childCount: 3, equalWidths: true, childrenHaveIcon: false, childrenHaveHeading: true },
        { selector: '.grid-2', childCount: 3, equalWidths: true, childrenHaveIcon: false, childrenHaveHeading: true },
        { selector: '.grid-3', childCount: 4, equalWidths: true, childrenHaveIcon: false, childrenHaveHeading: true },
      ];
    },
  },
  { id: 'layout.nested-cards', setup: (r) => (r.signals.nestedCards = firing(6, 'card nested 4 levels deep')) },
  {
    id: 'layout.centered-everything',
    setup: (r) => {
      r.text.blocks = 9;
      r.text.centeredBlocks = 8;
    },
  },
  { id: 'layout.numbered-labels', setup: (r) => (r.signals.numberedSectionLabels = firing(3, '"01" at 13px')) },
  {
    id: 'layout.monotonous-spacing',
    setup: (r) => {
      r.spacings = [
        { px: 24, count: 40 },
        { px: 16, count: 6 },
        { px: 8, count: 4 },
      ];
    },
  },
  {
    id: 'space.off-grid',
    setup: (r) => {
      r.spacings = [
        { px: 13, count: 10 },
        { px: 27, count: 9 },
        { px: 11, count: 6 },
        { px: 16, count: 5 },
      ];
    },
  },
  {
    id: 'space.too-many-steps',
    setup: (r) => {
      r.spacings = Array.from({ length: 20 }, (_, i) => ({ px: (i + 1) * 4, count: 2 }));
    },
  },
  { id: 'layout.cramped-padding', setup: (r) => (r.signals.crampedPadding = firing(5, 'padding 2px 4px')) },
  { id: 'layout.text-touching-edge', setup: (r) => (r.signals.textTouchingEdge = firing(2, 'body copy 0px from the edge')) },
  { id: 'layout.heading-crowded', setup: (r) => (r.signals.headingCrowded = firing(3, '8px above, 24px below')) },
  { id: 'layout.horizontal-overflow', setup: (r) => (r.overflowX = ['div.hero (+180px)', 'table (+62px)']) },
  { id: 'layout.occluded-text', setup: (r) => (r.signals.occludedText = firing(1, 'covered by div.overlay')) },
  { id: 'layout.clipped-positioned-child', setup: (r) => (r.signals.clippedPositionedChild = firing(2, 'clips .dropdown')) },
  { id: 'layout.lopsided-first-viewport', setup: (r) => (r.signals.lopsidedFirstViewport = firing(1, 'columns 780px vs 210px')) },
  { id: 'layout.flush-scroller-cards', setup: (r) => (r.signals.flushScrollerCards = firing(1, 'first card 0px from the panel edge')) },

  // --- motion ----------------------------------------------------------------
  {
    id: 'motion.no-reduced-motion',
    setup: (r) => {
      r.motion.reducedMotionRuleFound = false;
      r.motion.animatedElements = 6;
    },
  },
  { id: 'motion.pulsing-dot', setup: (r) => (r.motion.pulsingDots = firing(2, 'pulse on a 10px dot')) },
  { id: 'motion.blinking-caret', setup: (r) => (r.motion.blinkingCarets = firing(1, 'blink')) },
  { id: 'motion.marquee', setup: (r) => (r.motion.marquees = firing(1, 'marquee-scroll')) },
  { id: 'motion.bounce-easing', setup: (r) => (r.motion.bounceEasing = firing(3, 'cubic-bezier(.68,-0.55,.27,1.55)')) },
  { id: 'motion.layout-property-animation', setup: (r) => (r.motion.layoutPropertyAnimation = firing(4, 'transitions width')) },
  { id: 'motion.image-hover-transform', setup: (r) => (r.motion.imageHoverTransform = firing(2, 'scales an image on hover')) },
  { id: 'motion.perpetual', setup: (r) => (r.motion.infiniteAnimations = 7) },
  { id: 'motion.transition-all', setup: (r) => (r.motion.transitionAllCount = 11) },

  // --- copy ------------------------------------------------------------------
  {
    id: 'copy.em-dash-overuse',
    setup: (r) => {
      r.visibleText = Array.from(
        { length: 12 },
        () => 'It works — really well — for teams — of any size — anywhere in the world today.',
      ).join(' ');
    },
  },
  {
    id: 'copy.marketing-buzzword',
    setup: (r) => {
      r.visibleText =
        'Supercharge your workflow with world-class, enterprise-grade tooling that empowers teams to ' +
        'streamline everything and ship faster.';
    },
  },
  {
    id: 'copy.aphoristic-cadence',
    setup: (r) => {
      r.visibleText =
        'Not a feature. A platform. This is not just about speed, it is about certainty. ' +
        'No fluff, no filler, just results.';
    },
  },
  {
    id: 'copy.theater-framing',
    setup: (r) => {
      r.visibleText = 'We killed the growth theater. No more security theater either.';
    },
  },
  { id: 'copy.repeated-text', setup: (r) => (r.signals.repeatedTextInContainer = firing(3, '"Ready" appears more than once')) },
  {
    id: 'copy.weightless-headline',
    setup: (r) => {
      r.visibleText = 'Build faster. Ship smarter. Everything you need to run your business in one place.';
    },
  },

  // --- imagery ---------------------------------------------------------------
  {
    id: 'imagery.shape-assembled',
    setup: (r) => {
      r.media.shapeAssembledSvg = [{ selector: 'svg.hero-art', detail: '320px illustration from 11 primitives' }];
    },
  },
  {
    id: 'imagery.broken-src',
    setup: (r) => {
      r.media.brokenSrc = [{ selector: 'img:nth-child(2)', detail: 'empty src' }];
    },
  },

  // --- state & accessibility --------------------------------------------------
  { id: 'a11y.script-error', setup: (r) => (r.consoleErrors = 2) },
  { id: 'a11y.invisible-at-rest', setup: (r) => (r.signals.invisibleAtRest = firing(5, '420 characters at opacity 0')) },
  {
    id: 'a11y.no-focus-indicator',
    setup: (r) => {
      r.interactive.missingFocusStyle = ['.cta', '.tiny', 'input', 'a.link', 'button.ghost'];
    },
  },
  {
    id: 'state.small-targets',
    setup: (r) => {
      r.interactive.smallTargets = [{ selector: '.tiny', width: 18, height: 18 }];
    },
  },
  { id: 'state.unlabeled-fields', setup: (r) => (r.forms.unlabeled = ['input[type=email]']) },
  {
    id: 'state.required-not-marked',
    setup: (r) => {
      r.forms.requiredTotal = 3;
      r.forms.requiredMarked = 1;
    },
  },
  { id: 'state.no-error-region', setup: (r) => (r.forms.hasErrorRegion = false) },
  { id: 'state.no-validation', setup: (r) => (r.forms.hasNoValidationAttrs = true) },
  {
    id: 'a11y.no-h1',
    setup: (r) => {
      r.headings = { levels: [2, 3, 3], h1Count: 0, skips: [] };
    },
  },
  {
    id: 'a11y.multiple-h1',
    setup: (r) => {
      r.headings = { levels: [1, 1, 2], h1Count: 2, skips: [] };
    },
  },
  {
    id: 'a11y.heading-skip',
    setup: (r) => {
      r.headings = { levels: [1, 3], h1Count: 1, skips: ['h1 -> h3'] };
    },
  },
  { id: 'a11y.missing-alt', setup: (r) => (r.media.missingAlt = ['img.hero']) },
  { id: 'a11y.layout-shift-risk', setup: (r) => (r.media.missingIntrinsicSize = 3) },
  { id: 'a11y.no-main-landmark', setup: (r) => (r.landmarks.main = false) },
];

/* -------------------------------------------------------------------- main */

async function main(): Promise<void> {
  console.log('--- colour primitives ---');
  check(judgeSeed('#6366f1').isSlop, 'indigo-500 flagged');
  check(judgeSeed('#8b5cf6').isSlop, 'violet-500 flagged');
  check(!judgeSeed('#9a3412').isSlop, 'burnt sienna not flagged');
  const suggested = suggestHue([]);
  check(suggested < 258 || suggested > 310, `suggestHue avoids the slop band (got ${suggested})`);
  check(hueDistance(350, 10) === 20, 'hue distance wraps around 360');

  const ramp = buildRamp({ hue: 42, chroma: 0.15, hueShift: 12 });
  check(ramp.length === 11, 'ramp has 11 steps');
  check(
    ramp.every((s, i) => i === 0 || s.l < ramp[i - 1]!.l),
    'ramp lightness is strictly monotonic',
  );
  check(new Set(ramp.map((s) => Math.round(s.h))).size > 1, 'ramp shifts hue across steps');
  check(contrast('#ffffff', '#000000') === 21, 'white on black is 21:1');

  console.log('\n--- design system ---');
  const rejected = generateSystem({ seed: '#6366f1' });
  check(rejected.warnings.some((w) => w.includes('Seed rejected')), 'slop seed rejected and substituted');
  check(
    rejected.hues.primary < 258 || rejected.hues.primary > 310,
    `substituted hue ${rejected.hues.primary} is outside the slop band`,
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
      check(separation >= 90, `${label}/${intensity}: accent ${separation} degrees from primary`);
      const inBand = system.hues.accent >= 250 && system.hues.accent <= 318;
      check(!inBand, `${label}/${intensity}: accent avoids the indigo/violet band`);
    }
  }

  const tokens = generateSystem({ seed: '#9a3412' });
  check(tokens.tokens.light['surface-sunken'] !== tokens.tokens.light['surface'], 'light mode distinguishes sunken from surface');
  check(tokens.tokens.dark['surface-raised'] !== tokens.tokens.dark['surface'], 'dark mode distinguishes raised from surface');
  check(tokens.css.includes('prefers-color-scheme: dark'), 'css includes a dark scheme');
  check(tokens.tailwind.includes('@theme'), 'tailwind v4 @theme block emitted');

  console.log('\n--- design contract parsing ---');
  check(contract.fonts.includes('Fraunces'), `contract picked up fonts: ${contract.fonts.join(', ')}`);
  check(contract.radii.length >= 3, `contract picked up ${contract.radii.length} radii`);
  check(contract.fontSizes.length >= 5, `contract picked up ${contract.fontSizes.length} type steps`);
  check(contract.colors.length >= 3, `contract picked up ${contract.colors.length} colours`);

  console.log('\n--- baseline stays silent ---');
  const baseline = analyze(cleanPage(), 'desktop', { design: contract });
  check(
    baseline.findings.length === 0,
    baseline.findings.length === 0
      ? 'clean page produces zero findings'
      : `clean page produced ${baseline.findings.length}: ${baseline.findings.map((f) => f.id).join(', ')}`,
  );
  check(baseline.score === 100 && baseline.slopScore === 100, `clean page scores ${baseline.score}/${baseline.slopScore}`);
  check(baseline.passed.length >= 6, `clean page records ${baseline.passed.length} passing checks`);

  console.log('\n--- every rule fires on its own fixture ---');
  for (const testCase of cases) {
    const raw = cleanPage();
    testCase.setup(raw);
    const report = analyze(raw, 'desktop', { design: testCase.design ?? null });
    const ids = report.findings.map((f) => f.id);
    check(ids.includes(testCase.id), `${testCase.id} fires`);
  }

  console.log('\n--- rule coverage ---');
  const tested = new Set(cases.map((c) => c.id));
  const untested = RULES.filter((r) => !tested.has(r.id)).map((r) => r.id);
  check(
    untested.length === 0,
    untested.length === 0
      ? `all ${RULES.length} rules have a fixture`
      : `${untested.length} rules have no fixture: ${untested.join(', ')}`,
  );
  const orphans = cases.filter((c) => !RULES.some((r) => r.id === c.id)).map((c) => c.id);
  check(orphans.length === 0, orphans.length === 0 ? 'no fixtures reference a missing rule' : `orphan fixtures: ${orphans.join(', ')}`);
  check(RULES.length >= 64, `${RULES.length} deterministic rules registered`);
  check(LLM_ONLY_CHECKS.length >= 10, `${LLM_ONLY_CHECKS.length} judgement checks registered`);
  check(new Set(RULES.map((r) => r.id)).size === RULES.length, 'rule ids are unique');

  console.log('\n--- scoring behaviour ---');
  const slopPage = cleanPage();
  for (const testCase of cases.filter((c) => !c.design)) testCase.setup(slopPage);
  const slopReport = analyze(slopPage, 'desktop');
  check(slopReport.score === 0, `everything-wrong page scores ${slopReport.score} quality`);
  check(slopReport.slopScore === 0, `everything-wrong page scores ${slopReport.slopScore} slop-free`);
  check(slopReport.counts.slop > 20, `${slopReport.counts.slop} slop tells detected`);
  check(slopReport.counts.quality > 20, `${slopReport.counts.quality} quality defects detected`);
  check(slopReport.verdict.includes('blocker'), 'verdict leads with the blockers');

  const slopOnly = analyze(slopPage, 'desktop', { kinds: ['slop'] });
  check(
    slopOnly.findings.every((f) => f.kind === 'slop'),
    'kinds filter returns only the requested class',
  );
  const suppressed = analyze(slopPage, 'desktop', { disabled: new Set(['color.slop-hue']) });
  check(!suppressed.findings.some((f) => f.id === 'color.slop-hue'), 'ignore_rules suppresses a rule');

  console.log('\n--- icons ---');
  const arrows = await searchIcons('arrow right', { limit: 5 });
  check(arrows[0]?.name === 'arrow-right', `top hit for "arrow right" is ${arrows[0]?.set}:${arrows[0]?.name}`);
  const tabler = await searchIcons('shopping cart', { set: 'tabler', limit: 3 });
  check(tabler.every((h) => h.set === 'tabler'), 'set filter is respected');
  if (arrows[0]) {
    const svg = await getIconSvg(arrows[0].name, arrows[0].set, { size: 20, strokeWidth: 1.5, className: 'ic' });
    check(svg.startsWith('<svg') && svg.includes('width="20"'), 'icon renders at the requested size');
    check(svg.includes('stroke-width="1.5"') && svg.includes('class="ic"'), 'icon stroke width and class applied');
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
