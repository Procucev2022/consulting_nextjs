import { Module2AlternateSourcingEngine } from '../src/services/module2AlternateSourcingEngine';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import fs from 'fs';
import path from 'path';

const txs = Module2CanonicalService.getCanonicalTransactions('AIC-2026-0002');
const p = path.resolve(__dirname, '../data/alternate_vendors_index.json');
const index = JSON.parse(fs.readFileSync(p, 'utf8'));
const indexCats = Object.keys(index);

console.log('Total categories in index:', indexCats.length);

// Let's extract top 25 customer materials by spend
const materials = (Module2AlternateSourcingEngine as any).extractCustomerMaterials(txs).slice(0, 25);

for (const m of materials) {
  // Let's see what keywords match any index category
  const words = m.materialDescription.toLowerCase().split(/[\s,/-]+/).filter((w: string) => w.length > 3);
  const potentialMatches: string[] = [];
  for (const cat of indexCats) {
    const catLower = cat.toLowerCase();
    for (const w of words) {
      if (catLower.includes(w) && !potentialMatches.includes(cat)) {
        potentialMatches.push(cat);
      }
    }
  }
  console.log(`Mat: [${m.materialCode}] "${m.materialDescription}" | Spend: ₹${(m.totalSpendInr/1e7).toFixed(2)} Cr | Current: ${m.currentSuppliers.join(', ')}`);
  console.log(`  Index matches: ${potentialMatches.slice(0, 5).join(' | ')}`);
}
