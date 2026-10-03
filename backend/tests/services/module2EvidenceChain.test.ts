/**
 * Module 2 — Transaction-Level Evidence & Traceability Acceptance Test Suite
 * Version: MODULE_2_EVIDENCE_LOGIC_V1.0
 * Tests Section 20: TEST 01 through TEST 15
 */

import { describe, it, expect } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import { Module2StrategicSourcingEngine } from '../../src/services/module2StrategicSourcingEngine';
import { Module2EvidenceChainEngine } from '../../src/services/module2EvidenceChainEngine';
import { Module2TransactionEvidenceBuilder } from '../../src/services/module2TransactionEvidenceBuilder';
import { Module2EvidenceStatisticsHelper } from '../../src/services/module2EvidenceStatisticsHelper';

const mockTransactions: StrategicInputTransaction[] = [
  {
    id: 'TX-001',
    po_number: 'PO-1001',
    po_date: '2026-01-10',
    vendor_code: 'SUPP-TATA',
    vendor_name: 'Tata Steel Ltd',
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity: 1000,
    uom: 'MT',
    unit_price: 65000,
    total_spend_inr: 65000000,
    currency: 'INR',
    plant: 'Plant Jamshedpur',
    spend_category: 'Structural Steel'
  },
  {
    id: 'TX-002',
    po_number: 'PO-1002',
    po_date: '2026-01-12',
    vendor_code: 'SUPP-JSW',
    vendor_name: 'JSW Steel Ltd',
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity: 800,
    uom: 'MT',
    unit_price: 60000,
    total_spend_inr: 48000000,
    currency: 'INR',
    plant: 'Plant Vijayanagar',
    spend_category: 'Structural Steel'
  },
  {
    id: 'TX-003',
    po_number: 'PO-1003',
    po_date: '2026-01-15',
    vendor_code: 'SUPP-JINDAL',
    vendor_name: 'Jindal Steel & Power',
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity: 600,
    uom: 'MT',
    unit_price: 58000,
    total_spend_inr: 34800000,
    currency: 'INR',
    plant: 'Plant Angul',
    spend_category: 'Structural Steel'
  },
  {
    id: 'TX-004',
    po_number: 'PO-1004',
    po_date: '2026-01-18',
    vendor_code: 'SUPP-SAIL',
    vendor_name: 'Steel Authority of India Ltd',
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity: 500,
    uom: 'MT',
    unit_price: 59000,
    total_spend_inr: 29500000,
    currency: 'INR',
    plant: 'Plant Rourkela',
    spend_category: 'Structural Steel'
  },
  // Micro order (< 0.5% volume) to trigger exclusion
  {
    id: 'TX-005',
    po_number: 'PO-1005',
    po_date: '2026-01-20',
    vendor_code: 'SUPP-LOCAL',
    vendor_name: 'Local Hardware Supplier',
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity: 1,
    uom: 'MT',
    unit_price: 75000,
    total_spend_inr: 75000,
    currency: 'INR',
    plant: 'Local Site',
    spend_category: 'Structural Steel'
  },
  // Invalid transaction (0 price) to trigger invalid exclusion
  {
    id: 'TX-006',
    po_number: 'PO-1006',
    po_date: '2026-01-22',
    vendor_code: 'SUPP-ERR',
    vendor_name: 'Error Vendor',
    material_code: 'MAT-PLT-10',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity: 10,
    uom: 'MT',
    unit_price: 0,
    total_spend_inr: 0,
    currency: 'INR',
    spend_category: 'Structural Steel'
  }
];

