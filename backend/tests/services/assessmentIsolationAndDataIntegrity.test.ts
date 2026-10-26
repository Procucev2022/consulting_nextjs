import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { VgtModule1Runner } from '../../src/services/vgtModule1Runner';
import { Module2AttributionLedgerEngine } from '../../src/services/module2AttributionLedgerEngine';
import { AssessmentStore } from '../../src/services/assessmentStore';
import {
  resolveAssessmentCustomerName,
  resolveAuthoritativeAssessment
} from '../../src/utils/assessmentContextResolver';
import { Module2DirectPriceImprovementEngine } from '../../src/services/module2DirectPriceImprovementEngine';
import { Module2EAuctionEngine } from '../../src/services/module2EAuctionEngine';
import { Module2CategorySpecialisationEngine } from '../../src/services/module2CategorySpecialisationEngine';
import {
  Module2SpecificationRationalisationEngine
} from '../../src/services/module2SpecificationRationalisationEngine';
import { Module2ProcurementComplianceEngine } from '../../src/services/module2ProcurementComplianceEngine';
import { Module2SavingsDeduplicationEngine } from '../../src/services/module2SavingsDeduplicationEngine';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { Module2MaterialMappingRegister } from '../../src/services/module2MaterialMappingRegister';
import { findTaxonomyRuleMatch } from '../../src/constants/module2MaterialMappingTaxonomy';

