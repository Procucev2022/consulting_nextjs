import { describe, it, expect } from 'vitest';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2AttributionLedgerEngine } from '../../src/services/module2AttributionLedgerEngine';

describe('Phase 3B Live Validation on ABC Textile and PQR Cement', () => {
  it('executes attribution engine with 10 levers on live assessments', async () => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();

    const assessments = [
      { id: 'AIC-2026-0002', name: 'ABC Textile' },
      { id: 'AIC-2026-0003', name: 'PQR Cement' }
    ];

    for (const a of assessments) {
      if (!store.getAssessmentById(a.id)) {
        console.log(`Skipping non-existent assessment ${a.id} (${a.name})`);
        continue;
      }
      console.log(`\n======================================================`);
      console.log(`LIVE ASSESSMENT: ${a.name} (${a.id})`);
      console.log(`======================================================`);

      const canonicalInput = await Module2CanonicalService.getCanonicalInput(a.id);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger(a.id, canonicalInput);

      const p = result.reconciliation.sourcePopulation;
      const e = result.reconciliation.spendEligibility;
      const w = result.reconciliation.opportunityWaterfall;
      const lr = result.reconciliation.leverReconciliation || {};

      console.log(`\n1. SOURCE SPEND & POPULATION:`);
      console.log(`   - Total Source Transactions: ${p.totalTransactionCount}`);
      console.log(`   - Total Source Spend: ${p.totalSpendInr.toLocaleString('en-IN')} INR (${p.totalSpendCr} Cr)`);
      console.log(`   - Ineligible Transactions: ${e.ineligibleTransactionCount}`);
      console.log(`   - Ineligible Spend: ${e.ineligibleSpendInr.toLocaleString('en-IN')} INR (${e.ineligibleSpendCr} Cr)`);
      console.log(`   - Eligible Transactions: ${e.eligibleTransactionCount}`);
      console.log(`   - Eligible Spend: ${e.eligibleSpendInr.toLocaleString('en-IN')} INR (${e.eligibleSpendCr} Cr)`);

      console.log(`\n2. OPPORTUNITY WATERFALL:`);
      console.log(`   - Gross Candidate Opportunity: ${w.grossOpportunityInr.toLocaleString('en-IN')} INR (${w.grossOpportunityCr} Cr)`);
      console.log(`   - Overlap Deductions: ${w.overlapDeductionsInr.toLocaleString('en-IN')} INR (${w.overlapDeductionsCr} Cr)`);
      console.log(`   - Net Attributed Opportunity: ${w.netOpportunityInr.toLocaleString('en-IN')} INR (${w.netOpportunityCr} Cr)`);
      console.log(`   - Mathematically Balanced: ${w.isArithmeticallyBalanced}`);
      console.log(`   - Certification Notice: ${w.certificationNotice}`);

      console.log(`\n3. LEVER-BY-LEVER BREAKDOWN:`);
      console.log(`------------------------------------------------------------------------------------------------------------------------------------------------`);
      console.log(
        `Lever Name`.padEnd(38) +
        `| Candidates`.padEnd(14) +
        `| Eligible`.padEnd(12) +
        `| Quantified`.padEnd(14) +
        `| Gross Opp (Cr)`.padEnd(17) +
        `| Overlap (Cr)`.padEnd(15) +
        `| Net Opp (Cr)`.padEnd(15) +
        `| Primary Tx`
      );
      console.log(`------------------------------------------------------------------------------------------------------------------------------------------------`);

      for (const [key, s] of Object.entries(lr)) {
        console.log(
          `${s.leverName}`.padEnd(38) +
          `| ${s.candidateTransactionCount}`.padEnd(14) +
          `| ${s.eligibleTransactionCount}`.padEnd(12) +
          `| ${s.quantifiedTransactionCount}`.padEnd(14) +
          `| ₹${s.quantifiedOpportunityCr} Cr`.padEnd(17) +
          `| ₹${s.overlapDeductionCr} Cr`.padEnd(15) +
          `| ₹${s.netAttributedOpportunityCr} Cr`.padEnd(15) +
          `| ${s.primaryTransactionCount}`
        );
      }
      console.log(`------------------------------------------------------------------------------------------------------------------------------------------------`);

      console.log(`\n4. TOP UNQUANTIFIED REASON CODES PER LEVER:`);
      for (const [key, s] of Object.entries(lr)) {
        const reasons = Object.entries(s.unquantifiedReasonsBreakdown || {});
        if (reasons.length > 0) {
          console.log(`   * ${s.leverName}:`);
          for (const [r, cnt] of reasons) {
            console.log(`     - ${r}: ${cnt} transactions`);
          }
        }
      }
      expect(w.isArithmeticallyBalanced).toBe(true);
      expect(w.isCertified).toBe(false);
      expect(Object.keys(lr).length).toBe(10);
      expect(w.grossOpportunityInr - w.overlapDeductionsInr).toBeCloseTo(w.netOpportunityInr, 2);
    }
  }, 120000);
});
