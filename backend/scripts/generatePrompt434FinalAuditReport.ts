import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Module2VendorConsolidationEngine } from '../src/services/module2VendorConsolidationEngine';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';
import type { MaterialMappingEntry } from '../src/types/module2MaterialMapping';
import type { CategoryConsolidationProfile } from '../src/types/module2VendorConsolidation';
import { Module2VendorConsolidationExcelBuilder } from '../src/services/module2VendorConsolidationExcelBuilder';

const dictMap = new Map(unspscOfficialDictionary.map((u) => [u.commodityCode, u]));

async function run() {
  console.log('========================================================================');
  console.log('PROMPT 434 — LEVER 3 RECONCILIATION DEFECT & TRACEABILITY AUDIT');
  console.log('========================================================================\n');

  const exportDir = path.resolve(__dirname, '../../artifacts/excel_exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    const isTextile = assessmentId === 'AIC-2026-0002';
    const clientName = isTextile ? 'ABC Textile Ltd' : 'PQR Cement Ltd';

    console.log(`\n########################################################################`);
    console.log(`ASSESSMENT: ${clientName} (${assessmentId})`);
    console.log(`########################################################################`);

    const result = await Module2VendorConsolidationEngine.calculate(assessmentId);
    const cov = result.coverageSummary!;
    const register = result.mappingRegister || [];

    console.log('\n--- 1. OVERALL WORKFLOW CLASSIFICATION COVERAGE WATERFALL ---');
    console.log(`Total Distinct Materials: ${cov.totalMaterialsCount}`);
    console.log(`Total Spend Analysed: ₹${cov.totalSpendCr} Cr (${cov.totalSpendInr.toLocaleString('en-IN')} INR)`);
    console.log(`Workflow Coverage: ${cov.workflowCoveragePct}%`);
    console.log(`------------------------------------------------------------------------`);
    console.log(`Status                    | Count | Material % | Spend (Cr) | Spend % `);
    console.log(`------------------------------------------------------------------------`);
    console.log(`Taxonomy-Verified         | ${String(cov.taxonomyVerifiedCount).padEnd(5)} | ${String(cov.taxonomyVerifiedMaterialPct + '%').padEnd(10)} | ₹${String(cov.taxonomyVerifiedSpendCr.toFixed(4)).padEnd(9)} | ${cov.taxonomyVerifiedSpendPct}%`);
    console.log(`Provisional Classification| ${String(cov.provisionalCount).padEnd(5)} | ${String(cov.provisionalMaterialPct + '%').padEnd(10)} | ₹${String(cov.provisionalSpendCr.toFixed(4)).padEnd(9)} | ${cov.provisionalSpendPct}%`);
    console.log(`Awaiting Review Queue     | ${String(cov.awaitingReviewCount).padEnd(5)} | ${String(cov.awaitingReviewMaterialPct + '%').padEnd(10)} | ₹${String(cov.awaitingReviewSpendCr.toFixed(4)).padEnd(9)} | ${cov.awaitingReviewSpendPct}%`);
    console.log(`Client-Approved Mappings  | ${String(cov.clientApprovedCount ?? 0).padEnd(5)} | ${String((cov.clientApprovedMaterialPct ?? 0) + '%').padEnd(10)} | ₹${String((cov.clientApprovedSpendCr ?? 0).toFixed(4)).padEnd(9)} | ${cov.clientApprovedSpendPct ?? 0}%`);
    console.log(`------------------------------------------------------------------------`);

    // Verified Materials Audit
    const verifiedMaterials = register
      .filter((m: MaterialMappingEntry) => m.reviewStatus === 'TAXONOMY_VERIFIED' || m.reviewStatus === 'CLIENT_APPROVED' || m.reviewStatus === 'APPROVED')
      .sort((a: MaterialMappingEntry, b: MaterialMappingEntry) => b.totalSpendInr - a.totalSpendInr);

    console.log(`\n--- 2. VERIFIED MATERIALS AUDIT (Score >= 95 with Technical Standards / Part Nos) ---`);
    console.log(`Total Verified Materials Found: ${verifiedMaterials.length}`);
    verifiedMaterials.forEach((m: MaterialMappingEntry, idx: number) => {
      const taxon = dictMap.get(m.assignedUnspscCode);
      const officialDesc = taxon ? taxon.commodityTitle : m.assignedUnspscTitle;
      console.log(`[${idx + 1}] ID: ${m.sourceMaterialId.padEnd(15)} | Code: ${m.assignedUnspscCode} | Spend: ₹${m.totalSpendCr.toFixed(4)} Cr | Desc: "${m.sourceDescription}" | Evidence: "${m.evidence}"`);
    });

    // Category Breakdown
    console.log(`\n--- 3. CATEGORY RECONCILIATION FOR DISPLAYED GROUPS ---`);
    console.log(`Total Category Profiles: ${result.categories.length}`);
    console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
    console.log(`Code     | Status                   | Mats | Spend (Cr)  | Category Title`);
    console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
    let sumMats = 0;
    let sumSpendCr = 0;
    result.categories.forEach((cat: CategoryConsolidationProfile) => {
      sumMats += cat.distinctMaterialsCount;
      sumSpendCr += cat.totalSpendCr;
      console.log(`${cat.unspscCode.padEnd(8)} | ${cat.classificationLabel.padEnd(24)} | ${String(cat.distinctMaterialsCount).padStart(4)} | ₹${cat.totalSpendCr.toFixed(4).padStart(10)} | ${cat.unspscCategory}`);
    });
    console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
    console.log(`SUM CATS |                          | ${String(sumMats).padStart(4)} | ₹${sumSpendCr.toFixed(4).padStart(10)}`);
    console.log(`BASE POP |                          | ${String(cov.totalMaterialsCount).padStart(4)} | ₹${cov.totalSpendCr.toFixed(4).padStart(10)}`);
    console.log(`DELTA    |                          | ${String(sumMats - cov.totalMaterialsCount).padStart(4)} | ₹${(sumSpendCr - cov.totalSpendCr).toFixed(4).padStart(10)}`);

    // Generate Excel Workbook
    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const wb = Module2VendorConsolidationExcelBuilder.buildWorkbook(result, canonical.transactions);
    const excelFilename = `Prompt434_${assessmentId}_Vendor_Consolidation.xlsx`;
    const excelPath = path.join(exportDir, excelFilename);
    XLSX.writeFile(wb, excelPath);

    console.log(`\n--- 4. EXCEL WORKBOOK GENERATED & VALIDATED ---`);
    console.log(`File: ${excelPath}`);
    console.log(`Sheet Names (${wb.SheetNames.length}): ${wb.SheetNames.join(', ')}`);

    // Verify 9 sheets
    if (wb.SheetNames.length !== 9) {
      throw new Error(`Expected 9 sheets, got ${wb.SheetNames.length}`);
    }

    // Verify transactions in sheet 8
    const txSheet = wb.Sheets[wb.SheetNames[7]];
    const txRows = XLSX.utils.sheet_to_json(txSheet, { header: 1 }) as any[][];
    // Find row where PO Number header starts
    const headerRowIdx = txRows.findIndex(r => r && r[0] === 'PO Number');
    const dataRows = txRows.slice(headerRowIdx + 1);
    console.log(`Transaction sheet data rows: ${dataRows.length} (Expected: ${canonical.transactions.length})`);
    if (dataRows.length !== canonical.transactions.length) {
      throw new Error(`Transaction count mismatch: got ${dataRows.length}, expected ${canonical.transactions.length}`);
    }

    // Verify category sheet rows
    const catSheet = wb.Sheets[wb.SheetNames[1]];
    const catRows = XLSX.utils.sheet_to_json(catSheet, { header: 1 }) as any[][];
    console.log(`Category sheet rows (including header): ${catRows.length}`);

    // Check for any "Approved Spend" in workbook text
    const wbStr = JSON.stringify(wb);
    if (wbStr.includes('Approved Spend')) {
      throw new Error(`"Approved Spend" found in workbook!`);
    } else {
      console.log(`Zero occurrences of "Approved Spend" confirmed.`);
    }
  }

  console.log('\n========================================================================');
  console.log('AUDIT COMPLETED SUCCESSFULLY: ALL CHECKS PASSED');
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('Fatal error in Prompt 434 audit:', err);
  process.exit(1);
});
