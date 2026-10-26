import { describe, it, expect, beforeAll } from 'vitest';
import { Module2AttributionLedgerEngine } from '../../src/services/module2AttributionLedgerEngine';
import { Module2CanonicalService } from '../../src/services/module2CanonicalService';
import { db } from '../../src/services/db';
import { AssessmentStore } from '../../src/services/assessmentStore';
import { getDevelopmentDataDir } from '../../src/services/assessmentPersistence';
import type { Module2CanonicalInput } from '../../src/types/module2Canonical';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import {
  ATTRIBUTION_CALCULATION_VERSION,
  ATTRIBUTION_NOT_YET_CERTIFIED_NOTICE,
  DEFAULT_ATTRIBUTION_PRIORITY_ORDER,
  ATTRIBUTION_UNQUANTIFIED_REASONS
} from '../../src/constants/module2Attribution';
import {
  buildTransactionSignature,
  buildComparabilityKey,
  determineEligibility,
  evaluateVendorConsolidationCandidate,
  evaluateEAuctionCandidate
} from '../../src/services/module2AttributionHelpers';
import {
  buildPopulationMetrics,
  buildEligibilityMetrics,
  buildQuantifiabilityMetrics,
  buildAllocationsAndWaterfall,
  compileReconciliationReport
} from '../../src/services/module2AttributionReconciler';
import type {
  TransactionAttributionRecord,
  CandidateLeverEvaluation
} from '../../src/types/module2Attribution';

