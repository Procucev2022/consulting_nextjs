import { Module2VendorConsolidationEngine } from '../src/services/module2VendorConsolidationEngine';
import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

async function run() {
  const dictCodes = new Set(unspscOfficialDictionary.map(r => r.commodityCode));

  for (const id of ['AIC-2026-0002', 'AIC-2026-0003']) {
    console.log(`\n================ UNSPSC CATEGORY GROUPS FOR ${id} ================`);
    const res = await Module2VendorConsolidationEngine.calculate(id);
    console.log(`Total categories: ${res.categories.length}`);
    for (let i = 0; i < res.categories.length; i++) {
      const c = res.categories[i];
      const inDict = dictCodes.has(c.unspscCode);
      console.log(`${i + 1}. Code: "${c.unspscCode}" | Title: "${c.unspscCategory}" | Classification: ${c.classificationType} | Materials: ${c.distinctMaterialsCount} | Spend Cr: ${c.totalSpendCr} | In Taxonomy: ${inDict}`);
    }
  }
}

run().catch(console.error);
