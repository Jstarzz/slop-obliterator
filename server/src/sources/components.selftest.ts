import { makeShadcnSource } from './components.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const originalFetch = globalThis.fetch;
const originalRegistryUrl = process.env.SLOP_REGISTRY_URL;

const indexes: Record<string, unknown> = {
  'ui.shadcn.com': {
    items: [
      { name: 'button', type: 'registry:ui', description: 'button control' },
      { name: 'card', type: 'registry:ui', description: 'plain card' },
    ],
  },
  'magicui.design': {
    items: [{ name: 'magic-card', type: 'registry:ui', description: 'spotlight animated card' }],
  },
  'kokonutui.com': {
    items: [{ name: 'card-flip', type: 'registry:component', description: 'animated flip card' }],
  },
  'reactbits.dev': {
    items: [{ name: 'TiltedCard-TS-TW', type: 'registry:component', description: 'tilted animated card' }],
  },
  'registry.example.test': {
    items: [{ name: 'private-card', type: 'registry:component', description: 'internal card' }],
  },
};

const details: Record<string, unknown> = {
  'magicui.design/magic-card.json': {
    name: 'magic-card',
    type: 'registry:ui',
    dependencies: ['motion'],
    files: [{ path: 'magic-card.tsx', content: 'export const MagicCard = () => null;' }],
  },
  'registry.example.test/private-card.json': {
    name: 'private-card',
    type: 'registry:component',
    files: [{ path: 'private-card.tsx', content: 'export const PrivateCard = () => null;' }],
  },
};

globalThis.fetch = (async (input: string | URL | Request) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  const key = url.host;

  let payload: unknown;
  if (url.pathname.endsWith('/registry.json')) {
    payload = indexes[key];
  } else {
    const name = url.pathname.split('/').pop();
    payload = details[`${key}/${name}`];
  }

  if (payload === undefined) return new Response('not found', { status: 404 });
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

try {
  delete process.env.SLOP_REGISTRY_URL;
  const directory = makeShadcnSource();
  const results = await directory.search('card', undefined, 10);
  const ids = results.map((result) => result.id);

  assert(ids.includes('shadcn:card'), 'canonical shadcn result keeps the backwards-compatible short id');
  assert(ids.includes('shadcn:magicui:magic-card'), 'Magic UI is searched by default');
  assert(ids.includes('shadcn:kokonutui:card-flip'), 'KokonutUI is searched by default');
  assert(ids.includes('shadcn:reactbits:TiltedCard-TS-TW'), 'React Bits is searchable by default');

  const magic = await directory.get('shadcn:magicui:magic-card');
  assert(magic.license === 'MIT', 'Magic UI license is preserved');
  assert(magic.code.includes('MagicCard'), 'fetchable MIT registry source is returned');

  let reactBitsBlocked = false;
  try {
    await directory.get('shadcn:reactbits:TiltedCard-TS-TW');
  } catch (error) {
    reactBitsBlocked = String(error).includes('will not proxy its component source');
  }
  assert(reactBitsBlocked, 'React Bits source is not redistributed through component_fetch');

  process.env.SLOP_REGISTRY_URL = 'https://registry.example.test/r';
  const custom = makeShadcnSource();
  const customResults = await custom.search('private', undefined, 5);
  assert(customResults[0]?.id === 'shadcn:private-card', 'single custom registry preserves legacy id shape');
  const privateCard = await custom.get('shadcn:private-card');
  assert(privateCard.code.includes('PrivateCard'), 'custom registry remains fetchable');

  console.log('component source selftest passed');
} finally {
  globalThis.fetch = originalFetch;
  if (originalRegistryUrl === undefined) delete process.env.SLOP_REGISTRY_URL;
  else process.env.SLOP_REGISTRY_URL = originalRegistryUrl;
}
