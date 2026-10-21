import { Module2CanonicalService } from '../src/services/module2CanonicalService';

const txns = Module2CanonicalService.getCanonicalTransactions('AIC-2026-0001');
console.log('Total txns:', txns.length);
const coalTxns = txns.filter(t => /coal|western/i.test(t.material_desc || '') || /coal|western/i.test(t.vendor_name || ''));
console.log('Coal txns:', JSON.stringify(coalTxns, null, 2));

const uniqueMats = Array.from(new Set(txns.map(t => `${t.material_code} ::: ${t.material_desc} ::: ${t.spend_category}`)));
console.log('Unique materials count:', uniqueMats.length);
for (const m of uniqueMats.slice(0, 30)) {
  console.log(m);
}
