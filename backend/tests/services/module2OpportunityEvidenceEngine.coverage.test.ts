/**
 * Coverage tests for Module2OpportunityEvidenceEngine.
 * Covers each evidence state, the two-dimensional lever assessments, and the quartile-based
 * opportunity range, using dispersion metrics computed from realistic steel plate lines.
 */

import { describe, expect, it } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type {
  CategorySupplierStructureItem,
  PriceDispersionMetrics
} from '../../src/types/module2StrategicSourcing';
import {
  Module2OpportunityEvidenceEngine,
  type EvidenceResolutionInput
} from '../../src/services/module2OpportunityEvidenceEngine';
import { Module2PriceEngine } from '../../src/services/module2PriceEngine';

function supplierRow(
  rank: number,
  supplierName: string,
  spendSharePct: number
): CategorySupplierStructureItem {
  const totalSpendInr = Math.round((177300000 * spendSharePct) / 100);
  return {
    supplierId: `SUPP-${rank}`,
    supplierName,
    totalSpendInr,
    totalSpendInrCr: totalSpendInr / 10000000,
    spendSharePct,
    transactionCount: 2,
    transactionSharePct: 25,
    totalQuantity: 725,
    weightedAveragePrice: 61000,
    minPrice: 58000,
    maxPrice: 65000,
    rank,
    isTopSupplier: rank === 1,
    isTailSupplier: rank > 2,
    pricePositionVsComparable: 'AT_AVERAGE',
    potentialConsolidationRelevance: 'Steel plate supplier'
  };
}

// Two suppliers cover the plate category, which leaves too few suppliers for range-based levers.
const SUPPLIERS_FEW: CategorySupplierStructureItem[] = [
  supplierRow(1, 'Tata Steel Ltd', 62),
  supplierRow(2, 'JSW Steel Ltd', 38)
];

const SUPPLIERS_MANY: CategorySupplierStructureItem[] = [
  supplierRow(1, 'Tata Steel Ltd', 40),
  supplierRow(2, 'JSW Steel Ltd', 25),
  supplierRow(3, 'Jindal Steel & Power', 20),
  supplierRow(4, 'Steel Authority of India Ltd', 15)
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

const PLATE_LINES: StrategicInputTransaction[] = [
  supplierLine('Tata Steel Ltd', 65000, 1000),
  supplierLine('JSW Steel Ltd', 60000, 800),
  supplierLine('Jindal Steel & Power', 58000, 600),
  supplierLine('Steel Authority of India Ltd', 59000, 500)
];

function plateDispersion(): PriceDispersionMetrics {
  const dispersion = Module2PriceEngine.calculatePriceDispersion(PLATE_LINES);
  if (!dispersion) {
    throw new Error('Expected price dispersion metrics for the plate fixture');
  }
  return dispersion;
}

const PLATE_DISPERSION = plateDispersion();

function evidenceInput(overrides: Partial<EvidenceResolutionInput> = {}): EvidenceResolutionInput {
  return {
    provenPriceOppInr: 0,
    volumeBundlingOppInr: 0,
    eauctionOppInr: 0,
    consolidationOppInr: 0,
    specialistOppInr: 0,
    netOppInr: 0,
    isMarketDiscoveryRequired: false,
    suppliers: SUPPLIERS_FEW,
    dispersion: null,
    confidence: 'MEDIUM',
    comparableTxCount: 4,
    ...overrides
  };
}

describe('Module2OpportunityEvidenceEngine.resolveEvidenceState', () => {
  it('returns insufficient data when confidence is marked insufficient', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ confidence: 'INSUFFICIENT', dispersion: PLATE_DISPERSION })
    );

    expect(state).toBe('INSUFFICIENT_DATA');
  });

  it('returns insufficient data when no comparable transactions exist', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({
        comparableTxCount: 0,
        dispersion: PLATE_DISPERSION,
        netOppInr: 500000,
        provenPriceOppInr: 500000
      })
    );

    expect(state).toBe('INSUFFICIENT_DATA');
  });

  it('returns proven opportunity only when both the price and net opportunities are positive', () => {
    const proven = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ provenPriceOppInr: 500000, netOppInr: 450000 })
    );
    const unprovenNet = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ provenPriceOppInr: 500000, netOppInr: null })
    );

    expect(proven).toBe('PROVEN_OPPORTUNITY');
    expect(unprovenNet).toBe('LOW_EVIDENCED_OPPORTUNITY');
  });

  it('returns a quantifiable range when the price dispersion spans a quartile band', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ dispersion: PLATE_DISPERSION })
    );

    expect(state).toBe('QUANTIFIABLE_OPPORTUNITY_RANGE');
  });

  it('skips the quantifiable range when the quartile band is collapsed', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({
        dispersion: { ...PLATE_DISPERSION, p75Price: PLATE_DISPERSION.p25Price },
        isMarketDiscoveryRequired: true
      })
    );

    expect(state).toBe('MARKET_DISCOVERY_OPPORTUNITY');
  });

  it('treats a missing dispersion as having no quantifiable range', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ dispersion: null, isMarketDiscoveryRequired: true })
    );

    expect(state).toBe('MARKET_DISCOVERY_OPPORTUNITY');
  });

  it('reports identified-not-quantifiable for a broad supplier pool with null opportunity amounts', () => {
    // Null amounts for proven price, bundling and specialist benefit must be read as zero.
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({
        suppliers: SUPPLIERS_MANY,
        provenPriceOppInr: null,
        volumeBundlingOppInr: null,
        specialistOppInr: null,
        netOppInr: null
      })
    );

    expect(state).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
  });

  it('reports identified-not-quantifiable when a bundling benefit exists with few suppliers', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ volumeBundlingOppInr: 120000 })
    );

    expect(state).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
  });

  it('reports identified-not-quantifiable when a specialist benefit exists with few suppliers', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(
      evidenceInput({ specialistOppInr: 90000 })
    );

    expect(state).toBe('IDENTIFIED_NOT_QUANTIFIABLE');
  });

  it('reports low evidence when no quantifiable range or structural mechanism exists', () => {
    const state = Module2OpportunityEvidenceEngine.resolveEvidenceState(evidenceInput());

    expect(state).toBe('LOW_EVIDENCED_OPPORTUNITY');
  });
});

