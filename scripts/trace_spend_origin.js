const fs = require('fs');

// Provenance Buckets
const provBuckets = [
  { name: 'APPROVED_MAPPINGS', spendInr: 0.0, txs: 0, items: 0 },
  { name: 'PENDING_APPROVAL_MAPPINGS', spendInr: 1330469564.0, txs: 43, items: 6 },
  { name: 'SOURCE_IDENTIFIED_NOT_ACQUIRED', spendInr: 51643125.33, txs: 56, items: 5 },
  { name: 'LICENSE_REQUIRED', spendInr: 42376540.0, txs: 16, items: 4 },
  { name: 'MANUAL_VALIDATION_REQUIRED', spendInr: 23379500.0, txs: 8, items: 2 },
  { name: 'NO_SUITABLE_SOURCE', spendInr: 75418675.0, txs: 4, items: 4 },
  { name: 'UNMAPPED_SPEND', spendInr: 4042059021.86, txs: 27650, items: 8955 }
];

console.log('--- PROVENANCE BUCKETS ---');
let provInr = 0, provTxs = 0, provItems = 0;
provBuckets.forEach(b => {
  provInr += b.spendInr;
  provTxs += b.txs;
  provItems += b.items;
});
console.log(`Sum: Inr = ${provInr.toFixed(2)}, Txs = ${provTxs}, Items = ${provItems}`);

// Now read module3PcbiGapListItems.ts and Part2
const p1 = fs.readFileSync('backend/src/constants/module3PcbiGapListItems.ts', 'utf8');
const p2 = fs.readFileSync('backend/src/constants/module3PcbiGapListItemsPart2.ts', 'utf8');

function extractItems(content) {
  const items = [];
  const regex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?materialCode:\s*([^\n,]+)[\s\S]*?materialDescription:\s*'([^']+)'[\s\S]*?customerSpendCr:\s*([0-9.]+)[\s\S]*?customerSpendInr:\s*([0-9.]+)[\s\S]*?transactionCount:\s*([0-9]+)[\s\S]*?gapStatus:\s*'([^']+)'[\s\S]*?\}/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    items.push({
      id: m[1],
      code: m[2].replace(/['"]/g, '').trim(),
      desc: m[3],
      spendCr: parseFloat(m[4]),
      spendInr: parseFloat(m[5]),
      txs: parseInt(m[6], 10),
      status: m[7]
    });
  }
  return items;
}

const gapItems = [...extractItems(p1), ...extractItems(p2)];

console.log('\n--- GAP ITEMS IN module3PcbiGapListItems ---');
gapItems.forEach(it => {
  console.log(`${it.id} | ${it.code} | Inr: ${it.spendInr.toFixed(2)} | Cr: ${it.spendCr.toFixed(4)} | Txs: ${it.txs} | ${it.status}`);
});
