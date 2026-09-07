export interface PolishSample {
  selector: string;
  detail: string;
}

export interface PolishSignal {
  count: number;
  samples: PolishSample[];
}

export interface PolishMeasurements {
  viewport: { width: number; height: number };
  icons: {
    total: number;
    families: Record<string, number>;
    outline: number;
    filled: number;
    sizes: Array<{ px: number; count: number }>;
  };
  spacing: {
    values: Array<{ px: number; count: number }>;
    sectionPaddingPairs: Array<{ value: string; count: number }>;
  };
  signals: {
    emojiControl: PolishSignal;
    rasterUiIcon: PolishSignal;
    unlabeledIconButton: PolishSignal;
    oversizedUiIcon: PolishSignal;
    inconsistentSiblingIconSize: PolishSignal;
    mixedIconFamilies: PolishSignal;
    mixedSiblingIconStyles: PolishSignal;
    repeatedIconTiles: PolishSignal;
    sparkleDecoration: PolishSignal;
    spacingScaleSprawl: PolishSignal;
    offGridSpacing: PolishSignal;
    repeatedSectionPadding: PolishSignal;
    cardPaddingDrift: PolishSignal;
    controlHeightDrift: PolishSignal;
    headingBodyGapOutlier: PolishSignal;
    pillSoup: PolishSignal;
    repeatedCenteredSections: PolishSignal;
  };
}

/**
 * Lightweight second-pass collector for the fiddly stuff that makes an interface
 * feel generated even when the core audit is otherwise clean: icon consistency,
 * spacing rhythm, sibling alignment, pill overuse, and repeated section recipes.
 *
 * This function is serialized into the browser by Playwright. Keep every helper
 * inside the function and do not close over module state.
 */
