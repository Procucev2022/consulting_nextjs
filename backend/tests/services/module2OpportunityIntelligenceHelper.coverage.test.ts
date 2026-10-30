/**
 * Coverage tests for Module2OpportunityIntelligenceHelper.
 * Covers the integration output when auction, consolidation and net opportunity amounts are
 * present and when they are absent, using a realistic steel plate price dispersion.
 */

import { describe, expect, it } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { CategorySupplierStructureItem } from '../../src/types/module2StrategicSourcing';
import { OPPORTUNITY_EVIDENCE_STATE_LABELS } from '../../src/constants/module2OpportunityIntelligence';
import { Module2OpportunityEvidenceEngine } from '../../src/services/module2OpportunityEvidenceEngine';
import { Module2PriceEngine } from '../../src/services/module2PriceEngine';
import {
  Module2OpportunityIntelligenceHelper,
  type OpportunityIntelligenceIntegrationInput
} from '../../src/services/module2OpportunityIntelligenceHelper';

function supplierRow(rank: number, supplierName: string, spendSharePct: number): CategorySupplierStructureItem {
  const totalSpendInr = Math.round((177300000 * spendSharePct) / 100);
  return {
    supplierId: `SUPP-${rank}`,
    supplierName,
    totalSpendInr,
    totalSpendInrCr: totalSpendInr / 10000000,
    spendSharePct,
    transactionCount: 2,
    transactionSharePct: 33.3,
    totalQuantity: 1000,
    weightedAveragePrice: 61000,
    minPrice: 58000,
    maxPrice: 65000,
    rank,
    isTopSupplier: rank === 1,
    isTailSupplier: rank === 3,
    pricePositionVsComparable: 'AT_AVERAGE',
    potentialConsolidationRelevance: 'Steel plate supplier'
  };
}

const SUPPLIERS: CategorySupplierStructureItem[] = [
  supplierRow(1, 'Tata Steel Ltd', 50),
  supplierRow(2, 'JSW Steel Ltd', 30),
  supplierRow(3, 'Jindal Steel & Power', 20)
];

function supplierLine(vendorName: string, unitPrice: number, quantity: number): StrategicInputTransaction {
  return {
    vendor_name: vendorName,
    material_desc: 'Carbon Steel Plate 10mm',
    quantity,
    uom: 'MT',
    unit_price: unitPrice,
    total_spend_inr: unitPrice * quantity,
    currency: 'INR'
  };
}

const PLATE_DISPERSION = (() => {
  const dispersion = Module2PriceEngine.calculatePriceDispersion([
    supplierLine('Tata Steel Ltd', 65000, 1000),
    supplierLine('JSW Steel Ltd', 60000, 800),
    supplierLine('Jindal Steel & Power', 58000, 600),
    supplierLine('Steel Authority of India Ltd', 59000, 500)
  ]);
  if (!dispersion) {
    throw new Error('Expected price dispersion metrics for the plate fixture');
  }
  return dispersion;
})();

function integrationInput(
  overrides: Partial<OpportunityIntelligenceIntegrationInput> = {}
): OpportunityIntelligenceIntegrationInput {
  return {
    categoryName: 'Structural Steel',
    totalSpendInr: 177300000,
    addressableSpendInr: 177300000,
    comparableSpendInr: 177300000,
    addressableQuantity: 2900,
    suppliers: SUPPLIERS,
    fragmentationLevel: 'MODERATE_FRAGMENTATION',
    priceDispersion: PLATE_DISPERSION,
    isRecurring: true,
    activeMonthsCount: 6,
    comparableTxCount: 4,
    totalTxCount: 4,
    confidence: 'HIGH',
    eauctionOppInr: 6000000,
    consolidationOppInr: 3000000,
    volumeBundlingOppInr: 0,
    specialistOppInr: 0,
    overlapOppInr: 0,
    netOppInr: 9000000,
    ...overrides
  };
}

describe('Module2OpportunityIntelligenceHelper.buildIntelligence', () => {
  it('derives a proven state and waterfall totals when price and net opportunities are positive', () => {
    const result = Module2OpportunityIntelligenceHelper.buildIntelligence(integrationInput());
    const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(2900, PLATE_DISPERSION);

    expect(result.evidenceState).toBe('PROVEN_OPPORTUNITY');
    expect(result.evidenceStateLabel).toBe(OPPORTUNITY_EVIDENCE_STATE_LABELS.PROVEN_OPPORTUNITY);
    expect(result.twoDimensionalAssessments).toHaveLength(6);
    expect(result.waterfallV2).toHaveLength(13);
    expect(result.waterfallV2[12].eligibleAmountInr).toBe(9000000);
    expect(result.opportunityRangeMinInr).toBe(range.rangeMinInr);
    expect(result.opportunityRangeMaxInr).toBe(range.rangeMaxInr);
    expect(result.opportunityRangeMethodology).toBe(range.rangeMethodology);
  });

  it('treats missing auction, consolidation and net amounts as zero', () => {
    const result = Module2OpportunityIntelligenceHelper.buildIntelligence(
      integrationInput({ eauctionOppInr: null, consolidationOppInr: null, netOppInr: null })
    );

    expect(result.evidenceState).toBe('QUANTIFIABLE_OPPORTUNITY_RANGE');
    expect(result.twoDimensionalAssessments[0].monetaryValueInr).toBeNull();
    expect(result.waterfallV2).toHaveLength(13);
    expect(result.waterfallV2[12].eligibleAmountInr).toBe(0);
  });

  it('routes a single-supplier category without dispersion to market discovery', () => {
    const result = Module2OpportunityIntelligenceHelper.buildIntelligence(
      integrationInput({
        suppliers: [SUPPLIERS[0]],
        priceDispersion: null,
        confidence: 'LOW',
        comparableTxCount: 1,
        totalTxCount: 1,
        activeMonthsCount: 1,
        isRecurring: false,
        eauctionOppInr: 0,
        consolidationOppInr: 0,
        netOppInr: 0
      })
    );

    expect(result.marketDiscovery.isMarketDiscoveryRequired).toBe(true);
    expect(result.evidenceState).toBe('MARKET_DISCOVERY_OPPORTUNITY');
    expect(result.opportunityRangeMinInr).toBeNull();
    expect(result.opportunityRangeMethodology).toBe('INSUFFICIENT_DISPERSION_DATA');
  });

  it('reports insufficient data when there are no comparable transactions', () => {
    const result = Module2OpportunityIntelligenceHelper.buildIntelligence(
      integrationInput({ comparableTxCount: 0, confidence: 'INSUFFICIENT' })
    );

    expect(result.evidenceState).toBe('INSUFFICIENT_DATA');
    expect(result.evidenceStateLabel).toBe(OPPORTUNITY_EVIDENCE_STATE_LABELS.INSUFFICIENT_DATA);
  });

  it('passes commercial, procurement maturity and action outputs through with the category name', () => {
    const result = Module2OpportunityIntelligenceHelper.buildIntelligence(integrationInput());

    expect(result.commercialExcellence.dimensions).toHaveLength(12);
    expect(result.procurementMaturity.dimensions).toHaveLength(10);
    expect(result.actionRecommendation.whatWeFound).toContain('Structural Steel');
  });
});
