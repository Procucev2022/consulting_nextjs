import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { AssessmentStore } from '../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../src/services/module2CanonicalService';
import { buildTransactionSignature } from '../src/services/module2AttributionHelpers';
import { Module2DirectPriceImprovementEngine } from '../src/services/module2DirectPriceImprovementEngine';
import type { StrategicInputTransaction } from '../src/types/strategicSourcing';

export interface ExcludedTxRecord {
  id: string;
  poNumber: string;
  poLine: string;
  poDate: string;
  vendorName: string;
  vendorCode: string;
  materialDesc: string;
  materialCode: string;
  spendCategory: string;
  quantity: number;
  unitPrice: number;
  totalSpendInr: number;
  totalSpendCr: number;
  primaryExclusionReason: string;
  exclusionDetails: string;
}

async function reconcileCustomer(assessmentId: string, customerName: string) {
  console.log(`\n======================================================`);
  console.log(`RECONCILING LEVER 1 EXCLUSIONS FOR: ${customerName} (${assessmentId})`);
  console.log(`======================================================`);

  const canonical = await Module2CanonicalService.getCanonicalInput(assessmentId);
  const totalTxCount = canonical.transactions.length;
  const totalSpendInr = canonical.transactions.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0);
  const totalSpendCr = Number((totalSpendInr / 10000000).toFixed(4));

  console.log(`Total Source Transactions: ${totalTxCount}`);
  console.log(`Total Source Spend: ₹${totalSpendCr} Cr (₹${totalSpendInr.toLocaleString('en-IN')})`);

  // Buckets for mutually exclusive categorization
  const seenSignatures = new Set<string>();
  const excludedRecords: ExcludedTxRecord[] = [];
  const eligibleRecords: StrategicInputTransaction[] = [];

  const bucketStats: Record<string, { count: number; spendInr: number; sampleTxs: StrategicInputTransaction[] }> = {
    DUPLICATE_TRANSACTION: { count: 0, spendInr: 0, sampleTxs: [] },
    MISSING_OR_UNKNOWN_MATERIAL_CODE: { count: 0, spendInr: 0, sampleTxs: [] },
    NON_POSITIVE_QUANTITY: { count: 0, spendInr: 0, sampleTxs: [] },
    NON_POSITIVE_UNIT_PRICE: { count: 0, spendInr: 0, sampleTxs: [] },
    NON_POSITIVE_TOTAL_SPEND: { count: 0, spendInr: 0, sampleTxs: [] }
  };

  for (const t of canonical.transactions) {
    const sig = buildTransactionSignature(t);
    const isDuplicate = seenSignatures.has(sig);
    seenSignatures.add(sig);

    const spend = t.total_spend_inr || 0;
    const qty = t.quantity || 0;
    const price = t.unit_price || 0;
    const mat = (t.material_code || '').trim();

    let isEligible = true;
    let reason = '';
    let details = '';

    if (isDuplicate) {
      isEligible = false;
      reason = 'DUPLICATE_TRANSACTION';
      details = `Duplicate transaction signature: ${sig}`;
    } else if (!mat || mat === 'UNKNOWN_MAT') {
      isEligible = false;
      reason = 'MISSING_OR_UNKNOWN_MATERIAL_CODE';
      details = `Material code is blank, null or UNKNOWN_MAT (desc: "${t.material_desc || ''}")`;
    } else if (qty <= 0) {
      isEligible = false;
      reason = 'NON_POSITIVE_QUANTITY';
      details = `Quantity is <= 0 (qty: ${qty}, price: ${price}, spend: ${spend})`;
    } else if (price <= 0) {
      isEligible = false;
      reason = 'NON_POSITIVE_UNIT_PRICE';
      details = `Unit price is <= 0 (qty: ${qty}, price: ${price}, spend: ${spend})`;
    } else if (spend <= 0) {
      isEligible = false;
      reason = 'NON_POSITIVE_TOTAL_SPEND';
      details = `Total spend is <= 0 (qty: ${qty}, price: ${price}, spend: ${spend})`;
    }

    if (!isEligible) {
      bucketStats[reason].count++;
      bucketStats[reason].spendInr += spend;
      if (bucketStats[reason].sampleTxs.length < 3) {
        bucketStats[reason].sampleTxs.push(t);
      }

      excludedRecords.push({
        id: t.id || '',
        poNumber: t.po_number || 'N/A',
        poLine: t.po_line || 'N/A',
        poDate: t.po_date || 'N/A',
        vendorName: t.vendor_name || 'N/A',
        vendorCode: t.vendor_code || 'N/A',
        materialDesc: t.material_desc || 'N/A',
        materialCode: t.material_code || 'N/A',
        spendCategory: t.spend_category || 'General',
        quantity: qty,
        unitPrice: price,
        totalSpendInr: Math.round(spend * 100) / 100,
        totalSpendCr: Number((spend / 10000000).toFixed(6)),
        primaryExclusionReason: reason,
        exclusionDetails: details
      });
    } else {
      eligibleRecords.push(t);
    }
  }

  const totalExcludedCount = excludedRecords.length;
  const totalExcludedSpendInr = excludedRecords.reduce((sum, r) => sum + r.totalSpendInr, 0);
  const totalExcludedSpendCr = Number((totalExcludedSpendInr / 10000000).toFixed(4));

  const totalEligibleCount = eligibleRecords.length;
  const totalEligibleSpendInr = eligibleRecords.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0);
  const totalEligibleSpendCr = Number((totalEligibleSpendInr / 10000000).toFixed(4));

  console.log(`\n--- MUTUALLY EXCLUSIVE EXCLUSION BUCKETS ---`);
  let bucketSumCount = 0;
  let bucketSumSpendInr = 0;

  for (const [bucket, stat] of Object.entries(bucketStats)) {
    const spendCr = Number((stat.spendInr / 10000000).toFixed(4));
    bucketSumCount += stat.count;
    bucketSumSpendInr += stat.spendInr;
    console.log(`- ${bucket}:`);
    console.log(`    Count: ${stat.count} (${((stat.count / totalTxCount) * 100).toFixed(2)}%)`);
    console.log(`    Spend: ₹${spendCr} Cr (₹${Math.round(stat.spendInr).toLocaleString('en-IN')})`);
    if (stat.sampleTxs.length > 0) {
      console.log(`    Sample Source Records:`);
      for (const s of stat.sampleTxs) {
        console.log(`      * PO: ${s.po_number || 'N/A'} (${s.po_date || 'N/A'}), Vendor: ${s.vendor_name || 'N/A'}, MatCode: "${s.material_code || ''}", Desc: "${s.material_desc || ''}", Qty: ${s.quantity}, Price: ${s.unit_price}, Spend: ₹${s.total_spend_inr}`);
      }
    }
  }

  console.log(`\n--- ARITHMETIC RECONCILIATION INTEGRITY CHECK ---`);
  console.log(`Total Source Rows: ${totalTxCount} === Eligible (${totalEligibleCount}) + Excluded (${totalExcludedCount}) = ${totalEligibleCount + totalExcludedCount} [MATCH: ${totalTxCount === (totalEligibleCount + totalExcludedCount)}]`);
  console.log(`Total Source Spend: ₹${totalSpendCr} Cr === Eligible (₹${totalEligibleSpendCr} Cr) + Excluded (₹${totalExcludedSpendCr} Cr) = ₹${Number((totalEligibleSpendCr + totalExcludedSpendCr).toFixed(4))} Cr [MATCH: ${Math.abs(totalSpendInr - (totalEligibleSpendInr + totalExcludedSpendInr)) < 1.0}]`);
  console.log(`Mutually Exclusive Buckets Check: BucketSumCount = ${bucketSumCount} === TotalExcluded (${totalExcludedCount}) [MATCH: ${bucketSumCount === totalExcludedCount}]`);

  // Run engine to verify exact alignment with Lever 1 calculation
  const engineResult = await Module2DirectPriceImprovementEngine.calculate(assessmentId, { financialYear: 'ALL' });
  console.log(`\n--- ENGINE RESULTS COMPARISON ---`);
  console.log(`Engine Eligible Txs: ${engineResult.totalEligibleTransactions} [MATCH: ${engineResult.totalEligibleTransactions === totalEligibleCount}]`);
  console.log(`Engine Ineligible Txs: ${engineResult.totalIneligibleTransactions} [MATCH: ${engineResult.totalIneligibleTransactions === totalExcludedCount}]`);
  console.log(`Engine Eligible Spend: ₹${engineResult.totalEligibleSpendCr} Cr [MATCH: ${engineResult.totalEligibleSpendCr === totalEligibleSpendCr}]`);
  console.log(`Engine Ineligible Spend: ₹${engineResult.totalIneligibleSpendCr} Cr [MATCH: ${engineResult.totalIneligibleSpendCr === totalExcludedSpendCr}]`);
  console.log(`Engine Actual Purchase Cost: ₹${engineResult.actualSpendCr} Cr`);
  console.log(`Engine Benchmark Cost: ₹${engineResult.benchmarkCostCr} Cr`);
  console.log(`Engine Historical Lost Opportunity: ₹${engineResult.historicalLostOpportunityCr} Cr (₹${engineResult.historicalLostOpportunityInr.toLocaleString('en-IN')})`);

  // Export transaction-level register of excluded transactions to Excel and JSON
  const outDir = path.resolve(__dirname, '..');
  const xlsxFileName = assessmentId === 'AIC-2026-0002' 
    ? 'MODULE_2_ABC_TEXTILE_EXCLUDED_TRANSACTIONS.xlsx'
    : 'MODULE_2_PQR_CEMENT_EXCLUDED_TRANSACTIONS.xlsx';
  const xlsxPath = path.join(outDir, xlsxFileName);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excludedRecords);
  XLSX.utils.book_append_sheet(wb, ws, 'Excluded_Transactions');

  // Summary sheet
  const summaryRows = [
    { Metric: 'Customer Name', Value: customerName },
    { Metric: 'Assessment ID', Value: assessmentId },
    { Metric: 'Total Source Transactions', Value: totalTxCount },
    { Metric: 'Total Source Spend (Cr)', Value: totalSpendCr },
    { Metric: 'Total Eligible Transactions', Value: totalEligibleCount },
    { Metric: 'Total Eligible Spend (Cr)', Value: totalEligibleSpendCr },
    { Metric: 'Total Excluded Transactions', Value: totalExcludedCount },
    { Metric: 'Total Excluded Spend (Cr)', Value: totalExcludedSpendCr },
    { Metric: 'Actual Purchase Cost (Cr)', Value: engineResult.actualSpendCr },
    { Metric: 'Benchmark Cost (Cr)', Value: engineResult.benchmarkCostCr },
    { Metric: 'Historical Lost Opportunity (Cr)', Value: engineResult.historicalLostOpportunityCr },
    { Metric: 'Commercially Validated Savings (Cr)', Value: 0.00 }
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary_Reconciliation');

  XLSX.writeFile(wb, xlsxPath);
  console.log(`Exported transaction register to: ${xlsxPath}`);

  return {
    customerName,
    assessmentId,
    totalTxCount,
    totalSpendCr,
    totalEligibleCount,
    totalEligibleSpendCr,
    totalExcludedCount,
    totalExcludedSpendCr,
    bucketStats,
    engineResult,
    xlsxPath
  };
}

async function main() {
  const devDir = getDevelopmentDataDir();
  const store = AssessmentStore.getInstance();
  store.setCustomDataDir(devDir);
  store.reloadFromDisk();

  await reconcileCustomer('AIC-2026-0002', 'ABC Textile Ltd');
  await reconcileCustomer('AIC-2026-0003', 'PQR Cement Ltd');
}

main().catch(err => {
  console.error('Error running reconciliation:', err);
  process.exit(1);
});
