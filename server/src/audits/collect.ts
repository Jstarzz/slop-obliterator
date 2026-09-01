/**
 * The in-page collector.
 *
 * This whole file exists to answer one question cheaply: what did the page
 * actually render? Everything is measured from computed styles, real layout
 * boxes, and parsed stylesheets, never from source code, because the gap between
 * "the CSS says" and "the browser did" is where most design bugs live.
 *
 * `collectMeasurements` is serialised and shipped into the page, so it must be a
 * single self-contained function with no imports and no closure over module
 * scope. It gathers; it does not judge. Judgement lives in `rules/`.
 */

export interface ColorUse {
  value: string;
  role: 'text' | 'background' | 'border';
  count: number;
  area: number;
}

export interface ContrastSample {
  selector: string;
  text: string;
  foreground: string;
  background: string;
  fontSizePx: number;
  fontWeight: number;
  /** True when the background is a colour rather than the page ground. */
  onColoredSurface: boolean;
  /** Chroma-free foreground, i.e. a grey. */
  foregroundIsGrey: boolean;
}

export interface CardRow {
  selector: string;
  childCount: number;
  equalWidths: boolean;
  childrenHaveIcon: boolean;
  childrenHaveHeading: boolean;
}

export interface Sample {
  selector: string;
  detail: string;
}

/** Counted signal with a few worked examples. */
export interface Signal {
  count: number;
  samples: Sample[];
}

export interface RawMeasurements {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  documentWidth: number;
  documentHeight: number;
  elementsScanned: boolean;
  isDarkPage: boolean;
  pageBackground: string;

  colors: ColorUse[];
  gradients: Array<{ value: string; count: number }>;
  fontFamilies: Array<{ value: string; count: number; area: number }>;
  fontSizes: Array<{ px: number; count: number }>;
  fontWeights: Array<{ weight: number; count: number }>;
  radii: Array<{ value: string; count: number }>;
  shadows: Array<{ value: string; count: number }>;
  spacings: Array<{ px: number; count: number }>;

  text: {
    blocks: number;
    centeredBlocks: number;
    linesTooLong: number;
    linesTooShort: number;
    tightLineHeight: number;
    maxMeasureCh: number;
  };

  contrastSamples: ContrastSample[];
  cardRows: CardRow[];

  interactive: {
    total: number;
    missingFocusStyle: string[];
    missingHoverStyle: string[];
    smallTargets: Array<{ selector: string; width: number; height: number }>;
  };

  forms: {
    fieldCount: number;
    unlabeled: string[];
    requiredMarked: number;
    requiredTotal: number;
    hasErrorRegion: boolean;
    hasNoValidationAttrs: boolean;
  };

  media: {
    images: number;
    missingAlt: string[];
    missingIntrinsicSize: number;
    brokenSrc: Sample[];
    shapeAssembledSvg: Sample[];
  };

  motion: {
    reducedMotionRuleFound: boolean;
    animatedElements: number;
    infiniteAnimations: number;
    transitionAllCount: number;
    pulsingDots: Signal;
    blinkingCarets: Signal;
    marquees: Signal;
    bounceEasing: Signal;
    layoutPropertyAnimation: Signal;
    imageHoverTransform: Signal;
  };

  headings: { levels: number[]; h1Count: number; skips: string[] };
  overflowX: string[];
  landmarks: { main: boolean; nav: boolean; header: boolean; footer: boolean; skipLink: boolean };
  stylesheetsReadable: boolean;
  consoleErrors: number;

  /** Everything catalogued as a discrete pattern. */
  signals: {
    // Visual details
    decorativeGrid: Signal;
    borderOnRounded: Signal;
    sideTabBorder: Signal;
    hairlineWithWideShadow: Signal;
    repeatingGradientStripes: Signal;
    extremeRadius: Signal;
    glassmorphism: Signal;

    // Colour
    radialHalo: Signal;
    gradientText: Signal;
    glowShadow: Signal;
    creamBackground: Signal;
    greyOnColored: Signal;

    // Typography
    eyebrowLabel: Signal;
    iconTileAboveHeading: Signal;
    italicSerifDisplay: Signal;
    oversizedHeroHeadline: Signal;
    crushedTracking: Signal;
    wideTrackingBody: Signal;
    allCapsBody: Signal;
    justifiedText: Signal;
    undersizedFunctionalText: Signal;
    tinyBodyText: Signal;

    // Layout
    numberedSectionLabels: Signal;
    nestedCards: Signal;
    crampedPadding: Signal;
    textTouchingEdge: Signal;
    headingCrowded: Signal;
    occludedText: Signal;
    clippedPositionedChild: Signal;
    invisibleAtRest: Signal;
    lopsidedFirstViewport: Signal;
    flushScrollerCards: Signal;

    // Copy
    repeatedTextInContainer: Signal;
  };

  /** Visible prose, capped. Copy rules run over this in Node. */
  visibleText: string;
}

/**
 * Runs inside the page. Keep it dependency-free and defensive: it will be
 * pointed at pages that are half-broken, which is exactly when its output
 * matters most.
 */
