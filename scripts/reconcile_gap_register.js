const fs = require('fs');

const csvPath = 'C:/Users/srini/.gemini/antigravity-ide/brain/4a3e26bc-2f19-4999-85df-0757d158192a/scratch/test_export.csv';
const csv = fs.readFileSync(csvPath, 'utf8');

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const lines = csv.trim().split('\n');
const header = parseCSVLine(lines[0]);

let sumCr = 0;
let sumInr = 0;
let sumTxs = 0;
const statusBreakdown = {};

for (let i = 1; i < lines.length; i++) {
  const row = parseCSVLine(lines[i]);
  const code = row[0];
  const desc = row[1];
  const spendCr = parseFloat(row[5]);
  const spendInr = parseFloat(row[6]);
  const txs = parseInt(row[7], 10);
  const status = row[15];

  sumCr += spendCr;
  sumInr += spendInr;
  sumTxs += txs;

  if (!statusBreakdown[status]) {
    statusBreakdown[status] = { count: 0, txs: 0, spendCr: 0, spendInr: 0, items: [] };
  }
  statusBreakdown[status].count++;
  statusBreakdown[status].txs += txs;
  statusBreakdown[status].spendCr += spendCr;
  statusBreakdown[status].spendInr += spendInr;
  statusBreakdown[status].items.push({ code, desc, spendCr, txs });
}

console.log('--- CSV TOTALS ---');
console.log('Row count:', lines.length - 1);
console.log('Sum Spend Cr:', sumCr.toFixed(7));
console.log('Sum Spend Inr:', sumInr.toFixed(2));
console.log('Sum Transactions:', sumTxs);
console.log('\n--- STATUS BREAKDOWN IN CSV ---');
for (const [st, val] of Object.entries(statusBreakdown)) {
  console.log(`${st} => rows: ${val.count}, txs: ${val.txs}, spendCr: ${val.spendCr.toFixed(4)}`);
}

// Compare with Authoritative Borosil Baseline
const AUTHORITATIVE_SPEND_CR = 556.5346426;
const AUTHORITATIVE_SPEND_INR = 5565346426.19;
const AUTHORITATIVE_TXS = 27777;

console.log('\n--- VARIANCE VS AUTHORITATIVE BASELINE ---');
console.log('Spend Cr Diff (Baseline - CSV):', (AUTHORITATIVE_SPEND_CR - sumCr).toFixed(7));
console.log('Spend Inr Diff (Baseline - CSV):', (AUTHORITATIVE_SPEND_INR - sumInr).toFixed(2));
console.log('Txs Diff (Baseline - CSV):', AUTHORITATIVE_TXS - sumTxs);
