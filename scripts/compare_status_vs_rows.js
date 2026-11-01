const fs = require('fs');

const p1 = fs.readFileSync('backend/src/constants/module3PcbiGapListItems.ts', 'utf8');
const p2 = fs.readFileSync('backend/src/constants/module3PcbiGapListItemsPart2.ts', 'utf8');
const pSum = fs.readFileSync('backend/src/constants/module3PcbiGapList.ts', 'utf8');

// Extract items by regex
function extractItems(content) {
  const items = [];
  const regex = /\{[\s\S]*?id:\s*'([^']+)'[\s\S]*?materialCode:\s*([^\n,]+)[\s\S]*?materialDescription:\s*'([^']+)'[\s\S]*?customerSpendCr:\s*([0-9.]+)[\s\S]*?customerSpendInr:\s*([0-9.]+)[\s\S]*?transactionCount:\s*([0-9]+)[\s\S]*?gapStatus:\s*'([^']+)'[\s\S]*?\}/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    items.push({
      id: m[1],
      materialCode: m[2].replace(/['"]/g, '').trim(),
      materialDescription: m[3],
      customerSpendCr: parseFloat(m[4]),
      customerSpendInr: parseFloat(m[5]),
      transactionCount: parseInt(m[6], 10),
      gapStatus: m[7]
    });
  }
  return items;
}

const items1 = extractItems(p1);
const items2 = extractItems(p2);
const allItems = [...items1, ...items2];

console.log('Total items parsed:', allItems.length);

const summaryRows = {};
allItems.forEach((it) => {
  if (!summaryRows[it.gapStatus]) {
    summaryRows[it.gapStatus] = { count: 0, txs: 0, spendCr: 0, spendInr: 0, items: [] };
  }
  summaryRows[it.gapStatus].count++;
  summaryRows[it.gapStatus].txs += it.transactionCount;
  summaryRows[it.gapStatus].spendCr += it.customerSpendCr;
  summaryRows[it.gapStatus].spendInr += it.customerSpendInr;
  summaryRows[it.gapStatus].items.push(it);
});

console.log('\n--- STATUS IN module3PcbiGapList.ts (BOROSIL_GAP_STATUS_SUMMARIES) ---');
console.log('Status | Summaries Count | Rows Count | Summaries Txs | Rows Txs | Summaries SpendCr | Rows SpendCr');

const statusSummaryMap = {
  'VERIFIED OBSERVATIONS AVAILABLE': { count: 0, txs: 0, spendCr: 0.0 },
  'BENCHMARK DEFINED — OBSERVATIONS MISSING': { count: 2, txs: 10, spendCr: 22.3307 },
  'SOURCE IDENTIFIED — DATA NOT ACQUIRED': { count: 6, txs: 59, spendCr: 79.1808 },
  'LICENSE REQUIRED': { count: 4, txs: 16, spendCr: 4.2376 },
  'MAPPING / SPECIFICATION REVIEW REQUIRED': { count: 3, txs: 28, spendCr: 39.0219 },
  'STALE DATA': { count: 0, txs: 0, spendCr: 0.0 },
  'NO SUITABLE BENCHMARK IDENTIFIED': { count: 5, txs: 6, spendCr: 7.5572 },
  'UNMAPPED — RESEARCH REQUIRED': { count: 8956, txs: 27658, spendCr: 404.2064 }
};

for (const [st, sumDef] of Object.entries(statusSummaryMap)) {
  const rowAgg = summaryRows[st] || { count: 0, txs: 0, spendCr: 0 };
  console.log(`${st}:
    Count:   Summary = ${sumDef.count}, Rows = ${rowAgg.count} (diff: ${sumDef.count - rowAgg.count})
    Txs:     Summary = ${sumDef.txs}, Rows = ${rowAgg.txs} (diff: ${sumDef.txs - rowAgg.txs})
    SpendCr: Summary = ${sumDef.spendCr.toFixed(4)}, Rows = ${rowAgg.spendCr.toFixed(4)} (diff: ${(sumDef.spendCr - rowAgg.spendCr).toFixed(7)})`);
}
