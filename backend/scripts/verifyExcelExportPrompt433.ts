import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

function verifyWorkbook(filePath: string, assessmentId: string, expectedSpendCr: number) {
  console.log(`\n========================================================================`);
  console.log(`VERIFYING EXCEL WORKBOOK: ${path.basename(filePath)}`);
  console.log(`========================================================================`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Workbook not found at ${filePath}`);
  }

  const wb = XLSX.readFile(filePath);
  console.log(`Total Sheets: ${wb.SheetNames.length}`);
  console.log(`Sheet Names: ${wb.SheetNames.join(', ')}`);

  // 1. Executive Summary
  const execSheet = wb.Sheets['1. Executive Summary'];
  const execRows: any[][] = XLSX.utils.sheet_to_json(execSheet, { header: 1 });
  console.log('\n--- Sheet 1: Executive Summary Rows (First 15) ---');
  execRows.slice(0, 15).forEach((r, i) => console.log(`Row ${i + 1}: ${JSON.stringify(r)}`));

  // Check Terminology in Executive Summary:
  const execText = JSON.stringify(execRows);
  const hasTaxonomyVerified = execText.includes('Taxonomy-Verified UNSPSC Mappings');
  const hasProvisional = execText.includes('Provisional Classification Mappings');
  const hasAwaitingReview = execText.includes('Awaiting Review Queue');
  const hasClientApproved = execText.includes('Client-Approved Mappings');
  const hasApprovedSpend = execText.includes('Approved Spend'); // should NOT have "Approved Spend" without client sign-off

  console.log(`\nTerminology Checks:`);
  console.log(`  - "Taxonomy-Verified UNSPSC Mappings": ${hasTaxonomyVerified}`);
  console.log(`  - "Provisional Classification Mappings": ${hasProvisional}`);
  console.log(`  - "Awaiting Review Queue": ${hasAwaitingReview}`);
  console.log(`  - "Client-Approved Mappings": ${hasClientApproved}`);
  console.log(`  - Contains unauthorized "Approved Spend": ${hasApprovedSpend}`);

  // 2. UNSPSC Category Analysis
  const catSheet = wb.Sheets['2. UNSPSC Category Analysis'];
  const catRows: any[][] = XLSX.utils.sheet_to_json(catSheet, { header: 1 });
  console.log(`\n--- Sheet 2: UNSPSC Category Analysis (${catRows.length - 1} categories) ---`);
  let totalCatSpendCr = 0;
  for (let i = 1; i < catRows.length; i++) {
    totalCatSpendCr += Number(catRows[i][4] || 0); // Total Spend (Cr)
  }
  totalCatSpendCr = Math.round(totalCatSpendCr * 10000) / 10000;
  console.log(`Category Sheet Total Spend: ₹${totalCatSpendCr} Cr (Expected ~₹${expectedSpendCr} Cr, Match: ${totalCatSpendCr === expectedSpendCr})`);

  // 3. Transactions Audit Trail
  const txSheet = wb.Sheets['8. Purchase Transactions'];
  const txRows: any[][] = XLSX.utils.sheet_to_json(txSheet, { header: 1 });
  // Notice rows 1 is notice, 2 is empty, 3 is headers, data starts row 4
  const txDataRows = txRows.slice(3);
  let totalTxSpendInr = 0;
  for (const r of txDataRows) {
    totalTxSpendInr += Number(r[12] || 0); // Line Spend (INR)
  }
  const totalTxSpendCr = Math.round((totalTxSpendInr / 1e7) * 10000) / 10000;
  console.log(`\n--- Sheet 8: Purchase Transactions Audit Trail ---`);
  console.log(`Transaction Data Rows Count: ${txDataRows.length}`);
  console.log(`Transaction Total Spend: ₹${totalTxSpendCr} Cr (Reconciles 100%: ${totalTxSpendCr === expectedSpendCr})`);

  // 4. Mapping Exceptions Queue
  const exSheet = wb.Sheets['7. Mapping Exceptions Queue'];
  const exRows: any[][] = XLSX.utils.sheet_to_json(exSheet, { header: 1 });
  console.log(`\n--- Sheet 7: Mapping Exceptions Queue ---`);
  console.log(`Pending Review Items Count: ${exRows.length - 1}`);
}

async function main() {
  const exportDir = path.resolve(process.cwd(), 'artifacts', 'excel_exports');
  verifyWorkbook(path.join(exportDir, 'Prompt433_AIC-2026-0002_Vendor_Consolidation.xlsx'), 'AIC-2026-0002', 613.8805);
  verifyWorkbook(path.join(exportDir, 'Prompt433_AIC-2026-0003_Vendor_Consolidation.xlsx'), 'AIC-2026-0003', 262.6412);
}

main().catch(console.error);
