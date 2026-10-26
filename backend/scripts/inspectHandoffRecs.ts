import * as fs from 'fs';
import * as path from 'path';

const handoffPath = path.resolve('MODULE_1_CERTIFIED_HANDOFF.json');
const handoff = JSON.parse(fs.readFileSync(handoffPath, 'utf-8'));
const recs: any[] = handoff.handoffRecords;
console.log('Total recs in handoff:', recs.length);

// Find where REC-23573 is
const idx23573 = recs.findIndex(r => r.sourceRowId === 'REC-23573');
console.log('Index of REC-23573:', idx23573);
if (idx23573 >= 0) {
  console.log('Recs around REC-23573:');
  for (let i = Math.max(0, idx23573 - 5); i <= Math.min(recs.length - 1, idx23573 + 5); i++) {
    console.log(`[${i}]`, recs[i].sourceRowId, recs[i].po, recs[i].lineItem, recs[i].supplierName, recs[i].itemDescription, recs[i].lineSpendInr);
  }
}

// Find where REC-19673 is
const idx19673 = recs.findIndex(r => r.sourceRowId === 'REC-19673');
console.log('Index of REC-19673:', idx19673);
if (idx19673 >= 0) {
  console.log('Recs around REC-19673:');
  for (let i = Math.max(0, idx19673 - 5); i <= Math.min(recs.length - 1, idx19673 + 5); i++) {
    console.log(`[${i}]`, recs[i].sourceRowId, recs[i].po, recs[i].lineItem, recs[i].supplierName, recs[i].itemDescription, recs[i].lineSpendInr);
  }
}
