import { INTERACTION_PATTERNS, findInteractionPatterns } from './patterns.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(INTERACTION_PATTERNS.length >= 18, 'interaction-pattern catalogue should cover at least 18 reusable patterns');

const triage = findInteractionPatterns('operators triage incidents queue acknowledge resolve inspect details', 'web', 5);
assert(triage[0]?.id === 'exception-queue', 'incident triage should prefer an exception queue');
assert(triage.length <= 5, 'pattern retrieval must respect compact result limits');

const spatial = findInteractionPatterns('vehicle map selection location detail route context', 'mobile', 5);
assert(spatial[0]?.id === 'map-detail-dock', 'spatial selection should prefer map + contextual dock');

const compare = findInteractionPatterns('compare many records sort filter columns bulk action', 'web', 5);
assert(compare[0]?.id === 'data-table', 'record comparison should prefer a data table');

const field = findInteractionPatterns('offline inspection checklist evidence resume interrupted work', 'mobile', 5);
assert(field[0]?.id === 'checklist-flow', 'field inspection should prefer checklist/field flow');

const keyboard = findInteractionPatterns('expert keyboard quick commands launcher navigation actions', 'web', 5);
assert(keyboard[0]?.id === 'command-palette', 'expert keyboard actions should prefer a command palette');

assert(findInteractionPatterns('   ', 'any', 5).length === 0, 'empty pattern queries should return no results');

console.log('interaction pattern selftest passed');
