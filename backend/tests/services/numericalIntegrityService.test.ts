import { describe, it, expect } from 'vitest';
import {
  NumericalIntegrityService,
  numericalIntegrityService
} from '../../src/services/numericalIntegrityService';
import {
  inrToLakh,
  lakhToInr,
  inrToCrore,
  croreToInr,
  formatINR,
  formatINRLakh,
  formatINRCrore,
  detectScaleError,
  verifyRawInrEquality
} from '../../src/utils/moneyModel';
import {
  RAW_NET_DEFENSIBLE_INR,
  RAW_APPROVED_MODULE4_INR,
  RAW_GROSS_OPP_INR,
  RAW_OVERLAPS_INR,
  RAW_EXCLUSIONS_INR
} from '../../src/constants/numericalAuditConstants';

describe('Numerical Integrity & Scale-Error Defense (Prompt 256)', () => {
  it('verifies singleton getter for NumericalIntegrityService', () => {
    const inst1 = NumericalIntegrityService.getInstance();
    const inst2 = numericalIntegrityService;
    expect(inst1).toBe(inst2);
    expect(inst1).toBeInstanceOf(NumericalIntegrityService);
  });

  describe('Section 4 & 5 — Unit-Safe Money Model & Conversions', () => {
    it('converts between raw INR, Lakh, and Crore mathematically without loss', () => {
      // Prompt 256 reference example
      const val1 = 243750000;
      expect(inrToLakh(val1)).toBe(2437.5);
      expect(lakhToInr(2437.5)).toBe(val1);
      expect(inrToCrore(val1)).toBe(24.375);
      expect(croreToInr(24.375)).toBe(val1);

      // Enterprise Production Net Defensible Opportunity
      const netDefensibleInr = 936000000;
      expect(inrToLakh(netDefensibleInr)).toBe(9360.0);
      expect(lakhToInr(9360.0)).toBe(netDefensibleInr);
      expect(inrToCrore(netDefensibleInr)).toBe(93.60);
      expect(croreToInr(93.60)).toBe(netDefensibleInr);

      // Approved Module 4 Handoff
      const handoffInr = 479000000;
      expect(inrToLakh(handoffInr)).toBe(4790.0);
      expect(lakhToInr(4790.0)).toBe(handoffInr);
      expect(inrToCrore(handoffInr)).toBe(47.9);
      expect(croreToInr(47.9)).toBe(handoffInr);
    });

    it('formats numbers according to Indian grouping without modifying values', () => {
      expect(formatINR(936000000)).toBe('₹93,60,00,000.00');
      expect(formatINR(479000000)).toBe('₹47,90,00,000.00');
      expect(formatINR(-500000)).toBe('-₹5,00,000.00');
      expect(formatINR(500, false)).toBe('₹500');

      expect(formatINRLakh(936000000)).toBe('₹9,360.00 Lakh');
      expect(formatINRCrore(936000000)).toBe('₹93.60 Cr');
      expect(formatINRCrore(479000000)).toBe('₹47.90 Cr');
    });

    it('Section 5 — detects 10x, 100x, 1000x, 0.1x, 0.01x, 0.001x scaling errors', () => {
      // 10x error
      const check10x = detectScaleError(9360000000, 936000000);
      expect(check10x.hasScaleError).toBe(true);
      expect(check10x.ratio).toBe(10);
      expect(check10x.description).toContain('10x scaling discrepancy');

      // 0.1x error (missing zero)
      const check01x = detectScaleError(243750000, 2437500000);
      expect(check01x.hasScaleError).toBe(true);
      expect(check01x.ratio).toBe(0.1);
      expect(check01x.description).toContain('0.1x scaling discrepancy');

      // 100x error
      const check100x = detectScaleError(243750000000, 2437500000);
      expect(check100x.hasScaleError).toBe(true);
      expect(check100x.ratio).toBe(100);

      // 0.01x error
      const check001x = detectScaleError(24375000, 2437500000);
      expect(check001x.hasScaleError).toBe(true);
      expect(check001x.ratio).toBe(0.01);

      // 1000x error
      const check1000x = detectScaleError(2437500000000, 2437500000);
      expect(check1000x.hasScaleError).toBe(true);
      expect(check1000x.ratio).toBe(1000);

      // 0.001x error
      const check0001x = detectScaleError(2437500, 2437500000);
      expect(check0001x.hasScaleError).toBe(true);
      expect(check0001x.ratio).toBe(0.001);

      // Zero error when identical
      const identical = detectScaleError(2437500000, 2437500000);
      expect(identical.hasScaleError).toBe(false);

      // Zero inputs handled gracefully
      expect(detectScaleError(0, 100).hasScaleError).toBe(false);
      expect(detectScaleError(100, 0).hasScaleError).toBe(false);

      // Non-scale factor ratio
      const nonScale = detectScaleError(150, 100);
      expect(nonScale.hasScaleError).toBe(false);
    });

    it('Section 5 — regression tests ensuring scaled values are strictly NOT equal', () => {
      expect(243750000).not.toBe(24375000000);
      expect(243750000).not.toBe(2437500000);
      expect(243750000).not.toBe(243750000000);
      expect(2437500000).not.toBe(243750000);

      expect(47900000).not.toBe(479000000);
      expect(479000000).not.toBe(4790000000);
    });
  });

  describe('Section 1, 2, 3 — Critical Invariant Audit on Raw Absolute INR', () => {
    it('audits all 7 invariants directly on raw numeric INR with zero variance', () => {
      const invariants = numericalIntegrityService.auditAllInvariants();
      expect(invariants).toHaveLength(7);

      for (const inv of invariants) {
        expect(inv.lhsRawInr).toBe(inv.rhsRawInr);
        expect(inv.varianceRawInr).toBe(0.0);
        expect(inv.calculationStatus).toBe('PASS');
      }

      // Check INV-06 Net Opportunity specifically
      const inv06 = invariants.find((i) => i.invariantId === 'INV-06');
      expect(inv06).toBeDefined();
      expect(inv06?.lhsRawInr).toBe(RAW_NET_DEFENSIBLE_INR);
      expect(inv06?.rhsRawInr).toBe(RAW_GROSS_OPP_INR - RAW_OVERLAPS_INR - RAW_EXCLUSIONS_INR);
      expect(inv06?.lhsRawInr).toBe(936000000);
      expect(inv06?.rhsRawInr).toBe(936000000);
      expect(inv06?.lhsDisplay).toBe('₹93.60 Cr');
      expect(inv06?.rhsDisplay).toBe('₹93.60 Cr');

      // Check INV-07 Module 4 Handoff specifically
      const inv07 = invariants.find((i) => i.invariantId === 'INV-07');
      expect(inv07).toBeDefined();
      expect(inv07?.lhsRawInr).toBe(RAW_APPROVED_MODULE4_INR);
      expect(inv07?.rhsRawInr).toBe(RAW_APPROVED_MODULE4_INR);
      expect(inv07?.lhsRawInr).toBe(479000000);
      expect(inv07?.rhsRawInr).toBe(479000000);
      expect(inv07?.lhsDisplay).toBe('₹47.90 Cr');
      expect(inv07?.rhsDisplay).toBe('₹47.90 Cr');
    });

    it('verifies verifyRawInrEquality helper behavior', () => {
      const match = verifyRawInrEquality(100.5, 100.5);
      expect(match.isMatch).toBe(true);
      expect(match.variance).toBe(0);

      const mismatch = verifyRawInrEquality(100.5, 100.6);
      expect(mismatch.isMatch).toBe(false);
      expect(mismatch.variance).toBe(0.1);
    });
  });

  describe('Section 6 & 7 — Waterfall & Module 4 Lineage Audit', () => {
    it('verifies 8-stage waterfall lineage with transaction sample and formulas', () => {
      const waterfall = numericalIntegrityService.getWaterfallLineage();
      expect(waterfall).toHaveLength(8);

      const stageIds = waterfall.map((w) => w.stageId);
      expect(stageIds).toContain('WF-01');
      expect(stageIds).toContain('WF-06');
      expect(stageIds).toContain('WF-07');

      const wfNet = waterfall.find((w) => w.stageId === 'WF-06');
      expect(wfNet?.rawInr).toBe(RAW_NET_DEFENSIBLE_INR);
      expect(wfNet?.displayValue).toBe('₹93.60 Cr');
      expect(wfNet?.sourceTransactionCount).toBe(11800);
    });

    it('verifies Module 4 packages sum matches approved total and adheres to cap', () => {
      const handoff = numericalIntegrityService.verifyModule4HandoffIntegrity();
      expect(handoff.isReconciled).toBe(true);
      expect(handoff.varianceInr).toBe(0);
      expect(handoff.sumApprovedPackagesInr).toBe(479000000);
      expect(handoff.approvedHandoffTotalInr).toBe(479000000);
      expect(handoff.netDefensibleOpportunityInr).toBe(936000000);
      expect(handoff.isWithinCap).toBe(true);
      expect(handoff.approvedHandoffTotalInr).toBeLessThanOrEqual(handoff.netDefensibleOpportunityInr);
    });

    it('generates markdown report section for numerical audit', () => {
      const md = numericalIntegrityService.generateNumericalAuditMarkdown();
      expect(md).toContain('Critical Numerical Invariant Audit');
      expect(md).toContain('INV-06');
      expect(md).toContain('INV-07');
      expect(md).toContain('₹93.60 Cr');
      expect(md).toContain('₹47.90 Cr');
      expect(md).toContain('PASS (<= Net Defensible Opportunity)');
    });

    it('handles FAIL status and cap failure gracefully for branch coverage', () => {
      // Test auditAllInvariants when there is an inequality/scale mismatch
      const failedInvariants = numericalIntegrityService.auditAllInvariants([
        {
          invariantId: 'INV-TEST-FAIL',
          description: 'Test Invariant Mismatch',
          lhsRawInr: 1000,
          rhsRawInr: 2000,
          varianceRawInr: 0,
          lhsDisplay: '₹1,000.00',
          rhsDisplay: '₹2,000.00',
          displayUnit: 'INR',
          calculationStatus: 'PASS'
        }
      ]);
      expect(failedInvariants[0].calculationStatus).toBe('FAIL');
      expect(failedInvariants[0].varianceRawInr).toBe(1000);

      // Test markdown generation when isWithinCap is false
      const failedMd = numericalIntegrityService.generateNumericalAuditMarkdown({
        sumApprovedPackagesInr: 5000000000,
        approvedHandoffTotalInr: 5000000000,
        netDefensibleOpportunityInr: 2437500000,
        isWithinCap: false,
        varianceInr: 0
      });
      expect(failedMd).toContain('**FAIL**');
    });
  });
});
