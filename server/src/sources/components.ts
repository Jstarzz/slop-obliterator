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

const USER_AGENT = 'slop-obliterator/0.1 (+https://github.com/Jstarzz/slop-obliterator)';
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
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{ path?: string; content?: string; type?: string; target?: string }>;
}

interface ShadcnSearchResponse {
  items?: ShadcnRegistryItem[];
}

interface RegistryDescriptor {
  id: string;
  label: string;
  root: string;
  homepage?: string;
  license: string;
  /** False when upstream allows use but prohibits redistributing components. */
  proxyCode: boolean;
  installNamespace?: string;
}

const BUILTIN_REGISTRIES: readonly RegistryDescriptor[] = [
  {
    id: 'core',
    label: 'shadcn/ui',
    root: 'https://ui.shadcn.com/r',
    homepage: 'https://ui.shadcn.com',
    license: 'MIT',
    proxyCode: true,
  },
  {
    id: 'magicui',
    label: 'Magic UI',
    root: 'https://magicui.design/r',
    homepage: 'https://magicui.design',
    license: 'MIT',
    proxyCode: true,
    installNamespace: '@magicui',
  },
  {
    id: 'kokonutui',
    label: 'KokonutUI',
    root: 'https://kokonutui.com/r',
    homepage: 'https://kokonutui.com',
    license: 'MIT',
    proxyCode: true,
    installNamespace: '@kokonutui',
  },
  {
    id: 'reactbits',
    label: 'React Bits',
    root: 'https://reactbits.dev/r',
    homepage: 'https://reactbits.dev',
    license: 'MIT + Commons Clause — use is allowed; redistribution of the components themselves is restricted',
    proxyCode: false,
    installNamespace: '@react-bits',
  },
] as const;

function configuredRegistries(): readonly RegistryDescriptor[] {
  const custom = process.env.SLOP_REGISTRY_URL?.trim();
  if (!custom) return BUILTIN_REGISTRIES;
  return [
    {
      id: 'custom',
      label: `custom shadcn-schema registry (${custom.replace(/\/$/, '')})`,
      root: custom,
      license: 'registry-defined — verify before redistributing fetched source',
      proxyCode: true,
    },
  ];
}

function registryItemScore(item: ShadcnRegistryItem, terms: readonly string[]): number {
  if (terms.length === 0) return 1;
  const name = item.name.toLowerCase();
  const title = (item.title ?? '').toLowerCase();
  const description = (item.description ?? '').toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (name === term) score += 100;
    else if (name.startsWith(term)) score += 40;
    else if (name.includes(term)) score += 20;
    if (title.includes(term)) score += 10;
    if (description.includes(term)) score += 4;
  }
  return score;
}

function registryResultId(registry: RegistryDescriptor, name: string, totalRegistries: number): string {
  if (totalRegistries === 1 || registry.id === 'core') return `shadcn:${name}`;
  return `shadcn:${registry.id}:${name}`;
}

function registryFromId(
  id: string,
  registries: readonly RegistryDescriptor[],
): { registry: RegistryDescriptor; name: string } {
  const raw = id.replace(/^shadcn:/, '');
  const separator = raw.indexOf(':');
  if (separator > 0) {
    const registryId = raw.slice(0, separator);
    const match = registries.find((registry) => registry.id === registryId);
    if (match) return { registry: match, name: raw.slice(separator + 1) };
  }

  const fallback = registries.find((registry) => registry.id === 'core') ?? registries[0];
  if (!fallback) throw new Error('No shadcn-schema registries are configured.');
  return { registry: fallback, name: raw };
}

async function searchRegistry(
  registry: RegistryDescriptor,
  query: string,
  category: string | undefined,
  limit: number,
  totalRegistries: number,
): Promise<ComponentSummary[]> {
  const root = registry.root.replace(/\/$/, '');
  // Some registries implement q/limit server-side; others ignore them and return
  // the full index. Always rank/filter locally so behavior is consistent.
  const url = `${root}/registry.json?q=${encodeURIComponent(query)}&limit=${Math.max(limit, 20)}`;
  const payload = await cached(`shadcn:index:${url}`, () =>
    fetchJson<ShadcnSearchResponse | ShadcnRegistryItem[]>(url),
  );
  const items = Array.isArray(payload) ? payload : (payload.items ?? []);
  const terms = query.toLowerCase().split(/[\s,]+/).filter(Boolean);

  return items
    .map((item) => ({ item, score: registryItemScore(item, terms) }))
    .filter(({ item, score }) => {
      if (score <= 0) return false;
      if (!category) return true;
      return item.type?.replace(/^registry:/, '').toLowerCase() === category.toLowerCase();
    })
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map(({ item }) => ({
      id: registryResultId(registry, item.name, totalRegistries),
      name: item.name,
      source: `shadcn/${registry.id}`,
      category: [registry.id, item.type?.replace(/^registry:/, '')].filter(Boolean).join('/'),
      url: registry.homepage,
    }));
}

