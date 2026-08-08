import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Find a dependency's install root.
 *
 * `require.resolve('<pkg>/package.json')` is the clean path, but packages with an
 * `exports` map that does not expose `./package.json` (which includes
 * `@tabler/icons`) will refuse it. So we fall back to walking up looking for
 * node_modules, which is what every package manager layout has in common.
 */
export function resolvePackageRoot(name: string): string {
  try {
    return dirname(require.resolve(`${name}/package.json`));
  } catch {
    // fall through
  }

  let dir = here;
  for (let depth = 0; depth < 12; depth += 1) {
    const candidate = join(dir, 'node_modules', ...name.split('/'));
    if (existsSync(join(candidate, 'package.json'))) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(
    `Could not locate the "${name}" package. Run \`npm install\` in the slop-obliterator server directory.`,
  );
}
