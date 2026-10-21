import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./backend/data/alternate_vendors_index.json', 'utf8'));
console.log('Total categories:', Object.keys(data).length);
const keys = Object.keys(data);
const coalMatches = keys.filter(k => /coal|fuel|mining|mineral|e-auction|auction|power|coke|energy/i.test(k));
console.log('Coal/Fuel/Mining/Auction category keys:', coalMatches);

let westernCoalFound = false;
let totalVendorsSum = 0;
for (const [cat, rec] of Object.entries(data)) {
  totalVendorsSum += rec.distinctVendorCount || 0;
  const normNames = (rec.sampleVendors || []).map(v => v.normName || v.name);
  if (normNames.some(n => /western.*coal|coal.*fields/i.test(n))) {
    console.log(`Found Western Coal in category: ${cat}`);
    westernCoalFound = true;
  }
}
console.log('Sum of distinctVendorCount across all categories:', totalVendorsSum);
if (!westernCoalFound) {
  console.log('WESTERN COAL not found in sampleVendors of alternate_vendors_index.json');
}

// Sample a category record
console.log('Sample record (first key):', keys[0], JSON.stringify(data[keys[0]], null, 2));
