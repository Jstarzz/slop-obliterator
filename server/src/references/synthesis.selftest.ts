import { buildSynthesisContract } from './synthesis.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const contract = buildSynthesisContract([
  { id: 'logistics-dispatch', role: 'structure' },
  { id: 'operations-console', role: 'interaction' },
  { id: 'field-work', role: 'mobile', note: 'offline state must remain visible' },
]);
assert(contract.includes('Logistics / dispatch'), 'contract should name the structural reference');
assert(contract.includes('Operations console'), 'contract should name the interaction reference');
assert(contract.includes('Field-work / inspection'), 'contract should name the mobile reference');
assert(contract.includes('normalize:'), 'contract should include anti-Frankenstein normalization');

let duplicateRejected = false;
try {
  buildSynthesisContract([
    { id: 'logistics-dispatch', role: 'structure' },
    { id: 'security-access', role: 'structure' },
  ]);
} catch {
  duplicateRejected = true;
}
assert(duplicateRejected, 'duplicate synthesis roles must be rejected');

let singletonRejected = false;
try {
  buildSynthesisContract([{ id: 'logistics-dispatch', role: 'structure' }]);
} catch {
  singletonRejected = true;
}
assert(singletonRejected, 'one reference is selection, not synthesis');

console.log('reference synthesis selftest passed');
