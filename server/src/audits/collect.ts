/**
 * The in-page collector.
 *
 * This whole file exists to answer one question cheaply: what did the page
 * actually render? Everything is measured from computed styles and real layout
 * boxes, never from source code, because the gap between "the CSS says" and "the
 * browser did" is where most design bugs live.
 *
 * `collectMeasurements` is serialised and shipped into the page, so it must be a
 * single self-contained function with no imports and no closure over module scope.
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
}

export interface CardRow {
  selector: string;
  childCount: number;
  equalWidths: boolean;
  childrenHaveIcon: boolean;
  childrenHaveHeading: boolean;
}

export interface RawMeasurements {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  documentWidth: number;
  documentHeight: number;
  elementsScanned: boolean;
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
  media: { images: number; missingAlt: string[]; missingIntrinsicSize: number };
  motion: {
    reducedMotionRuleFound: boolean;
    animatedElements: number;
    infiniteAnimations: number;
    transitionAllCount: number;
  };
  headings: { levels: number[]; h1Count: number; skips: string[] };
  overflowX: string[];
  landmarks: { main: boolean; nav: boolean; header: boolean; footer: boolean; skipLink: boolean };
  stylesheetsReadable: boolean;
}

/**
 * Runs inside the page. Keep it dependency-free and defensive: it will be pointed
 * at pages that are half-broken, which is exactly when its output matters most.
 */