/**
 * Searches a small built-in directory of shadcn-schema registries by default:
 * shadcn/ui, Magic UI, KokonutUI, and React Bits. Point SLOP_REGISTRY_URL at an
 * internal registry to preserve the old single-registry behavior.
 *
 * React Bits is searchable but intentionally not proxied by component_fetch:
 * its current MIT + Commons Clause terms allow use but restrict redistribution
 * of the component library itself. Agents should install it from upstream.
 */
export function makeShadcnSource(): ComponentSource {
  const registries = configuredRegistries();

  return {
    id: 'shadcn',
    label:
      registries.length === 1
        ? registries[0]!.label
        : `shadcn-schema directory (${registries.map((registry) => registry.label).join(', ')})`,
    license: 'Per registry; component_fetch reports the source license.',

    categories: () => ['ui', 'block', 'component', 'hook', 'style'],

    async search(query, category, limit) {
      const settled = await Promise.allSettled(
        registries.map((registry) => searchRegistry(registry, query, category, limit, registries.length)),
      );
      const results = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));

      if (results.length === 0) {
        const failures = settled
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          .map((result) => describe(result.reason));
        if (failures.length === settled.length && failures.length > 0) {
          throw new Error(`Every shadcn-schema registry failed: ${failures.join(' | ')}`);
        }
      }

      return results.slice(0, limit);
    },

    async get(id) {
      const { registry, name } = registryFromId(id, registries);
      const root = registry.root.replace(/\/$/, '');

      if (!registry.proxyCode) {
        const install = registry.installNamespace
          ? `npx shadcn@latest add ${registry.installNamespace}/${name}`
          : `${root}/${encodeURIComponent(name)}.json`;
        throw new Error(
          `${registry.label} is searchable here, but slop-obliterator will not proxy its component source. ` +
            `${registry.license}. Fetch/install it directly from upstream instead: ${install}`,
        );
      }

      const item = await cached(`shadcn:item:${registry.id}:${name}`, () =>
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
        source: `shadcn/${registry.id}`,
        category: item.type?.replace(/^registry:/, ''),
        language: 'tsx',
        code: code || JSON.stringify(item, null, 2),
        dependencies: [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])],
        license: registry.license,
        url: registry.homepage,
        attribution: registry.id === 'core' ? undefined : `${item.name} from ${registry.label}`,
      };
    },
  };
}

/**
 * SmoothUI publishes a shadcn-schema registry, but it remains its own source so
 * callers can explicitly ask for motion-driven interaction rather than search
 * the broader registry directory.
 */
function makeSmoothUiSource(): ComponentSource {
  const registry: RegistryDescriptor = {
    id: 'smoothui',
    label: 'SmoothUI',
    root: 'https://smoothui.dev/r',
    homepage: 'https://smoothui.dev',
    license: 'MIT',
    proxyCode: true,
  };

  return {
    id: 'smoothui',
    label: 'SmoothUI (motion-driven React components)',
    license: 'MIT',
    categories: () => ['ui', 'interactive', 'layout', 'utility'],
    async search(query, category, limit) {
      const results = await searchRegistry(registry, query, category, limit, 1);
      return results.map((result) => ({
        ...result,
        id: result.id.replace(/^shadcn:/, 'smoothui:'),
        source: 'smoothui',
        url: `https://smoothui.dev/doc/${result.name}`,
      }));
    },
    async get(id) {
      const name = id.replace(/^smoothui:/, '');
      const root = registry.root.replace(/\/$/, '');
      const item = await cached(`smoothui:item:${name}`, () =>
        fetchJson<ShadcnRegistryItem>(`${root}/${encodeURIComponent(name)}.json`),
      );
      const code = (item.files ?? [])
        .map((file) => `${file.path ? `// ${file.path}\n` : ''}${file.content ?? ''}`)
        .join('\n\n');
      return {
        id,
        name: item.name,
        source: 'smoothui',
        category: item.type?.replace(/^registry:/, ''),
        language: 'tsx',
        code: code || JSON.stringify(item, null, 2),
        dependencies: [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])],
        license: registry.license,
        url: `https://smoothui.dev/doc/${item.name}`,
        attribution: `${item.name} from SmoothUI by educlopez`,
      };
    },
  };
}

export function componentSources(): Record<string, ComponentSource> {
  return {
    uiverse: uiverseSource,
    shadcn: makeShadcnSource(),
    smoothui: makeSmoothUiSource(),
  };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
