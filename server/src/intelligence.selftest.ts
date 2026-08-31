import { findDesignSources } from './intelligence.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const accessibleCombo = findDesignSources('accessible combobox', 'primitive', 'react', 5).map((source) => source.id);
assert(accessibleCombo.includes('radix'), 'accessible React primitive search should include Radix');
assert(accessibleCombo.includes('base-ui') || accessibleCombo.includes('ariakit'), 'accessible primitive search should include another headless library');

const hero = findDesignSources('animated hero effect', 'marketing', 'react', 5).map((source) => source.id);
assert(hero.includes('magic-ui') || hero.includes('react-bits'), 'marketing motion search should surface expressive libraries');

const enterprise = findDesignSources('dense admin table', 'data', 'react', 5).map((source) => source.id);
assert(enterprise.includes('primer') || enterprise.includes('carbon'), 'data-heavy application search should surface an authoritative system');

const crossFramework = findDesignSources('state machine primitives', 'primitive', 'vue', 5).map((source) => source.id);
assert(crossFramework[0] === 'ark-ui' || crossFramework.includes('ark-ui'), 'Vue primitive search should surface Ark UI');

console.log('intelligence selftest passed');