describe('Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments', () => {
  const LEVER_KEYS = [
    'PRICE_OPPORTUNITY',
    'VOLUME_OPPORTUNITY',
    'E_AUCTION_OPPORTUNITY',
    'SUPPLIER_CONSOLIDATION',
    'CATEGORY_SPECIALIZATION',
    'COMMERCIAL_EXCELLENCE'
  ];

  it('marks every lever as proven when each opportunity amount is positive', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({
        provenPriceOppInr: 500000,
        volumeBundlingOppInr: 120000,
        eauctionOppInr: 500000,
        consolidationOppInr: 250000,
        specialistOppInr: 90000,
        netOppInr: 600000
      }),
      'PROVEN_OPPORTUNITY'
    );

    expect(assessments.map(a => a.dimensionKey)).toEqual(LEVER_KEYS);
    expect(assessments.slice(0, 5).map(a => a.potentialValue)).toEqual([
      'PROVEN',
      'PROVEN',
      'PROVEN',
      'PROVEN',
      'PROVEN'
    ]);
    expect(assessments[0].monetaryValueInr).toBe(500000);
    expect(assessments[0].valueDisplay).toContain('5.00');
    expect(assessments[1].monetaryValueInr).toBe(120000);
    expect(assessments[3].monetaryValueInr).toBe(250000);
    expect(assessments[4].monetaryValueInr).toBe(90000);
  });

  it('treats null opportunity amounts as absent and reports each unproven lever', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({
        provenPriceOppInr: null,
        volumeBundlingOppInr: null,
        eauctionOppInr: null,
        consolidationOppInr: null,
        specialistOppInr: null,
        netOppInr: null
      }),
      'LOW_EVIDENCED_OPPORTUNITY'
    );

    expect(assessments.map(a => a.potentialValue)).toEqual([
      'LOW_EVIDENCED',
      'NOT_QUANTIFIABLE',
      'NOT_QUANTIFIABLE',
      'NOT_QUANTIFIABLE',
      'NOT_QUANTIFIABLE',
      'NOT_QUANTIFIABLE'
    ]);
    expect(assessments.every(a => a.monetaryValueInr === null || a.monetaryValueInr === undefined)).toBe(true);
  });

  it('reports price as market discovery when discovery is required and no proven price exists', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({ isMarketDiscoveryRequired: true }),
      'MARKET_DISCOVERY_OPPORTUNITY'
    );

    expect(assessments[0].potentialValue).toBe('MARKET_DISCOVERY');
  });

  it('downgrades high-confidence volume evidence to medium and keeps the other confidence levels', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({ confidence: 'HIGH' }),
      'QUANTIFIABLE_OPPORTUNITY_RANGE'
    );

    expect(assessments[0].evidenceConfidence).toBe('HIGH');
    expect(assessments[1].evidenceConfidence).toBe('MEDIUM');
    expect(assessments[2].evidenceConfidence).toBe('HIGH');
  });

  it('ranks volume, auction and consolidation as ranges or discovery for a broad supplier pool', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({ suppliers: SUPPLIERS_MANY }),
      'IDENTIFIED_NOT_QUANTIFIABLE'
    );

    expect(assessments[1].potentialValue).toBe('RANGE');
    expect(assessments[2].potentialValue).toBe('MARKET_DISCOVERY');
    expect(assessments[3].potentialValue).toBe('RANGE');
    expect(assessments[4].potentialValue).toBe('NOT_QUANTIFIABLE');
  });

  it('marks volume, auction and consolidation as not quantifiable for a single supplier', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({ suppliers: [SUPPLIERS_FEW[0]] }),
      'LOW_EVIDENCED_OPPORTUNITY'
    );

    expect(assessments[1].potentialValue).toBe('NOT_QUANTIFIABLE');
    expect(assessments[2].potentialValue).toBe('NOT_QUANTIFIABLE');
    expect(assessments[3].potentialValue).toBe('NOT_QUANTIFIABLE');
  });

  it('reports commercial excellence as structural with no monetary value', () => {
    const assessments = Module2OpportunityEvidenceEngine.buildTwoDimensionalAssessments(
      evidenceInput({ provenPriceOppInr: 500000, netOppInr: 500000 }),
      'PROVEN_OPPORTUNITY'
    );

    expect(assessments[5].potentialValue).toBe('NOT_QUANTIFIABLE');
    expect(assessments[5].monetaryValueInr).toBeNull();
    expect(assessments[5].rangeMinInr).toBeNull();
  });
});

