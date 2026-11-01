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

console.log('--- INDIVIDUAL MATERIAL ITEMS (1 to 21) ---');
materialItems.filter(it => it.id !== 'GAP-BOR-022').forEach(it => {
  console.log(`${it.id} | ${it.code.padEnd(20)} | Inr: ${it.spendInr.toString().padStart(12)} | Cr: ${it.spendCr.toFixed(4).padStart(9)} | Txs: ${it.txs.toString().padStart(3)} | ${it.status}`);
});

const AUTHORITATIVE_INR = 5565346426.19;
const AUTHORITATIVE_TXS = 27777;

let sum1to21Inr = 0;
let sum1to21Txs = 0;
materialItems.filter(it => it.id !== 'GAP-BOR-022').forEach(it => {
  sum1to21Inr += it.spendInr;
  sum1to21Txs += it.txs;
});

console.log('\n--- SUM OF 21 INDIVIDUAL ITEMS ---');
console.log('Spend INR:', sum1to21Inr.toFixed(2));
console.log('Spend Cr:', (sum1to21Inr / 10000000).toFixed(7));
console.log('Transactions:', sum1to21Txs);

const exactMroInr = AUTHORITATIVE_INR - sum1to21Inr;
const exactMroTxs = AUTHORITATIVE_TXS - sum1to21Txs;

console.log('\n--- EXACT MRO ROW TO RECONCILE 100% ---');
console.log('Exact MRO Spend INR:', exactMroInr.toFixed(2));
console.log('Exact MRO Spend Cr:', (exactMroInr / 10000000).toFixed(7));
console.log('Exact MRO Transactions:', exactMroTxs);
