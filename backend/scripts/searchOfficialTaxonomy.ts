import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';

const searchTerms = ['coal', 'diesel', 'fuel', 'bearing', 'valve', 'pump', 'motor', 'cable', 'steel', 'refractory', 'grinding', 'paper', 'box', 'explosive', 'bag'];

for (const term of searchTerms) {
  const matches = unspscOfficialDictionary.filter(r => 
    r.commodityTitle.toLowerCase().includes(term) ||
    r.classTitle.toLowerCase().includes(term) ||
    r.familyTitle.toLowerCase().includes(term) ||
    r.segmentTitle.toLowerCase().includes(term)
  );
  console.log(`Term "${term}": ${matches.length} matches. Sample:`);
  for (const m of matches.slice(0, 3)) {
    console.log(`   ${m.commodityCode} | ${m.commodityTitle} | Class: ${m.classCode} (${m.classTitle}) | Family: ${m.familyCode} (${m.familyTitle})`);
  }
}
