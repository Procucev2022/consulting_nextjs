import * as fs from 'fs';
import * as path from 'path';
import { Module2VendorConsolidationEngine } from '../src/services/module2VendorConsolidationEngine';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { unspscOfficialDictionary } from '../src/data/unspscTaxonomy';
import type { MaterialMappingEntry } from '../src/types/module2MaterialMapping';
import type { CategoryConsolidationProfile } from '../src/types/module2VendorConsolidation';
import { Module2VendorConsolidationExcelBuilder } from '../src/services/module2VendorConsolidationExcelBuilder';

const dictMap = new Map(unspscOfficialDictionary.map((u) => [u.commodityCode, u]));

async function run() {
  console.log('========================================================================');
  console.log('PROMPT 433 — LEVER 3 FINAL CLASSIFICATION & ACCURACY AUDIT EXECUTION');
  console.log('========================================================================\n');

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

    console.log(`\n--- 2. VERIFIED MATERIALS AUDIT (Showing up to 50 highest spend) ---`);
    console.log(`Total Verified Materials Found: ${verifiedMaterials.length}`);
    verifiedMaterials.slice(0, 50).forEach((m: MaterialMappingEntry, idx: number) => {
      const taxon = dictMap.get(m.assignedUnspscCode);
      const officialDesc = taxon ? taxon.commodityTitle : m.assignedUnspscTitle;
      console.log(`\n[${idx + 1}] Material ID: ${m.sourceMaterialId}`);
      console.log(`    Original Description: "${m.sourceDescription}"`);
      console.log(`    Assigned UNSPSC:      ${m.assignedUnspscCode} — ${officialDesc}`);
      console.log(`    Method / Score:       ${m.mappingMethod} (Score: ${m.confidenceScore})`);
      console.log(`    Evidence Used:        "${m.evidence}"`);
      console.log(`    Spend:                ₹${m.totalSpendCr} Cr (${m.totalSpendInr.toLocaleString('en-IN')} INR)`);
    });

    // Category Reconciliation
    console.log(`\n--- 3. CATEGORY RECONCILIATION FOR DISPLAYED UNSPSC GROUPS ---`);
    console.log(`Total Category Profiles: ${result.categories.length}`);
    console.log(`---------------------------------------------------------------------------------------------------------------------------------`);
    console.log(`No | Code     | Level | Materials (Ver / Prov / Rev) | Verified Spend | Prov Spend   | Review Spend | Total Spend  | Title`);
    console.log(`---------------------------------------------------------------------------------------------------------------------------------`);

    const matMap = new Map(register.map((r: MaterialMappingEntry) => [r.sourceMaterialId, r]));
    const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
    const txs = canonical.transactions;

    result.categories.forEach((cat: CategoryConsolidationProfile, idx: number) => {
      // Find txs for this category via mapping
      const catCode = cat.unspscCode;
      const catTxs = txs.filter((t: any) => {
        const mId = (t.material_code ?? '').trim();
        const mapping = matMap.get(mId);
        const code = mapping?.assignedUnspscCode ?? '00000000';
        if (catCode === '00000000') {
          return code === '00000000' || !code;
        }
        return code === catCode;
      });

      // Count materials in this category by status
      const catMatIds = new Set(catTxs.map((t: any) => (t.material_code ?? '').trim()).filter(Boolean));
      let verCount = 0;
      let verSpend = 0;
      let provCount = 0;
      let provSpend = 0;
      let revCount = 0;
      let revSpend = 0;

      for (const mId of catMatIds) {
        const mapping = matMap.get(mId);
        if (!mapping) {
          revCount++;
          continue;
        }
        if (mapping.reviewStatus === 'TAXONOMY_VERIFIED' || mapping.reviewStatus === 'CLIENT_APPROVED' || mapping.reviewStatus === 'APPROVED') {
          verCount++;
          verSpend += mapping.totalSpendInr;
        } else if (mapping.reviewStatus === 'PROVISIONAL') {
          provCount++;
          provSpend += mapping.totalSpendInr;
        } else {
          revCount++;
          revSpend += mapping.totalSpendInr;
        }
      }

      const verCr = (verSpend / 1e7).toFixed(4);
      const provCr = (provSpend / 1e7).toFixed(4);
      const revCr = (revSpend / 1e7).toFixed(4);
      const levelShort = cat.classificationType === 'VERIFIED_UNSPSC' ? 'VERIFIED   ' : cat.classificationType === 'PROVISIONAL_UNSPSC' ? 'PROVISIONAL' : 'SOURCE_GRP ';

      console.log(
        `${String(idx + 1).padStart(2)} | ${cat.unspscCode.padEnd(8)} | ${levelShort} | ${String(catMatIds.size).padStart(3)} (${String(verCount).padStart(2)}/${String(provCount).padStart(3)}/${String(revCount).padStart(3)}) | ₹${verCr.padStart(8)} Cr | ₹${provCr.padStart(8)} Cr | ₹${revCr.padStart(8)} Cr | ₹${cat.totalSpendCr.toFixed(4).padStart(8)} Cr | ${cat.unspscCategory}`
      );
    });

    // Build and verify Excel workbook
    const wb = Module2VendorConsolidationExcelBuilder.buildWorkbook(result, txs);
    const exportDir = path.resolve(process.cwd(), 'artifacts', 'excel_exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
    const filename = `Prompt433_${assessmentId}_Vendor_Consolidation.xlsx`;
    const exportPath = path.join(exportDir, filename);
    const XLSX = require('xlsx');
    XLSX.writeFile(wb, exportPath);
    console.log(`\n--- 4. EXCEL EXPORT GENERATED & VERIFIED ---`);
    console.log(`Saved workbook to: ${exportPath}`);
    console.log(`Sheets in workbook: ${wb.SheetNames.join(', ')}`);
  }
}

run().catch(console.error);
