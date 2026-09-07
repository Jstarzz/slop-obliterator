import assert from 'node:assert/strict';

import { analyzePolish, POLISH_RULES } from './analyze.js';
import type { PolishMeasurements, PolishSignal } from './collect.js';

function signal(): PolishSignal {
  return { count: 0, samples: [] };
}

function baseline(): PolishMeasurements {
  return {
    viewport: { width: 1280, height: 800 },
    icons: {
      total: 0,
      families: {},
      outline: 0,
      filled: 0,
      sizes: [],
    },
    spacing: {
      values: [],
      sectionPaddingPairs: [],
    },
    signals: {
      emojiControl: signal(),
      rasterUiIcon: signal(),
      unlabeledIconButton: signal(),
      oversizedUiIcon: signal(),
      inconsistentSiblingIconSize: signal(),
      mixedIconFamilies: signal(),
      mixedSiblingIconStyles: signal(),
      repeatedIconTiles: signal(),
      sparkleDecoration: signal(),
      spacingScaleSprawl: signal(),
      offGridSpacing: signal(),
      repeatedSectionPadding: signal(),
      cardPaddingDrift: signal(),
      controlHeightDrift: signal(),
      headingBodyGapOutlier: signal(),
      pillSoup: signal(),
      repeatedCenteredSections: signal(),
    },
  };
}

const clean = analyzePolish(baseline());
assert.equal(clean.findings.length, 0, 'clean polish baseline should produce zero findings');
assert.equal(clean.score, 100, 'clean polish baseline should score 100');

for (const rule of POLISH_RULES) {
  const raw = baseline();
  raw.signals[rule.signal] = {
    count: 1,
    samples: [{ selector: '.fixture', detail: `fixture for ${rule.id}` }],
  };
  const report = analyzePolish(raw);
  assert.equal(report.findings.length, 1, `${rule.id} should produce exactly one finding`);
  assert.equal(report.findings[0]?.id, rule.id, `${rule.id} should map to its own signal`);
}

assert.equal(
  new Set(POLISH_RULES.map((rule) => rule.id)).size,
  POLISH_RULES.length,
  'polish rule ids must be unique',
);
assert.equal(
  new Set(POLISH_RULES.map((rule) => rule.signal)).size,
  POLISH_RULES.length,
  'each polish rule should own one signal so coverage stays obvious',
);

console.log(`POLISH CHECKS PASSED (${POLISH_RULES.length} rules)`);
