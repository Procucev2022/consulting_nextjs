import fs from 'fs';
import path from 'path';

const p = path.resolve(__dirname, '../data/alternate_vendors_index.json');
const index = JSON.parse(fs.readFileSync(p, 'utf8'));

const stateCounts: Record<string, number> = {};
const stateCities: Record<string, Set<string>> = {};

for (const [cat, rec] of Object.entries<any>(index)) {
  for (const [st, cnt] of Object.entries<number>(rec.stateCounts || {})) {
    stateCounts[st] = (stateCounts[st] || 0) + cnt;
    if (!stateCities[st]) stateCities[st] = new Set();
  }
  for (const c of rec.topCities || []) {
    // topCities has { city, count }
    // find which state that city belongs to or record it
  }
}

console.log('Top 10 states by total vendor mentions:');
const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
for (const [st, cnt] of sortedStates.slice(0, 10)) {
  console.log(`- ${st}: ${cnt}`);
}

// Let's sample topCities across several categories
const sampleCities = new Set<string>();
for (const rec of Object.values<any>(index).slice(0, 20)) {
  for (const c of rec.topCities || []) {
    sampleCities.add(c.city);
  }
}
console.log('Sample cities in index:', Array.from(sampleCities));
