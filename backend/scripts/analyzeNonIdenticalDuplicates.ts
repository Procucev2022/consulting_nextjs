import * as path from 'path';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { buildTransactionSignature } from '../src/services/module2AttributionHelpers';

async function analyzeNonIdenticalDuplicates() {
  const canonical = await Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
  const rawPath = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/data/dev/assessments/AIC-2026-0002/uploads/Textile1.xlsx');
  const wb = XLSX.readFile(rawPath);
  const sheetName = wb.SheetNames[0];
  const rawRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { raw: true, defval: '' });

  const signatureMap = new Map<string, number[]>();
  for (let i = 0; i < canonical.transactions.length; i++) {
    const t = canonical.transactions[i];
    const sig = buildTransactionSignature(t);
    const indices = signatureMap.get(sig) || [];
    indices.push(i);
    signatureMap.set(sig, indices);
  }

  const diffFieldCounts: Record<string, number> = {};
  const diffExamples: any[] = [];

  for (const [sig, indices] of signatureMap.entries()) {
    if (indices.length > 1) {
      const firstRow = rawRows[indices[0]];
      for (let k = 1; k < indices.length; k++) {
        const curRow = rawRows[indices[k]];
        const diffCols: string[] = [];
        for (const key of Object.keys(firstRow)) {
          if (String(firstRow[key]).trim() !== String(curRow[key]).trim()) {
            diffCols.push(key);
            diffFieldCounts[key] = (diffFieldCounts[key] || 0) + 1;
          }
        }
        if (diffCols.length > 0) {
          diffExamples.push({
            sig,
            rowA: indices[0] + 2,
            rowB: indices[k] + 2,
            po: firstRow['Purch.Doc.'],
            itemA: firstRow['Item'],
            itemB: curRow['Item'],
            mat: firstRow['Material'],
            diffCols,
            firstValues: diffCols.map(c => `${c}='${firstRow[c]}'`),
            curValues: diffCols.map(c => `${c}='${curRow[c]}'`)
          });
        }
      }
    }
  }

  console.log('--- ANALYSIS OF THE 374 NON-IDENTICAL REPEATED SIGNATURE ROWS ---');
  console.log('Total non-identical repeated rows:', diffExamples.length);
  console.log('Differing columns frequency:');
  for (const [col, cnt] of Object.entries(diffFieldCounts)) {
    console.log(`  - "${col}": ${cnt} rows`);
  }

  console.log('\n--- 10 REPRESENTATIVE EXAMPLES OF DIFFERING ROWS ---');
  for (let i = 0; i < Math.min(10, diffExamples.length); i++) {
    const ex = diffExamples[i];
    console.log(`\nExample #${i + 1}: PO ${ex.po}, Material ${ex.mat}`);
    console.log(`  Row ${ex.rowA} vs Row ${ex.rowB}`);
    console.log(`  Row ${ex.rowA} Item: ${ex.itemA}, Row ${ex.rowB} Item: ${ex.itemB}`);
    console.log(`  Differing fields: ${ex.diffCols.join(', ')}`);
    console.log(`  Row ${ex.rowA} values: ${ex.firstValues.join('; ')}`);
    console.log(`  Row ${ex.rowB} values: ${ex.curValues.join('; ')}`);
  }
}

analyzeNonIdenticalDuplicates().catch(console.error);
