import { describe, it, expect } from 'vitest';
import { Module2AttributionLedgerEngine } from '../../src/services/module2AttributionLedgerEngine';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { Module2CanonicalInput } from '../../src/types/module2Canonical';
import {
  evaluateDirectPriceImprovement,
  evaluateEAuction,
  evaluateVendorConsolidation
} from '../../src/services/module2LeversCore';
import type { MaterialBaselineMap } from '../../src/services/module2AttributionHelpers';

describe('Prompt 415 / Audit 2: Phase 3B Adversarial & Edge-Case Testing', () => {
  const nowMs = Date.parse('2026-03-01T12:00:00Z');

  const createMockInput = (transactions: StrategicInputTransaction[]): Module2CanonicalInput => ({
    datasetId: 'TEST-DATASET-ADV',
    dataVersionId: 'DV-001',
    sourceFileName: 'test_adversarial.xlsx',
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
    categoryHandoffSummary: []
  });

  const mockBaseline: MaterialBaselineMap = {
    minPrice: 100,
    distinctPricesCount: 2,
    supplierCount: 2,
    peerPrices: [100, 150],
    peerEpochsMs: [nowMs, nowMs],
    baselineQty: 100,
    baselineEpochMs: nowMs
  };

  it('handles a transaction eligible for multiple quantified levers with zero double-counting', () => {
    // Transaction with rate 150 vs baseline 100 (quantity 100) -> 5,000 INR opp
    const tHigh: StrategicInputTransaction = {
      id: 'TX-MULTI-01',
      po_number: 'PO-M01',
      vendor_code: 'V-001',
      vendor_name: 'Vendor A',
      material_code: 'MAT-ADV-01',
      material_desc: 'Adv Material',
      spend_category: 'Raw Materials',
      quantity: 100,
      uom: 'KG',
      unit_price: 150,
      total_spend_inr: 15000,
      po_date: '2026-03-01'
    };

    const tLow: StrategicInputTransaction = {
      id: 'TX-MULTI-02',
      po_number: 'PO-M02',
      vendor_code: 'V-002',
      vendor_name: 'Vendor B',
      material_code: 'MAT-ADV-01',
      material_desc: 'Adv Material',
      spend_category: 'Raw Materials',
      quantity: 100,
      uom: 'KG',
      unit_price: 100,
      total_spend_inr: 10000,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tHigh, tLow]);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger(
      'AIC-ADV-MULTI',
      input,
      undefined,
      { supplierCapacityVerified: true }
    );

    const highRec = result.records.find((r) => r.sourceTransactionId === 'TX-MULTI-01')!;
    // Both Direct Price and Vendor Consolidation qualify on this record with 5,000 INR gross each
    const quantifiedLevers = highRec.candidateLevers.filter((c) => c.isQuantified && c.grossOpportunityInr > 0);
    expect(quantifiedLevers.length).toBeGreaterThanOrEqual(2);

    // Primary attribution must pick exactly one lever (e.g. VENDOR_CONSOLIDATION as default or DIRECT_PRICE)
    expect(highRec.netAttributedOpportunityInr).toBe(5000);
    expect(highRec.overlapTreatment).toBe('MUTUALLY_EXCLUSIVE_PRIMARY');

    // Total net across assessment must strictly equal 5,000
    expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(5000);
    expect(result.reconciliation.opportunityWaterfall.overlapDeductionsInr).toBe(
      result.reconciliation.opportunityWaterfall.grossOpportunityInr - 5000
    );
    expect(result.reconciliation.opportunityWaterfall.isArithmeticallyBalanced).toBe(true);
  });

  it('resolves equal priority levers deterministically', () => {
    // Custom priority with duplicate priority order
    const tHigh: StrategicInputTransaction = {
      id: 'TX-TIE-01',
      po_number: 'PO-T01',
      vendor_code: 'V-001',
      material_code: 'MAT-ADV-01',
      quantity: 10,
      uom: 'KG',
      unit_price: 200,
      total_spend_inr: 2000,
      po_date: '2026-03-01'
    };
    const tLow: StrategicInputTransaction = {
      id: 'TX-TIE-02',
      po_number: 'PO-T02',
      vendor_code: 'V-002',
      material_code: 'MAT-ADV-01',
      quantity: 10,
      uom: 'KG',
      unit_price: 100,
      total_spend_inr: 1000,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tHigh, tLow]);
    const res1 = Module2AttributionLedgerEngine.buildAttributionLedger(
      'AIC-TIE-1',
      input,
      ['DIRECT_PRICE_IMPROVEMENT', 'VENDOR_CONSOLIDATION'],
      { supplierCapacityVerified: true }
    );
    const res2 = Module2AttributionLedgerEngine.buildAttributionLedger(
      'AIC-TIE-2',
      input,
      ['VENDOR_CONSOLIDATION', 'DIRECT_PRICE_IMPROVEMENT'],
      { supplierCapacityVerified: true }
    );

    expect(res1.records[0].primaryAttributedLever).toBe('DIRECT_PRICE_IMPROVEMENT');
    expect(res2.records[0].primaryAttributedLever).toBe('VENDOR_CONSOLIDATION');
    // In both cases, net opportunity is identical (1,000 INR)
    expect(res1.records[0].netAttributedOpportunityInr).toBe(1000);
    expect(res2.records[0].netAttributedOpportunityInr).toBe(1000);
  });

  it('rejects negative, zero, and credit-reversal transactions from opportunity creation', () => {
    const tNeg: StrategicInputTransaction = {
      id: 'TX-NEG-01',
      po_number: 'PO-NEG',
      vendor_code: 'V-001',
      material_code: 'MAT-01',
      quantity: -50,
      unit_price: 100,
      total_spend_inr: -5000,
      po_date: '2026-03-01'
    };
    const tZero: StrategicInputTransaction = {
      id: 'TX-ZERO-01',
      po_number: 'PO-ZERO',
      vendor_code: 'V-001',
      material_code: 'MAT-01',
      quantity: 0,
      unit_price: 0,
      total_spend_inr: 0,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tNeg, tZero]);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-ADV-ZERO', input);

    expect(result.records[0].eligibilityStatus).toBe('INELIGIBLE');
    expect(result.records[0].netAttributedOpportunityInr).toBe(0);
    expect(result.records[1].eligibilityStatus).toBe('INELIGIBLE');
    expect(result.records[1].netAttributedOpportunityInr).toBe(0);
    expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(0);
    expect(result.reconciliation.opportunityWaterfall.grossOpportunityInr).toBe(0);
  });

  it('handles missing material code, UOM, and currency without cross-contamination', () => {
    const tMissingMat: StrategicInputTransaction = {
      id: 'TX-MISS-01',
      po_number: 'PO-M1',
      vendor_code: 'V-001',
      material_code: '',
      quantity: 10,
      unit_price: 100,
      total_spend_inr: 1000,
      po_date: '2026-03-01'
    };
    const tUnknownMat: StrategicInputTransaction = {
      id: 'TX-MISS-02',
      po_number: 'PO-M2',
      vendor_code: 'V-002',
      material_code: 'UNKNOWN_MAT',
      quantity: 10,
      unit_price: 50,
      total_spend_inr: 500,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tMissingMat, tUnknownMat]);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-ADV-MISSING', input);

    expect(result.records[0].netAttributedOpportunityInr).toBe(0);
    expect(result.records[1].netAttributedOpportunityInr).toBe(0);
    expect(result.reconciliation.opportunityWaterfall.netOpportunityInr).toBe(0);
  });

  it('excludes outside temporal window transactions from validated opportunity', () => {
    const tOld: StrategicInputTransaction = {
      id: 'TX-OLD-01',
      po_number: 'PO-OLD',
      vendor_code: 'V-001',
      material_code: 'MAT-ADV-01',
      quantity: 10,
      unit_price: 200,
      total_spend_inr: 2000,
      po_date: '2025-01-01' // 14 months before baseline
    };
    const tNew: StrategicInputTransaction = {
      id: 'TX-NEW-01',
      po_number: 'PO-NEW',
      vendor_code: 'V-002',
      material_code: 'MAT-ADV-01',
      quantity: 10,
      unit_price: 100,
      total_spend_inr: 1000,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tOld, tNew]);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-ADV-TEMP', input);

    const oldRec = result.records.find((r) => r.sourceTransactionId === 'TX-OLD-01')!;
    // Validated attainable opportunity must be 0
    expect(oldRec.netAttributedOpportunityInr).toBe(0);
    // Observed price variance may still be recorded
    expect(oldRec.qualificationStatus).toBe('UNQUANTIFIED');
  });

  it('excludes volume ratio mismatches > 3.0x from validated opportunity', () => {
    // Bulk transaction: 10,000 units at 50 vs Spot purchase: 10 units at 100
    const tSpot: StrategicInputTransaction = {
      id: 'TX-SPOT-01',
      po_number: 'PO-S01',
      vendor_code: 'V-001',
      material_code: 'MAT-ADV-VOL',
      quantity: 10,
      unit_price: 100,
      total_spend_inr: 1000,
      po_date: '2026-03-01'
    };
    const tBulk: StrategicInputTransaction = {
      id: 'TX-BULK-01',
      po_number: 'PO-B01',
      vendor_code: 'V-002',
      material_code: 'MAT-ADV-VOL',
      quantity: 10000, // 1000x difference
      unit_price: 50,
      total_spend_inr: 500000,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tSpot, tBulk]);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-ADV-VOL', input);

    const spotRec = result.records.find((r) => r.sourceTransactionId === 'TX-SPOT-01')!;
    // Spot purchase cannot claim bulk price as validated attainable opportunity
    expect(spotRec.netAttributedOpportunityInr).toBe(0);
    expect(spotRec.volumeAttainabilityStatus).toBe('VOLUME_DISPARITY_UNVERIFIED');
  });

  it('rejects suspected duplicate transactions from baseline formation', () => {
    const tOriginal: StrategicInputTransaction = {
      id: 'TX-DUP-01',
      po_number: 'PO-DUP',
      vendor_code: 'V-001',
      material_code: 'MAT-DUP',
      quantity: 100,
      unit_price: 100,
      total_spend_inr: 10000,
      po_date: '2026-03-01'
    };
    const tDuplicate: StrategicInputTransaction = {
      id: 'TX-DUP-02',
      po_number: 'PO-DUP',
      vendor_code: 'V-001',
      material_code: 'MAT-DUP',
      quantity: 100,
      unit_price: 100,
      total_spend_inr: 10000,
      po_date: '2026-03-01'
    };

    const input = createMockInput([tOriginal, tDuplicate]);
    const result = Module2AttributionLedgerEngine.buildAttributionLedger('AIC-ADV-DUP', input);

    expect(result.records[1].eligibilityStatus).toBe('SUSPECTED_DUPLICATE_REVIEW');
    expect(result.records[1].netAttributedOpportunityInr).toBe(0);
  });
});