describe('Assessment Isolation, Taxonomy Separation & Financial Integrity Tests', () => {
  const BOROSIL_ASSESSMENT_ID = 'AIC-2026-0002';

  beforeAll(async () => {
    Module2CanonicalService.clearCache();
    await new Promise((r) => setTimeout(r, 10));
    Module2CanonicalService.getCanonicalInput(BOROSIL_ASSESSMENT_ID);
    await new Promise((r) => setTimeout(r, 10));
  }, 180000);

  afterAll(() => {
    Module2CanonicalService.clearCache();
    AssessmentStore.resetInstance();
  });

  describe('1. Authoritative Assessment Context Resolver & Cross-Customer Isolation', () => {
    it('resolves AIC-2026-0002 to Borosil Ltd, never ABC Textile Ltd', () => {
      const customerName = resolveAssessmentCustomerName(BOROSIL_ASSESSMENT_ID);
      expect(customerName).toBe('Borosil Ltd');
      expect(customerName).not.toContain('ABC Textile');
    });

    it('resolves authoritative assessment metadata for AIC-2026-0002', () => {
      const assessment = resolveAuthoritativeAssessment(BOROSIL_ASSESSMENT_ID);
      expect(assessment).toBeDefined();
      expect(assessment.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
      expect(assessment.customerName).toBe('Borosil Ltd');
    });

    it('throws error for non-existent assessment ID in resolveAuthoritativeAssessment', () => {
      expect(() => {
        resolveAuthoritativeAssessment('AIC-9999-9999');
      }).toThrow(/not found in assessment store/);
    });

    it('returns empty string or fallback for non-existent assessment in resolver without throwing', () => {
      const customerName = resolveAssessmentCustomerName('AIC-9999-9999');
      expect(customerName).toBe('Enterprise Client (AIC-9999-9999)');
    });
  });

  describe('2. Sourcing Levers Assessment Isolation (All 6 Engines)', () => {
    it('Module2DirectPriceImprovementEngine returns Borosil Ltd as customerName', async () => {
      const result = await Module2DirectPriceImprovementEngine.calculate(BOROSIL_ASSESSMENT_ID);
      expect(result.customerName).toBe('Borosil Ltd');
      expect(result.customerName).not.toContain('ABC Textile');
      expect(result.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
      expect(result.totalEligibleSpendCr).toBeGreaterThan(0);
      expect(result.historicalLostOpportunityCr).toBeGreaterThan(0);
    }, 20000);

    it('Module2EAuctionEngine returns Borosil Ltd as customerName', async () => {
      const result = await Module2EAuctionEngine.calculate(BOROSIL_ASSESSMENT_ID);
      expect(result.customerName).toBe('Borosil Ltd');
      expect(result.customerName).not.toContain('ABC Textile');
      expect(result.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
    });

    it('Module2CategorySpecialisationEngine returns Borosil Ltd as customerName', () => {
      const result = Module2CategorySpecialisationEngine.calculate(BOROSIL_ASSESSMENT_ID);
      expect(result.customerName).toBe('Borosil Ltd');
      expect(result.customerName).not.toContain('ABC Textile');
      expect(result.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
    });

    it('Module2SpecificationRationalisationEngine returns Borosil Ltd as customerName', async () => {
      const result = await Module2SpecificationRationalisationEngine.calculate(BOROSIL_ASSESSMENT_ID);
      expect(result.customerName).toBe('Borosil Ltd');
      expect(result.customerName).not.toContain('ABC Textile');
      expect(result.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
    }, 20000);

    it('Module2ProcurementComplianceEngine returns Borosil Ltd as customerName', async () => {
      const result = await Module2ProcurementComplianceEngine.calculate(BOROSIL_ASSESSMENT_ID);
      expect(result.customerName).toBe('Borosil Ltd');
      expect(result.customerName).not.toContain('ABC Textile');
      expect(result.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
    });

    it('Module2SavingsDeduplicationEngine returns Borosil Ltd as customerName', () => {
      const result = Module2SavingsDeduplicationEngine.deduplicate(BOROSIL_ASSESSMENT_ID);
      expect(result.customerName).toBe('Borosil Ltd');
      expect(result.customerName).not.toContain('ABC Textile');
      expect(result.assessmentId).toBe(BOROSIL_ASSESSMENT_ID);
    });
  });

  describe('3. Taxonomy Classification & Separation', () => {
    it('verifies verified UNSPSC taxonomy rules return high confidence and proper codes', () => {
      const sodaAshMatch = findTaxonomyRuleMatch('Dense Soda Ash Chemical');
      expect(sodaAshMatch).toBeDefined();
      expect(sodaAshMatch?.unspscCode).toBe('12141501');
      expect(sodaAshMatch?.confidenceScore).toBe(95);

      const antimonateMatch = findTaxonomyRuleMatch('Sodium Antimonate Powder');
      expect(antimonateMatch).toBeDefined();
      expect(antimonateMatch?.unspscCode).toBe('12141544');

      const silicaMatch = findTaxonomyRuleMatch('Silica Sand Fine Grade');
      expect(silicaMatch).toBeDefined();
      expect(silicaMatch?.unspscCode).toBe('11111701');

      const dolomiteMatch = findTaxonomyRuleMatch('Dolomite Powder Grade A');
      expect(dolomiteMatch).toBeDefined();
      expect(dolomiteMatch?.unspscCode).toBe('11111611');
    });

    it('returns undefined rule match for generic or unclassified material descriptions', () => {
      const unclassifiedMatch = findTaxonomyRuleMatch('Random Unregistered Proprietary Item 720MR033RGP');
      expect(unclassifiedMatch).toBeUndefined();
    });

    it('verifies canonical line items preserve material_code without internal code substitution', () => {
      const canonicalInput = Module2CanonicalService.getCanonicalInput(BOROSIL_ASSESSMENT_ID);
      expect(canonicalInput).toBeDefined();
      expect(canonicalInput.transactions.length).toBe(27777);

      // Check a sample transaction
      const sampleTx = canonicalInput.transactions[0];
      expect(sampleTx.material_code || sampleTx.materialCode).toBeDefined();
      expect(sampleTx.material_desc || sampleTx.materialDescription).toBeDefined();
    });
  });

  describe('4. Financial Metrics & Baseline Verification', () => {
    it('verifies exact net baseline spend and gross spend separation', () => {
      const sourcing = Module2CanonicalService.getSourcingAnalysis(BOROSIL_ASSESSMENT_ID);
      const summary = sourcing.summary;

      // Net Validated Baseline
      expect(summary.totalSpendAnalyzedInrCr).toBeCloseTo(556.5347, 2);
      expect(summary.netBaselineSpendInrCr).toBeCloseTo(556.5347, 2);
      expect(summary.netBaselineRowCount).toBe(27777);

      // Gross Uploaded Spend
      expect(summary.grossUploadedSpendInrCr).toBeCloseTo(585.3049, 2);

      // Excluded Deductions
      expect(summary.excludedDeletedBlockedSpendInrCr).toBeCloseTo(28.7702, 2);
      expect(summary.excludedDeletedBlockedRowCount).toBe(755);
      expect(summary.excludedStoRowCount).toBe(2208);

      // Realized savings must be strictly 0 (no savings realized yet)
      expect(summary.realizedSavingsInrCr ?? 0).toBe(0);
    });
  });

  describe('5. Assessment-Scoped Material Mappings', () => {
    it('updates material mapping only for the specified assessment', () => {
      const testMaterial = 'TEST_BOROSIL_CHEM_ITEM_01';
      const updated = Module2MaterialMappingRegister.updateMapping(
        testMaterial,
        {
          unspsc_code: '12141501',
          unspsc_commodity_title: 'Sodium carbonate',
          unspsc_class_title: 'Compounds',
          unspsc_category_name: 'Chemicals'
        },
        BOROSIL_ASSESSMENT_ID
      );

      expect(updated).toBeDefined();
      expect(updated.unspsc_code || updated.assignedUnspscCode).toBe('12141501');

      // Verify mapping for Borosil
      const borosilMapping = Module2MaterialMappingRegister.getMapping(testMaterial, BOROSIL_ASSESSMENT_ID);
      expect(borosilMapping).toBeDefined();
      expect(borosilMapping?.unspsc_code || borosilMapping?.assignedUnspscCode).toBe('12141501');

      // Verify that another assessment does not inherit this mapping
      const otherMapping = Module2MaterialMappingRegister.getMapping(testMaterial, 'AIC-2026-9999');
      expect(otherMapping).toBeUndefined();
    });

    it('verifies supplementary canonical analytics on Borosil assessment', () => {
      const top50 = Module2CanonicalService.getTop50Vendors(BOROSIL_ASSESSMENT_ID);
      expect(top50).toBeDefined();

      const risk = Module2CanonicalService.getSupplierRiskAnalysis(BOROSIL_ASSESSMENT_ID);
      expect(risk).toBeDefined();

      const po = Module2CanonicalService.getPoConsolidationAnalysis(BOROSIL_ASSESSMENT_ID);
      expect(po).toBeDefined();

      const recurring = Module2CanonicalService.getRecurringSpendAnalysis(BOROSIL_ASSESSMENT_ID);
      expect(recurring).toBeDefined();

      const forensic = Module2CanonicalService.getForensicSummary(BOROSIL_ASSESSMENT_ID);
      expect(forensic).toBeDefined();
      expect(forensic.canonicalInput.validRowCount).toBe(27777);

      const txs = Module2CanonicalService.getCanonicalTransactions(BOROSIL_ASSESSMENT_ID);
      expect(txs.length).toBe(27777);

      const opps = Module2CanonicalService.getOpportunityLedger(BOROSIL_ASSESSMENT_ID);
      expect(opps.length).toBeGreaterThan(0);

      const bridge = Module2CanonicalService.getMathematicalBridge(BOROSIL_ASSESSMENT_ID);
      expect(bridge.totalValidatedSpendCr).toBeCloseTo(556.5347, 2);
    });

    it('covers edge branches and attribution ledger in Module2CanonicalService', () => {
      // Test missing assessment throws
      expect(() => Module2CanonicalService.getCanonicalInput('AIC-NONEXISTENT-9999')).toThrow();

      // Test boolean argument overloads
      const sourcingBool = Module2CanonicalService.getSourcingAnalysis(false);
      expect(sourcingBool).toBeDefined();

      const ledgerBool = Module2CanonicalService.getOpportunityLedger(false);
      expect(ledgerBool).toBeDefined();

      const bridgeBool = Module2CanonicalService.getMathematicalBridge(false);
      expect(bridgeBool).toBeDefined();

      // Test Attribution Ledger
      const mockResult = { assessmentId: BOROSIL_ASSESSMENT_ID, reconciliation: {} };
      const attrSpy = vi.spyOn(Module2AttributionLedgerEngine, 'buildAttributionLedger')
        .mockReturnValue(mockResult as never);

      const attr1 = Module2CanonicalService.getTransactionAttributionLedger(BOROSIL_ASSESSMENT_ID);
      expect(attr1).toBe(mockResult);

      const attrCached = Module2CanonicalService.getTransactionAttributionLedger(BOROSIL_ASSESSMENT_ID);
      expect(attrCached).toBe(mockResult);

      const attrForce = Module2CanonicalService.getTransactionAttributionLedger(
        BOROSIL_ASSESSMENT_ID,
        undefined,
        true
      );
      expect(attrForce).toBe(mockResult);

      attrSpy.mockRestore();
    }, 60000);
  });
});