export function collectPolishMeasurements(): PolishMeasurements {
  const MAX_ELEMENTS = 4500;
  const SAMPLES = 5;

  const empty = (): PolishSignal => ({ count: 0, samples: [] });
  const note = (signal: PolishSignal, selector: string, detail: string): void => {
    signal.count += 1;
    if (signal.samples.length < SAMPLES) signal.samples.push({ selector, detail });
  };
  const bump = (map: Record<string, number>, key: string): void => {
    map[key] = (map[key] ?? 0) + 1;
  };
  const px = (value: string): number => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const selectorFor = (el: Element): string => {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((value) => value && value.length < 28 && !/^(is|has)-/.test(value))
      .slice(0, 2)
      .join('.');
    const parent = el.parentElement;
    const index = parent ? Array.prototype.indexOf.call(parent.children, el) + 1 : 0;
    return cls ? `${tag}.${cls}` : `${tag}:nth-child(${index})`;
  };
  const isVisible = (el: Element): boolean => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      Number(style.opacity) !== 0 &&
      rect.width > 0 &&
      rect.height > 0
    );
  };
  const isOpaque = (color: string): boolean => {
    if (!color || color === 'transparent') return false;
    const alpha = /rgba\([^)]*[,/]\s*(0(?:\.\d+)?|1(?:\.0+)?)\s*\)$/.exec(color);
    return !alpha || Number(alpha[1]) > 0.08;
  };
  const iconFamily = (el: Element): string => {
    const attrs = [
      el.getAttribute('class') ?? '',
      el.getAttribute('data-icon') ?? '',
      el.getAttribute('data-lucide') ?? '',
      el.getAttribute('aria-label') ?? '',
      el.parentElement?.getAttribute('class') ?? '',
    ]
      .join(' ')
      .toLowerCase();
    if (/\blucide\b|data-lucide/.test(attrs) || el.hasAttribute('data-lucide')) return 'lucide';
    if (/tabler|icon-tabler/.test(attrs)) return 'tabler';
    if (/heroicon/.test(attrs)) return 'heroicons';
    if (/svg-inline--fa|\bfa[srlbd]?[- ]/.test(attrs)) return 'font-awesome';
    if (/material-symbol/.test(attrs)) return 'material-symbols';
    if (/phosphor|\bph[- ]/.test(attrs)) return 'phosphor';
    return 'custom';
  };
  const iconKind = (svg: SVGElement): 'outline' | 'filled' | 'mixed' => {
    const shapes = Array.from(svg.querySelectorAll<SVGElement>('path,circle,rect,polygon,polyline,line,ellipse')).slice(0, 12);
    let stroke = 0;
    let fill = 0;
    for (const shape of shapes) {
      const style = getComputedStyle(shape);
      const strokeValue = style.stroke || shape.getAttribute('stroke') || '';
      const fillValue = style.fill || shape.getAttribute('fill') || '';
      if (strokeValue && strokeValue !== 'none' && strokeValue !== 'transparent') stroke += 1;
      if (fillValue && fillValue !== 'none' && fillValue !== 'transparent' && fillValue !== 'rgba(0, 0, 0, 0)') fill += 1;
    }
    if (fill > 0 && stroke > 0) return 'mixed';
    return fill > 0 ? 'filled' : 'outline';
  };
  const iconElement = (root: Element): Element | null =>
    root.matches('svg,img,i,[class*="icon"],[class*="Icon"]')
      ? root
      : root.querySelector('svg,img,i,[class*="icon"],[class*="Icon"]');
  const iconSize = (el: Element): number => {
    const rect = el.getBoundingClientRect();
    return Math.max(rect.width, rect.height);
  };
  const isCardLike = (el: Element): boolean => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width < 90 || rect.height < 60) return false;
    const hasSurface = isOpaque(style.backgroundColor);
    const hasEdge = px(style.borderTopWidth) > 0 || px(style.borderLeftWidth) > 0;
    const hasShadow = style.boxShadow !== 'none';
    return hasSurface || hasEdge || hasShadow;
  };
  const directControls = (el: Element): HTMLElement[] =>
    Array.from(el.children).filter((child): child is HTMLElement =>
      child instanceof HTMLElement &&
      (child.matches('button,a[href],[role="button"]') || !!child.querySelector(':scope > button,:scope > a[href],:scope > [role="button"]')),
    );

  const signals: PolishMeasurements['signals'] = {
    emojiControl: empty(),
    rasterUiIcon: empty(),
    unlabeledIconButton: empty(),
    oversizedUiIcon: empty(),
    inconsistentSiblingIconSize: empty(),
    mixedIconFamilies: empty(),
    mixedSiblingIconStyles: empty(),
    repeatedIconTiles: empty(),
    sparkleDecoration: empty(),
    spacingScaleSprawl: empty(),
    offGridSpacing: empty(),
    repeatedSectionPadding: empty(),
    cardPaddingDrift: empty(),
    controlHeightDrift: empty(),
    headingBodyGapOutlier: empty(),
    pillSoup: empty(),
    repeatedCenteredSections: empty(),
  };

  const spacingCounts: Record<string, number> = {};
  const sectionPaddingPairs: Record<string, number> = {};
  const familyCounts: Record<string, number> = {};
  const iconSizeCounts: Record<string, number> = {};
  let iconTotal = 0;
  let outlineIcons = 0;
  let filledIcons = 0;
  let pillCount = 0;
  let centeredSections = 0;

  const elements = Array.from(document.querySelectorAll<HTMLElement>('body *')).slice(0, MAX_ELEMENTS);

  for (const el of elements) {
    if (!isVisible(el)) continue;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const sel = selectorFor(el);

    for (const value of [
      style.paddingTop,
      style.paddingRight,
      style.paddingBottom,
      style.paddingLeft,
      style.marginTop,
      style.marginRight,
      style.marginBottom,
      style.marginLeft,
      style.gap,
      style.rowGap,
      style.columnGap,
    ]) {
      const n = px(value);
      if (n >= 2 && n <= 160) bump(spacingCounts, String(Math.round(n * 10) / 10));
    }

    const rounded = px(style.borderTopLeftRadius);
    if (
      rect.height >= 18 &&
      rect.height <= 48 &&
      rect.width >= 28 &&
      rect.width <= 260 &&
      rounded >= rect.height * 0.45 &&
      !el.matches('button,input,select,textarea') &&
      (isOpaque(style.backgroundColor) || px(style.borderTopWidth) > 0)
    ) {
      pillCount += 1;
    }

    const text = (el.textContent ?? '').trim();
    if (
      text.length > 0 &&
      text.length <= 6 &&
      /[✨✦✧★✶✷✸✹✺]/u.test(text) &&
      !el.matches('button,a[href]')
    ) {
      note(signals.sparkleDecoration, sel, `decorative glyph "${text}"`);
    }

    const interactive = el.matches('button,a[href],[role="button"],[role="link"]');
    if (interactive) {
      const icon = iconElement(el);
      const ownText = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join(' ')
        .trim();
      const label = el.getAttribute('aria-label') || el.getAttribute('title') || ownText;

      if (!icon && ownText && ownText.length <= 6 && /\p{Extended_Pictographic}/u.test(ownText)) {
        note(signals.emojiControl, sel, `emoji-only control "${ownText}"`);
      }

      if (icon && !label && (el.textContent ?? '').trim().length === 0) {
        note(signals.unlabeledIconButton, sel, 'icon-only control has no aria-label, title, or text label');
      }

      if (icon) {
        const size = iconSize(icon);
        if (rect.height <= 64 && size > 34) {
          note(signals.oversizedUiIcon, selectorFor(icon), `${Math.round(size)}px icon inside ${Math.round(rect.height)}px control`);
        }
        if (icon.tagName.toLowerCase() === 'img') {
          const src = (icon as HTMLImageElement).currentSrc || (icon as HTMLImageElement).src || '';
          if (src && !/\.svg(?:[?#]|$)|image\/svg\+xml/i.test(src)) {
            note(signals.rasterUiIcon, selectorFor(icon), `${Math.round(size)}px raster asset inside a UI control`);
          }
        }
      }
    }

    if (el.tagName.toLowerCase() === 'svg' && rect.width >= 8 && rect.height >= 8 && rect.width <= 96 && rect.height <= 96) {
      const svg = el as unknown as SVGElement;
      iconTotal += 1;
      const family = iconFamily(el);
      bump(familyCounts, family);
      bump(iconSizeCounts, String(Math.round(iconSize(el))));
      const kind = iconKind(svg);
      if (kind === 'outline') outlineIcons += 1;
      else if (kind === 'filled') filledIcons += 1;
      else {
        outlineIcons += 1;
        filledIcons += 1;
      }
    }
  }

  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section, main > article, body > section'))
    .filter(isVisible)
    .slice(0, 24);
  for (const section of sections) {
    const style = getComputedStyle(section);
    const top = Math.round(px(style.paddingTop));
    const bottom = Math.round(px(style.paddingBottom));
    const pair = `${top}/${bottom}`;
    bump(sectionPaddingPairs, pair);
    if (style.textAlign === 'center' && section.querySelector('h1,h2,h3') && section.querySelector('p')) centeredSections += 1;
  }

  for (const heading of Array.from(document.querySelectorAll<HTMLElement>('h2,h3,h4')).slice(0, 100)) {
    if (!isVisible(heading)) continue;
    const next = heading.nextElementSibling;
    if (!(next instanceof HTMLElement) || !isVisible(next)) continue;
    if (!next.matches('p,ul,ol,div')) continue;
    const headingRect = heading.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const gap = nextRect.top - headingRect.bottom;
    const headingSize = px(getComputedStyle(heading).fontSize);
    if (headingSize < 44 && (gap < 4 || gap > 48)) {
      note(
        signals.headingBodyGapOutlier,
        selectorFor(heading),
        `${Math.round(gap)}px to ${selectorFor(next)} after a ${Math.round(headingSize)}px heading`,
      );
    }
  }

  const groups = Array.from(document.querySelectorAll<HTMLElement>('body *'))
    .filter((el) => {
      if (!isVisible(el) || el.children.length < 2 || el.children.length > 10) return false;
      const style = getComputedStyle(el);
      return style.display === 'grid' || style.display === 'flex';
    })
    .slice(0, 220);

  for (const group of groups) {
    const groupSel = selectorFor(group);
    const children = Array.from(group.children).filter(isVisible);
    if (children.length < 2) continue;
    const rects = children.map((child) => child.getBoundingClientRect());
    const sameRow = rects.every((rect) => Math.abs(rect.top - rects[0]!.top) <= 10);

    const childIcons = children
      .map((child) => iconElement(child))
      .filter((icon): icon is Element => icon !== null && isVisible(icon));
    if (childIcons.length >= 3) {
      const sizes = childIcons.map(iconSize);
      const min = Math.min(...sizes);
      const max = Math.max(...sizes);
      if (max - min > 6 && max / Math.max(min, 1) > 1.28) {
        note(signals.inconsistentSiblingIconSize, groupSel, `sibling icons range ${Math.round(min)}-${Math.round(max)}px`);
      }

      const styles = childIcons
        .filter((icon) => icon.tagName.toLowerCase() === 'svg')
        .map((icon) => iconKind(icon as unknown as SVGElement));
      const hasOutline = styles.some((value) => value === 'outline');
      const hasFilled = styles.some((value) => value === 'filled');
      if (styles.length >= 3 && hasOutline && hasFilled) {
        note(signals.mixedSiblingIconStyles, groupSel, 'filled and outline icons are mixed in the same sibling group');
      }
    }

    if (children.length >= 3) {
      let iconTileChildren = 0;
      for (const child of children) {
        const heading = child.querySelector('h2,h3,h4,h5,h6');
        if (!heading) continue;
        const candidates = Array.from(child.children).slice(0, 3);
        const tile = candidates.find((candidate) => {
          const icon = iconElement(candidate);
          if (!icon || !isVisible(candidate)) return false;
          const tileRect = candidate.getBoundingClientRect();
          const tileStyle = getComputedStyle(candidate);
          return (
            tileRect.width >= 28 &&
            tileRect.width <= 88 &&
            Math.abs(tileRect.width - tileRect.height) <= 8 &&
            px(tileStyle.borderTopLeftRadius) >= 4 &&
            (isOpaque(tileStyle.backgroundColor) || px(tileStyle.borderTopWidth) > 0)
          );
        });
        if (tile) iconTileChildren += 1;
      }
      if (iconTileChildren >= 3 && iconTileChildren / children.length >= 0.75) {
        note(signals.repeatedIconTiles, groupSel, `${iconTileChildren}/${children.length} siblings use the same boxed-icon recipe`);
      }
    }

    const cardChildren = children.filter(isCardLike);
    if (sameRow && cardChildren.length >= 3) {
      const pads = cardChildren.map((child) => {
        const style = getComputedStyle(child);
        return {
          x: Math.min(px(style.paddingLeft), px(style.paddingRight)),
          y: Math.min(px(style.paddingTop), px(style.paddingBottom)),
        };
      });
      const xs = pads.map((pad) => pad.x);
      const ys = pads.map((pad) => pad.y);
      if (Math.max(...xs) - Math.min(...xs) > 8 || Math.max(...ys) - Math.min(...ys) > 8) {
        note(
          signals.cardPaddingDrift,
          groupSel,
          `sibling card padding drifts x:${Math.round(Math.min(...xs))}-${Math.round(Math.max(...xs))}px y:${Math.round(Math.min(...ys))}-${Math.round(Math.max(...ys))}px`,
        );
      }
    }

    const controls = directControls(group).filter(isVisible);
    if (controls.length >= 2) {
      const controlRects = controls.map((control) => control.getBoundingClientRect());
      const controlsSameRow = controlRects.every((rect) => Math.abs(rect.top - controlRects[0]!.top) <= 8);
      if (controlsSameRow) {
        const heights = controlRects.map((rect) => rect.height);
        if (Math.max(...heights) - Math.min(...heights) > 6) {
          note(signals.controlHeightDrift, groupSel, `controls range ${Math.round(Math.min(...heights))}-${Math.round(Math.max(...heights))}px tall`);
        }
      }
    }
  }

  const knownFamilies = Object.entries(familyCounts).filter(([family, count]) => family !== 'custom' && count >= 2);
  if (knownFamilies.length >= 2) {
    const names = knownFamilies.map(([family, count]) => `${family}:${count}`).join(', ');
    const onlyCompatiblePair =
      knownFamilies.length === 2 &&
      knownFamilies.some(([family]) => family === 'tabler') &&
      knownFamilies.some(([family]) => family === 'lucide');
    if (!onlyCompatiblePair) {
      note(signals.mixedIconFamilies, 'document', `multiple icon families in one view: ${names}`);
    }
  }

  const spacingEntries = Object.entries(spacingCounts)
    .map(([value, count]) => ({ px: Number(value), count }))
    .sort((a, b) => a.px - b.px);
  const repeatedSpacing = spacingEntries.filter((entry) => entry.count >= 2 && entry.px >= 4 && entry.px <= 96);
  if (repeatedSpacing.length > 14) {
    note(signals.spacingScaleSprawl, 'document', `${repeatedSpacing.length} repeated spacing values between 4px and 96px`);
  }

  const offGrid = repeatedSpacing.filter((entry) => {
    const nearestTwo = Math.round(entry.px / 2) * 2;
    return Math.abs(entry.px - nearestTwo) > 0.35;
  });
  const offGridUses = offGrid.reduce((sum, entry) => sum + entry.count, 0);
  if (offGrid.length >= 4 && offGridUses >= 8) {
    note(
      signals.offGridSpacing,
      'document',
      `${offGrid.length} repeated values fall off a 2px rhythm: ${offGrid.slice(0, 7).map((entry) => `${entry.px}px×${entry.count}`).join(', ')}`,
    );
  }

  const repeatedSection = Object.entries(sectionPaddingPairs)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
  const dominantSection = repeatedSection[0];
  if (sections.length >= 5 && dominantSection && dominantSection.count >= 5) {
    note(
      signals.repeatedSectionPadding,
      'main',
      `${dominantSection.count}/${sections.length} sections use identical ${dominantSection.value.replace('/', 'px / ')}px vertical padding`,
    );
  }

  if (pillCount >= 10) {
    note(signals.pillSoup, 'document', `${pillCount} pill-shaped non-control elements visible at once`);
  }
  if (sections.length >= 4 && centeredSections >= 4 && centeredSections / sections.length >= 0.75) {
    note(signals.repeatedCenteredSections, 'main', `${centeredSections}/${sections.length} content sections center both heading and body copy`);
  }

  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    icons: {
      total: iconTotal,
      families: familyCounts,
      outline: outlineIcons,
      filled: filledIcons,
      sizes: Object.entries(iconSizeCounts)
        .map(([value, count]) => ({ px: Number(value), count }))
        .sort((a, b) => a.px - b.px),
    },
    spacing: {
      values: spacingEntries,
      sectionPaddingPairs: repeatedSection,
    },
    signals,
  };
}