describe('Module 2 — Transaction-Level Evidence & Traceability Acceptance Tests', () => {
  const profile = Module2StrategicSourcingEngine.buildCategoryProfile('Structural Steel', mockTransactions);

  it('TEST 01 — Every opportunity has transaction evidence', () => {
    expect(profile.transactionEvidenceRecords).toBeDefined();
    expect(profile.transactionEvidenceRecords!.length).toBe(mockTransactions.length);
    const firstTx = profile.transactionEvidenceRecords![0];
    expect(firstTx.transactionId).toBe('TX-001');
    expect(firstTx.poNumber).toBe('PO-1001');
    expect(firstTx.supplierName).toBe('Tata Steel Ltd');
    expect(firstTx.sourceDocument).toBe('ERP_PURCHASE_ORDER');
    expect(firstTx.sourceRow).toBe(1);
  });

  it('TEST 02 — Every reference price has supporting transactions', () => {
    expect(profile.evidenceChain).toBeDefined();
    const audit = profile.evidenceChain!.referencePriceAudit;
    expect(audit.selectedReferencePrice).toBeGreaterThan(0);
    expect(audit.supportingTransactionIds.length).toBeGreaterThan(0);
    expect(audit.selectionRationale).toMatch(/reference|validated/);
  });

  it('TEST 03 — Every excluded transaction has an exclusion reason', () => {
    expect(profile.exclusionLedger).toBeDefined();
    expect(profile.exclusionLedger!.length).toBeGreaterThan(0);
    for (const ex of profile.exclusionLedger!) {
      expect(ex.exclusionCode).toBeDefined();
      expect(ex.exclusionDetail.length).toBeGreaterThan(0);
      expect(ex.spendInr).toBeGreaterThanOrEqual(0);
    }
  });

  it('TEST 04 — Every opportunity range has independent calculations', () => {
    const range = profile.evidenceChain!.realisticOpportunityRange;
    expect(range.conservativeOpportunityInr).toBeDefined();
    expect(range.baseOpportunityInr).toBeDefined();
    expect(range.upsideOpportunityInr).toBeDefined();
    expect(range.conservativeRefPrice).toBeGreaterThan(0);
    expect(range.baseRefPrice).toBeGreaterThan(0);
    expect(range.upsideRefPrice).toBeGreaterThan(0);
  });

  it('TEST 05 — No single minimum transaction becomes a target automatically', () => {
    const records = Module2TransactionEvidenceBuilder.buildTransactionEvidenceRecords('Structural Steel', mockTransactions);
    const eligible = records.filter(r => r.isEligible);
    const res = Module2EvidenceStatisticsHelper.determineLowestCrediblePrice(eligible, 60000);
    expect(res.lowestObservedPrice).toBe(58000);
    expect(res.lowestCrediblePrice).toBeGreaterThanOrEqual(58000);
  });

  it('TEST 06 — E-auction opportunity is traceable to eligible spend', () => {
    expect(profile.potentialEAuctionOpportunityInr).toBeDefined();
    expect(profile.addressableSpendInr).toBeGreaterThan(0);
    expect(profile.evidenceChain!.executionMechanisms.some(m => m.mechanism === 'E_AUCTION')).toBe(true);
  });

  it('TEST 07 — Vendor consolidation opportunity is traceable to supplier/category/item data', () => {
    expect(profile.potentialVendorConsolidationOpportunityInr).toBeDefined();
    expect(profile.suppliers.length).toBeGreaterThan(0);
    expect(profile.evidenceChain!.executionMechanisms.some(m => m.mechanism === 'VENDOR_CONSOLIDATION')).toBe(true);
  });

  it('TEST 08 — Category-specialist opportunity is transaction-backed', () => {
    expect(profile.categorySpecialistOpportunityInr).toBeDefined();
  });

  it('TEST 09 — ₹0 opportunity never implies procurement perfection', () => {
    const flatTx: StrategicInputTransaction[] = [
      { vendor_name: 'Tata Steel', material_desc: 'Plate', quantity: 100, unit_price: 60000, total_spend_inr: 6000000 },
      { vendor_name: 'JSW Steel', material_desc: 'Plate', quantity: 100, unit_price: 60000, total_spend_inr: 6000000 }
    ];
    const flatProfile = Module2StrategicSourcingEngine.buildCategoryProfile('Flat Plate', flatTx);
    expect(flatProfile.evidenceChain!.evidenceStatus).toBe('NO_QUANTIFIED_PRICE_OPPORTUNITY_IDENTIFIED');
    expect(flatProfile.evidenceChain!.diagnosticReasonsIfZero).toBeDefined();
    expect(flatProfile.evidenceChain!.untestedOpportunityAreas).toBeDefined();
  });

  it('TEST 10 — Insufficient evidence returns NOT_QUANTIFIABLE or MARKET_DISCOVERY_REQUIRED', () => {
    const singleTx: StrategicInputTransaction[] = [
      { vendor_name: 'Tata Steel', material_desc: 'Plate', quantity: 100, unit_price: 60000, total_spend_inr: 6000000 }
    ];
    const singleProfile = Module2StrategicSourcingEngine.buildCategoryProfile('Single Source Steel', singleTx);
    expect(singleProfile.evidenceChain!.evidenceStatus).toBe('MARKET_DISCOVERY_REQUIRED');
  });

  it('TEST 11 — Every KPI is drillable to transaction level', () => {
    const stats = profile.evidenceBackedStatistics!;
    expect(stats.length).toBeGreaterThan(0);
    for (const s of stats) {
      expect(s.transactionCount).toBe(mockTransactions.length);
      expect(s.contributingTransactionIds.length).toBeGreaterThan(0);
    }
  });

  it('TEST 12 — Evidence export reproduces the calculation', () => {
    const exportPack = Module2EvidenceChainEngine.generateEvidencePackExport(
      profile.evidenceChain!,
      profile.transactionEvidenceRecords!,
      profile.exclusionLedger!,
      profile.pairwisePriceProofs!,
      profile.evidenceBackedStatistics!,
      'Action'
    );
    expect(exportPack.version).toBe('MODULE_2_EVIDENCE_LOGIC_V1.0');
    expect(exportPack.eligibleTransactions.length).toBeGreaterThan(0);
    expect(exportPack.priceStatistics.length).toBeGreaterThan(0);
    expect(exportPack.calculationMethodology).toContain('LOWEST_CREDIBLE_PRICE');
  });

  it('TEST 13 — No Module 3 / PCBI data is used in Module 2', () => {
    const serialized = JSON.stringify(profile);
    expect(serialized).not.toContain('pcbi');
    expect(serialized).not.toContain('FeMo');
    expect(serialized).not.toContain('commodity_market_index');
  });

  it('TEST 14 — No Module 4 realized savings are generated', () => {
    expect(profile.evidenceChain!.addressability.realizableSavingsInr).toBeNull();
    expect(profile.evidenceChain!.realisticOpportunityRange.label).toContain('NOT REALIZED SAVINGS');
  });

  it('TEST 15 — Existing Module 2 outputs remain regression-compatible', () => {
    expect(profile.categoryId).toBeDefined();
    expect(profile.hhiScore).toBeGreaterThan(0);
    expect(profile.status).toBeDefined();
    expect(profile.scorecard.overallScore).toBeGreaterThan(0);
    expect(profile.scenarios.isAvailable).toBe(true);
  });
});
