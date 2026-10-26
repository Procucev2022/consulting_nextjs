import fs from 'fs';
import path from 'path';

const p = path.resolve(__dirname, '../data/alternate_vendors_index.json');
const data = JSON.parse(fs.readFileSync(p, 'utf8'));
const coalRec = data['coal'];
console.log('Coal category distinct count:', coalRec.distinctVendorCount);
console.log('Sample vendors (first 5):', JSON.stringify(coalRec.sampleVendors?.slice(0, 5), null, 2));
console.log('Company norms (first 10):', coalRec.companyNorms?.slice(0, 10));

const wcl = (coalRec.companyNorms || []).filter((n: string) => /western|coalfields|cil|singareni/i.test(n));
console.log('Matching WCL or CIL in coal company norms:', wcl);

// Also search all categories for "western" or "coalfields"
let foundAnywhere: string[] = [];
for (const [cat, rec] of Object.entries<any>(data)) {
  const matches = (rec.companyNorms || []).filter((n: string) => /western.*coal|coalfields/i.test(n));
  if (matches.length > 0) {
    foundAnywhere.push(`${cat}: ${matches.join(', ')}`);
  }
}
console.log('Western Coalfields found anywhere in index?:', foundAnywhere);
