import assert from 'node:assert/strict';

import { buildCraftProfile, inferCraftMode } from './craft.js';

assert.equal(inferCraftMode('developer documentation and API guide'), 'read');
assert.equal(inferCraftMode('creative portfolio showcase'), 'experience');
assert.equal(inferCraftMode('SaaS landing page for technical buyers'), 'persuade');
assert.equal(inferCraftMode('port checkpoint NFC verification'), 'operate');

const publicService = buildCraftProfile('public sector access control verification', 'mobile');
assert.equal(publicService.mode, 'operate');
assert.ok(publicService.dials.designVariance <= 4, 'trust-heavy surfaces should suppress arbitrary visual variance');
assert.ok(publicService.dials.motionIntensity <= 3, 'trust-heavy surfaces should keep motion restrained');
assert.ok(publicService.dials.visualDensity >= 5, 'operational trust-heavy surfaces should retain useful information density');

const creativeLanding = buildCraftProfile('experimental creative agency landing page', 'web');
assert.equal(creativeLanding.mode, 'persuade');
assert.ok(creativeLanding.dials.designVariance >= 8);
assert.ok(creativeLanding.dials.motionIntensity >= 7);

const overridden = buildCraftProfile('calm documentation', 'web', 'read', {
  designVariance: 9,
  motionIntensity: 8,
  visualDensity: 6,
});
assert.deepEqual(overridden.dials, { designVariance: 9, motionIntensity: 8, visualDensity: 6 });
assert.ok(overridden.evidence.some((line) => line.includes('Figma MCP')));
assert.ok(overridden.evidence.some((line) => line.includes('Playwright MCP')));

console.log('CRAFT PROFILE SELFTEST PASSED');
