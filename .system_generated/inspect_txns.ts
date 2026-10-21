import { Module2CanonicalService } from './backend/src/services/module2CanonicalService';

const txns = Module2CanonicalService.getCanonicalTransactions('AIC-2026-0001');
console.log('Total transactions:', txns.length);
const coalTxns = txns.filter(t => /coal|western/i.test(t.material_desc || '') || /coal|western/i.test(t.vendor_name || ''));
console.log('Coal transactions:', JSON.stringify(coalTxns, null, 2));

// Also let's list all unique materials in AIC-2026-0001
const uniqueMats = Array.from(new Set(txns.map(t => `${t.material_code} - ${t.material_desc} (${t.spend_category})`)));
console.log('\nUnique materials count:', uniqueMats.length);
console.log('Materials:', uniqueMats);