export function collectMeasurements(): RawMeasurements {
  const MAX_ELEMENTS = 4000;
  const LIMIT = 30;
  const SAMPLES = 4;

  // ---------------------------------------------------------------- helpers

  const empty = (): Signal => ({ count: 0, samples: [] });

  const note = (signal: Signal, selector: string, detail: string): void => {
    signal.count += 1;
    if (signal.samples.length < SAMPLES) signal.samples.push({ selector, detail });
  };

  const bump = (map: Record<string, number>, key: string, by = 1): void => {
    map[key] = (map[key] ?? 0) + by;
  };

  const selectorFor = (el: Element): string => {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((c) => c && c.length < 24 && !/^(is|has)-/.test(c))
      .slice(0, 2)
      .join('.');
    const parent = el.parentElement;
    const index = parent ? Array.prototype.indexOf.call(parent.children, el) + 1 : 0;
    return cls ? `${tag}.${cls}` : `${tag}:nth-child(${index})`;
  };

  const px = (value: string): number => {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const hasNonZeroDuration = (value: string): boolean =>
    value.split(',').some((part) => {
      const token = part.trim();
      if (!token.endsWith('s')) return false;
      return Number.parseFloat(token) > 0;
    });

  const isVisible = (style: CSSStyleDeclaration, rect: DOMRect): boolean =>
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) !== 0 &&
    rect.width > 0 &&
    rect.height > 0;

  const opaque = (color: string): boolean => {
    if (!color || color === 'transparent') return false;
    const match = /rgba?\(([^)]+)\)/.exec(color);
    if (!match) return true;
    const parts = match[1]!.split(/[,\s/]+/).filter(Boolean);
    return parts.length < 4 || Number(parts[3]) > 0.92;
  };

  const rgbOf = (color: string): [number, number, number] | null => {
    const match = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(color);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
  };

  /** Rec.709 luma, 0..1. Good enough for "is this dark" and "is this grey". */
  const luma = (color: string): number => {
    const rgb = rgbOf(color);
    if (!rgb) return 1;
    return (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  };

  const isGrey = (color: string): boolean => {
    const rgb = rgbOf(color);
    if (!rgb) return false;
    const value = luma(color);
    return Math.max(...rgb) - Math.min(...rgb) <= 12 && value > 0.08 && value < 0.92;
  };

  const isNeutralish = (color: string): boolean => {
    const rgb = rgbOf(color);
    if (!rgb) return true;
    return Math.max(...rgb) - Math.min(...rgb) <= 40;
  };

  const effectiveBackground = (el: Element): string => {
    let node: Element | null = el;
    for (let hops = 0; node && hops < 24; hops += 1) {
      const style = getComputedStyle(node);
      if (opaque(style.backgroundColor)) return style.backgroundColor;
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        const stop = /rgba?\([^)]+\)|#[0-9a-f]{3,8}/i.exec(style.backgroundImage);
        if (stop) return stop[0];
      }
      node = node.parentElement;
    }
    return 'rgb(255, 255, 255)';
  };

  const ownText = (el: Element): string => {
    let out = '';
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) out += child.textContent ?? '';
    }
    return out.trim();
  };

  const normalizeWeight = (weight: string): number => {
    const named: Record<string, number> = { normal: 400, bold: 700, lighter: 300, bolder: 700 };
    return named[weight] ?? (Number(weight) || 400);
  };

  /** A box that reads as a card: has a surface and an edge or a shadow. */
  const isCardLike = (style: CSSStyleDeclaration, rect: DOMRect): boolean => {
    if (rect.width < 80 || rect.height < 48) return false;
    const hasSurface = opaque(style.backgroundColor);
    const hasEdge = px(style.borderTopWidth) > 0 || px(style.borderLeftWidth) > 0;
    const hasShadow = style.boxShadow !== 'none';
    const rounded = px(style.borderRadius) > 0;
    return (hasSurface || hasEdge || hasShadow) && (rounded || hasEdge || hasShadow);
  };

  // ------------------------------------------------------------ accumulators

  const colorCounts: Record<string, { role: ColorUse['role']; count: number; area: number }> = {};
  const gradientCounts: Record<string, number> = {};
  const familyCounts: Record<string, { count: number; area: number }> = {};
  const sizeCounts: Record<string, number> = {};
  const weightCounts: Record<string, number> = {};
  const radiusCounts: Record<string, number> = {};
  const shadowCounts: Record<string, number> = {};
  const spacingCounts: Record<string, number> = {};

  const contrastSamples: ContrastSample[] = [];
  const cardRows: CardRow[] = [];
  const missingFocusStyle: string[] = [];
  const missingHoverStyle: string[] = [];
  const smallTargets: Array<{ selector: string; width: number; height: number }> = [];
  const unlabeled: string[] = [];
  const missingAlt: string[] = [];
  const overflowX: string[] = [];
  const headingLevels: number[] = [];
  const headingSkips: string[] = [];

  const signals: RawMeasurements['signals'] = {
    decorativeGrid: empty(),
    borderOnRounded: empty(),
    sideTabBorder: empty(),
    hairlineWithWideShadow: empty(),
    repeatingGradientStripes: empty(),
    extremeRadius: empty(),
    glassmorphism: empty(),
    radialHalo: empty(),
    gradientText: empty(),
    glowShadow: empty(),
    creamBackground: empty(),
    greyOnColored: empty(),
    eyebrowLabel: empty(),
    iconTileAboveHeading: empty(),
    italicSerifDisplay: empty(),
    oversizedHeroHeadline: empty(),
    crushedTracking: empty(),
    wideTrackingBody: empty(),
    allCapsBody: empty(),
    justifiedText: empty(),
    undersizedFunctionalText: empty(),
    tinyBodyText: empty(),
    numberedSectionLabels: empty(),
    nestedCards: empty(),
    crampedPadding: empty(),
    textTouchingEdge: empty(),
    headingCrowded: empty(),
    occludedText: empty(),
    clippedPositionedChild: empty(),
    invisibleAtRest: empty(),
    lopsidedFirstViewport: empty(),
    flushScrollerCards: empty(),
    repeatedTextInContainer: empty(),
  };

  const brokenSrcSignal = empty();
  const motion: RawMeasurements['motion'] = {
    reducedMotionRuleFound: false,
    animatedElements: 0,
    infiniteAnimations: 0,
    transitionAllCount: 0,
    pulsingDots: empty(),
    blinkingCarets: empty(),
    marquees: empty(),
    bounceEasing: empty(),
    layoutPropertyAnimation: empty(),
    imageHoverTransform: empty(),
  };

  let blocks = 0;
  let centeredBlocks = 0;
  let linesTooLong = 0;
  let linesTooShort = 0;
  let tightLineHeight = 0;
  let maxMeasureCh = 0;
  let interactiveTotal = 0;
  let missingIntrinsicSize = 0;
  let requiredMarked = 0;
  let requiredTotal = 0;
  let visibleText = '';

  const bodyStyle = getComputedStyle(document.body);
  const pageBackground = opaque(bodyStyle.backgroundColor)
    ? bodyStyle.backgroundColor
    : effectiveBackground(document.body);
  const pageLuma = luma(pageBackground);
  const isDarkPage = pageLuma < 0.35;

  // A warm off-white ground has become the reflex "tasteful" surface.
  {
    const rgb = rgbOf(pageBackground);
    if (rgb && rgb[0] > 235 && rgb[1] > 228 && rgb[2] > 210 && rgb[0] - rgb[2] >= 8 && rgb[0] - rgb[2] <= 45) {
      note(signals.creamBackground, 'body', `page background ${pageBackground} is a warm cream`);
    }
  }

  const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
  const elements = all.slice(0, MAX_ELEMENTS);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Track card nesting depth without an O(n^2) ancestor walk.
  const cardDepth = new WeakMap<Element, number>();

  // ------------------------------------------------------------- main sweep

  for (const el of elements) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();

    // Content shipped at opacity 0 and never revealed.
    if (style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) === 0) {
      const textLength = (el.textContent ?? '').trim().length;
      if (textLength > 40 && rect.width > 0) {
        note(signals.invisibleAtRest, selectorFor(el), `${textLength} characters at opacity 0`);
      }
    }

    if (!isVisible(style, rect)) continue;

    const area = Math.round(rect.width * rect.height);
    const sel = selectorFor(el);

    // ------------------------------------------------------- overflow / clipping

    if (rect.right > viewportWidth + 2 && overflowX.length < LIMIT) {
      const overflowBy = Math.round(rect.right - viewportWidth);
      if (overflowBy > 4) overflowX.push(`${sel} (+${overflowBy}px)`);
    }

    if (style.overflow === 'hidden' || style.overflow === 'clip' || style.overflowY === 'hidden') {
      const escapee = el.querySelector(
        '[class*="tooltip"],[class*="popover"],[class*="dropdown"],[class*="menu"],[role="tooltip"],[role="menu"]',
      );
      if (escapee) {
        const child = getComputedStyle(escapee);
        if (child.position === 'absolute' || child.position === 'fixed') {
          note(signals.clippedPositionedChild, sel, `clips ${selectorFor(escapee)} (${child.position})`);
        }
      }
    }

    // ------------------------------------------------------------------ colour

    if (opaque(style.backgroundColor)) {
      const key = style.backgroundColor;
      colorCounts[key] ??= { role: 'background', count: 0, area: 0 };
      colorCounts[key]!.count += 1;
      colorCounts[key]!.area += area;
    }

    const bgImage = style.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      if (bgImage.includes('gradient')) bump(gradientCounts, bgImage.slice(0, 200));

      if (bgImage.includes('repeating-linear-gradient') || bgImage.includes('repeating-radial-gradient')) {
        note(signals.repeatingGradientStripes, sel, bgImage.slice(0, 70));
      }

      // A grid is a small tiled linear gradient, usually two of them crossed.
      const tile = style.backgroundSize;
      const tileSize = px(tile);
      if (
        bgImage.includes('linear-gradient') &&
        !bgImage.includes('repeating') &&
        tileSize > 0 &&
        tileSize <= 96 &&
        area > 40_000
      ) {
        note(signals.decorativeGrid, sel, `tiled gradient at ${tile} over ${Math.round(area / 1000)}k px2`);
      }

      if (bgImage.includes('radial-gradient') && area > 60_000) {
        const stops = bgImage.match(/rgba?\([^)]+\)/g) ?? [];
        const saturated = stops.some((s) => !isNeutralish(s));
        if (saturated) {
          note(signals.radialHalo, sel, `radial glow over ${Math.round(area / 1000)}k px2`);
        }
      }

      // Gradient text: paint the background and knock the glyphs out of it.
      const clip = style.getPropertyValue('background-clip') || style.getPropertyValue('-webkit-background-clip');
      const fill = style.getPropertyValue('-webkit-text-fill-color');
      if (bgImage.includes('gradient') && clip.includes('text') && /transparent|rgba\(0, 0, 0, 0\)/.test(fill)) {
        note(signals.gradientText, sel, (el.textContent ?? '').trim().slice(0, 40) || bgImage.slice(0, 40));
      }
    }

    // --------------------------------------------------------------- surfaces

    const radius = px(style.borderTopLeftRadius);
    if (style.borderRadius && style.borderRadius !== '0px') bump(radiusCounts, style.borderRadius);

    const widths = [
      px(style.borderTopWidth),
      px(style.borderRightWidth),
      px(style.borderBottomWidth),
      px(style.borderLeftWidth),
    ];
    const maxBorder = Math.max(...widths);
    const thickSides = widths.filter((w) => w >= 3).length;
    const borderColor = style.borderTopColor;

    if (maxBorder > 0 && opaque(borderColor)) {
      const key = `border:${borderColor}`;
      colorCounts[key] ??= { role: 'border', count: 0, area: 0 };
      colorCounts[key]!.count += 1;
    }

    if (isCardLike(style, rect)) {
      // Side-tab: one thick coloured edge, the rest hairline or absent.
      if (thickSides === 1 && maxBorder >= 3) {
        const side = ['top', 'right', 'bottom', 'left'][widths.indexOf(maxBorder)];
        const edgeColor = [
          style.borderTopColor,
          style.borderRightColor,
          style.borderBottomColor,
          style.borderLeftColor,
        ][widths.indexOf(maxBorder)]!;
        if (!isNeutralish(edgeColor)) {
          note(signals.sideTabBorder, sel, `${Math.round(maxBorder)}px ${edgeColor} on the ${side} edge`);
        }
      }

      // Thick accent border fighting a rounded corner.
      if (maxBorder >= 3 && radius >= 6 && thickSides >= 3 && !isNeutralish(borderColor)) {
        note(signals.borderOnRounded, sel, `${Math.round(maxBorder)}px border with ${Math.round(radius)}px radius`);
      }

      // Hairline edge plus a wide soft shadow: pick one.
      if (maxBorder > 0 && maxBorder <= 1.5 && style.boxShadow !== 'none') {
        const blur = Number.parseFloat((/\d+px\s+\d+px\s+(\d+(?:\.\d+)?)px/.exec(style.boxShadow) ?? [])[1] ?? '0');
        if (blur >= 12) {
          note(signals.hairlineWithWideShadow, sel, `${maxBorder}px border plus ${Math.round(blur)}px blur`);
        }
      }

      // Over-rounding a small card turns it into a blob.
      if (radius >= 24 && rect.width < 640 && rect.height < 480) {
        note(signals.extremeRadius, sel, `${Math.round(radius)}px radius on a ${Math.round(rect.width)}x${Math.round(rect.height)} card`);
      }

      const parentDepth = el.parentElement ? (cardDepth.get(el.parentElement) ?? 0) : 0;
      const depth = parentDepth + 1;
      cardDepth.set(el, depth);
      if (depth >= 3) {
        note(signals.nestedCards, sel, `card nested ${depth} levels deep`);
      }
    } else if (el.parentElement) {
      cardDepth.set(el, cardDepth.get(el.parentElement) ?? 0);
    }

    const backdrop = style.backdropFilter || style.getPropertyValue('-webkit-backdrop-filter');
    if (backdrop && backdrop !== 'none' && backdrop.includes('blur') && area > 10_000) {
      note(signals.glassmorphism, sel, `backdrop-filter: ${backdrop.slice(0, 40)}`);
    }

    if (style.boxShadow && style.boxShadow !== 'none') {
      bump(shadowCounts, style.boxShadow.slice(0, 160));
      // A saturated shadow with no offset is a glow, not an elevation.
      const shadowColor = (/rgba?\([^)]+\)/.exec(style.boxShadow) ?? [])[0];
      const offsets = style.boxShadow.match(/-?\d+(?:\.\d+)?px/g) ?? [];
      const dx = Math.abs(Number.parseFloat(offsets[0] ?? '0'));
      const dy = Math.abs(Number.parseFloat(offsets[1] ?? '0'));
      const blur = Number.parseFloat(offsets[2] ?? '0');
      if (shadowColor && !isNeutralish(shadowColor) && blur >= 8 && dx <= 2 && dy <= 4) {
        note(signals.glowShadow, sel, `${shadowColor} glow, ${Math.round(blur)}px blur`);
      }
    }

    for (const value of [style.paddingTop, style.paddingLeft, style.marginBottom, style.gap]) {
      const n = px(value);
      if (n > 0 && n < 400) bump(spacingCounts, String(Math.round(n)));
    }

    // Cramped padding inside a bordered or filled container.
    if ((opaque(style.backgroundColor) || maxBorder > 0) && (el.textContent ?? '').trim().length > 0) {
      const padX = Math.min(px(style.paddingLeft), px(style.paddingRight));
      const padY = Math.min(px(style.paddingTop), px(style.paddingBottom));
      const hasElementChildren = el.children.length > 0;
      if (!hasElementChildren && rect.height < 400 && (padX < 8 || padY < 4)) {
        note(signals.crampedPadding, sel, `padding ${Math.round(padY)}px ${Math.round(padX)}px`);
      }
    }

    // ---------------------------------------------------------------- motion

    if (style.animationName && style.animationName !== 'none') {
      motion.animatedElements += 1;
      const names = style.animationName.toLowerCase();
      const infinite = style.animationIterationCount === 'infinite';
      if (infinite) motion.infiniteAnimations += 1;

      if (infinite && /pulse|ping|ripple|throb/.test(names) && rect.width <= 24 && rect.height <= 24) {
        note(motion.pulsingDots, sel, `${style.animationName} on a ${Math.round(rect.width)}px dot`);
      }
      if (infinite && /blink|caret|cursor/.test(names)) {
        note(motion.blinkingCarets, sel, style.animationName);
      }
      if (infinite && /marquee|scroll|ticker|slide-?(left|right)|infinite/.test(names) && rect.width > 200) {
        note(motion.marquees, sel, style.animationName);
      }
    }

    if (style.transitionProperty === 'all' && hasNonZeroDuration(style.transitionDuration)) {
      motion.transitionAllCount += 1;
    }

    for (const timing of [style.animationTimingFunction, style.transitionTimingFunction]) {
      if (!timing || timing === 'none') continue;
      if (/bounce|elastic|back/i.test(timing)) {
        note(motion.bounceEasing, sel, timing.slice(0, 50));
        continue;
      }
      // A cubic-bezier whose control points leave 0..1 overshoots.
      const bezier = /cubic-bezier\(([^)]+)\)/.exec(timing);
      if (bezier) {
        const nums = bezier[1]!.split(',').map((n) => Number.parseFloat(n));
        if (nums.length === 4 && (nums[1]! < -0.02 || nums[3]! > 1.02 || nums[1]! > 1.02 || nums[3]! < -0.02)) {
          note(motion.bounceEasing, sel, timing.slice(0, 50));
        }
      }
    }

    const animatedProps = `${style.transitionProperty} ${style.willChange}`;
    if (
      /\b(width|height|padding|margin|top|left|right|bottom)\b/.test(animatedProps) &&
      hasNonZeroDuration(style.transitionDuration)
    ) {
      note(motion.layoutPropertyAnimation, sel, `transitions ${style.transitionProperty}`);
    }

    // ------------------------------------------------------------ typography

    const own = ownText(el);
    if (own.length > 0) {
      if (visibleText.length < 8000) visibleText += own + '\n';

      const family = style.fontFamily.split(',')[0]!.replace(/["']/g, '').trim();
      familyCounts[family] ??= { count: 0, area: 0 };
      familyCounts[family]!.count += 1;
      familyCounts[family]!.area += area;

      const fontSize = Math.round(px(style.fontSize) * 10) / 10;
      bump(sizeCounts, String(fontSize));
      const weight = normalizeWeight(style.fontWeight);
      bump(weightCounts, String(weight));

      blocks += 1;
      if (style.textAlign === 'center') centeredBlocks += 1;
      if (style.textAlign === 'justify' && own.length > 120 && !style.getPropertyValue('hyphens').includes('auto')) {
        note(signals.justifiedText, sel, `${own.length} characters justified without hyphenation`);
      }

      const tracking = px(style.letterSpacing) / (fontSize || 1);
      if (fontSize >= 28 && tracking <= -0.05) {
        note(signals.crushedTracking, sel, `${tracking.toFixed(3)}em at ${fontSize}px`);
      }
      if (own.length > 80 && tracking >= 0.05 && style.textTransform !== 'uppercase') {
        note(signals.wideTrackingBody, sel, `${tracking.toFixed(3)}em on ${own.length} characters`);
      }

      const upper = style.textTransform === 'uppercase' || own === own.toUpperCase();
      if (upper && own.length > 120) {
        note(signals.allCapsBody, sel, `${own.length} characters in uppercase`);
      }

      const lineHeight = px(style.lineHeight);
      if (lineHeight > 0 && fontSize > 0 && own.length > 90 && lineHeight / fontSize < 1.4) {
        tightLineHeight += 1;
      }

      const interactiveContext = !!el.closest('a,button,label,th,td,nav,[role="button"]');
      if (fontSize < 11 && interactiveContext) {
        note(signals.undersizedFunctionalText, sel, `${fontSize}px functional text`);
      }
      if (fontSize < 12 && own.length > 60) {
        note(signals.tinyBodyText, sel, `${fontSize}px body copy`);
      }

      if (own.length > 60) {
        const measureCh = rect.width / (fontSize * 0.5);
        if (measureCh > maxMeasureCh) maxMeasureCh = Math.round(measureCh);
        if (measureCh > 85) linesTooLong += 1;
        if (measureCh < 40 && rect.width > 200) linesTooShort += 1;

        if (rect.left < 8 || viewportWidth - rect.right < 8) {
          note(signals.textTouchingEdge, sel, `body copy ${Math.round(rect.left)}px from the viewport edge`);
        }
      }

      const bg = effectiveBackground(el);
      if (contrastSamples.length < LIMIT) {
        contrastSamples.push({
          selector: sel,
          text: own.slice(0, 40),
          foreground: style.color,
          background: bg,
          fontSizePx: fontSize,
          fontWeight: weight,
          onColoredSurface: !isNeutralish(bg),
          foregroundIsGrey: isGrey(style.color),
        });
      }

      if (isGrey(style.color) && !isNeutralish(bg) && luma(bg) > 0.2) {
        note(signals.greyOnColored, sel, `${style.color} on ${bg}`);
      }

      const textKey = `text:${style.color}`;
      colorCounts[textKey] ??= { role: 'text', count: 0, area: 0 };
      colorCounts[textKey]!.count += 1;
      colorCounts[textKey]!.area += area;

      // Tiny sequence numbers used as editorial furniture.
      if (/^0?\d{1,2}$/.test(own) && fontSize <= 15 && rect.top < viewportHeight * 3) {
        note(signals.numberedSectionLabels, sel, `"${own}" at ${fontSize}px`);
      }
    }

    // ------------------------------------------------------- headings & eyebrows

    if (/^h[1-6]$/.test(tag)) {
      headingLevels.push(Number(tag[1]));
      const headingSize = px(style.fontSize);
      const headingText = (el.textContent ?? '').trim();

      // Eyebrow: a small tracked-out label immediately above a much larger heading.
      const previous = el.previousElementSibling;
      if (previous) {
        const prevStyle = getComputedStyle(previous);
        const prevSize = px(prevStyle.fontSize);
        const prevText = (previous.textContent ?? '').trim();
        const prevTracking = px(prevStyle.letterSpacing) / (prevSize || 1);
        const isKicker =
          prevText.length > 0 &&
          prevText.length < 40 &&
          prevSize <= 16 &&
          headingSize >= prevSize * 1.6 &&
          (prevStyle.textTransform === 'uppercase' || prevText === prevText.toUpperCase()) &&
          prevTracking >= 0.04;
        if (isKicker) {
          note(signals.eyebrowLabel, selectorFor(previous), `"${prevText.slice(0, 32)}" above ${tag}`);
        }

        // Icon tile: a small rounded square containing an svg, sitting above a heading.
        const prevRect = previous.getBoundingClientRect();
        const hasSvg = !!previous.querySelector('svg,img');
        const squarish = Math.abs(prevRect.width - prevRect.height) < 8;
        if (
          hasSvg &&
          squarish &&
          prevRect.width >= 24 &&
          prevRect.width <= 88 &&
          px(prevStyle.borderTopLeftRadius) >= 4 &&
          (opaque(prevStyle.backgroundColor) || px(prevStyle.borderTopWidth) > 0)
        ) {
          note(
            signals.iconTileAboveHeading,
            selectorFor(previous),
            `${Math.round(prevRect.width)}px rounded icon tile above ${tag}`,
          );
        }
      }

      // Hero treatment checks, first viewport only.
      if (rect.top < viewportHeight && headingSize >= 44) {
        const words = headingText.split(/\s+/).filter(Boolean).length;
        if (words >= 6) {
          note(
            signals.oversizedHeroHeadline,
            sel,
            `${words} words at ${Math.round(headingSize)}px, ${Math.round((rect.height / viewportHeight) * 100)}% of the fold`,
          );
        }
        const family = style.fontFamily.toLowerCase();
        const serif =
          /serif|georgia|garamond|playfair|instrument|times|didot|bodoni|cormorant|freight/.test(family) &&
          !family.includes('sans-serif');
        if (style.fontStyle === 'italic' && serif) {
          note(signals.italicSerifDisplay, sel, `italic serif hero at ${Math.round(headingSize)}px`);
        }
      }

      // A heading closer to the block above than to its own content.
      const spaceAbove = px(style.marginTop);
      const spaceBelow = px(style.marginBottom);
      if (spaceAbove > 0 && spaceBelow > 0 && spaceAbove < spaceBelow * 0.7) {
        note(signals.headingCrowded, sel, `${Math.round(spaceAbove)}px above, ${Math.round(spaceBelow)}px below`);
      }
    }

    // ----------------------------------------------------------- interactive

    const role = el.getAttribute('role');
    const interactive =
      tag === 'button' ||
      tag === 'select' ||
      tag === 'textarea' ||
      (tag === 'a' && el.hasAttribute('href')) ||
      (tag === 'input' && el.getAttribute('type') !== 'hidden') ||
      role === 'button' ||
      role === 'link' ||
      el.hasAttribute('onclick');

    if (interactive) {
      interactiveTotal += 1;
      const inline = tag === 'a' && style.display.includes('inline');
      if (!inline && (rect.width < 24 || rect.height < 24) && smallTargets.length < LIMIT) {
        smallTargets.push({ selector: sel, width: Math.round(rect.width), height: Math.round(rect.height) });
      }
      if (style.outlineStyle === 'none' && px(style.outlineWidth) === 0 && missingFocusStyle.length < LIMIT) {
        missingFocusStyle.push(sel);
      }
      if (style.transitionDuration === '0s' && style.cursor !== 'pointer' && missingHoverStyle.length < LIMIT) {
        missingHoverStyle.push(sel);
      }
    }

    // ---------------------------------------------------------------- media

    if (tag === 'img') {
      const img = el as HTMLImageElement;
      const src = img.getAttribute('src');
      if (!img.hasAttribute('alt') && missingAlt.length < LIMIT) missingAlt.push(sel);
      if (!img.getAttribute('width') || !img.getAttribute('height')) missingIntrinsicSize += 1;
      if (!src || src.trim() === '' || /placeholder|via\.placeholder|example\.com|lorem/i.test(src)) {
        note(brokenSrcSignal, sel, src ? src.slice(0, 50) : 'empty src');
      }
    }

    // ------------------------------------------------------------ card rows

    if ((style.display === 'flex' || style.display === 'grid') && el.children.length >= 2 && el.children.length <= 8) {
      const children = Array.from(el.children) as HTMLElement[];
      const rects = children.map((c) => c.getBoundingClientRect());
      const sameRow = rects.every((r) => Math.abs(r.top - rects[0]!.top) < 8);
      if (sameRow && rects[0]!.width > 80) {
        const widths2 = rects.map((r) => r.width);
        const equalWidths = Math.max(...widths2) - Math.min(...widths2) < Math.max(2, Math.max(...widths2) * 0.04);
        if (equalWidths && cardRows.length < 12) {
          cardRows.push({
            selector: sel,
            childCount: children.length,
            equalWidths,
            childrenHaveIcon: children.every((c) => !!c.querySelector('svg, i, [class*="icon"]')),
            childrenHaveHeading: children.every((c) => !!c.querySelector('h1,h2,h3,h4,h5,h6,strong,b')),
          });
        }
      }

      // A horizontal scroller whose first card sits flush against the panel edge.
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        const inset = rects[0]!.left - rect.left;
        if (inset < 2) note(signals.flushScrollerCards, sel, `first card ${Math.round(inset)}px from the panel edge`);
      }
    }

    // Repeated identical text inside one container.
    if (el.children.length >= 2 && el.children.length <= 12 && rect.height < 600) {
      const labels = Array.from(el.children)
        .map((c) => (c.textContent ?? '').trim().toLowerCase())
        .filter((t) => t.length > 2 && t.length < 40);
      const seen = new Set<string>();
      for (const label of labels) {
        if (seen.has(label)) {
          note(signals.repeatedTextInContainer, sel, `"${label.slice(0, 30)}" appears more than once`);
          break;
        }
        seen.add(label);
      }
    }
  }

  // ---------------------------------------------------------- SVG illustrations

  const brokenSrc = brokenSrcSignal.samples;
  const shapeAssembledSvg: Sample[] = [];
  for (const svg of Array.from(document.querySelectorAll('svg')).slice(0, 200)) {
    const rect = svg.getBoundingClientRect();
    if (rect.width < 120 || rect.height < 120) continue;
    const shapes = svg.querySelectorAll('circle,rect,ellipse,polygon,line');
    const paths = svg.querySelectorAll('path');
    if (shapes.length >= 5 && paths.length <= 2) {
      shapeAssembledSvg.push({
        selector: selectorFor(svg),
        detail: `${Math.round(rect.width)}px illustration from ${shapes.length} primitives`,
      });
      if (shapeAssembledSvg.length >= SAMPLES) break;
    }
  }

  // ------------------------------------------------------------- occlusion

  {
    const textNodes = Array.from(document.querySelectorAll<HTMLElement>('p,h1,h2,h3,li,span')).slice(0, 400);
    for (const node of textNodes) {
      const text = ownText(node);
      if (text.length < 20) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      if (rect.top < 0 || rect.bottom > viewportHeight || rect.left < 0 || rect.right > viewportWidth) continue;
      const centre = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (!centre) continue;
      if (centre !== node && !node.contains(centre) && !centre.contains(node)) {
        const coverStyle = getComputedStyle(centre);
        if (opaque(coverStyle.backgroundColor)) {
          note(signals.occludedText, selectorFor(node), `covered by ${selectorFor(centre)}`);
          if (signals.occludedText.count >= SAMPLES) break;
        }
      }
    }
  }

  // ----------------------------------------------- lopsided opening columns

  {
    const containers = Array.from(document.querySelectorAll<HTMLElement>('body > *, main > *, section')).slice(0, 60);
    for (const container of containers) {
      const style = getComputedStyle(container);
      if (style.display !== 'grid' && style.display !== 'flex') continue;
      const rect = container.getBoundingClientRect();
      if (rect.top > viewportHeight || rect.height < 200) continue;
      const kids = Array.from(container.children).map((c) => c.getBoundingClientRect());
      if (kids.length !== 2) continue;
      const [a, b] = kids as [DOMRect, DOMRect];
      if (Math.abs(a.top - b.top) > 8) continue;
      const tall = Math.max(a.height, b.height);
      const short = Math.min(a.height, b.height);
      if (short > 0 && tall / short > 2.4 && tall > viewportHeight * 0.5) {
        note(
          signals.lopsidedFirstViewport,
          selectorFor(container),
          `columns ${Math.round(tall)}px vs ${Math.round(short)}px`,
        );
      }
    }
  }

  // ------------------------------------------------------------------ forms

  const fields = Array.from(
    document.querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([type="submit"]), select, textarea'),
  );
  for (const field of fields) {
    const id = field.getAttribute('id');
    const labelled =
      (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) ||
      field.closest('label') ||
      field.getAttribute('aria-label') ||
      field.getAttribute('aria-labelledby');
    if (!labelled && unlabeled.length < LIMIT) unlabeled.push(selectorFor(field));

    if (field.hasAttribute('required') || field.getAttribute('aria-required') === 'true') {
      requiredTotal += 1;
      const container = field.closest('label, .field, .form-group, div');
      if (container && /\*|required|\(required\)/i.test(container.textContent ?? '')) requiredMarked += 1;
    }
  }

  const hasErrorRegion = !!document.querySelector(
    '[role="alert"], [aria-live], [aria-invalid], [class*="error"], [class*="invalid"]',
  );
  const hasNoValidationAttrs =
    fields.length > 0 &&
    !fields.some((f) =>
      ['required', 'pattern', 'minlength', 'min', 'maxlength', 'max'].some((a) => f.hasAttribute(a)),
    );

  // --------------------------------------------------------- heading order

  let previousLevel = 0;
  for (const level of headingLevels) {
    if (previousLevel && level > previousLevel + 1) headingSkips.push(`h${previousLevel} -> h${level}`);
    previousLevel = level;
  }

  // ------------------------------------------------------- stylesheet scan

  let reducedMotionRuleFound = false;
  let stylesheetsReadable = true;

  const scanRules = (rules: CSSRuleList, depth: number): void => {
    if (depth > 4) return;
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSMediaRule) {
        if (rule.conditionText.includes('prefers-reduced-motion')) reducedMotionRuleFound = true;
        scanRules(rule.cssRules, depth + 1);
        continue;
      }
      if (rule instanceof CSSSupportsRule) {
        scanRules(rule.cssRules, depth + 1);
        continue;
      }
      if (rule instanceof CSSKeyframesRule) {
        const name = rule.name.toLowerCase();
        const text = rule.cssText;
        if (/\b(width|height|margin|padding|top|left)\s*:/.test(text.replace(/max-|min-/g, ''))) {
          note(motion.layoutPropertyAnimation, `@keyframes ${rule.name}`, 'animates a layout property');
        }
        if (/marquee|ticker|scroll/.test(name) && /translate/.test(text)) {
          note(motion.marquees, `@keyframes ${rule.name}`, 'continuous translate loop');
        }
        continue;
      }
      if (rule instanceof CSSStyleRule) {
        const selectorText = rule.selectorText ?? '';
        if (/:hover/.test(selectorText) && /transform\s*:\s*(scale|rotate)/.test(rule.cssText)) {
          if (/\bimg\b|\[class\*="image"\]|\.image|picture|figure/.test(selectorText)) {
            note(motion.imageHoverTransform, selectorText.slice(0, 60), 'scales or rotates an image on hover');
          }
        }
        if (/::?after|::?before/.test(selectorText) && /animation[^;]*(blink|caret)/.test(rule.cssText)) {
          note(motion.blinkingCarets, selectorText.slice(0, 60), 'pseudo-element caret animation');
        }
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      scanRules(sheet.cssRules, 0);
    } catch {
      stylesheetsReadable = false;
    }
  }
  motion.reducedMotionRuleFound = reducedMotionRuleFound;

  // ----------------------------------------------------------------- output

  const sortDesc = <T>(items: T[], key: (t: T) => number): T[] => items.sort((a, b) => key(b) - key(a));

  return {
    url: location.href,
    title: document.title,
    viewport: { width: viewportWidth, height: viewportHeight },
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    elementsScanned: all.length <= MAX_ELEMENTS,
    isDarkPage,
    pageBackground,

    colors: sortDesc(
      Object.entries(colorCounts).map(([key, v]) => ({
        value: key.replace(/^(text|border):/, ''),
        role: v.role,
        count: v.count,
        area: v.area,
      })),
      (c) => c.area + c.count * 100,
    ).slice(0, 40),

    gradients: sortDesc(
      Object.entries(gradientCounts).map(([value, count]) => ({ value, count })),
      (g) => g.count,
    ).slice(0, 12),

    fontFamilies: sortDesc(
      Object.entries(familyCounts).map(([value, v]) => ({ value, count: v.count, area: v.area })),
      (f) => f.count,
    ).slice(0, 10),

    fontSizes: sortDesc(
      Object.entries(sizeCounts).map(([p, count]) => ({ px: Number(p), count })),
      (f) => f.count,
    ).slice(0, 24),

    fontWeights: sortDesc(
      Object.entries(weightCounts).map(([weight, count]) => ({ weight: Number(weight), count })),
      (f) => f.count,
    ),

    radii: sortDesc(
      Object.entries(radiusCounts).map(([value, count]) => ({ value, count })),
      (r) => r.count,
    ).slice(0, 12),

    shadows: sortDesc(
      Object.entries(shadowCounts).map(([value, count]) => ({ value, count })),
      (s) => s.count,
    ).slice(0, 12),

    spacings: sortDesc(
      Object.entries(spacingCounts).map(([p, count]) => ({ px: Number(p), count })),
      (s) => s.count,
    ).slice(0, 30),

    text: { blocks, centeredBlocks, linesTooLong, linesTooShort, tightLineHeight, maxMeasureCh },
    contrastSamples,
    cardRows,
    interactive: { total: interactiveTotal, missingFocusStyle, missingHoverStyle, smallTargets },
    forms: {
      fieldCount: fields.length,
      unlabeled,
      requiredMarked,
      requiredTotal,
      hasErrorRegion,
      hasNoValidationAttrs,
    },
    media: {
      images: document.images.length,
      missingAlt,
      missingIntrinsicSize,
      brokenSrc,
      shapeAssembledSvg,
    },
    motion,
    headings: { levels: headingLevels, h1Count: headingLevels.filter((l) => l === 1).length, skips: headingSkips },
    overflowX,
    landmarks: {
      main: !!document.querySelector('main, [role="main"]'),
      nav: !!document.querySelector('nav, [role="navigation"]'),
      header: !!document.querySelector('header, [role="banner"]'),
      footer: !!document.querySelector('footer, [role="contentinfo"]'),
      skipLink: !!document.querySelector('a[href^="#"]:first-of-type'),
    },
    stylesheetsReadable,
    consoleErrors: 0,
    signals,
    visibleText: visibleText.slice(0, 8000),
  };
}