export function collectMeasurements(): RawMeasurements {
  const MAX_ELEMENTS = 4000;
  const SAMPLE_LIMIT = 40;

  const bump = <T extends Record<string, number>>(map: T, key: string, by = 1): void => {
    (map as Record<string, number>)[key] = ((map as Record<string, number>)[key] ?? 0) + by;
  };

  const selectorFor = (el: Element): string => {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((c) => c && !/^(is|has)-/.test(c))
      .slice(0, 2)
      .join('.');
    const parent = el.parentElement;
    const index = parent ? Array.prototype.indexOf.call(parent.children, el) + 1 : 0;
    return cls ? `${tag}.${cls}` : `${tag}:nth-child(${index})`;
  };

  const isVisible = (el: Element, style: CSSStyleDeclaration, rect: DOMRect): boolean => {
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (Number(style.opacity) === 0) return false;
    if (rect.width <= 0 || rect.height <= 0) return false;
    return true;
  };

  const opaque = (color: string): boolean => {
    if (!color) return false;
    if (color === 'transparent') return false;
    const match = /rgba?\(([^)]+)\)/.exec(color);
    if (!match) return true;
    const parts = match[1]!.split(/[,\s/]+/).filter(Boolean);
    if (parts.length < 4) return true;
    return Number(parts[3]) > 0.92;
  };

  /** Walk up until we find something that actually paints a background. */
  const effectiveBackground = (el: Element): string => {
    let node: Element | null = el;
    let hops = 0;
    while (node && hops < 24) {
      const style = getComputedStyle(node);
      if (opaque(style.backgroundColor)) return style.backgroundColor;
      if (style.backgroundImage && style.backgroundImage !== 'none') {
        const stop = /rgba?\([^)]+\)|#[0-9a-f]{3,8}/i.exec(style.backgroundImage);
        if (stop) return stop[0];
      }
      node = node.parentElement;
      hops += 1;
    }
    return 'rgb(255, 255, 255)';
  };

  const hasOwnText = (el: Element): string => {
    let out = '';
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) out += child.textContent ?? '';
    }
    return out.trim();
  };

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

  let blocks = 0;
  let centeredBlocks = 0;
  let linesTooLong = 0;
  let linesTooShort = 0;
  let tightLineHeight = 0;
  let maxMeasureCh = 0;
  let interactiveTotal = 0;
  let animatedElements = 0;
  let infiniteAnimations = 0;
  let transitionAllCount = 0;
  let missingIntrinsicSize = 0;
  let requiredMarked = 0;
  let requiredTotal = 0;

  const all = Array.from(document.querySelectorAll<HTMLElement>('body *'));
  const elements = all.slice(0, MAX_ELEMENTS);
  const viewportWidth = window.innerWidth;

  for (const el of elements) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (!isVisible(el, style, rect)) continue;

    const area = Math.round(rect.width * rect.height);
    const tag = el.tagName.toLowerCase();

    if (rect.right > viewportWidth + 2 && overflowX.length < SAMPLE_LIMIT) {
      const overflowBy = Math.round(rect.right - viewportWidth);
      if (overflowBy > 4) overflowX.push(`${selectorFor(el)} (+${overflowBy}px)`);
    }

    if (opaque(style.backgroundColor)) {
      const key = style.backgroundColor;
      colorCounts[key] ??= { role: 'background', count: 0, area: 0 };
      colorCounts[key]!.count += 1;
      colorCounts[key]!.area += area;
    }

    if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
      bump(gradientCounts, style.backgroundImage.slice(0, 220));
    }

    const borderColor = style.borderTopColor;
    if (Number.parseFloat(style.borderTopWidth) > 0 && opaque(borderColor)) {
      const key = `border:${borderColor}`;
      colorCounts[key] ??= { role: 'border', count: 0, area: 0 };
      colorCounts[key]!.count += 1;
    }

    if (style.borderRadius && style.borderRadius !== '0px') bump(radiusCounts, style.borderRadius);
    if (style.boxShadow && style.boxShadow !== 'none') bump(shadowCounts, style.boxShadow.slice(0, 160));

    for (const prop of [style.paddingTop, style.paddingLeft, style.marginBottom, style.gap]) {
      const px = Number.parseFloat(prop);
      if (Number.isFinite(px) && px > 0 && px < 400) bump(spacingCounts, String(Math.round(px)));
    }

    if (style.animationName && style.animationName !== 'none') {
      animatedElements += 1;
      if (style.animationIterationCount === 'infinite') infiniteAnimations += 1;
    }
    if (style.transitionProperty === 'all') transitionAllCount += 1;

    const own = hasOwnText(el);
    if (own.length > 0) {
      const family = style.fontFamily.split(',')[0]!.replace(/["']/g, '').trim();
      familyCounts[family] ??= { count: 0, area: 0 };
      familyCounts[family]!.count += 1;
      familyCounts[family]!.area += area;

      const fontSize = Math.round(Number.parseFloat(style.fontSize) * 10) / 10;
      bump(sizeCounts, String(fontSize));
      bump(weightCounts, String(normalizeWeight(style.fontWeight)));

      blocks += 1;
      if (style.textAlign === 'center') centeredBlocks += 1;

      const lineHeight = Number.parseFloat(style.lineHeight);
      if (Number.isFinite(lineHeight) && fontSize > 0) {
        const ratio = lineHeight / fontSize;
        if (own.length > 90 && ratio < 1.4) tightLineHeight += 1;
      }

      if (own.length > 60) {
        // ~0.5em average glyph advance is close enough for a measure estimate.
        const measureCh = rect.width / (fontSize * 0.5);
        if (measureCh > maxMeasureCh) maxMeasureCh = Math.round(measureCh);
        if (measureCh > 85) linesTooLong += 1;
        if (measureCh < 40 && rect.width > 200) linesTooShort += 1;
      }

      if (contrastSamples.length < SAMPLE_LIMIT) {
        contrastSamples.push({
          selector: selectorFor(el),
          text: own.slice(0, 48),
          foreground: style.color,
          background: effectiveBackground(el),
          fontSizePx: fontSize,
          fontWeight: normalizeWeight(style.fontWeight),
        });
      }

      const textColorKey = `text:${style.color}`;
      colorCounts[textColorKey] ??= { role: 'text', count: 0, area: 0 };
      colorCounts[textColorKey]!.count += 1;
      colorCounts[textColorKey]!.area += area;
    }

    if (/^h[1-6]$/.test(tag)) {
      headingLevels.push(Number(tag[1]));
    }

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
      const isInline = tag === 'a' && style.display.includes('inline');
      if (!isInline && (rect.width < 24 || rect.height < 24) && smallTargets.length < SAMPLE_LIMIT) {
        smallTargets.push({
          selector: selectorFor(el),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
      if (style.outlineStyle === 'none' && Number.parseFloat(style.outlineWidth) === 0) {
        if (missingFocusStyle.length < SAMPLE_LIMIT) missingFocusStyle.push(selectorFor(el));
      }
      if (style.transitionDuration === '0s' && style.cursor !== 'pointer') {
        if (missingHoverStyle.length < SAMPLE_LIMIT) missingHoverStyle.push(selectorFor(el));
      }
    }

    if (tag === 'img') {
      const img = el as HTMLImageElement;
      if (!img.hasAttribute('alt') && missingAlt.length < SAMPLE_LIMIT) missingAlt.push(selectorFor(el));
      if (!img.getAttribute('width') || !img.getAttribute('height')) missingIntrinsicSize += 1;
    }

    // Card-row detection: a flex/grid container whose children are near-identical
    // boxes. Three of them in a row with an icon and a heading is the single most
    // recognisable generated-layout signature there is.
    if ((style.display === 'flex' || style.display === 'grid') && el.children.length >= 2 && el.children.length <= 6) {
      const children = Array.from(el.children) as HTMLElement[];
      const rects = children.map((c) => c.getBoundingClientRect());
      const sameRow = rects.every((r) => Math.abs(r.top - rects[0]!.top) < 8);
      if (sameRow && rects[0]!.width > 80) {
        const widths = rects.map((r) => r.width);
        const min = Math.min(...widths);
        const max = Math.max(...widths);
        const equalWidths = max - min < Math.max(2, max * 0.04);
        if (equalWidths && cardRows.length < 12) {
          cardRows.push({
            selector: selectorFor(el),
            childCount: children.length,
            equalWidths,
            childrenHaveIcon: children.every((c) => !!c.querySelector('svg, i, [class*="icon"]')),
            childrenHaveHeading: children.every((c) => !!c.querySelector('h1,h2,h3,h4,h5,h6,strong,b')),
          });
        }
      }
    }
  }

  // Forms
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
    if (!labelled && unlabeled.length < SAMPLE_LIMIT) unlabeled.push(selectorFor(field));

    if (field.hasAttribute('required') || field.getAttribute('aria-required') === 'true') {
      requiredTotal += 1;
      const container = field.closest('label, .field, .form-group, div');
      const marked = container ? /\*|required|\(required\)/i.test(container.textContent ?? '') : false;
      if (marked) requiredMarked += 1;
    }
  }

  const hasErrorRegion = !!document.querySelector(
    '[role="alert"], [aria-live], [aria-invalid], [class*="error"], [class*="invalid"]',
  );
  const hasNoValidationAttrs =
    fields.length > 0 &&
    !fields.some(
      (f) =>
        f.hasAttribute('required') ||
        f.hasAttribute('pattern') ||
        f.hasAttribute('minlength') ||
        f.hasAttribute('min') ||
        f.hasAttribute('maxlength'),
    );

  // Heading order
  let previous = 0;
  for (const level of headingLevels) {
    if (previous && level > previous + 1) headingSkips.push(`h${previous} → h${level}`);
    previous = level;
  }

  // Reduced-motion support. Cross-origin sheets throw on access; note that rather
  // than reporting a false negative.
  let reducedMotionRuleFound = false;
  let stylesheetsReadable = true;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion')) {
          reducedMotionRuleFound = true;
          break;
        }
      }
    } catch {
      stylesheetsReadable = false;
    }
    if (reducedMotionRuleFound) break;
  }

  const toSorted = <T>(entries: T[], key: (t: T) => number): T[] =>
    entries.sort((a, b) => key(b) - key(a));

  return {
    url: location.href,
    title: document.title,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    elementsScanned: all.length <= MAX_ELEMENTS,
    colors: toSorted(
      Object.entries(colorCounts).map(([key, v]) => ({
        value: key.replace(/^(text|border):/, ''),
        role: v.role,
        count: v.count,
        area: v.area,
      })),
      (c) => c.area + c.count * 100,
    ).slice(0, 40),
    gradients: toSorted(
      Object.entries(gradientCounts).map(([value, count]) => ({ value, count })),
      (g) => g.count,
    ).slice(0, 12),
    fontFamilies: toSorted(
      Object.entries(familyCounts).map(([value, v]) => ({ value, count: v.count, area: v.area })),
      (f) => f.count,
    ).slice(0, 10),
    fontSizes: toSorted(
      Object.entries(sizeCounts).map(([px, count]) => ({ px: Number(px), count })),
      (f) => f.count,
    ).slice(0, 24),
    fontWeights: toSorted(
      Object.entries(weightCounts).map(([weight, count]) => ({ weight: Number(weight), count })),
      (f) => f.count,
    ),
    radii: toSorted(
      Object.entries(radiusCounts).map(([value, count]) => ({ value, count })),
      (r) => r.count,
    ).slice(0, 12),
    shadows: toSorted(
      Object.entries(shadowCounts).map(([value, count]) => ({ value, count })),
      (s) => s.count,
    ).slice(0, 12),
    spacings: toSorted(
      Object.entries(spacingCounts).map(([px, count]) => ({ px: Number(px), count })),
      (s) => s.count,
    ).slice(0, 30),
    text: {
      blocks,
      centeredBlocks,
      linesTooLong,
      linesTooShort,
      tightLineHeight,
      maxMeasureCh,
    },
    contrastSamples,
    cardRows,
    interactive: {
      total: interactiveTotal,
      missingFocusStyle,
      missingHoverStyle,
      smallTargets,
    },
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
    },
    motion: {
      reducedMotionRuleFound,
      animatedElements,
      infiniteAnimations,
      transitionAllCount,
    },
    headings: {
      levels: headingLevels,
      h1Count: headingLevels.filter((l) => l === 1).length,
      skips: headingSkips,
    },
    overflowX,
    landmarks: {
      main: !!document.querySelector('main, [role="main"]'),
      nav: !!document.querySelector('nav, [role="navigation"]'),
      header: !!document.querySelector('header, [role="banner"]'),
      footer: !!document.querySelector('footer, [role="contentinfo"]'),
      skipLink: !!document.querySelector('a[href^="#"]:first-of-type'),
    },
    stylesheetsReadable,
  };

  function normalizeWeight(weight: string): number {
    const named: Record<string, number> = { normal: 400, bold: 700, lighter: 300, bolder: 700 };
    return named[weight] ?? (Number(weight) || 400);
  }
}
