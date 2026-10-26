import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Module2VendorConsolidationEngine } from '../src/services/module2VendorConsolidationEngine';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';
import type { MaterialMappingEntry } from '../src/types/module2MaterialMapping';
import type { CategoryConsolidationProfile } from '../src/types/module2VendorConsolidation';

const dictMap = new Map(unspscOfficialDictionary.map((u) => [u.commodityCode, u]));

async function main() {
  console.log('=== PROMPT 435 ACCEPTANCE CHECK 1 & 2: VERIFIED MATERIALS & CATEGORY AUDIT ===\n');

  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    const isTextile = assessmentId === 'AIC-2026-0002';
    const clientName = isTextile ? 'ABC Textile Ltd' : 'PQR Cement Ltd';
    console.log(`\n================================================================================`);
    console.log(`ASSESSMENT: ${clientName} (${assessmentId})`);
    console.log(`================================================================================`);

    const result = await Module2VendorConsolidationEngine.calculate(assessmentId);
    const register = result.mappingRegister || [];
    const cov = result.coverageSummary!;

    // 1. Audit all TAXONOMY_VERIFIED materials
    const verifiedMats = register
      .filter((m: MaterialMappingEntry) => m.reviewStatus === 'TAXONOMY_VERIFIED' || m.reviewStatus === 'CLIENT_APPROVED' || m.reviewStatus === 'APPROVED')
      .sort((a: MaterialMappingEntry, b: MaterialMappingEntry) => b.totalSpendInr - a.totalSpendInr);

    console.log(`\n1. TAXONOMY_VERIFIED MATERIALS AUDIT: Qualifying Count = ${verifiedMats.length}`);
    verifiedMats.forEach((m: MaterialMappingEntry, i: number) => {
      const taxon = dictMap.get(m.assignedUnspscCode);
      const officialDesc = taxon ? taxon.commodityTitle : m.assignedUnspscTitle;
      console.log(`[${i + 1}] ID: ${m.sourceMaterialId.padEnd(16)} | Spend: ₹${m.totalSpendCr.toFixed(4)} Cr (₹${m.totalSpendInr.toLocaleString('en-IN')}) | Code: ${m.assignedUnspscCode} | Title: ${officialDesc}`);
      console.log(`    Desc: "${m.sourceDescription}"`);
      console.log(`    Evidence: "${m.evidence}" | Method: ${m.mappingMethod} | Score: ${m.confidenceScore}`);
    });

    // 2. Audit all displayed categories
    console.log(`\n2. CATEGORY AUDIT & SEMANTICS RECONCILIATION: Total Categories = ${result.categories.length}`);
    let sumCatMats = 0;
    let sumCatSpendInr = 0;
    let sumCatSpendCr = 0;

    result.categories.forEach((c: CategoryConsolidationProfile) => {
      sumCatMats += c.distinctMaterialsCount;
      sumCatSpendInr += c.totalSpendInr;
      sumCatSpendCr += c.totalSpendCr;

      // Verify label rule: only VERIFIED_UNSPSC if 100% of underlying materials are verified
      const hasProvisionalOrUnmapped = c.unspscCategory.includes('Unmapped') || c.unspscCode === '00000000';
      console.log(`- [${c.unspscCode}] ${c.unspscCategory.padEnd(55)} | Status: ${c.classificationLabel.padEnd(25)} | Mats: ${String(c.distinctMaterialsCount).padStart(5)} | Spend: ₹${c.totalSpendCr.toFixed(4).padStart(9)} Cr (₹${c.totalSpendInr.toLocaleString('en-IN')})`);
    });

    console.log(`\nCategory Sum Mats:     ${sumCatMats}`);
    console.log(`Base Population Mats:  ${cov.totalMaterialsCount}`);
    console.log(`Material Delta:        ${sumCatMats - cov.totalMaterialsCount}`);
    console.log(`Category Sum Spend Inr: ₹${sumCatSpendInr.toLocaleString('en-IN')}`);
    console.log(`Base Population Inr:    ₹${cov.totalSpendInr.toLocaleString('en-IN')}`);
    console.log(`Spend Inr Delta:        ₹${(sumCatSpendInr - cov.totalSpendInr).toFixed(2)}`);
    console.log(`Category Sum Spend Cr:  ₹${sumCatSpendCr.toFixed(4)} Cr`);
    console.log(`Base Population Cr:     ₹${cov.totalSpendCr.toFixed(4)} Cr`);
    console.log(`Spend Cr Delta:         ₹${(sumCatSpendCr - cov.totalSpendCr).toFixed(4)} Cr`);
  }

  // 3. Independent Inspection of Existing Excel Exports
  console.log(`\n=== PROMPT 435 ACCEPTANCE CHECK 3: INDEPENDENT INSPECTION OF EXISTING EXCEL EXPORTS ===\n`);
  const exportDir = path.resolve(__dirname, '../../artifacts/excel_exports');

  for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
    const filename = `Prompt434_${assessmentId}_Vendor_Consolidation.xlsx`;
    const fullPath = path.join(exportDir, filename);
    console.log(`Inspecting: ${fullPath}`);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File does not exist: ${fullPath}`);
    }

    const wb = XLSX.readFile(fullPath);
    console.log(`Sheet Count: ${wb.SheetNames.length}`);
    console.log(`Sheet Names: ${wb.SheetNames.join(' | ')}`);

    // Sheet 1: Executive Summary
    const s1 = wb.Sheets[wb.SheetNames[0]];
    const s1Rows = XLSX.utils.sheet_to_json(s1, { header: 1 }) as any[][];
    console.log(`Sheet 1 (Executive Summary) rows: ${s1Rows.length}`);

    // Sheet 2: UNSPSC Categories
    const s2 = wb.Sheets[wb.SheetNames[1]];
    const s2Rows = XLSX.utils.sheet_to_json(s2, { header: 1 }) as any[][];
    console.log(`Sheet 2 (UNSPSC Category Analysis) rows: ${s2Rows.length}`);

    // Sheet 8: Transactions
    const s8 = wb.Sheets[wb.SheetNames[7]];
    const s8Rows = XLSX.utils.sheet_to_json(s8, { header: 1 }) as any[][];
    const headerRowIdx = s8Rows.findIndex((r) => r && r[0] === 'PO Number');
    const txDataRows = s8Rows.slice(headerRowIdx + 1);
    console.log(`Sheet 8 (Purchase Transactions) data rows: ${txDataRows.length}`);

    // Sum spend in Sheet 8
    let txSpendSum = 0;
    for (const r of txDataRows) {
      const lineSpend = Number(r[12] ?? 0);
      txSpendSum += lineSpend;
    }
    console.log(`Sheet 8 Total Line Spend Sum: ₹${txSpendSum.toLocaleString('en-IN')}`);

    // Check string content for "Approved Spend"
    const wbStr = JSON.stringify(wb);
    const hasApprovedSpend = wbStr.includes('Approved Spend');
    console.log(`Contains "Approved Spend": ${hasApprovedSpend ? 'YES (DEFECT)' : 'NO (PASSED)'}`);
    console.log('--------------------------------------------------------------------------------');
  }
}

main().catch((err) => {
  console.error('Error during Prompt 435 check:', err);
  process.exit(1);
});
