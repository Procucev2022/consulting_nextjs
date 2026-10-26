import { Module2AlternateSourcingEngine } from '../src/services/module2AlternateSourcingEngine';
import fs from 'fs';
import path from 'path';

const p = path.resolve(__dirname, '../data/alternate_vendors_index.json');
const index = JSON.parse(fs.readFileSync(p, 'utf8'));

const res = Module2AlternateSourcingEngine.calculateAlternateSourcing('AIC-2026-0002');

// Categories matched across opportunities
const matchedCats = new Set<string>();
for (const o of res.opportunities) {
  if (o.matchedVendorCategory && o.matchedVendorCategory !== 'General Procurement' && o.matchedVendorCategory !== 'NO_VERIFIED_CATEGORY_MATCH') {
    matchedCats.add(o.matchedVendorCategory);
  }
}
console.log('Matched categories across top 25 opportunities:', Array.from(matchedCats));

const distinctVendors = new Set<string>();
let sumVendorCounts = 0;
for (const cat of matchedCats) {
  const rec = index[cat];
  if (rec) {
    sumVendorCounts += rec.distinctVendorCount;
    for (const norm of rec.companyNorms || []) {
      distinctVendors.add(norm);
    }
  }
}

console.log('Sum of category distinctVendorCount:', sumVendorCounts);
console.log('Truly distinct deduplicated vendors across matched categories:', distinctVendors.size);
