import { rankReferenceAxes, scoreReferenceAxes } from './axes.js';
import { DESIGN_REFERENCES } from './design.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dispatch = rankReferenceAxes('ambulance dispatch map exception triage', 'mobile', 5);
assert(dispatch.length > 0, 'dispatch axis ranking should return candidates');
assert(dispatch[0]?.reference.id === 'logistics-dispatch', 'logistics/dispatch should rank first for ambulance dispatch');
assert(dispatch[0]!.axes.mobile > 0, 'mobile dispatch candidate should receive a mobile score');

const security = DESIGN_REFERENCES.find((reference) => reference.id === 'security-access');
assert(security, 'security reference must exist');
const securityScores = scoreReferenceAxes(security, 'nfc checkpoint badge scan override audit', 'mobile');
assert(securityScores.axes.domain > 0, 'security reference should score for checkpoint domain');
assert(securityScores.axes.interaction > 0, 'security reference should score for scan/override interaction');
assert(securityScores.axes.mobile > 0, 'security reference should expose mobile behavior');

const field = rankReferenceAxes('offline technician inspection photo checklist sync', 'mobile', 4);
assert(field[0]?.reference.id === 'field-work', 'field-work should lead offline inspection synthesis');

const bounded = rankReferenceAxes('dashboard status', 'web', 2);
assert(bounded.length <= 2, 'axis ranking must honor compact result limits');
assert(rankReferenceAxes('', 'any', 5).length === 0, 'empty queries must not dump the catalogue');

console.log('reference axis selftest passed');
