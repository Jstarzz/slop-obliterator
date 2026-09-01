import { findDesignSources } from './intelligence.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const accessibleCombo = findDesignSources('accessible combobox', 'primitive', 'react', 8).map((source) => source.id);
assert(accessibleCombo.includes('radix'), 'accessible React primitive search should include Radix');
assert(
  accessibleCombo.includes('base-ui') || accessibleCombo.includes('ariakit') || accessibleCombo.includes('react-aria'),
  'accessible primitive search should include another headless/accessibility library',
);

const internationalized = findDesignSources('internationalization keyboard collections', 'primitive', 'react', 5).map(
  (source) => source.id,
);
assert(internationalized.includes('react-aria'), 'complex accessible/i18n primitive work should surface React Aria');

const hero = findDesignSources('animated hero effect', 'marketing', 'react', 5).map((source) => source.id);
assert(hero.includes('magic-ui') || hero.includes('react-bits'), 'marketing motion search should surface expressive libraries');

const enterprise = findDesignSources('dense admin table', 'data', 'react', 8).map((source) => source.id);
assert(
  enterprise.some((id) => ['primer', 'carbon', 'mui', 'mantine', 'fluent-ui', 'ant-design'].includes(id)),
  'data-heavy application search should surface an authoritative system',
);

const material = findDesignSources('material data grid forms', 'data', 'react', 5).map((source) => source.id);
assert(material.includes('mui'), 'Material application work should surface MUI');

const crossFramework = findDesignSources('state machine primitives', 'primitive', 'vue', 5).map((source) => source.id);
assert(crossFramework[0] === 'ark-ui' || crossFramework.includes('ark-ui'), 'Vue primitive search should surface Ark UI');

console.log('intelligence selftest passed');
