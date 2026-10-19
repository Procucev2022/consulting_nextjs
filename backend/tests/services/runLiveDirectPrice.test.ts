import { describe, it } from 'vitest';
import { Module2DirectPriceImprovementEngine } from '../../src/services/module2DirectPriceImprovementEngine';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';

describe('Live Direct Price Improvement Runner', () => {
  it('runs against ABC Textile and PQR Cement', async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();

    console.log('--- RUNNING DIRECT PRICE IMPROVEMENT ENGINE ON LIVE DATASETS ---');

    for (const assessmentId of ['AIC-2026-0002', 'AIC-2026-0003']) {
      console.log(`\n======================================================`);
      console.log(`ASSESSMENT: ${assessmentId}`);
      console.log(`======================================================`);

      const resultAll = await Module2DirectPriceImprovementEngine.calculate(assessmentId, { financialYear: 'ALL' });
      console.log(`Customer: ${resultAll.customerName}`);
      console.log(`Total Eligible Txs: ${resultAll.totalEligibleTransactions}`);
      console.log(`Total Ineligible Txs: ${resultAll.totalIneligibleTransactions}`);
      console.log(`Total Eligible Spend: ₹${resultAll.totalEligibleSpendCr} Cr (₹${resultAll.totalEligibleSpendInr})`);
      console.log(`Total Ineligible Spend: ₹${resultAll.totalIneligibleSpendCr} Cr (₹${resultAll.totalIneligibleSpendInr})`);
      console.log(`Overall Actual Spend: ₹${resultAll.actualSpendCr} Cr`);
      console.log(`Overall Benchmark Cost: ₹${resultAll.benchmarkCostCr} Cr`);
      console.log(`Overall Historical Lost Opp: ₹${resultAll.historicalLostOpportunityCr} Cr (₹${resultAll.historicalLostOpportunityInr})`);
      console.log(`Items Evaluated: ${resultAll.itemsEvaluatedCount}, Items with Opp: ${resultAll.itemsWithOpportunityCount}, Disqualified: ${resultAll.disqualifiedItemsCount}`);
      console.log(`Certification Notice: ${resultAll.certificationNotice}`);

      console.log(`\n--- FINANCIAL YEAR BREAKDOWN ---`);
      for (const fy of resultAll.fySummaries) {
        console.log(`FY: ${fy.financialYear}`);
        console.log(`  Txs: ${fy.transactionCount}, Qty: ${fy.totalQuantity}`);
        console.log(`  Actual Spend: ₹${fy.actualSpendCr} Cr (₹${fy.actualSpendInr})`);
        console.log(`  Benchmark Cost: ₹${fy.benchmarkCostCr} Cr (₹${fy.benchmarkCostInr})`);
        console.log(`  Historical Lost Opp: ₹${fy.historicalLostOpportunityCr} Cr (₹${fy.historicalLostOpportunityInr})`);
        console.log(`  Items Evaluated: ${fy.itemsEvaluatedCount}, Items With Opp: ${fy.itemsWithOpportunityCount}`);
      }

      console.log(`\n--- TOP 5 OPPORTUNITY ITEMS (ALL FY) ---`);
      for (const item of resultAll.items.slice(0, 5)) {
        console.log(`Item: [${item.materialCode}] ${item.materialDesc} (${item.financialYear})`);
        console.log(`  Category: ${item.spendCategory}, UOM: ${item.uom}`);
        console.log(`  Txs: ${item.transactionCount}, Qty: ${item.totalEligibleQuantity}`);
        console.log(`  Lowest Price: ₹${item.lowestUnitPrice}, Weighted Avg Price: ₹${item.weightedAveragePrice}, Highest: ₹${item.highestUnitPrice}`);
        console.log(`  Actual Cost: ₹${item.actualPurchaseCostCr} Cr, Benchmark Cost: ₹${item.benchmarkCostCr} Cr`);
        console.log(`  Historical Lost Opp: ₹${item.historicalLostOpportunityCr} Cr (₹${item.historicalLostOpportunityInr})`);
        console.log(`  Qualification Status: ${item.qualificationStatus}`);
      }
    }
  }, 60000);
});
