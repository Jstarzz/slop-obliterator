import { DESIGN_REFERENCES, findDesignReferences } from './design.js';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(DESIGN_REFERENCES.length >= 15, 'design reference catalogue should cover at least 15 app archetypes');

const dispatch = findDesignReferences('ambulance dispatch vehicle tracking', 'mobile', 4);
assert(dispatch[0]?.id === 'logistics-dispatch', 'ambulance dispatch should rank logistics/dispatch first');
assert(dispatch.length <= 4, 'reference search should honor the compact result limit');

const access = findDesignReferences('port checkpoint nfc badge access control', 'mobile', 4);
assert(access[0]?.id === 'security-access', 'checkpoint NFC should rank security/access first');

const payments = findDesignReferences('school payment transactions receipt settlement', 'web', 4);
assert(payments[0]?.id === 'finance-payments', 'payment workflow should rank finance/payments first');

const field = findDesignReferences('offline technician inspection photo checklist sync', 'mobile', 4);
assert(field[0]?.id === 'field-work', 'offline inspection should rank field-work first');

const empty = findDesignReferences('', 'any', 4);
assert(empty.length === 0, 'empty queries should not dump the whole catalogue into context');

console.log('design reference selftest passed');
