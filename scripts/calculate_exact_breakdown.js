const fs = require('fs');
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

const all = [...extractItems(p1), ...extractItems(p2)];
const materialItems = all.filter(it => it.id !== 'GAP-BOR-023');
console.log('Material items count:', materialItems.length);

let totalInr = 0;
let totalCr = 0;
let totalTxs = 0;

const byStatus = {};

materialItems.forEach(it => {
  totalInr += it.spendInr;
  totalCr += it.spendCr;
  totalTxs += it.txs;

  if (!byStatus[it.status]) {
    byStatus[it.status] = { count: 0, txs: 0, spendCr: 0, spendInr: 0, items: [] };
  }
  byStatus[it.status].count++;
  byStatus[it.status].txs += it.txs;
  byStatus[it.status].spendCr += it.spendCr;
  byStatus[it.status].spendInr += it.spendInr;
  byStatus[it.status].items.push(it);
});

console.log('Total Spend INR:', totalInr.toFixed(2));
console.log('Total Spend Cr (from Inr):', (totalInr / 10000000).toFixed(7));
console.log('Total Spend Cr (from spendCr):', totalCr.toFixed(7));
console.log('Total Txs:', totalTxs);

console.log('\nBy Status (from individual rows):');
for (const [st, val] of Object.entries(byStatus)) {
  console.log(st, '=> items:', val.count, ', txs:', val.txs, ', spendInr:', val.spendInr.toFixed(2), ', spendCr:', (val.spendInr / 10000000).toFixed(4));
}

const AUTHORITATIVE_INR = 5565346426.19;
console.log('\nAuthoritative Borosil Baseline:', AUTHORITATIVE_INR);
console.log('Difference (Authoritative - Rows):', (AUTHORITATIVE_INR - totalInr).toFixed(2), 'INR');
console.log('Difference in Cr:', ((AUTHORITATIVE_INR - totalInr) / 10000000).toFixed(7), 'Cr');
