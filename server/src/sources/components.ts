/**
 * Component sources.
 *
 * Each source is a small adapter behind one interface, so a source that changes
 * its API — or a new one worth adding — touches exactly one object in this file
 * and nothing else in the server.
 *
 * Nothing here is a substitute for taste. These return raw material; the skill
 * layer decides whether the material belongs in the design.
 */

export interface ComponentSummary {
  id: string;
  name: string;
  source: string;
  category?: string;
  author?: string;
  /** Where a human can go look at it. */
  url?: string;
}

export interface ComponentDetail extends ComponentSummary {
  language: 'html' | 'tsx' | 'json';
  code: string;
  dependencies?: string[];
  license: string;
  attribution?: string;
}

export interface ComponentSource {
  readonly id: string;
  readonly label: string;
  readonly license: string;
  categories(): readonly string[];
  search(query: string, category: string | undefined, limit: number): Promise<ComponentSummary[]>;
  get(id: string): Promise<ComponentDetail>;
}

const USER_AGENT = 'slop-obliterator/0.1 (+https://github.com/uiverse-io/galaxy)';
const CACHE_TTL_MS = 15 * 60 * 1000;

const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status} ${response.statusText}`);
  }
  return await response.text();
}

/* ------------------------------------------------------------------ uiverse */

const UIVERSE_CATEGORIES = [
  'Buttons',
  'Cards',
  'Checkboxes',
  'Forms',
  'Inputs',
  'Loaders',
  'Notifications',
  'Patterns',
  'Radio-buttons',
  'Toggle-switches',
  'Tooltips',
] as const;

/** The repo directory is lowercase for loaders and capitalised for everything else. */
function uiverseDir(category: string): string {
  return category.toLowerCase() === 'loaders' ? 'loaders' : category;
}

interface GithubEntry {
  name: string;
  path: string;
  type: string;
  size: number;
  download_url: string | null;
}

export const uiverseSource: ComponentSource = {
  id: 'uiverse',
  label: 'Uiverse.io (galaxy)',
  license: 'MIT — attribution to the original author and Uiverse.io is requested',

  categories: () => UIVERSE_CATEGORIES,

  async search(query, category, limit) {
    const targets = category ? [category] : [...UIVERSE_CATEGORIES];
    const terms = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const results: ComponentSummary[] = [];

    for (const target of targets) {
      const dir = uiverseDir(target);
      let listing: GithubEntry[];
      try {
        listing = await cached(`uiverse:${dir}`, () =>
          fetchJson<GithubEntry[]>(
            `https://api.github.com/repos/uiverse-io/galaxy/contents/${encodeURIComponent(dir)}`,
          ),
        );
      } catch (error) {
        throw new Error(
          `Could not list Uiverse "${target}": ${describe(error)}. ` +
            `The GitHub API rate-limits unauthenticated requests to 60/hour — set GITHUB_TOKEN to raise it.`,
        );
      }

      for (const entry of listing) {
        if (entry.type !== 'file' || !entry.name.endsWith('.html')) continue;
        const base = entry.name.replace(/\.html$/, '');
        const separator = base.indexOf('_');
        const author = separator > 0 ? base.slice(0, separator) : undefined;
        const slug = separator > 0 ? base.slice(separator + 1) : base;

        if (terms.length > 0) {
          const haystack = `${slug} ${target}`.toLowerCase();
          if (!terms.some((term) => haystack.includes(term))) continue;
        }

        results.push({
          id: `uiverse:${entry.path}`,
          name: slug,
          source: 'uiverse',
          category: target,
          author,
          url: `https://uiverse.io/${author ?? ''}/${slug}`,
        });
        if (results.length >= limit) return results;
      }
    }

    return results;
  },

  async get(id) {
    const path = id.replace(/^uiverse:/, '');
    const code = await cached(`uiverse:file:${path}`, () =>
      fetchText(`https://raw.githubusercontent.com/uiverse-io/galaxy/main/${path}`),
    );
    const base = path.split('/').pop()!.replace(/\.html$/, '');
    const separator = base.indexOf('_');
    const author = separator > 0 ? base.slice(0, separator) : undefined;
    const slug = separator > 0 ? base.slice(separator + 1) : base;

    return {
      id,
      name: slug,
      source: 'uiverse',
      category: path.split('/')[0],
      author,
      url: `https://uiverse.io/${author ?? ''}/${slug}`,
      language: 'html',
      code,
      license: 'MIT',
      attribution: author ? `${slug} by ${author} via Uiverse.io` : `via Uiverse.io`,
    };
  },
};

/* ------------------------------------------------------------------ shadcn */

interface ShadcnRegistryItem {
  name: string;
  type?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{ path?: string; content?: string; type?: string; target?: string }>;
}

interface ShadcnSearchResponse {
  items?: ShadcnRegistryItem[];
}

/**
 * Works against any registry that follows the shadcn schema, not just the
 * canonical one. Point SLOP_REGISTRY_URL at an internal registry to search a
 * team's own components with the same tool.
 */
export function makeShadcnSource(baseUrl = process.env.SLOP_REGISTRY_URL ?? 'https://ui.shadcn.com/r'): ComponentSource {
  const root = baseUrl.replace(/\/$/, '');

  return {
    id: 'shadcn',
    label: `shadcn-schema registry (${root})`,
    license: 'MIT',

    categories: () => ['ui', 'block', 'component', 'hook'],

    async search(query, _category, limit) {
      const url = `${root}/registry.json?q=${encodeURIComponent(query)}&limit=${limit}`;
      const payload = await cached(`shadcn:${url}`, () => fetchJson<ShadcnSearchResponse | ShadcnRegistryItem[]>(url));
      const items = Array.isArray(payload) ? payload : (payload.items ?? []);

      return items.slice(0, limit).map((item) => ({
        id: `shadcn:${item.name}`,
        name: item.name,
        source: 'shadcn',
        category: item.type?.replace(/^registry:/, ''),
        url: root.includes('ui.shadcn.com') ? `https://ui.shadcn.com/docs/components/${item.name}` : undefined,
      }));
    },

    async get(id) {
      const name = id.replace(/^shadcn:/, '');
      const item = await cached(`shadcn:item:${name}`, () =>
        fetchJson<ShadcnRegistryItem>(`${root}/${encodeURIComponent(name)}.json`),
      );

      const code = (item.files ?? [])
        .map((file) => {
          const header = file.path ? `// ${file.path}\n` : '';
          return `${header}${file.content ?? ''}`;
        })
        .join('\n\n');

      return {
        id,
        name: item.name,
        source: 'shadcn',
        category: item.type?.replace(/^registry:/, ''),
        language: 'tsx',
        code: code || JSON.stringify(item, null, 2),
        dependencies: [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])],
        license: 'MIT',
        url: root.includes('ui.shadcn.com') ? `https://ui.shadcn.com/docs/components/${item.name}` : undefined,
      };
    },
  };
}

export function componentSources(): Record<string, ComponentSource> {
  const shadcn = makeShadcnSource();
  return { uiverse: uiverseSource, shadcn };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
