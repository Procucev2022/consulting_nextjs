import { describe, it } from 'vitest';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2AttributionLedgerEngine } from '../../src/services/module2AttributionLedgerEngine';

describe('Prompt 415: Phase 3B Deep Audit Execution', () => {
  it('executes forensic reconciliation for ABC Textile and PQR Cement', async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();

    const assessments = [
      { id: 'AIC-2026-0002', name: 'ABC Textile Ltd' },
      { id: 'AIC-2026-0003', name: 'PQR Cement Ltd' }
    ];

    for (const a of assessments) {
      console.log(`\n################################################################`);
      console.log(`AUDIT EXECUTION FOR: ${a.name} (${a.id})`);
      console.log(`################################################################`);

      const canonicalInput = await Module2CanonicalService.getCanonicalInput(a.id);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger(a.id, canonicalInput);

      const p = result.reconciliation.sourcePopulation;
      const e = result.reconciliation.spendEligibility;
      const w = result.reconciliation.opportunityWaterfall;
      const lr = result.reconciliation.leverReconciliation || {};

      console.log(`\n--- AUDIT 1: SOURCE SPEND AND EXCLUSIONS ---`);
      console.log(`Total Source Transactions: ${p.totalTransactionCount}`);
      console.log(`Total Source Spend: ₹${p.totalSpendInr.toLocaleString('en-IN')} (${p.totalSpendCr} Cr)`);
      console.log(`Eligible Transactions: ${e.eligibleTransactionCount}`);
      console.log(`Eligible Spend: ₹${e.eligibleSpendInr.toLocaleString('en-IN')} (${e.eligibleSpendCr} Cr)`);
      console.log(`Ineligible Transactions: ${e.ineligibleTransactionCount}`);
      console.log(`Ineligible Spend: ₹${e.ineligibleSpendInr.toLocaleString('en-IN')} (${e.ineligibleSpendCr} Cr)`);
      console.log(`  - Duplicate Exclusions: ${p.suspectedDuplicateTransactionCount} txs, ₹${p.suspectedDuplicateSpendInr.toLocaleString('en-IN')} INR`);
      console.log(`  - Zero/Negative Exclusions: ${p.zeroOrNegativeTransactionCount} txs, ₹${p.zeroOrNegativeSpendInr.toLocaleString('en-IN')} INR`);

      // Verify Disjoint Population & Reconciles
      const countSum = e.eligibleTransactionCount + e.ineligibleTransactionCount;
      const spendSum = Math.round((e.eligibleSpendInr + e.ineligibleSpendInr) * 100) / 100;
      console.log(`Disjoint Population Check: ${countSum} === ${p.totalTransactionCount} -> ${countSum === p.totalTransactionCount}`);
      console.log(`Spend Reconciliation Check: ${spendSum} === ${p.totalSpendInr} -> ${spendSum === p.totalSpendInr}`);

      console.log(`\n--- AUDIT 3: 4-STAGE CANDIDATE COUNTS PER LEVER ---`);
      console.log(
        `Lever Name`.padEnd(38) +
        `| 1. Screened`.padEnd(15) +
        `| 2. Eligible`.padEnd(15) +
        `| 3. Quantified`.padEnd(16) +
        `| 4. Validated`
      );
      console.log(`-`.repeat(95));
      for (const [key, s] of Object.entries(lr)) {
        console.log(
          `${s.leverName}`.padEnd(38) +
          `| ${s.candidateTransactionCount}`.padEnd(15) +
          `| ${s.eligibleTransactionCount}`.padEnd(15) +
          `| ${s.quantifiedTransactionCount}`.padEnd(16) +
          `| 0 (Commercial gaps uncertified)`
        );
      }

      console.log(`\n--- AUDIT 4: OVERLAP DEDUCTION PAIRS ---`);
      // Compute overlap between lever pairs across all transactions
      const pairOverlap: Record<string, { count: number; overlapInr: number }> = {};
      for (const r of result.records) {
        const qLevers = r.candidateLevers.filter((c) => c.isQuantified && c.grossOpportunityInr > 0);
        if (qLevers.length > 1) {
          const prim = r.primaryAttributedLever;
          for (const c of qLevers) {
            if (c.lever !== prim) {
              const pairKey = `${prim} <-> ${c.lever}`;
              if (!pairOverlap[pairKey]) pairOverlap[pairKey] = { count: 0, overlapInr: 0 };
              pairOverlap[pairKey].count += 1;
              pairOverlap[pairKey].overlapInr += c.grossOpportunityInr;
            }
          }
        }
      }
      for (const [pair, val] of Object.entries(pairOverlap)) {
        console.log(`  * ${pair}: ${val.count} txs, Overlap Deducted: ₹${val.overlapInr.toLocaleString('en-IN')} INR`);
      }

      console.log(`\n--- AUDIT 4: TOP 20 OPPORTUNITY TRANSACTIONS ---`);
      const positiveRecords = result.records
        .filter((r) => r.netAttributedOpportunityInr > 0)
        .sort((a, b) => b.netAttributedOpportunityInr - a.netAttributedOpportunityInr);

      console.log(`Total Positive Opportunity Transactions: ${positiveRecords.length}`);
      const top20 = positiveRecords.slice(0, 20);
      top20.forEach((r, idx) => {
        const unitPriceInr = r.quantity > 0 ? Math.round((r.validatedSpendInr / r.quantity) * 100) / 100 : 0;
        const delta = Math.round((unitPriceInr - (r.baselineUnitRate || 0)) * 100) / 100;
        console.log(
          `#${idx + 1} Tx: ${r.sourceTransactionId} | PO: ${r.poNumber} | Mat: ${r.materialCode} (${r.itemDescription || 'N/A'}) | ` +
          `Supplier: ${r.supplierName} (${r.supplierId}) | Qty: ${r.quantity} ${r.uom} | ` +
          `Rate: ₹${unitPriceInr} | Base: ₹${r.baselineUnitRate} | Delta: ₹${delta} | ` +
          `Formula: (${unitPriceInr} - ${r.baselineUnitRate}) * ${r.quantity} | ` +
          `Lever: ${r.primaryAttributedLever} | Net Opp: ₹${r.netAttributedOpportunityInr.toLocaleString('en-IN')}`
        );
      });

      console.log(`\n--- AUDIT 4: METRIC ISOLATION SUMMARY ---`);
      const spendWithPositiveOpp = positiveRecords.reduce((sum, r) => sum + r.validatedSpendInr, 0);
      const unquantRecords = result.records.filter((r) => r.netAttributedOpportunityInr === 0 && r.eligibilityStatus === 'ELIGIBLE');
      const unquantSpend = unquantRecords.reduce((sum, r) => sum + r.validatedSpendInr, 0);

      console.log(`A. Total Spend Contributing to Positive Opportunity: ₹${spendWithPositiveOpp.toLocaleString('en-IN')} INR (Count: ${positiveRecords.length})`);
      console.log(`B. Total Spend Left Unquantified: ₹${unquantSpend.toLocaleString('en-IN')} INR (Count: ${unquantRecords.length})`);
      console.log(`C. Total Observed Price Variance: ₹${w.totalObservedVarianceInr.toLocaleString('en-IN')} INR (${w.totalObservedVarianceCr} Cr)`);
      console.log(`D. Calculated Gross Candidate Opportunity: ₹${w.grossOpportunityInr.toLocaleString('en-IN')} INR (${w.grossOpportunityCr} Cr)`);
      console.log(`E. Multi-Lever Overlap Deductions: ₹${w.overlapDeductionsInr.toLocaleString('en-IN')} INR (${w.overlapDeductionsCr} Cr)`);
      console.log(`F. Net Attributed Opportunity: ₹${w.netOpportunityInr.toLocaleString('en-IN')} INR (${w.netOpportunityCr} Cr)`);
      console.log(`G. Commercially Validated Savings: ₹0 INR (0.00 Cr - Uncertified pending supplier commercial validation)`);
    }
  }, 180000);
});
