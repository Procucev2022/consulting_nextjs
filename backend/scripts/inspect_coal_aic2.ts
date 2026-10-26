import { Module2CanonicalService } from '../src/services/module2CanonicalService';

const txs = Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
const coal = txs.filter(t => /coal/i.test(t.material_desc || '') || /coal/i.test(t.vendor_name || ''));
console.log('AIC-2026-0002 Coal transactions count:', coal.length);

const coalMaterials = Array.from(new Set(coal.map(t => `${t.material_code} ::: ${t.material_desc} ::: ${t.spend_category} ::: ${t.vendor_name}`)));
console.log('Coal materials / vendors:');
for (const cm of coalMaterials) {
  console.log(' -', cm);
}
