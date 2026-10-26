/**
 * Module 2 — Cross-Lever Savings Deduplication & Consolidation Unit Tests
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 1: Strict >= 90% unit test code coverage benchmark
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Module2SavingsDeduplicationEngine } from '../../src/services/module2SavingsDeduplicationEngine';
import { Module2SavingsOpportunityCollector } from '../../src/services/module2SavingsOpportunityCollector';
import {
  buildCanonicalOpportunity,
  createZeroSavingsOpportunity,
  makeOpportunityId,
  round2,
  toCrores
} from '../../src/services/module2SavingsDeduplicationHelpers';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import {
  CALCULATION_BASIS,
  LEVER_SAFEGUARD_RULES,
  CONSOLIDATED_SAVINGS_NOTICES,
  DEDUPLICATION_STATUS_LABELS,
  EVIDENCE_VALIDATION_STATUS_LABELS,
  APPROVAL_STATUS_LABELS
} from '../../src/constants/module2SavingsDeduplication';
import { consolidatedSavingsQuerySchema } from '../../src/constants/module2SavingsDeduplicationValidation';

describe('Module 2 Cross-Lever Savings Deduplication Control', () => {
  const assessmentId = 'AIC-2026-0001';

  beforeAll(() => {
    Module2CanonicalService.clearCache();
    // Warm up canonical bundle once during suite initialization
    Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
  }, 45000);

  describe('Section 1 & 7: Single Source of Truth & Idempotence', () => {
    it('generates canonical opportunities with deterministic identifiers', () => {
      const id1 = makeOpportunityId('AIC-2026-0001', 'LEV-01', 'FABRIC_RAW');
      const id2 = makeOpportunityId('AIC-2026-0001', 'LEV-01', 'FABRIC_RAW');
      expect(id1).toBe(id2);
      expect(id1).toBe('OPP-AIC-2026-0001-LEV-01-FABRIC_RAW');
    });

    it('ensures repeated refreshes do not create duplicate opportunity records', () => {
      const run1 = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      const run2 = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);

      expect(run1.opportunities.length).toBe(run2.opportunities.length);
      expect(run1.grossEstimatedSavingsInr).toBe(run2.grossEstimatedSavingsInr);
      expect(run1.netEstimatedSavingsInr).toBe(run2.netEstimatedSavingsInr);

      const ids1 = run1.opportunities.map((o) => o.opportunityId);
      const ids2 = run2.opportunities.map((o) => o.opportunityId);
      expect(ids1).toEqual(ids2);

      // Verify no duplicate IDs within the run
      const uniqueIds = new Set(ids1);
      expect(uniqueIds.size).toBe(ids1.length);
    });

    it('canonical opportunities contain all 11 required fields', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      expect(summary.opportunities.length).toBeGreaterThan(0);

      for (const opp of summary.opportunities) {
        expect(opp.assessmentId).toBe(assessmentId);
        expect(opp.opportunityId).toBeDefined();
        expect(opp.leverId).toBeGreaterThanOrEqual(1);
        expect(opp.leverId).toBeLessThanOrEqual(10);
        expect(opp.categoryOrMaterialId).toBeDefined();
        expect(opp.eligibleSpendInr).toBeGreaterThanOrEqual(0);
        expect(opp.calculationBasis).toBeDefined();
        expect(opp.estimatedGrossSavingsInr).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(opp.overlappingOpportunityRefs)).toBe(true);
        expect(opp.deduplicationStatus).toBeDefined();
        expect(opp.evidenceValidationStatus).toBeDefined();
        expect(opp.approvalStatus).toBeDefined();
      }
    });
  });

  describe('Section 2 & 3: Overlap Detection & Maximum Defensible Net Savings', () => {
    it('surfaces alternative estimates and retains the highest defensible comparable estimate', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      
      // Look for deduplicated commercial alternatives
      const deduplicatedOpps = summary.opportunities.filter(
        (o) => o.deduplicationStatus === 'DEDUPLICATED_OVERLAP'
      );
      expect(deduplicatedOpps.length).toBeGreaterThan(0);

      for (const dedup of deduplicatedOpps) {
        expect(dedup.netEstimatedSavingsInr).toBe(0);
        expect(dedup.overlapAmountInr).toBe(dedup.estimatedGrossSavingsInr);
        expect(dedup.overlappingOpportunityRefs.length).toBeGreaterThan(0);

        // Verify that the primary retained opportunity is evidence-based or has higher defensible gross savings
        const primaryRefId = dedup.overlappingOpportunityRefs[0];
        const primaryOpp = summary.opportunities.find((o) => o.opportunityId === primaryRefId);
        if (primaryOpp && primaryOpp.deduplicationStatus === 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED') {
          const isDefensible = !primaryOpp.isExploratoryPipeline ||
            primaryOpp.estimatedGrossSavingsInr >= dedup.estimatedGrossSavingsInr;
          expect(isDefensible).toBe(true);
          expect(primaryOpp.netEstimatedSavingsInr).toBe(primaryOpp.estimatedGrossSavingsInr);
        }
      }
    });

    it('does not sum full savings estimates of overlapping alternative strategies', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      expect(summary.totalOverlappingDeductionsInr).toBeGreaterThan(0);
      expect(summary.netEstimatedSavingsInr).toBeLessThan(summary.grossEstimatedSavingsInr);
    });

    it('classifies unverified administrative PO consolidation as exploratory planning assumptions', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      const adminPoOpps = summary.opportunities.filter(
        (o) => o.isIncrementalBenefit && o.leverCode === 'LEV-03-ADMIN'
      );
      expect(adminPoOpps.length).toBeGreaterThan(0);

      for (const inc of adminPoOpps) {
        expect(inc.isExploratoryPipeline).toBe(true);
        expect(inc.evidenceValidationStatus).toBe('PLANNING_ASSUMPTION');
        expect(inc.deduplicationStatus).toBe('EXPLORATORY_PIPELINE');
        expect(inc.netEstimatedSavingsInr).toBe(0);
      }
    });

    it('excludes unresolved overlaps from net savings and flags them for review', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      const unresolvedOpps = summary.opportunities.filter(
        (o) => o.deduplicationStatus === 'UNRESOLVED_EXCLUDED'
      );

      for (const unres of unresolvedOpps) {
        expect(unres.netEstimatedSavingsInr).toBe(0);
        expect(unres.approvalStatus).toBe('EXCLUDED_FROM_NET');
        expect(unres.unresolvedExclusionReason).toBeDefined();
      }
    });
  });

  describe('Section 4 & 5: Lever-Specific Safeguards & Value Separation', () => {
    it('strictly separates Lever 5 financing benefit and working capital released, never summing into purchase price', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);

      expect(summary.lever5AnnualFinancingBenefitInr).toBeGreaterThan(0);
      expect(summary.lever5WorkingCapitalReleasedInr).toBeGreaterThan(0);

      // Verify that financing benefit is NOT added into grossEstimatedSavingsInr
      const l5Opp = summary.opportunities.find((o) => o.leverId === 5);
      expect(l5Opp).toBeDefined();
      expect(l5Opp?.isFinancingBenefitOnly).toBe(true);
      expect(l5Opp?.estimatedGrossSavingsInr).toBe(0);

      // Verify that working capital and financing benefits are NOT summed together
      expect(summary.lever5AnnualFinancingBenefitInr).not.toBe(summary.lever5WorkingCapitalReleasedInr);
    });

    it('produces zero commercial savings for Lever 8 (Phase 1 discovery) and Lever 10 (Vendor discovery)', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);

      const l8Summary = summary.leverSummaries.find((s) => s.leverId === 8);
      expect(l8Summary).toBeDefined();
      expect(l8Summary?.grossSavingsInr).toBe(0);
      expect(l8Summary?.netSavingsInr).toBe(0);

      const l10Summary = summary.leverSummaries.find((s) => s.leverId === 10);
      expect(l10Summary).toBeDefined();
      expect(l10Summary?.grossSavingsInr).toBe(0);
      expect(l10Summary?.netSavingsInr).toBe(0);

      const l7Summary = summary.leverSummaries.find((s) => s.leverId === 7);
      expect(l7Summary).toBeDefined();
      expect(l7Summary?.grossSavingsInr).toBe(0);
      expect(l7Summary?.netSavingsInr).toBe(0);
    });

    it('unapproved planning assumptions do not enter commercially validated savings', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      
      const unapprovedOpps = summary.opportunities.filter(
        (o) => o.evidenceValidationStatus === 'PLANNING_ASSUMPTION' || o.evidenceValidationStatus === 'UNVERIFIED_ESTIMATE'
      );

      for (const opp of unapprovedOpps) {
        expect(opp.commerciallyValidatedSavingsInr).toBe(0);
      }
    });

    it('commercial approvals allow verified incremental benefits into validated savings', () => {
      const options = {
        commercialApprovals: {
          'LEV01-Direct Materials': true
        }
      };
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId, options);
      const approvedOpp = summary.opportunities.find((o) => o.opportunityId.includes('LEV-01-Direct_Materials'));
      if (approvedOpp) {
        expect(approvedOpp.evidenceValidationStatus).toBe('VALIDATED_COMMERCIAL');
        expect(approvedOpp.approvalStatus).toBe('APPROVED');
        expect(approvedOpp.commerciallyValidatedSavingsInr).toBe(approvedOpp.estimatedGrossSavingsInr);
      }
    });
  });

  describe('Section 6: Reporting & Mathematical Reconciliation', () => {
    it('strictly reconciles Gross, Overlap, Unresolved, and Net savings arithmetically', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);

      const expectedNet = round2(
        summary.grossEstimatedSavingsInr -
        summary.totalOverlappingDeductionsInr -
        summary.unresolvedOverlapsExcludedInr
      );
      expect(summary.netEstimatedSavingsInr).toBe(expectedNet);
      expect(summary.isArithmeticallyBalanced).toBe(true);
      expect(summary.reconciliationBalanceInr).toBe(0);
      // Unresolved exclusions not double-subtracted; exploratory never in evidence-based net
      expect(summary.netEvidenceBasedSavingsInr).toBe(summary.grossEvidenceBasedSavingsInr);
      // No opportunity counted twice
      const oppIds = summary.opportunities.map((o) => o.opportunityId);
      expect(new Set(oppIds).size).toBe(oppIds.length);
      // Working capital & financing benefit never enter procurement savings totals
      const ppGross = summary.opportunities.filter((o) => !o.isFinancingBenefitOnly)
        .reduce((s, o) => s + o.estimatedGrossSavingsInr, 0);
      expect(summary.grossEstimatedSavingsInr).toBe(round2(ppGross));
    });

    it('consolidated lever breakdown contains exactly 10 levers', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      expect(summary.leverSummaries.length).toBe(10);

      for (let i = 1; i <= 10; i++) {
        const found = summary.leverSummaries.find((s) => s.leverId === i);
        expect(found).toBeDefined();
        expect(found?.safeguardRule).toBeDefined();
      }
    });

    it('contains all required pre-negotiation disclosures and certification notice', () => {
      const summary = Module2SavingsDeduplicationEngine.calculateConsolidatedSavings(assessmentId);
      expect(summary.certificationNotice).toBe(CONSOLIDATED_SAVINGS_NOTICES.CERTIFICATION_NOTICE);
      expect(summary.disclosures.length).toBeGreaterThan(0);
    });
  });

  describe('Validation & Helpers Coverage', () => {
    it('validates query parameters with consolidatedSavingsQuerySchema', () => {
      const valid = consolidatedSavingsQuerySchema.safeParse({ assessmentId: 'AIC-2026-0001', refresh: 'true' });
      expect(valid.success).toBe(true);

      const invalid = consolidatedSavingsQuerySchema.safeParse({});
      expect(invalid.success).toBe(false);
    });

    it('helper functions round2 and toCrores behave with precision', () => {
      expect(round2(123.456)).toBe(123.46);
      expect(round2(0)).toBe(0);
      expect(toCrores(10000000)).toBe(1);
      expect(toCrores(5000000)).toBe(0.5);
    });

    it('createZeroSavingsOpportunity builds standard zero savings record', () => {
      const zeroOpp = createZeroSavingsOpportunity(
        'AIC-TEST',
        7,
        'LEV-07',
        'Logistics',
        'CARRIER_RATE',
        'Test notice'
      );
      expect(zeroOpp.estimatedGrossSavingsInr).toBe(0);
      expect(zeroOpp.netEstimatedSavingsInr).toBe(0);
      expect(zeroOpp.deduplicationStatus).toBe('NOT_APPLICABLE');
      expect(zeroOpp.evidenceValidationStatus).toBe('DISCOVERY_ONLY');
    });

    it('verifies constant labels exist', () => {
      expect(DEDUPLICATION_STATUS_LABELS.INDEPENDENT).toBeDefined();
      expect(EVIDENCE_VALIDATION_STATUS_LABELS.VALIDATED_COMMERCIAL).toBeDefined();
      expect(APPROVAL_STATUS_LABELS.APPROVED).toBeDefined();
      expect(CALCULATION_BASIS.PEER_PRICE_DISPERSION).toBeDefined();
      expect(LEVER_SAFEGUARD_RULES.LEVER_01).toBeDefined();
    });
  });
});
