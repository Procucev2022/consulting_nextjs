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
const catalogItems = all.filter(it => it.id !== 'GAP-BOR-022' && it.id !== 'GAP-BOR-023');

let sumCatalogInr = 0;
let sumCatalogCr = 0;
let sumCatalogTxs = 0;

catalogItems.forEach(it => {
  sumCatalogInr += it.spendInr;
  sumCatalogCr += it.spendCr;
  sumCatalogTxs += it.txs;
});

console.log('Catalog Items count (GAP-BOR-001 to 021):', catalogItems.length);
console.log('Catalog Spend Inr:', sumCatalogInr.toFixed(2));
console.log('Catalog Spend Cr:', (sumCatalogInr / 10000000).toFixed(7));
console.log('Catalog Transactions:', sumCatalogTxs);

const AUTHORITATIVE_INR = 5565346426.19;
const AUTHORITATIVE_TXS = 27777;

const requiredMroInr = AUTHORITATIVE_INR - sumCatalogInr;
const requiredMroCr = requiredMroInr / 10000000;
const requiredMroTxs = AUTHORITATIVE_TXS - sumCatalogTxs;

console.log('\n--- EXACT REQUIRED MRO ROW ---');
console.log('Required MRO Spend Inr:', requiredMroInr.toFixed(2));
console.log('Required MRO Spend Cr:', requiredMroCr.toFixed(7));
console.log('Required MRO Txs:', requiredMroTxs);
console.log('Existing GAP-BOR-022 spendInr:', 4042058726.19);
console.log('Difference (Required - Existing GAP-BOR-022):', (requiredMroInr - 4042058726.19).toFixed(2));
