import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./backend/data/alternate_vendors_index.json', 'utf8'));
const keys = Object.keys(data);
console.log('Categories matching coal/fuel/mining/power/etc:');
const coalMatches = keys.filter(k => /coal|fuel|mining|mineral|e-auction|auction|power|coke|energy/i.test(k));
for (const m of coalMatches) {
  console.log(`- "${m}": count=${data[m].distinctVendorCount}, stateCounts=${JSON.stringify(data[m].stateCounts)}`);
}

// Also check all 319 category names to see if anything is even remotely related to raw materials/commodities/chemicals
console.log('\nAll categories sample (first 30):');
console.log(keys.slice(0, 30));
