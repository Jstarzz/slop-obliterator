/**
 * Reads a project's own design contract so the detector can flag drift from it.
 *
 * The generic rules catch what everybody's model does by default. These catch
 * the more insidious problem: a page that is fine in isolation but does not
 * belong to this product. A DESIGN.md is the cheapest way to say what "belongs"
 * means, so we parse whatever one is there rather than demanding a schema.
 */

import { readFile } from 'node:fs/promises';
import type { DesignContract } from './types.js';

const FONT_HINT = /(?:font|typeface|family)/i;
const RADIUS_HINT = /(?:radius|corner|rounded)/i;
const SIZE_HINT = /(?:size|scale|step|type)/i;

export async function loadDesignContract(path: string): Promise<DesignContract> {
  const text = await readFile(path, 'utf8');
  return parseDesignContract(text, path);
}

export function parseDesignContract(text: string, source: string): DesignContract {
  const colors = new Set<string>();
  const fonts = new Set<string>();
  const radii = new Set<number>();
  const fontSizes = new Set<number>();

  // Colours: hex, oklch, rgb. Anywhere in the document.
  for (const match of text.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) colors.add(match[0].toLowerCase());
  for (const match of text.matchAll(/oklch\([^)]+\)/gi)) colors.add(match[0].toLowerCase().replace(/\s+/g, ' '));
  for (const match of text.matchAll(/rgba?\([^)]+\)/gi)) colors.add(match[0].toLowerCase().replace(/\s+/g, ' '));

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (FONT_HINT.test(line)) {
      // Quoted names first; they are unambiguous.
      for (const match of line.matchAll(/["'`]([A-Za-z][A-Za-z0-9 _-]{1,40})["'`]/g)) {
        fonts.add(match[1]!.trim());
      }
      // Then "Font: Fraunces, Public Sans" style declarations.
      const after = /:\s*(.+)$/.exec(line);
      if (after) {
        for (const part of after[1]!.split(/[,/|]/)) {
          const name = part.replace(/[`*_()]/g, '').trim();
          if (/^[A-Za-z][A-Za-z0-9 ]{2,40}$/.test(name) && !/^(the|and|for|use|with|body|display|heading)$/i.test(name)) {
            fonts.add(name);
          }
        }
      }
    }

    if (RADIUS_HINT.test(line)) {
      for (const match of line.matchAll(/(\d+(?:\.\d+)?)\s*(?:px|rem)?\b/g)) {
        const value = Number(match[1]);
        const isRem = /rem/.test(match[0]);
        const pxValue = isRem ? value * 16 : value;
        if (pxValue >= 0 && pxValue <= 200) radii.add(pxValue);
      }
    }

    if (SIZE_HINT.test(line)) {
      for (const match of line.matchAll(/(\d+(?:\.\d+)?)\s*(px|rem)\b/g)) {
        const value = Number(match[1]);
        const pxValue = match[2] === 'rem' ? value * 16 : value;
        if (pxValue >= 8 && pxValue <= 200) fontSizes.add(Math.round(pxValue * 10) / 10);
      }
    }
  }

  return {
    source,
    fonts: [...fonts],
    colors: [...colors],
    radii: [...radii].sort((a, b) => a - b),
    fontSizes: [...fontSizes].sort((a, b) => a - b),
  };
}

/** A contract with nothing in it would flag the entire page. */
export function isUsable(contract: DesignContract | null): contract is DesignContract {
  if (!contract) return false;
  return (
    contract.fonts.length > 0 ||
    contract.colors.length > 2 ||
    contract.radii.length > 0 ||
    contract.fontSizes.length > 2
  );
}
