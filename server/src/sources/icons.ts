/**
 * Icon search, offline.
 *
 * Both sets ship as npm dependencies rather than being fetched at runtime. That
 * means no network round-trip in the middle of a design loop, no CDN outage
 * taking the tool down, and a version pinned in the lockfile instead of "latest".
 *
 * Tabler and Lucide are both 24×24, 2px stroke, currentColor, so they can be
 * mixed inside one interface without the weight mismatch that gives away a
 * scavenged icon set.
 */

import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolvePackageRoot } from './resolve.js';

export type IconSet = 'tabler' | 'lucide';
export type IconStyle = 'outline' | 'filled';

export interface IconHit {
  name: string;
  set: IconSet;
  category?: string;
  tags: string[];
  styles: IconStyle[];
}

interface TablerEntry {
  name: string;
  category?: string;
  tags?: Array<string | number>;
  styles?: Partial<Record<IconStyle, unknown>>;
}

interface IconIndex {
  entries: IconHit[];
  byName: Map<string, IconHit>;
}

let indexPromise: Promise<IconIndex> | null = null;

export function iconIndex(): Promise<IconIndex> {
  indexPromise ??= buildIndex();
  return indexPromise;
}

async function buildIndex(): Promise<IconIndex> {
  const entries: IconHit[] = [];

  try {
    const root = resolvePackageRoot('@tabler/icons');
    const raw = JSON.parse(await readFile(join(root, 'icons.json'), 'utf8')) as Record<string, TablerEntry>;
    for (const [name, entry] of Object.entries(raw)) {
      entries.push({
        name,
        set: 'tabler',
        category: entry.category || undefined,
        tags: (entry.tags ?? []).map(String),
        styles: (Object.keys(entry.styles ?? {}) as IconStyle[]).filter(
          (s) => s === 'outline' || s === 'filled',
        ),
      });
    }
  } catch (error) {
    process.stderr.write(`[slop-obliterator] Tabler icons unavailable: ${describe(error)}\n`);
  }

  try {
    const root = resolvePackageRoot('lucide-static');
    const raw = JSON.parse(await readFile(join(root, 'tags.json'), 'utf8')) as Record<string, string[]>;
    for (const [name, tags] of Object.entries(raw)) {
      entries.push({ name, set: 'lucide', tags, styles: ['outline'] });
    }
  } catch (error) {
    process.stderr.write(`[slop-obliterator] Lucide icons unavailable: ${describe(error)}\n`);
  }

  const byName = new Map<string, IconHit>();
  for (const entry of entries) byName.set(`${entry.set}:${entry.name}`, entry);

  return { entries, byName };
}

export interface SearchOptions {
  set?: IconSet | 'both';
  limit?: number;
}

export async function searchIcons(query: string, options: SearchOptions = {}): Promise<IconHit[]> {
  const { entries } = await iconIndex();
  const set = options.set ?? 'both';
  const limit = Math.min(options.limit ?? 20, 60);
  const terms = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (terms.length === 0) return [];

  const exactName = terms.join('-');
  const scored: Array<{ hit: IconHit; score: number }> = [];

  for (const entry of entries) {
    if (set !== 'both' && entry.set !== set) continue;

    let score = 0;
    const name = entry.name.toLowerCase();
    const nameWords = name.split('-');

    // "arrow right" should return arrow-right, not arrow-merge-alt-right. Tag
    // matches are useful for discovery but must never outrank the literal name.
    if (name === exactName) score += 400;

    for (const term of terms) {
      if (name === term) score += 140;
      else if (nameWords.includes(term)) score += 80;
      else if (name.startsWith(term)) score += 45;
      else if (name.includes(term)) score += 25;
    }

    let tagScore = 0;
    for (const term of terms) {
      for (const tag of entry.tags) {
        const t = tag.toLowerCase();
        if (t === term) tagScore += 18;
        else if (t.includes(term)) tagScore += 6;
      }
      if (entry.category && entry.category.toLowerCase().includes(term)) tagScore += 6;
    }
    score += Math.min(tagScore, 40);

    if (score === 0) continue;
    // Every extra word in the name is a qualifier the query did not ask for.
    score -= Math.max(0, nameWords.length - terms.length) * 14;
    scored.push({ hit: entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.hit.name.length - b.hit.name.length);
  return scored.slice(0, limit).map((s) => s.hit);
}

export interface RenderOptions {
  size?: number;
  strokeWidth?: number;
  /** Any CSS colour, or "currentColor" (the default, and almost always right). */
  color?: string;
  className?: string;
  style?: IconStyle;
}

export async function getIconSvg(
  name: string,
  set: IconSet,
  options: RenderOptions = {},
): Promise<string> {
  const style = options.style ?? 'outline';
  const path =
    set === 'tabler'
      ? join(resolvePackageRoot('@tabler/icons'), 'icons', style, `${name}.svg`)
      : join(resolvePackageRoot('lucide-static'), 'icons', `${name}.svg`);

  let svg: string;
  try {
    svg = await readFile(path, 'utf8');
  } catch {
    throw new Error(
      `Icon "${name}" not found in ${set}${set === 'tabler' ? ` (${style})` : ''}. Use icon_search first — names are kebab-case.`,
    );
  }

  return transform(svg, options);
}

function transform(input: string, options: RenderOptions): string {
  let svg = input.replace(/<!--[\s\S]*?-->/g, '').trim();

  if (options.size && options.size > 0) {
    svg = svg
      .replace(/\bwidth="[^"]*"/, `width="${options.size}"`)
      .replace(/\bheight="[^"]*"/, `height="${options.size}"`);
  }

  if (options.strokeWidth && options.strokeWidth > 0) {
    svg = svg.replace(/\bstroke-width="[^"]*"/, `stroke-width="${options.strokeWidth}"`);
  }

  if (options.color && options.color !== 'currentColor') {
    svg = svg.replace(/\bstroke="(?!none)[^"]*"/g, `stroke="${options.color}"`);
  }

  if (options.className !== undefined) {
    svg = /\bclass="[^"]*"/.test(svg)
      ? svg.replace(/\bclass="[^"]*"/, `class="${options.className}"`)
      : svg.replace(/<svg\b/, `<svg class="${options.className}"`);
  }

  // Collapse the multi-line attribute formatting both packages ship with.
  return svg.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/> </g, '><');
}

/** Best-effort count for the server banner. Sync so startup logging stays simple. */
export function installedSetsSummary(): string {
  const parts: string[] = [];
  for (const [label, pkg, file] of [
    ['tabler', '@tabler/icons', 'icons.json'],
    ['lucide', 'lucide-static', 'tags.json'],
  ] as const) {
    try {
      const raw = JSON.parse(readFileSync(join(resolvePackageRoot(pkg), file), 'utf8')) as object;
      parts.push(`${label}:${Object.keys(raw).length}`);
    } catch {
      parts.push(`${label}:unavailable`);
    }
  }
  return parts.join(' ');
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
