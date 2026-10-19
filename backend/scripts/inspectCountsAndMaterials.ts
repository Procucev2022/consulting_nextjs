import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../src/services/module2MaterialMappingRegister';

async function run() {
  console.log('=== RUNNING AUDIT ===');
  for (const id of ['AIC-2026-0002', 'AIC-2026-0003']) {
    console.log(`\n=================== ${id} ===================`);
    const canonical = await Module2CanonicalService.getCanonicalInput(id);
    const txs = canonical.transactions;
    console.log(`Canonical txs count: ${txs.length}`);
    const spendInr = txs.reduce((s, t) => s + (t.total_spend_inr ?? 0), 0);
    console.log(`Canonical spend INR: ${spendInr} (₹${(spendInr / 1e7).toFixed(4)} Cr)`);

    // Check uploads
    const uploadDir = path.resolve(process.cwd(), '..', 'data', 'dev', 'assessments', id, 'uploads');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const f of files) {
        if (f.endsWith('.xlsx') || f.endsWith('.csv')) {
          const fp = path.join(uploadDir, f);
          const wb = XLSX.readFile(fp);
          for (const s of wb.SheetNames) {
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { raw: true, defval: '' });
            console.log(`Upload file ${f}, sheet ${s}: ${rows.length} rows`);
          }
        }
      }
    }

    // Material mapping coverage
    const { coverage, register, exceptions } = Module2MaterialMappingRegister.classifyMaterials(txs);
    console.log('--- Material Coverage ---');
    console.log(`Total Materials: ${coverage.totalMaterialsCount}, Total Spend Cr: ${coverage.totalSpendCr}`);
    console.log(`Approved: ${coverage.approvedCount} (${coverage.approvedMaterialPct}%), Spend Cr: ${coverage.approvedSpendCr} (${coverage.approvedSpendPct}%)`);
    console.log(`Provisional: ${coverage.provisionalCount} (${coverage.provisionalMaterialPct}%), Spend Cr: ${coverage.provisionalSpendCr} (${coverage.provisionalSpendPct}%)`);
    console.log(`Awaiting Review: ${coverage.awaitingReviewCount} (${coverage.awaitingReviewMaterialPct}%), Spend Cr: ${coverage.awaitingReviewSpendCr} (${coverage.awaitingReviewSpendPct}%)`);

    // Show top 15 unresolved materials by spend
    const sortedExceptions = [...exceptions].sort((a, b) => b.totalSpendInr - a.totalSpendInr);
    console.log('--- Top 15 Unresolved Materials ---');
    for (const ex of sortedExceptions.slice(0, 15)) {
      console.log(`Mat: ${ex.sourceMaterialId} | Desc: "${ex.sourceDescription}" | Cat: "${ex.sourceCategory}" | Spend Cr: ${ex.totalSpendCr} | Txs: ${ex.transactionCount} | Supps: ${ex.qualifyingSuppliersCount}`);
    }
  }
}

run().catch(console.error);
