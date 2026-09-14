import assert from 'node:assert/strict';

import { rankReferenceAxes } from './axes.js';
import { buildDesignPlan, proposeDesignRoles } from './plan.js';

function run(): void {
  const checkpoint = buildDesignPlan('port checkpoint NFC verification offline Android', 'mobile', 6, 4);
  assert.ok(checkpoint.roles.some((role) => role.referenceId === 'security-access'));
  assert.ok(checkpoint.roles.some((role) => role.role === 'mobile'));
  assert.ok(checkpoint.patterns.length > 0);
  assert.equal(checkpoint.craft.mode, 'operate');
  assert.ok(checkpoint.craft.dials.motionIntensity <= 3);
  assert.ok(checkpoint.craft.evidence.some((line) => line.includes('Figma MCP')));
  assert.ok(checkpoint.craft.evidence.some((line) => line.includes('Playwright MCP')));

  const dispatch = buildDesignPlan('ambulance dispatch exception triage map', 'web', 6, 4);
  assert.ok(dispatch.roles.some((role) => role.referenceId === 'logistics-dispatch'));
  assert.ok(dispatch.patterns.includes('exception-queue') || dispatch.patterns.includes('map-detail-dock'));
  assert.ok(dispatch.craft.dials.visualDensity >= 8);

  const ranked = rankReferenceAxes('developer infrastructure logs incident triage', 'web', 6);
  const roles = proposeDesignRoles(ranked, 'web');
  assert.ok(roles.length >= 3);
  assert.ok(new Set(roles.map((role) => role.role)).size === roles.length);
  assert.ok(new Set(roles.map((role) => role.referenceId)).size >= 2, 'planner should diversify role references when plausible');

  const empty = buildDesignPlan('', 'any', 5, 4);
  assert.deepEqual(empty.roles, []);
  assert.deepEqual(empty.patterns, []);

  console.log('design plan selftest passed');
}

run();
