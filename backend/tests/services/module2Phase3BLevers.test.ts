import { describe, it, expect } from 'vitest';
import {
  evaluateDirectPriceImprovement,
  evaluateEAuction,
  evaluateVendorConsolidation
} from '../../src/services/module2LeversCore';
import {
  evaluateVolumeAggregation,
  evaluatePaymentTerms,
  evaluateCategorySpecialisation,
  evaluateLogisticsPackaging,
  evaluateSpecificationRationalisation,
  evaluateContractCompliance,
  evaluateNewVendorDevelopment
} from '../../src/services/module2LeversExtended';
import { buildLeverReconciliationSummaries } from '../../src/services/module2LeverReconciler';
import type {
  TransactionAttributionRecord,
  CandidateLeverEvaluation
} from '../../src/types/module2Attribution';
import type { MaterialBaselineMap } from '../../src/services/module2AttributionHelpers';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import {
  TEN_STRATEGIC_SOURCING_LEVERS,
  LEVER_UNQUANTIFIED_REASONS
} from '../../src/constants/module2AttributionLevers';

describe('Prompt 414 / Phase 3B: Ten Strategic Sourcing Levers Evaluation & Reconciliation', () => {
  const testEpoch = Date.parse('2026-03-01T12:00:00Z');
  const mockTx: StrategicInputTransaction = {
    id: 'TX-TEST-001',
    po_number: 'PO-100',
    vendor_code: 'V-001',
    vendor_name: 'Vendor One',
    material_code: 'MAT-STEEL-01',
    material_desc: 'High Tensile Steel Sheet',
    spend_category: 'Raw Materials',
    quantity: 100,
    uom: 'TON',
    unit_price: 1500,
    total_spend_inr: 150000,
    po_date: '2026-03-01'
  };

  const mockBaseline: MaterialBaselineMap = {
    minPrice: 1200,
    distinctPricesCount: 3,
    supplierCount: 3,
    peerPrices: [1200, 1400, 1600],
    peerEpochsMs: [testEpoch, testEpoch],
    baselineQty: 100,
    baselineEpochMs: testEpoch
  };

  describe('1. Core Lever Evaluators (Levers 1-3)', () => {
    it('evaluates Direct Price Improvement with valid observed variance', () => {
      const evalResult = evaluateDirectPriceImprovement(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('DIRECT_PRICE_IMPROVEMENT');
      expect(evalResult.isQuantified).toBe(true);
      expect(evalResult.grossOpportunityInr).toBe(30000); // (1500 - 1200) * 100
      expect(evalResult.evidenceStatus).toBe('OPPORTUNITY_CALCULATED');
      expect(evalResult.unresolvedConditions).toBeDefined();
    });

    it('evaluates Direct Price Improvement as unquantified when rate equals benchmark', () => {
      const benchmarkTx: StrategicInputTransaction = { ...mockTx, unit_price: 1200, total_spend_inr: 120000 };
      const evalResult = evaluateDirectPriceImprovement(benchmarkTx, mockBaseline);
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.grossOpportunityInr).toBe(0);
      expect(evalResult.unquantifiedReason).toContain('equals lowest verified baseline');
    });

    it('evaluates E-Auction with multi-supplier competition as candidate requiring bid sheets', () => {
      const evalResult = evaluateEAuction(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('E_AUCTION');
      expect(evalResult.isEligible).toBe(true);
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_BID_EVIDENCE);
      expect(evalResult.unresolvedConditions).toBeDefined();
    });

    it('marks E-Auction unquantified when single supplier exists', () => {
      const singleGroup: MaterialBaselineMap = {
        ...mockBaseline,
        supplierCount: 1,
        distinctPricesCount: 1
      };
      const evalResult = evaluateEAuction(mockTx, singleGroup);
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe('SINGLE_SUPPLIER_CATEGORY');
    });

    it('evaluates Vendor Consolidation: unquantified when capacity missing, quantified when verified', () => {
      const unverified = evaluateVendorConsolidation(mockTx, mockBaseline);
      expect(unverified.lever).toBe('VENDOR_CONSOLIDATION');
      expect(unverified.isQuantified).toBe(false);
      expect(unverified.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_SUPPLIER_CAPACITY);
      expect(unverified.grossOpportunityInr).toBe(0);
      expect(unverified.observedPriceVarianceInr).toBe(30000);

      const verified = evaluateVendorConsolidation(mockTx, mockBaseline, { supplierCapacityVerified: true });
      expect(verified.isQuantified).toBe(true);
      expect(verified.grossOpportunityInr).toBe(30000);
      expect(verified.unresolvedConditions).toBeDefined();
    });

    it('marks Vendor Consolidation unquantified when single vendor supplies category', () => {
      const singleVendorGroup: MaterialBaselineMap = {
        ...mockBaseline,
        supplierCount: 1,
        distinctPricesCount: 1
      };
      const evalResult = evaluateVendorConsolidation(mockTx, singleVendorGroup);
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe('SINGLE_SUPPLIER_CATEGORY');
    });
  });

  describe('2. Extended Lever Evaluators (Levers 4-10)', () => {
    it('evaluates Volume Aggregation as candidate requiring volume commitments', () => {
      const evalResult = evaluateVolumeAggregation(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('VOLUME_AGGREGATION');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_VOLUME_TIER_AGREEMENT);
      expect(evalResult.evidenceStatus).toBe('CANDIDATE_IDENTIFIED');
    });

    it('evaluates Payment Terms Optimisation without approved financing rate', () => {
      const evalResult = evaluatePaymentTerms(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('PAYMENT_TERMS_OPTIMISATION');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_PAYMENT_TERMS_DATA);
      expect(evalResult.evidenceStatus).toBe('CANDIDATE_IDENTIFIED');
    });

    it('evaluates Category Specialisation without arbitrary percentage', () => {
      const evalResult = evaluateCategorySpecialisation(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('CATEGORY_SPECIALISATION');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_SPECIALIST_CHARTER);
    });

    it('evaluates Logistics & Packaging without logistics parity proof', () => {
      const evalResult = evaluateLogisticsPackaging(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('LOGISTICS_PACKAGING');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_FREIGHT_COST_DATA);
    });

    it('evaluates Specification Rationalisation requiring technical interchangeability', () => {
      const evalResult = evaluateSpecificationRationalisation(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('SPECIFICATION_RATIONALISATION');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_SPECIFICATION_EQUIVALENCE);
    });

    it('evaluates Contract Compliance requiring verified contract prices', () => {
      const evalResult = evaluateContractCompliance(mockTx, mockBaseline);
      expect(evalResult.lever).toBe('CONTRACT_COMPLIANCE_AUDIT');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_CONTRACT_RATE_CARD);
    });

    it('evaluates New-Vendor Development requiring technical approval and tooling', () => {
      const constrainedBaseline: MaterialBaselineMap = { ...mockBaseline, supplierCount: 2 };
      const evalResult = evaluateNewVendorDevelopment(mockTx, constrainedBaseline);
      expect(evalResult.lever).toBe('NEW_VENDOR_DEVELOPMENT');
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toBe(LEVER_UNQUANTIFIED_REASONS.MISSING_ALTERNATE_VENDOR_DATA);
    });
  });

  describe('3. Multi-Lever Reconciliation & Overlap Invariants', () => {
    it('builds comprehensive 10-lever reconciliation summaries with zero double-counting', () => {
      const cand1: CandidateLeverEvaluation = {
        lever: 'DIRECT_PRICE_IMPROVEMENT',
        priorityScore: 1000,
        isEligible: true,
        eligibilityReason: 'Direct price improvement potential against lowest peer',
        isQuantified: true,
        grossOpportunityInr: 30000,
        unquantifiedReason: undefined,
        baselineUnitRate: 1200,
        proposedUnitRate: 1200,
        qualificationStatus: 'VALIDATED_ATTAINABLE_OPPORTUNITY',
        observedPriceVarianceInr: 30000,
        validatedAttainableOpportunityInr: 30000,
        evidenceStatus: 'OPPORTUNITY_CALCULATED',
        unresolvedConditions: ['Supplier quote verification']
      };

      const cand2: CandidateLeverEvaluation = {
        lever: 'VENDOR_CONSOLIDATION',
        priorityScore: 800,
        isEligible: true,
        eligibilityReason: 'Vendor base consolidation candidate with verified price gap',
        isQuantified: true,
        grossOpportunityInr: 30000,
        unquantifiedReason: undefined,
        baselineUnitRate: 1200,
        proposedUnitRate: 1200,
        qualificationStatus: 'VALIDATED_ATTAINABLE_OPPORTUNITY',
        observedPriceVarianceInr: 30000,
        validatedAttainableOpportunityInr: 30000,
        evidenceStatus: 'OPPORTUNITY_CALCULATED',
        unresolvedConditions: ['Target supplier capacity audit']
      };

      const cand3: CandidateLeverEvaluation = {
        lever: 'VOLUME_AGGREGATION',
        priorityScore: 700,
        isEligible: true,
        eligibilityReason: 'Purchase order eligible for consolidated demand volume aggregation',
        isQuantified: false,
        grossOpportunityInr: 0,
        unquantifiedReason: LEVER_UNQUANTIFIED_REASONS.MISSING_VOLUME_TIER_AGREEMENT,
        baselineUnitRate: 1200,
        proposedUnitRate: 1200,
        qualificationStatus: 'UNQUANTIFIED',
        observedPriceVarianceInr: 0,
        validatedAttainableOpportunityInr: 0,
        evidenceStatus: 'CANDIDATE_IDENTIFIED',
        unresolvedConditions: ['Demand schedule consolidation']
      };

      const record: TransactionAttributionRecord = {
        signature: 'SIG-001',
        transactionId: mockTx.id,
        eligibilityStatus: 'ELIGIBLE',
        eligibilityReason: 'VALID_SPEND_AND_MATERIAL',
        candidateLevers: [cand1, cand2, cand3],
        primaryAttributedLever: 'DIRECT_PRICE_IMPROVEMENT',
        grossAttributedOpportunityInr: 30000,
        overlapTreatment: 'MUTUALLY_EXCLUSIVE_PRIMARY',
        netAttributedOpportunityInr: 30000,
        validatedSpendInr: 150000,
        sourceTransaction: mockTx,
        baselineGroupKey: 'MAT-STEEL-01|TON|INR'
      };

      const summaries = buildLeverReconciliationSummaries([record]);
      expect(Object.keys(summaries).length).toBe(Object.keys(TEN_STRATEGIC_SOURCING_LEVERS).length);

      const directSummary = summaries['DIRECT_PRICE_IMPROVEMENT'];
      expect(directSummary?.candidateTransactionCount).toBe(1);
      expect(directSummary?.quantifiedTransactionCount).toBe(1);
      expect(directSummary?.quantifiedOpportunityInr).toBe(30000);
      expect(directSummary?.primaryAttributedOpportunityInr).toBe(30000);
      expect(directSummary?.overlapDeductionInr).toBe(0);
      expect(directSummary?.netAttributedOpportunityInr).toBe(30000);

      const consolSummary = summaries['VENDOR_CONSOLIDATION'];
      expect(consolSummary?.candidateTransactionCount).toBe(1);
      expect(consolSummary?.quantifiedTransactionCount).toBe(1);
      expect(consolSummary?.quantifiedOpportunityInr).toBe(30000);
      expect(consolSummary?.primaryAttributedOpportunityInr).toBe(0);
      expect(consolSummary?.alternativeScenarioOpportunityInr).toBe(30000);
      expect(consolSummary?.overlapDeductionInr).toBe(30000);
      expect(consolSummary?.netAttributedOpportunityInr).toBe(0);

      const volSummary = summaries['VOLUME_AGGREGATION'];
      expect(volSummary?.candidateTransactionCount).toBe(1);
      expect(volSummary?.unquantifiedTransactionCount).toBe(1);
      expect(volSummary?.quantifiedOpportunityInr).toBe(0);
      expect(volSummary?.netAttributedOpportunityInr).toBe(0);
      expect(volSummary?.unquantifiedReasonsBreakdown[LEVER_UNQUANTIFIED_REASONS.MISSING_VOLUME_TIER_AGREEMENT]).toBe(1);

      // Verify invariant: net = primary = quantified - overlap
      Object.values(summaries).forEach((s) => {
        expect(s.netAttributedOpportunityInr).toBe(
          s.quantifiedOpportunityInr - s.overlapDeductionInr
        );
      });
    });
  });
});
