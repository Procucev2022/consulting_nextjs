import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

const searchCodes = ['24112501', '24121511', '24141505', '24141500', '14121503', '14121506', '24112701', '24111515', '24111507', '24121500'];

for (const code of searchCodes) {
  const item = unspscOfficialDictionary.find(u => u.commodityCode === code);
  if (item) {
    console.log(`FOUND ${code}: ${item.commodityTitle} [Family: ${item.familyTitle}, Class: ${item.classTitle}]`);
  } else {
    console.log(`NOT FOUND ${code}`);
  }
}
