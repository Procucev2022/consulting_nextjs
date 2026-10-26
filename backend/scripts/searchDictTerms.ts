import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

const terms = [
  'tube', 'core', 'cone', 'strap', 'box', 'carton', 'corrugated', 'coal', 
  'labor', 'labour', 'manpower', 'personnel', 'strap', 'ice', 'cold', 'fuel',
  'diesel', 'refractory', 'grinding', 'conveyor', 'bearing', 'pallet'
];

for (const t of terms) {
  const matches = unspscOfficialDictionary.filter(u => 
    u.commodityTitle.toLowerCase().includes(t) || 
    u.classTitle.toLowerCase().includes(t)
  );
  console.log(`\n=== Matches for "${t}" (${matches.length}) ===`);
  matches.slice(0, 5).forEach(m => {
    console.log(`  ${m.commodityCode} | ${m.commodityTitle} [Class: ${m.classTitle}]`);
  });
}