describe('Module2OpportunityEvidenceEngine.calculateOpportunityRange', () => {
  it('reports insufficient dispersion data when dispersion or addressable quantity is missing', () => {
    expect(Module2OpportunityEvidenceEngine.calculateOpportunityRange(2900, null)).toMatchObject({
      rangeMinInr: null,
      rangeMaxInr: null,
      rangeMethodology: 'INSUFFICIENT_DISPERSION_DATA'
    });
    expect(Module2OpportunityEvidenceEngine.calculateOpportunityRange(0, PLATE_DISPERSION)).toMatchObject({
      rangeMethodology: 'INSUFFICIENT_DISPERSION_DATA'
    });
  });

  it('reports no material variance when the weighted average sits at or below P25', () => {
    const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(2900, {
      ...PLATE_DISPERSION,
      weightedAveragePrice: PLATE_DISPERSION.p25Price
    });

    expect(range).toMatchObject({
      rangeMinInr: null,
      rangeMaxInr: null,
      rangeMethodology: 'NO_MATERIAL_PRICE_VARIANCE'
    });
  });

  it('uses the P75 gap as the low end when the weighted average exceeds P75', () => {
    const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(2900, {
      ...PLATE_DISPERSION,
      weightedAveragePrice: 70000
    });

    // Low end is 70,000 minus P75 (61,250) and high end is 70,000 minus P25 (58,750).
    expect(range.rangeMinInr).toBe(25375000);
    expect(range.rangeMaxInr).toBe(32625000);
    expect(range.rangeMethodology).toContain('NON_PARAMETRIC_QUARTILE_DISPERSION');
  });

  it('uses half the median gap as the low end when the weighted average sits between median and P75', () => {
    const wap = PLATE_DISPERSION.weightedAveragePrice;
    const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(2900, PLATE_DISPERSION);

    expect(range.rangeMinInr).toBe(Math.round((wap - PLATE_DISPERSION.medianPrice) * 0.5 * 2900));
    expect(range.rangeMaxInr).toBe(Math.round((wap - PLATE_DISPERSION.p25Price) * 2900));
    expect(range.rangeMinInr ?? 0).toBeLessThan(range.rangeMaxInr ?? 0);
  });

  it('falls back to half the high end when the low end rounds to zero', () => {
    // Weighted average 59,000 is below the 59,500 median, so the low delta is zero.
    const range = Module2OpportunityEvidenceEngine.calculateOpportunityRange(2900, {
      ...PLATE_DISPERSION,
      weightedAveragePrice: 59000
    });

    expect(range.rangeMaxInr).toBe(Math.round((59000 - PLATE_DISPERSION.p25Price) * 2900));
    expect(range.rangeMinInr).toBe(Math.round((range.rangeMaxInr ?? 0) * 0.5));
  });
});