describe('Prompt 410 / Phase 3A: Module 2 Transaction-Level Attribution Ledger Engine', () => {
  beforeAll(() => {
    const devDir = getDevelopmentDataDir();
    const store = AssessmentStore.getInstance();
    store.setCustomDataDir(devDir);
    store.reloadFromDisk();
    Module2CanonicalService.clearCache();
    // Pre-warm caches for ABC Textile and PQR Cement
    Module2CanonicalService.getCanonicalInput('AIC-2026-0002');
    Module2CanonicalService.getCanonicalInput('AIC-2026-0003');
  }, 180000);

  const createMockInput = (transactions: StrategicInputTransaction[]): Module2CanonicalInput => ({
    datasetId: 'TEST-DATASET-001',
    dataVersionId: 'DV-001',
    sourceFileName: 'test_transactions.xlsx',
    sourceRowCount: transactions.length,
    validRowCount: transactions.length,
    excludedRowCount: 0,
    anomalyRowCount: 0,
    totalValidatedSpendInr: transactions.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0),
    totalValidatedSpendCr: Number(
      (transactions.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0) / 10000000).toFixed(3)
    ),
    transactions,
    suppliersCount: new Set(transactions.map((t) => t.vendor_name)).size,
    materialGroupsCount: new Set(transactions.map((t) => t.spend_category)).size,
    plantsCount: 1,
    billingMonthsCount: 12,
    period: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      actualBillingMonths: 12,
      fiscalYear: 'FY23',
      fiscalMonthCoverage: '12/12',
      isFullFiscalYear: true,
      missingMonthsNotice: 'Full period covered'
    },
    currencyCoverage: {
      currenciesDetected: ['INR'],
      normalizedSpendInr: transactions.reduce((sum, t) => sum + (t.total_spend_inr || 0), 0)
    },
    fxNormalization: {
      masterVersion: 'v2.0',
      checksum: 'test-hash'
    }
  });

  describe('1. Transaction Signature & Deduplication Isolation', () => {
    it('generates consistent signatures for identical transactions', () => {
      const t1: StrategicInputTransaction = {
        id: 'TX-1',
        po_number: 'PO-100',
        po_date: '2023-05-10',
        vendor_code: 'V-01',
        vendor_name: 'Alpha Ltd',
        material_code: 'MAT-A',
        material_desc: 'Bearing 50mm',
        quantity: 10,
        uom: 'EA',
        unit_price: 500,
        total_spend_inr: 5000,
        currency: 'INR',
        plant: 'P1',
        spend_category: 'Direct'
      };
      const t2 = { ...t1, id: 'TX-2' };
      expect(buildTransactionSignature(t1)).toBe(buildTransactionSignature(t2));
    });

    it('preserves suspected duplicate lines in source spend without automated deduction', () => {
      const baseTx: StrategicInputTransaction = {
        id: 'TX-DUP-1',
        po_number: 'PO-999',
        po_date: '2023-06-01',
        vendor_code: 'V-DUP',
        vendor_name: 'Dup Corp',
        material_code: 'MAT-DUP',
        material_desc: 'Valves',
        quantity: 100,
        uom: 'EA',
        unit_price: 250,
        total_spend_inr: 25000,
        currency: 'INR',
        plant: '1000',
        spend_category: 'Mechanical'
      };
      const dupTx = { ...baseTx, id: 'TX-DUP-2' };
      const input = createMockInput([baseTx, dupTx]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-DUP', input);

      expect(result.records.length).toBe(2);
      expect(result.records[0].isSuspectedDuplicate).toBe(false);
      expect(result.records[0].eligibilityStatus).toBe('ELIGIBLE');

      expect(result.records[1].isSuspectedDuplicate).toBe(true);
      expect(result.records[1].eligibilityStatus).toBe('SUSPECTED_DUPLICATE_REVIEW');
      expect(result.records[1].eligibilityReason).toContain('Suspected identical transaction duplicate awaiting review');

      // Both records must be retained in total source spend population
      expect(result.reconciliation.sourcePopulation.totalSpendInr).toBe(50000);
      expect(result.reconciliation.sourcePopulation.suspectedDuplicateTransactionCount).toBe(1);
      expect(result.reconciliation.sourcePopulation.suspectedDuplicateSpendInr).toBe(25000);
    });

    it('keeps genuine repeated purchases with different dates or POs distinct and eligible', () => {
      const t1: StrategicInputTransaction = {
        id: 'TX-REP-1',
        po_number: 'PO-101',
        po_date: '2023-01-15',
        vendor_code: 'V-01',
        vendor_name: 'Vendor A',
        material_code: 'MAT-X',
        quantity: 50,
        unit_price: 100,
        total_spend_inr: 5000,
        currency: 'INR'
      };
      const t2: StrategicInputTransaction = {
        id: 'TX-REP-2',
        po_number: 'PO-102',
        po_date: '2023-02-20',
        vendor_code: 'V-01',
        vendor_name: 'Vendor A',
        material_code: 'MAT-X',
        quantity: 50,
        unit_price: 100,
        total_spend_inr: 5000,
        currency: 'INR'
      };
      const input = createMockInput([t1, t2]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-REP', input);

      expect(result.records[0].isSuspectedDuplicate).toBe(false);
      expect(result.records[1].isSuspectedDuplicate).toBe(false);
      expect(result.records[0].eligibilityStatus).toBe('ELIGIBLE');
      expect(result.records[1].eligibilityStatus).toBe('ELIGIBLE');
      expect(result.reconciliation.sourcePopulation.suspectedDuplicateTransactionCount).toBe(0);
    });
  });

  describe('2. Incompatible Units of Measure & Currencies', () => {
    it('does not compare unit rates across different UOMs or different currencies', () => {
      const tKg: StrategicInputTransaction = {
        id: 'TX-KG',
        po_number: 'PO-1',
        vendor_code: 'V-1',
        vendor_name: 'Vendor 1',
        material_code: 'CHEM-01',
        material_desc: 'Solvent',
        quantity: 100,
        uom: 'KG',
        unit_price: 100,
        total_spend_inr: 10000,
        currency: 'INR'
      };
      const tLtr: StrategicInputTransaction = {
        id: 'TX-LTR',
        po_number: 'PO-2',
        vendor_code: 'V-2',
        vendor_name: 'Vendor 2',
        material_code: 'CHEM-01',
        material_desc: 'Solvent',
        quantity: 100,
        uom: 'LTR',
        unit_price: 150,
        total_spend_inr: 15000,
        currency: 'INR'
      };
      const tUsd: StrategicInputTransaction = {
        id: 'TX-USD',
        po_number: 'PO-3',
        vendor_code: 'V-3',
        vendor_name: 'Vendor 3',
        material_code: 'CHEM-01',
        material_desc: 'Solvent',
        quantity: 100,
        uom: 'KG',
        unit_price: 2,
        total_spend_inr: 16000,
        currency: 'USD'
      };

      const input = createMockInput([tKg, tLtr, tUsd]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-COMP', input);

      // Each has distinct comparability key: CHEM-01::KG::INR, CHEM-01::LTR::INR, CHEM-01::KG::USD
      // Since each comparability group has only 1 vendor, no cross-UOM or cross-currency rate comparison occurs!
      for (const rec of result.records) {
        expect(rec.netAttributedOpportunityInr).toBe(0);
        expect(rec.primaryAttributedLever).toBe('UNQUANTIFIED');
      }
      expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(0);
    });
  });

  describe('3. Zero and Negative Spend Handling', () => {
    it('marks zero or negative transactions as ineligible with zero opportunity', () => {
      const tZero: StrategicInputTransaction = {
        id: 'TX-ZERO',
        po_number: 'PO-0',
        vendor_code: 'V-0',
        material_code: 'MAT-Z',
        quantity: 0,
        unit_price: 0,
        total_spend_inr: 0,
        currency: 'INR'
      };
      const tNeg: StrategicInputTransaction = {
        id: 'TX-NEG',
        po_number: 'PO-NEG',
        vendor_code: 'V-0',
        material_code: 'MAT-Z',
        quantity: -5,
        unit_price: 100,
        total_spend_inr: -500,
        currency: 'INR'
      };
      const input = createMockInput([tZero, tNeg]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-ZERO', input);

      expect(result.records[0].isZeroOrNegativeSpend).toBe(true);
      expect(result.records[0].eligibilityStatus).toBe('INELIGIBLE');
      expect(result.records[0].netAttributedOpportunityInr).toBe(0);
      expect(result.records[1].isZeroOrNegativeSpend).toBe(true);
      expect(result.records[1].eligibilityStatus).toBe('INELIGIBLE');
      expect(result.records[1].netAttributedOpportunityInr).toBe(0);
      expect(result.reconciliation.sourcePopulation.zeroOrNegativeTransactionCount).toBe(2);
      expect(result.reconciliation.spendEligibility.ineligibleTransactionCount).toBe(2);
    });
  });

  describe('4. Deterministic Multi-Lever Attribution & Non-Duplication (Zero Double-Counting)', () => {
    it('allocates exactly one primary lever with zero double-counting across candidate levers', () => {
      const tHigh: StrategicInputTransaction = {
        id: 'TX-HIGH',
        po_number: 'PO-201',
        po_date: '2023-03-01',
        vendor_code: 'V-EXPENSIVE',
        vendor_name: 'Expensive Supplier Ltd',
        material_code: 'STEEL-ROD-10',
        material_desc: 'Steel Rod 10mm',
        quantity: 1000,
        uom: 'KG',
        unit_price: 80,
        total_spend_inr: 80000,
        currency: 'INR',
        spend_category: 'Metals'
      };
      const tLow: StrategicInputTransaction = {
        id: 'TX-LOW',
        po_number: 'PO-202',
        po_date: '2023-03-02',
        vendor_code: 'V-BENCHMARK',
        vendor_name: 'Benchmark Supplier Ltd',
        material_code: 'STEEL-ROD-10',
        material_desc: 'Steel Rod 10mm',
        quantity: 1000,
        uom: 'KG',
        unit_price: 60,
        total_spend_inr: 60000,
        currency: 'INR',
        spend_category: 'Metals'
      };

      const input = createMockInput([tHigh, tLow]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger(
        'AIC-TEST-ATTR',
        input,
        undefined,
        { supplierCapacityVerified: true }
      );

      const highRec = result.records[0];
      expect(highRec.eligibilityStatus).toBe('ELIGIBLE');
      expect(highRec.candidateLevers.length).toBeGreaterThanOrEqual(2);

      // Direct price improvement candidate should also have quantified (80 - 60) * 1000 = 20,000 INR
      const directCandidate = highRec.candidateLevers.find((c) => c.lever === 'DIRECT_PRICE_IMPROVEMENT');
      expect(directCandidate?.isQuantified).toBe(true);
      expect(directCandidate?.grossOpportunityInr).toBe(20000);

      // Consolidation candidate should have quantified (80 - 60) * 1000 = 20,000 INR
      const consolCandidate = highRec.candidateLevers.find((c) => c.lever === 'VENDOR_CONSOLIDATION');
      expect(consolCandidate?.isQuantified).toBe(true);
      expect(consolCandidate?.grossOpportunityInr).toBe(20000);

      // Primary lever must be VENDOR_CONSOLIDATION with exactly 20,000 net
      expect(highRec.primaryAttributedLever).toBe('VENDOR_CONSOLIDATION');
      expect(highRec.netAttributedOpportunityInr).toBe(20000);
      expect(highRec.overlapTreatment).toBe('MUTUALLY_EXCLUSIVE_PRIMARY');

      // Benchmark supplier record: unit rate is 60 (lowest), so savings is 0
      const lowRec = result.records[1];
      expect(lowRec.netAttributedOpportunityInr).toBe(0);

      // Total Net across the entire assessment must strictly equal 20,000
      // Gross opportunity across candidate levers is 40,000 with 20,000 overlap deduction
      expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(20000);
      expect(result.reconciliation.opportunityWaterfall.grossOpportunityInr).toBe(40000);
      expect(result.reconciliation.opportunityWaterfall.multiLeverOverlapDeductionsInr).toBe(20000);
      expect(result.reconciliation.opportunityWaterfall.isArithmeticallyBalanced).toBe(true);
      expect(result.reconciliation.opportunityWaterfall.isCertified).toBe(false);
      expect(result.reconciliation.opportunityWaterfall.certificationNotice).toBe(
        ATTRIBUTION_NOT_YET_CERTIFIED_NOTICE
      );
    });

    it('prevents unsupported Vendor Consolidation savings when capacity evidence is missing', () => {
      const tHigh: StrategicInputTransaction = {
        id: 'TX-HIGH',
        po_number: 'PO-1',
        po_date: '2025-01-15',
        vendor_code: 'VEND-A',
        vendor_name: 'Supplier Alpha',
        material_code: 'MAT-1',
        material_desc: 'Standard Steel Bolt',
        quantity: 1000,
        unit_price: 80,
        total_spend_inr: 80000,
        uom: 'EA',
        currency: 'INR'
      };
      const tLow: StrategicInputTransaction = {
        id: 'TX-LOW',
        po_number: 'PO-2',
        po_date: '2025-01-10',
        vendor_code: 'VEND-B',
        vendor_name: 'Supplier Beta',
        material_code: 'MAT-1',
        material_desc: 'Standard Steel Bolt',
        quantity: 1000,
        unit_price: 60,
        total_spend_inr: 60000,
        uom: 'EA',
        currency: 'INR'
      };
      const input = createMockInput([tHigh, tLow]);
      // Run without supplier capacity verified
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-NOCAP', input);

      const highRec = result.records[0];
      const consolCandidate = highRec.candidateLevers.find((c) => c.lever === 'VENDOR_CONSOLIDATION');
      expect(consolCandidate?.isQuantified).toBe(false);
      expect(consolCandidate?.grossOpportunityInr).toBe(0);
      expect(consolCandidate?.unquantifiedReason).toBe('MISSING_SUPPLIER_CAPACITY');

      // Primary lever defaults to DIRECT_PRICE_IMPROVEMENT since vendor consolidation cannot claim savings
      expect(highRec.primaryAttributedLever).toBe('DIRECT_PRICE_IMPROVEMENT');
      expect(highRec.netAttributedOpportunityInr).toBe(20000);
      expect(result.reconciliation.opportunityWaterfall.multiLeverOverlapDeductionsInr).toBe(0);
      expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(20000);
    });

    it('returns uniform price items as unquantified when all suppliers offer identical prices', () => {
      const t1: StrategicInputTransaction = {
        id: 'TX-U1',
        po_number: 'PO-1',
        vendor_code: 'V-1',
        material_code: 'UNIFORM-MAT',
        quantity: 100,
        uom: 'EA',
        unit_price: 500,
        total_spend_inr: 50000,
        currency: 'INR'
      };
      const t2: StrategicInputTransaction = {
        id: 'TX-U2',
        po_number: 'PO-2',
        vendor_code: 'V-2',
        material_code: 'UNIFORM-MAT',
        quantity: 100,
        uom: 'EA',
        unit_price: 500,
        total_spend_inr: 50000,
        currency: 'INR'
      };
      const input = createMockInput([t1, t2]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-UNIFORM', input);

      expect(result.records[0].netAttributedOpportunityInr).toBe(0);
      expect(result.records[0].primaryAttributedLever).toBe('UNQUANTIFIED');
      expect(result.records[1].netAttributedOpportunityInr).toBe(0);
      expect(result.records[1].primaryAttributedLever).toBe('UNQUANTIFIED');
      expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(0);
    });
  });

  describe('5. Reconciliation Invariants Verification', () => {
    it('strictly satisfies all mathematical population and waterfall invariants', () => {
      const txs: StrategicInputTransaction[] = [
        {
          id: 'TX-1',
          po_number: 'PO-1',
          vendor_code: 'V1',
          material_code: 'M1',
          quantity: 100,
          uom: 'EA',
          unit_price: 300,
          total_spend_inr: 30000,
          currency: 'INR'
        },
        {
          id: 'TX-2',
          po_number: 'PO-2',
          vendor_code: 'V2',
          material_code: 'M1',
          quantity: 100,
          uom: 'EA',
          unit_price: 200,
          total_spend_inr: 20000,
          currency: 'INR'
        },
        {
          id: 'TX-3',
          po_number: 'PO-3',
          vendor_code: 'V3',
          material_code: 'M2',
          quantity: 0,
          unit_price: 0,
          total_spend_inr: 0,
          currency: 'INR'
        }
      ];
      const input = createMockInput(txs);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-TEST-INVAR', input);
      const rec = result.reconciliation;

      // Invariant 1: Source Spend = Eligible Spend + Ineligible Spend
      const totalSpend = rec.sourcePopulation.totalSpendInr;
      const eligibleSpend = rec.spendEligibility.eligibleSpendInr;
      const ineligibleSpend = rec.spendEligibility.ineligibleSpendInr;
      expect(Math.abs(totalSpend - (eligibleSpend + ineligibleSpend))).toBeLessThan(0.01);

      // Invariant 2: Eligible Spend = Quantified Spend + Unquantified Spend
      const quantifiedSpend = rec.quantifiability.quantifiedSpendInr;
      const unquantifiedSpend = rec.quantifiability.unquantifiedSpendInr;
      expect(Math.abs(eligibleSpend - (quantifiedSpend + unquantifiedSpend))).toBeLessThan(0.01);

      // Invariant 3: Gross - Overlap = Net
      const gross = rec.opportunityWaterfall.grossOpportunityInr;
      const overlap = rec.opportunityWaterfall.overlapDeductionsInr;
      const net = rec.opportunityWaterfall.netOpportunityInr;
      expect(Math.abs(gross - overlap - net)).toBeLessThan(0.01);
      expect(rec.opportunityWaterfall.isArithmeticallyBalanced).toBe(true);

      // Invariant 4: Sum of Primary Lever Allocations = Net Opportunity
      const sumAllocatedNet = Object.values(rec.primaryAllocationsByLever).reduce(
        (sum, a) => sum + a.netOpportunityInr,
        0
      );
      expect(Math.abs(sumAllocatedNet - net)).toBeLessThan(0.01);
    });
  });

  describe('6. Customer Isolation & Live Assessment Verification', () => {
    it('executes transaction attribution ledger on ABC Textile (AIC-2026-0002) with 23,570 records', () => {
      const result = Module2CanonicalService.getTransactionAttributionLedger('AIC-2026-0002');
      expect(result.assessmentId).toBe('AIC-2026-0002');
      expect(result.recordCount).toBe(23570);
      expect(result.records.length).toBe(23570);
      expect(result.reconciliation.sourcePopulation.totalSpendCr).toBeCloseTo(613.881, 2);
      expect(result.reconciliation.opportunityWaterfall.isArithmeticallyBalanced).toBe(true);
      expect(result.reconciliation.opportunityWaterfall.isCertified).toBe(false);
      expect(result.reconciliation.opportunityWaterfall.certificationNotice).toContain('NOT YET CERTIFIED');
      expect(result.reconciliation.opportunityWaterfall.totalObservedVarianceCr).toBeCloseTo(8.554, 2);
      expect(result.reconciliation.opportunityWaterfall.totalValidatedOpportunityCr).toBeCloseTo(0.488, 2);
      expect(result.reconciliation.opportunityWaterfall.otherQualificationExclusionsCr).toBeCloseTo(7.789, 2);
    });

    it('executes transaction attribution ledger on PQR Cement (AIC-2026-0003) with 19,670 records', () => {
      const result = Module2CanonicalService.getTransactionAttributionLedger('AIC-2026-0003');
      expect(result.assessmentId).toBe('AIC-2026-0003');
      expect(result.recordCount).toBe(19670);
      expect(result.records.length).toBe(19670);
      expect(result.reconciliation.sourcePopulation.totalSpendCr).toBeCloseTo(262.641, 2);
      expect(result.reconciliation.opportunityWaterfall.isArithmeticallyBalanced).toBe(true);
      expect(result.reconciliation.opportunityWaterfall.isCertified).toBe(false);
      expect(result.reconciliation.opportunityWaterfall.totalObservedVarianceCr).toBeCloseTo(19.526, 2);
      expect(result.reconciliation.opportunityWaterfall.totalValidatedOpportunityCr).toBeCloseTo(0.477, 2);
      expect(result.reconciliation.opportunityWaterfall.otherQualificationExclusionsCr).toBeCloseTo(17.945, 2);
    });

    it('switching between ABC Textile and PQR Cement maintains absolute data isolation', () => {
      const abc1 = Module2CanonicalService.getTransactionAttributionLedger('AIC-2026-0002');
      const pqr1 = Module2CanonicalService.getTransactionAttributionLedger('AIC-2026-0003');
      const abc2 = Module2CanonicalService.getTransactionAttributionLedger('AIC-2026-0002');

      expect(abc1.recordCount).toBe(23570);
      expect(pqr1.recordCount).toBe(19670);
      expect(abc2.recordCount).toBe(23570);
      expect(abc1.records[0].assessmentId).toBe('AIC-2026-0002');
      expect(pqr1.records[0].assessmentId).toBe('AIC-2026-0003');
    });

    it('database singleton exposes getModule2AttributionLedger cleanly', () => {
      const result = db.getModule2AttributionLedger('AIC-2026-0002');
      expect(result.assessmentId).toBe('AIC-2026-0002');
      expect(result.recordCount).toBe(23570);
    });
  });

  describe('7. Edge Cases & Helper Branch Coverage', () => {
    it('handles missing material code, UOM, or currency in comparability key', () => {
      expect(buildComparabilityKey()).toBe('UNKNOWN_MAT::UNKNOWN_UOM::INR');
      expect(buildComparabilityKey('MAT-1', undefined, 'EUR')).toBe('MAT-1::UNKNOWN_UOM::EUR');
    });

    it('handles custom priority order when provided', () => {
      const tHigh: StrategicInputTransaction = {
        id: 'TX-HIGH',
        po_number: 'PO-201',
        vendor_code: 'V-EXPENSIVE',
        material_code: 'STEEL-ROD-10',
        quantity: 100,
        uom: 'KG',
        unit_price: 80,
        total_spend_inr: 8000,
        currency: 'INR'
      };
      const tLow: StrategicInputTransaction = {
        id: 'TX-LOW',
        po_number: 'PO-202',
        vendor_code: 'V-BENCHMARK',
        material_code: 'STEEL-ROD-10',
        quantity: 100,
        uom: 'KG',
        unit_price: 60,
        total_spend_inr: 6000,
        currency: 'INR'
      };
      const input = createMockInput([tHigh, tLow]);
      // Custom priority order with supplier capacity verified
      const result = Module2AttributionLedgerEngine.buildAttributionLedger(
        'AIC-CUSTOM',
        input,
        ['E_AUCTION', 'VENDOR_CONSOLIDATION'],
        { supplierCapacityVerified: true }
      );
      expect(result.records[0].primaryAttributedLever).toBe('VENDOR_CONSOLIDATION');
    });

    it('records alternative lever opportunities and validates overlap deductions', () => {
      const mockRecord: TransactionAttributionRecord = {
        assessmentId: 'AIC-ALT',
        sourceTransactionId: 'TX-ALT-1',
        sourceRowReference: 1,
        poNumber: 'PO-ALT',
        lineItemId: 'PO-ALT-1',
        supplierId: 'V-1',
        supplierName: 'Vendor 1',
        materialCode: 'MAT-1',
        itemDescription: 'Desc 1',
        procurementCategory: 'Cat 1',
        unspscCode: '00000000',
        transactionDate: '2022-01-01',
        quantity: 10,
        uom: 'EA',
        originalCurrency: 'INR',
        originalAmount: 1000,
        validatedSpendInr: 1000,
        candidateLevers: [
          {
            lever: 'VENDOR_CONSOLIDATION',
            isEligible: true,
            eligibilityReason: 'Eligible',
            isQuantified: true,
            baselineUnitRate: 80,
            proposedUnitRate: 80,
            grossOpportunityInr: 200,
            priorityScore: 1
          },
          {
            lever: 'VOLUME_BUNDLING',
            isEligible: true,
            eligibilityReason: 'Eligible',
            isQuantified: true,
            baselineUnitRate: 70,
            proposedUnitRate: 70,
            grossOpportunityInr: 300,
            priorityScore: 2
          }
        ],
        eligibilityStatus: 'ELIGIBLE',
        eligibilityReason: 'Valid',
        primaryAttributedLever: 'VENDOR_CONSOLIDATION',
        baselineUnitRate: 80,
        baselineEvidence: 'Lowest verified',
        proposedUnitRate: 80,
        proposedEvidence: 'Attributed rate',
        grossOpportunityAmountInr: 500,
        overlapTreatment: 'MUTUALLY_EXCLUSIVE_PRIMARY',
        netAttributedOpportunityInr: 200,
        confidenceStatus: 'HIGH',
        calculationMethod: 'METHOD',
        calculationVersion: 'V1.0',
        isSuspectedDuplicate: false,
        isZeroOrNegativeSpend: false,
        isMissingRequiredEvidence: false
      };

      const rep = compileReconciliationReport([mockRecord], 'AIC-ALT');
      expect(rep.alternativeScenariosByLever['VOLUME_BUNDLING']).toBeDefined();
      expect(rep.alternativeScenariosByLever['VOLUME_BUNDLING'].unrealizedOpportunityInr).toBe(300);
      expect(rep.opportunityWaterfall.overlapDeductionsInr).toBe(300);
      expect(rep.opportunityWaterfall.netOpportunityInr).toBe(200);
      expect(rep.opportunityWaterfall.isArithmeticallyBalanced).toBe(true);
    });

    it('covers eligibility branches for zero quantity and zero spend individually', () => {
      const tZeroQty: StrategicInputTransaction = {
        quantity: 0,
        total_spend_inr: 100,
        unit_price: 100,
        currency: 'INR'
      };
      const tZeroSpend: StrategicInputTransaction = {
        quantity: 10,
        total_spend_inr: 0,
        unit_price: 0,
        currency: 'INR'
      };
      expect(determineEligibility(tZeroQty, false).status).toBe('INELIGIBLE');
      expect(determineEligibility(tZeroSpend, false).status).toBe('INELIGIBLE');
    });

    it('handles benchmark price match in vendor consolidation evaluation', () => {
      const tBenchmark: StrategicInputTransaction = {
        material_code: 'MAT-BENCH',
        unit_price: 50,
        quantity: 10,
        total_spend_inr: 500,
        currency: 'INR'
      };
      const baseline = {
        minPrice: 50,
        maxPrice: 60,
        supplierCount: 2,
        distinctPricesCount: 2,
        primarySupplier: 'V1'
      };
      const evalResult = evaluateVendorConsolidationCandidate(tBenchmark, baseline);
      expect(evalResult.isQuantified).toBe(false);
      expect(evalResult.unquantifiedReason).toContain('Supplier unit rate equals lowest verified baseline');
    });

    it('sorts multiple quantified candidates by priority order', () => {
      const candA: CandidateLeverEvaluation = {
        lever: 'VOLUME_BUNDLING',
        isEligible: true,
        eligibilityReason: 'Eligible',
        isQuantified: true,
        baselineUnitRate: 70,
        proposedUnitRate: 70,
        grossOpportunityInr: 300,
        priorityScore: 3
      };
      const candB: CandidateLeverEvaluation = {
        lever: 'VENDOR_CONSOLIDATION',
        isEligible: true,
        eligibilityReason: 'Eligible',
        isQuantified: true,
        baselineUnitRate: 80,
        proposedUnitRate: 80,
        grossOpportunityInr: 200,
        priorityScore: 1
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chosen = (Module2AttributionLedgerEngine as any).selectPrimaryLever(
        [candA, candB],
        DEFAULT_ATTRIBUTION_PRIORITY_ORDER
      );
      expect(chosen.primaryLever).toBe('VENDOR_CONSOLIDATION');
      expect(chosen.netInr).toBe(200);
      expect(chosen.overlapTreatment).toBe('MUTUALLY_EXCLUSIVE_PRIMARY');
    });

    it('handles OBSERVED_PRICE_VARIANCE qualification in selectPrimaryLever', () => {
      const candObs: CandidateLeverEvaluation = {
        lever: 'VENDOR_CONSOLIDATION',
        isEligible: true,
        eligibilityReason: 'Disparity',
        isQuantified: true,
        baselineUnitRate: 50,
        proposedUnitRate: 50,
        grossOpportunityInr: 500,
        priorityScore: 600,
        qualificationStatus: 'OBSERVED_PRICE_VARIANCE',
        observedPriceVarianceInr: 500,
        validatedAttainableOpportunityInr: 0,
        temporalComparisonStatus: 'INSIDE_WINDOW',
        volumeAttainabilityStatus: 'VOLUME_DISPARITY_UNVERIFIED'
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chosen = (Module2AttributionLedgerEngine as any).selectPrimaryLever(
        [candObs],
        DEFAULT_ATTRIBUTION_PRIORITY_ORDER
      );
      expect(chosen.primaryLever).toBe('VENDOR_CONSOLIDATION');
      expect(chosen.netInr).toBe(0);
      expect(chosen.confidence).toBe('MEDIUM');
      expect(chosen.overlapTreatment).toBe('NO_OVERLAP');
    });

    it('handles empty candidates array in selectPrimaryLever fallback', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chosen = (Module2AttributionLedgerEngine as any).selectPrimaryLever(
        [],
        DEFAULT_ATTRIBUTION_PRIORITY_ORDER
      );
      expect(chosen.primaryLever).toBe('UNQUANTIFIED');
      expect(chosen.baselinePrice).toBeNull();
      expect(chosen.netInr).toBe(0);
    });

    it('flags rate outlier in evaluateVendorConsolidationCandidate', () => {
      const tOutlier: StrategicInputTransaction = {
        id: 'TX-OUT',
        po_number: 'PO-OUT',
        po_date: '2023-01-01',
        vendor_code: 'V-DUMMY',
        vendor_name: 'Dummy ERP Vendor',
        material_code: 'MAT-STEEL',
        material_desc: 'Heavy Structural Steel Beam',
        quantity: 10,
        uom: 'MT',
        unit_price: 0.01,
        total_spend_inr: 0.1,
        currency: 'INR'
      };
      const baseline: MaterialBaselineMap = {
        minPrice: 50000,
        maxPrice: 60000,
        supplierCount: 2,
        distinctPricesCount: 2,
        primarySupplier: 'V-REAL',
        baselineQty: 10,
        baselineEpochMs: Date.parse('2023-01-01'),
        peerEpochsMs: [Date.parse('2023-01-01')],
        peerPrices: [50000, 60000]
      };
      const res = evaluateVendorConsolidationCandidate(tOutlier, baseline);
      expect(res.isQuantified).toBe(false);
      expect(res.unquantifiedReason).toBe(ATTRIBUTION_UNQUANTIFIED_REASONS.SUSPECTED_PLACEHOLDER_RATE);
    });

    it('handles uniform prices in evaluateVendorConsolidationCandidate', () => {
      const tUni: StrategicInputTransaction = {
        id: 'TX-UNI',
        po_number: 'PO-UNI',
        po_date: '2023-01-01',
        vendor_code: 'V-1',
        vendor_name: 'V1',
        material_code: 'MAT-UNI',
        material_desc: 'Uniform Price Item',
        quantity: 10,
        uom: 'EA',
        unit_price: 100,
        total_spend_inr: 1000,
        currency: 'INR'
      };
      const baseline: MaterialBaselineMap = {
        minPrice: 100,
        maxPrice: 100,
        supplierCount: 2,
        distinctPricesCount: 1,
        primarySupplier: 'V-1',
        baselineQty: 10,
        baselineEpochMs: Date.parse('2023-01-01'),
        peerEpochsMs: [Date.parse('2023-01-01')],
        peerPrices: [100, 100]
      };
      const res = evaluateVendorConsolidationCandidate(tUni, baseline);
      expect(res.isQuantified).toBe(false);
      expect(res.unquantifiedReason).toBe(ATTRIBUTION_UNQUANTIFIED_REASONS.UNIFORM_PRICING);
    });
  });

  describe('8. Independent Savings Validation & Ledger Audit (Prompt 411)', () => {
    it('classifies transactions with missing material identifiers as UNQUANTIFIED and does not pool them across vendors', () => {
      const tMissingA: StrategicInputTransaction = {
        id: 'TX-MISS-1',
        po_number: 'PO-M1',
        po_date: '2023-01-01',
        vendor_code: 'V-M1',
        vendor_name: 'Vendor M1',
        material_code: '', // missing
        material_desc: 'Freight Services Contract',
        quantity: 1,
        uom: 'EA',
        unit_price: 10000000,
        total_spend_inr: 10000000,
        currency: 'INR'
      };
      const tMissingB: StrategicInputTransaction = {
        id: 'TX-MISS-2',
        po_number: 'PO-M2',
        po_date: '2023-01-02',
        vendor_code: 'V-M2',
        vendor_name: 'Vendor M2',
        material_code: 'UNKNOWN_MAT', // placeholder
        material_desc: 'Sample item test rate',
        quantity: 1,
        uom: 'EA',
        unit_price: 0.01,
        total_spend_inr: 0.01,
        currency: 'INR'
      };

      const input = createMockInput([tMissingA, tMissingB]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-AUDIT-MISS', input);

      expect(result.records[0].netAttributedOpportunityInr).toBe(0);
      expect(result.records[0].candidateLevers[0].unquantifiedReason).toBe(
        ATTRIBUTION_UNQUANTIFIED_REASONS.MISSING_MATERIAL_IDENTIFIER
      );
      expect(result.records[1].netAttributedOpportunityInr).toBe(0);
      expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(0);
    });

    it('demonstrates volume/quantity disparity where bulk vs spot purchase creates observed variance rather than attainable savings', () => {
      const tBulk: StrategicInputTransaction = {
        id: 'TX-BULK',
        po_number: 'PO-BULK',
        po_date: '2023-01-10',
        vendor_code: 'V-BULK',
        vendor_name: 'Wholesale Corp',
        material_code: 'MAT-BULK-01',
        material_desc: 'Polymer Granules',
        quantity: 50000, // Wholesale container load
        uom: 'KG',
        unit_price: 80,
        total_spend_inr: 4000000,
        currency: 'INR'
      };
      const tSpot: StrategicInputTransaction = {
        id: 'TX-SPOT',
        po_number: 'PO-SPOT',
        po_date: '2023-02-15',
        vendor_code: 'V-SPOT',
        vendor_name: 'Local Dealer',
        material_code: 'MAT-BULK-01',
        material_desc: 'Polymer Granules',
        quantity: 25, // Emergency spot purchase of 25 kg
        uom: 'KG',
        unit_price: 150,
        total_spend_inr: 3750,
        currency: 'INR'
      };

      const input = createMockInput([tBulk, tSpot]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-AUDIT-VOL', input);

      const spotRecord = result.records.find((r) => r.sourceTransactionId === 'TX-SPOT');
      expect(spotRecord).toBeDefined();
      expect(spotRecord?.baselineUnitRate).toBe(80);
      expect(spotRecord?.qualificationStatus).toBe('OBSERVED_PRICE_VARIANCE');
      expect(spotRecord?.volumeAttainabilityStatus).toBe('VOLUME_DISPARITY_UNVERIFIED');
      expect(spotRecord?.observedPriceVarianceInr).toBe(1750);
      expect(spotRecord?.validatedAttainableOpportunityInr).toBe(0);
      expect(spotRecord?.netAttributedOpportunityInr).toBe(0);
    });

    it('identifies price shifts over time across separate billing periods', () => {
      const t2021: StrategicInputTransaction = {
        id: 'TX-2021',
        po_number: 'PO-2021',
        po_date: '2021-04-10',
        vendor_code: 'V-OIL-1',
        vendor_name: 'Oil Co 1',
        material_code: 'MAT-DIESEL',
        material_desc: 'High Speed Diesel',
        quantity: 10000,
        uom: 'LTR',
        unit_price: 77.8,
        total_spend_inr: 778000,
        currency: 'INR'
      };
      const t2022: StrategicInputTransaction = {
        id: 'TX-2022',
        po_number: 'PO-2022',
        po_date: '2022-05-15',
        vendor_code: 'V-OIL-2',
        vendor_name: 'Oil Co 2',
        material_code: 'MAT-DIESEL',
        material_desc: 'High Speed Diesel',
        quantity: 10000,
        uom: 'LTR',
        unit_price: 122.56, // National crude price escalation
        total_spend_inr: 1225600,
        currency: 'INR'
      };

      const input = createMockInput([t2021, t2022]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-AUDIT-TIME', input);
      const rec2022 = result.records.find((r) => r.sourceTransactionId === 'TX-2022');
      expect(rec2022?.temporalComparisonStatus).toBe('OUTSIDE_TEMPORAL_WINDOW');
      expect(rec2022?.qualificationStatus).toBe('UNQUANTIFIED');
      expect(rec2022?.netAttributedOpportunityInr).toBe(0);
      expect(rec2022?.requiresCategoryTemporalReview).toBe(true);
    });

    it('retains credits, returns, and reversals transparently in source spend without negative savings', () => {
      const tCredit: StrategicInputTransaction = {
        id: 'TX-CREDIT',
        po_number: 'PO-RET-01',
        po_date: '2023-03-01',
        vendor_code: 'V-RET',
        vendor_name: 'Reversal Vendor',
        material_code: 'MAT-RET',
        material_desc: 'Return Credit Memo',
        quantity: -5,
        uom: 'EA',
        unit_price: 200,
        total_spend_inr: -1000,
        currency: 'INR'
      };
      const input = createMockInput([tCredit]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-AUDIT-CREDIT', input);

      expect(result.records.length).toBe(1);
      expect(result.records[0].isZeroOrNegativeSpend).toBe(true);
      expect(result.records[0].eligibilityStatus).toBe('INELIGIBLE');
      expect(result.records[0].netAttributedOpportunityInr).toBe(0);
      expect(result.reconciliation.sourcePopulation.zeroOrNegativeTransactionCount).toBe(1);
      expect(result.reconciliation.sourcePopulation.zeroOrNegativeSpendInr).toBe(-1000);
      expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(0);
    });

    it('preserves legitimate repeated purchases as distinct ledger entries', () => {
      const tLegit1: StrategicInputTransaction = {
        id: 'TX-LEGIT-1',
        po_number: 'PO-DAILY-01',
        po_date: '2023-01-05',
        vendor_code: 'V-DAILY',
        vendor_name: 'Daily Supplier',
        material_code: 'MAT-DAILY',
        material_desc: 'Daily Raw Milk',
        quantity: 100,
        uom: 'LTR',
        unit_price: 50,
        total_spend_inr: 5000,
        currency: 'INR'
      };
      const tLegit2: StrategicInputTransaction = {
        id: 'TX-LEGIT-2',
        po_number: 'PO-DAILY-02',
        po_date: '2023-01-06', // Different date, distinct PO
        vendor_code: 'V-DAILY',
        vendor_name: 'Daily Supplier',
        material_code: 'MAT-DAILY',
        material_desc: 'Daily Raw Milk',
        quantity: 100,
        uom: 'LTR',
        unit_price: 50,
        total_spend_inr: 5000,
        currency: 'INR'
      };

      const input = createMockInput([tLegit1, tLegit2]);
      const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-AUDIT-REPEAT', input);

      expect(result.records.length).toBe(2);
      expect(result.records[0].isSuspectedDuplicate).toBe(false);
      expect(result.records[1].isSuspectedDuplicate).toBe(false);
      expect(result.reconciliation.sourcePopulation.suspectedDuplicateTransactionCount).toBe(0);
      expect(result.reconciliation.sourcePopulation.totalSpendInr).toBe(10000);
    });
  });
});
