import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

const segment14And24 = unspscOfficialDictionary.filter(u => 
  u.commodityCode.startsWith('14') || u.commodityCode.startsWith('24')
);

console.log('Total segment 14 and 24 items:', segment14And24.length);
segment14And24.forEach(u => {
  console.log(`${u.commodityCode} | ${u.commodityTitle} | Class: ${u.classTitle}`);
});
