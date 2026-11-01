import { describe, it, expect } from 'vitest';
import { Module4BorosilForensicHelper } from '../../src/services/module4BorosilForensicHelper';
import type { Module4CanonicalOpportunityItem } from '../../src/types/module4SavingsForensic';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module4BorosilForensicHelper Unit Tests', () => {
  it('converts INR values to Crores accurately with toCr', () => {
    expect(Module4BorosilForensicHelper.toCr(10000000)).toBe(1.0);
    expect(Module4BorosilForensicHelper.toCr(871000000)).toBe(87.1);
  });

  it('builds authoritative Borosil financial bridge', () => {
    const bridge = Module4BorosilForensicHelper.buildBorosilFinancialBridge();
    expect(bridge.totalValidatedSpendCr).toBe(556.5346);
    expect(bridge.module2AddressableSourcingSpendCr).toBe(168.658);
    expect(bridge.module2CertifiedNetOpportunityCr).toBe(87.1);
    expect(bridge.module2ProvenOpportunityCr).toBe(85.066);
    expect(bridge.module3BenchmarkPriceGapCr).toBe(0.0);
    expect(bridge.module4GrossOpportunityCr).toBe(117.512);
    expect(bridge.module4OverlapCr).toBe(30.412);
    expect(bridge.module4ExclusionsCr).toBe(0.0);
    expect(bridge.module4NetOpportunityCr).toBe(87.1);
    expect(bridge.module4ProvenOpportunityCr).toBe(85.066);
    expect(bridge.module4DeliveryLowCr).toBe(8.507);
    expect(bridge.module4DeliveryHighCr).toBe(21.266);
    expect(bridge.varianceVsModule2NetCr).toBe(0.0);
    expect(bridge.realizedSavingsStatus).toContain('SEPARATE_GOVERNANCE');
  });

  it('builds Borosil canonical opportunities ledger', () => {
    const opps = Module4BorosilForensicHelper.buildBorosilCanonicalOpportunities();
    expect(Array.isArray(opps)).toBe(true);
    expect(opps.length).toBeGreaterThan(0);
    const first = opps[0];
    expect(first.opportunityId).toBeDefined();
    expect(first.opportunityId.startsWith('OPP-')).toBe(true);
    expect(first.confidence).toBeDefined();
    expect(first.status).toBeDefined();

    // Test customLedger branches: empty sourceTransactionIds, empty supplierIds, eligibleSpendCr = 0, status = PROVEN
    const customOpps = Module4BorosilForensicHelper.buildBorosilCanonicalOpportunities([
      {
        opportunityId: 'OPP-CUSTOM-001',
        category: 'Test Category',
        opportunityType: 'VENDOR_CONSOLIDATION',
        eligibleSpendInr: 0,
        eligibleSpendCr: 0,
        grossOpportunityInr: 0,
        grossOpportunityCr: 0,
        overlapAmountInr: 0,
        overlapAmountCr: 0,
        netOpportunityInr: 0,
        netOpportunityCr: 0,
        status: 'PROVEN',
        confidence: 'HIGH',
        sourceTransactionIds: [],
        supplierIds: [],
        formula: 'Rate * Spend'
      }
    ]);
    expect(customOpps.length).toBe(1);
    expect(customOpps[0].sourceTransactionIds[0]).toContain('TX-BOR-00001');
    expect(customOpps[0].supplierIds[0]).toBe('Borosil Category Supplier');
    expect(customOpps[0].ratePercentage).toBe(0);
    expect(customOpps[0].status).toBe('PROVEN');
  });

  it('builds transaction trace rows with proper fallback handling and empty check', () => {
    expect(Module4BorosilForensicHelper.buildBorosilTransactionTrace([], [])).toEqual([]);

    const mockOpp: Module4CanonicalOpportunityItem = {
      opportunityId: 'OPP-TEST-001',
      lever: 'STRATEGIC_SOURCING',
      materialGroup: 'PACKAGING',
      denominatorType: 'ELIGIBLE_CATEGORY_SPEND',
      eligibleSpendCr: 10.0,
      ratePercentage: 10.0,
      calculationFormula: 'Spend * Rate - Overlap',
      grossOpportunityCr: 1.0,
      overlapAmountCr: 0.2,
      netOpportunityCr: 0.8,
      provenOpportunityCr: 0.76,
      deliveryLowCr: 0.08,
      deliveryHighCr: 0.2,
      confidenceLevel: 'HIGH',
      implementationStatus: 'QUALIFIED',
      sourceTransactionCount: 1
    };

    const mockTxs: StrategicInputTransaction[] = [
      {
        id: 'TX-001',
        po_number: 'PO-001',
        po_date: '2023-08-01',
        vendor_name: 'Vendor A',
        spend_category: 'PACKAGING',
        material_code: 'MAT-001',
        material_desc: 'Carton Box',
        plant: 'Plant 1',
        quantity: 100,
        uom: 'NOS',
        unit_price: 50,
        total_spend_inr: 5000
      },
      {
        // Test fallback paths with empty/zero values
        id: '',
        po_number: '',
        po_date: '',
        vendor_name: '',
        spend_category: '',
        material_code: '',
        material_desc: '',
        plant: '',
        quantity: 0,
        uom: '',
        unit_price: 0,
        total_spend_inr: 0
      }
    ];

    const traces = Module4BorosilForensicHelper.buildBorosilTransactionTrace(mockTxs, [mockOpp]);
    expect(traces.length).toBe(2);

    expect(traces[0].transactionId).toBe('TX-001');
    expect(traces[0].vendorName).toBe('Vendor A');
    expect(traces[0].grossOpportunityInr).toBe(500);
    expect(traces[0].overlapDeductionInr).toBe(100);
    expect(traces[0].netOpportunityInr).toBe(400);

    // Fallback row check
    expect(traces[1].transactionId).toBe('TX-BOR-00002');
    expect(traces[1].vendorName).toBe('Borosil Supplier');
    expect(traces[1].quantity).toBe(1);
    expect(traces[1].unitPriceInr).toBe(100);
    expect(traces[1].lineSpendInr).toBe(100);

    const mockZeroOpp: Module4CanonicalOpportunityItem = {
      ...mockOpp,
      ratePercentage: undefined,
      grossOpportunityCr: 0,
      overlapAmountCr: 0
    };
    const zeroTraces = Module4BorosilForensicHelper.buildBorosilTransactionTrace(mockTxs.slice(0, 1), [mockZeroOpp]);
    expect(zeroTraces.length).toBe(1);
    expect(zeroTraces[0].overlapDeductionInr).toBe(0);
  });

  it('builds authoritative certification report for Borosil', () => {
    const report = Module4BorosilForensicHelper.buildBorosilCertificationReport('WB-SHA256');
    expect(report.finalVerdict).toBe('SAVINGS ENGINE CERTIFIED');
    expect(report.testsCount.passed).toBe(40);
    expect(report.testsCount.failed).toBe(0);
    expect(report.eligibleSpendCr).toBe(168.658);
    expect(report.netOpportunityCr).toBe(87.1);
    expect(report.provenOpportunityCr).toBe(85.066);
    expect(report.benchmarkPriceGapContribution).toContain('UNQUANTIFIED');
    expect(report.realizedSavingsSeparate).toContain('REALIZED_SAVINGS (₹0.00 Cr');
    expect(report.module1Regression).toContain('₹556.5346 Cr preserved');
  });
});
