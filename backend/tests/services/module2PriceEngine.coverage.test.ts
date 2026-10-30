/**
 * Coverage tests for Module2PriceEngine.
 * Uses realistic steel plate supplier lines to check dispersion metrics, the credible reference
 * selection cascade, and the opportunity scenario guards.
 */

import { describe, expect, it } from 'vitest';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import type { PriceDispersionMetrics } from '../../src/types/module2StrategicSourcing';
import { CREDIBLE_PRICE_RULES } from '../../src/constants/module2StrategicSourcing';
import { Module2PriceEngine } from '../../src/services/module2PriceEngine';

function supplierLine(
  vendorName: string,
  unitPrice: number,
  quantity: number,
  overrides: Partial<StrategicInputTransaction> = {}
): StrategicInputTransaction {
  return {
    vendor_name: vendorName,
    material_desc: 'Carbon Steel Plate 10mm',
    quantity,
    uom: 'MT',
    unit_price: unitPrice,
    total_spend_inr: unitPrice * quantity,
    currency: 'INR',
    ...overrides
  };
}

function requireDispersion(transactions: StrategicInputTransaction[]): PriceDispersionMetrics {
  const dispersion = Module2PriceEngine.calculatePriceDispersion(transactions);
  if (!dispersion) {
    throw new Error('Expected price dispersion metrics for the fixture lines');
  }
  return dispersion;
}

// Four supplier lines for one plate specification. Total volume is 2,900 MT.
const PLATE_LINES: StrategicInputTransaction[] = [
  supplierLine('Tata Steel Ltd', 65000, 1000),
  supplierLine('JSW Steel Ltd', 60000, 800),
  supplierLine('Jindal Steel & Power', 58000, 600),
  supplierLine('Steel Authority of India Ltd', 59000, 500)
];
const PLATE_DISPERSION = requireDispersion(PLATE_LINES);
const PLATE_REFERENCE = Module2PriceEngine.determineCredibleReferencePrice(PLATE_LINES, PLATE_DISPERSION);
const PLATE_WEIGHTED_AVERAGE = 177300000 / 2900;

describe('Module2PriceEngine.calculatePriceDispersion', () => {
  it('returns null for an empty transaction list', () => {
    expect(Module2PriceEngine.calculatePriceDispersion([])).toBeNull();
  });

  it('returns null when no line carries any quantity', () => {
    expect(Module2PriceEngine.calculatePriceDispersion([supplierLine('Tata Steel Ltd', 65000, 0)])).toBeNull();
  });

  it('computes weighted price, percentiles and volume above P25 for four supplier lines', () => {
    expect(PLATE_DISPERSION.totalQuantity).toBe(2900);
    expect(PLATE_DISPERSION.totalSpendInr).toBe(177300000);
    expect(PLATE_DISPERSION.weightedAveragePrice).toBeCloseTo(PLATE_WEIGHTED_AVERAGE, 6);
    expect(PLATE_DISPERSION.simpleAveragePrice).toBeCloseTo(60500, 6);
    expect(PLATE_DISPERSION.minPrice).toBe(58000);
    expect(PLATE_DISPERSION.maxPrice).toBe(65000);
    expect(PLATE_DISPERSION.medianPrice).toBeCloseTo(59500, 6);
    expect(PLATE_DISPERSION.p10Price).toBeCloseTo(58300, 6);
    expect(PLATE_DISPERSION.p25Price).toBeCloseTo(58750, 6);
    expect(PLATE_DISPERSION.p50Price).toBeCloseTo(59500, 6);
    expect(PLATE_DISPERSION.p75Price).toBeCloseTo(61250, 6);
    expect(PLATE_DISPERSION.p90Price).toBeCloseTo(63500, 6);
    expect(PLATE_DISPERSION.priceDispersionInr).toBe(7000);
    expect(PLATE_DISPERSION.priceDispersionPct).toBeCloseTo((7000 / PLATE_WEIGHTED_AVERAGE) * 100, 6);
    // Lines priced above P25 (65000, 60000 and 59000) carry 2,300 of the 2,900 MT.
    expect(PLATE_DISPERSION.volumeAboveP25Pct).toBeCloseTo((2300 / 2900) * 100, 6);
  });

  it('reports the high-dispersion interpretation when the price spread exceeds fifteen percent', () => {
    // Weighted average 150, spread 100, so dispersion is 66.7%. Volume above P25 (125) is 50%.
    const metrics = requireDispersion([
      supplierLine('Low Cost Vendor', 100, 100),
      supplierLine('Premium Vendor', 200, 100)
    ]);

    expect(metrics.priceDispersionPct).toBeCloseTo(66.67, 2);
    expect(metrics.dispersionInterpretation).toContain('66.7%');
    expect(metrics.dispersionInterpretation).toContain('50.0%');
  });

  it('reports the tight-clustering interpretation when prices agree within five percent', () => {
    const metrics = requireDispersion([
      supplierLine('Vendor A', 60000, 100),
      supplierLine('Vendor B', 60100, 100),
      supplierLine('Vendor C', 60200, 100)
    ]);

    expect(metrics.priceDispersionPct).toBeLessThanOrEqual(5);
    expect(metrics.dispersionInterpretation).toContain('0.3%');
  });

  it('reports zero dispersion when every priced line sits at zero', () => {
    const metrics = requireDispersion([
      supplierLine('Free Sample Vendor', 0, 500, { total_spend_inr: 0 }),
      supplierLine('Donor Vendor', 0, 300, { total_spend_inr: 0 })
    ]);

    expect(metrics.totalQuantity).toBe(800);
    expect(metrics.weightedAveragePrice).toBe(0);
    expect(metrics.priceDispersionPct).toBe(0);
    expect(metrics.volumeAboveP25Pct).toBe(0);
  });

  it('derives line spend from price and quantity when the spend field is zero, keeping zero lines', () => {
    const metrics = requireDispersion([
      supplierLine('Tata Steel Ltd', 60000, 100, { total_spend_inr: 0 }),
      supplierLine('Donor Vendor', 0, 50, { total_spend_inr: 0 }),
      supplierLine('Cancelled Line Vendor', 59000, 0, { total_spend_inr: 0 })
    ]);

    expect(metrics.totalQuantity).toBe(150);
    expect(metrics.totalSpendInr).toBe(6000000);
    expect(metrics.weightedAveragePrice).toBeCloseTo(40000, 6);
    expect(metrics.minPrice).toBe(0);
    expect(metrics.maxPrice).toBe(60000);
    // P25 of [0, 59000, 60000] is 29,500. Only the 100 MT line at 60,000 adds volume above it.
    expect(metrics.volumeAboveP25Pct).toBeCloseTo((100 / 150) * 100, 6);
  });
});

describe('Module2PriceEngine percentile helper', () => {
  // The helper is private. Bracket access keeps its guard clauses under test because the public
  // methods only ever ask for in-range percentiles.
  const percentileOf = (values: number[], percentile: number): number =>
    Module2PriceEngine['calculatePercentile'](values, percentile);

  it('returns zero for an empty value list', () => {
    expect(percentileOf([], 50)).toBe(0);
  });

  it('returns the only value for a single-value list', () => {
    expect(percentileOf([42], 90)).toBe(42);
  });

  it('interpolates linearly between the two nearest ranks', () => {
    expect(percentileOf([10, 20, 30, 40], 50)).toBeCloseTo(25, 6);
    expect(percentileOf([10, 20, 30, 40], 25)).toBeCloseTo(17.5, 6);
  });

  it('clamps to the largest value when the percentile exceeds one hundred', () => {
    expect(percentileOf([10, 20, 30], 150)).toBe(30);
  });
});

describe('Module2PriceEngine.determineCredibleReferencePrice', () => {
  it('reports no valid reference when there are no transaction lines', () => {
    const result = Module2PriceEngine.determineCredibleReferencePrice([], null);

    expect(result.referencePrice).toBeNull();
    expect(result.methodology).toBe('NO_VALID_REFERENCE');
    expect(result.isCredible).toBe(false);
    expect(result.qualifyingTransactionCount).toBe(0);
  });

  it('reports no valid reference for a missing transaction list', () => {
    // Loosely typed ERP payloads can arrive without a list; the engine must not throw.
    const missingList = null as unknown as StrategicInputTransaction[];
    const result = Module2PriceEngine.determineCredibleReferencePrice(missingList, PLATE_DISPERSION);

    expect(result.methodology).toBe('NO_VALID_REFERENCE');
    expect(result.isCredible).toBe(false);
  });

  it('reports no valid reference when no line has both a positive price and quantity', () => {
    const donorLines = [supplierLine('Donor Vendor', 0, 100, { total_spend_inr: 0 })];
    const result = Module2PriceEngine.determineCredibleReferencePrice(donorLines, requireDispersion(donorLines));

    expect(result.methodology).toBe('NO_VALID_REFERENCE');
    expect(result.referencePrice).toBeNull();
  });

  it('reports no valid reference when dispersion has not been computed', () => {
    const result = Module2PriceEngine.determineCredibleReferencePrice(PLATE_LINES, null);

    expect(result.methodology).toBe('NO_VALID_REFERENCE');
    expect(result.isCredible).toBe(false);
  });

  it('selects the lowest price among lines that carry at least five percent of volume', () => {
    expect(PLATE_REFERENCE).toMatchObject({
      referencePrice: 58000,
      methodology: 'LOWEST_CREDIBLE_PRICE',
      qualifyingTransactionCount: 4,
      isCredible: true
    });
  });

  it('keeps lines below the volume floor or below 65 percent of median out of the candidates', () => {
    // A spot buyer at 40,000 holds 0.3% of volume. A dumping vendor at 30,000 sits below 65% of the
    // 58,500 median. Both are cheaper than the plate suppliers but neither is a credible reference.
    const lines = [
      ...PLATE_LINES,
      supplierLine('Spot Buyer', 40000, 10),
      supplierLine('Dumping Vendor', 30000, 1000)
    ];
    const result = Module2PriceEngine.determineCredibleReferencePrice(lines, requireDispersion(lines));

    expect(result.referencePrice).toBe(58000);
    expect(result.qualifyingTransactionCount).toBe(4);
  });

  it('ignores zero-priced and zero-quantity lines when selecting candidates', () => {
    const lines = [
      ...PLATE_LINES,
      supplierLine('Donor Vendor', 0, 500, { total_spend_inr: 0 }),
      supplierLine('Phantom Vendor', 30000, 0, { total_spend_inr: 0 })
    ];
    const result = Module2PriceEngine.determineCredibleReferencePrice(lines, requireDispersion(lines));

    expect(result.referencePrice).toBe(58000);
    expect(result.qualifyingTransactionCount).toBe(4);
  });

  it('falls back to the P25 price when no line meets the volume floor and P25 sits below the average', () => {
    // Each of 25 lines holds 4% of volume, which is under the 5% floor. P25 is 100 and the average is 120.
    const lines = [
      ...Array.from({ length: 20 }, (_, index) => supplierLine(`Vendor ${index}`, 100, 10)),
      ...Array.from({ length: 5 }, (_, index) => supplierLine(`Premium ${index}`, 200, 10))
    ];
    expect(10 / 250).toBeLessThan(CREDIBLE_PRICE_RULES.MIN_VOLUME_SHARE);

    const result = Module2PriceEngine.determineCredibleReferencePrice(lines, requireDispersion(lines));

    expect(result).toMatchObject({
      referencePrice: 100,
      methodology: 'P25_COMPARABLE_PRICE',
      qualifyingTransactionCount: 25,
      isCredible: true
    });
  });

  it('falls back to the weighted average when prices are homogeneous and no line meets the volume floor', () => {
    const lines = Array.from({ length: 25 }, (_, index) => supplierLine(`Vendor ${index}`, 60000, 10));
    const result = Module2PriceEngine.determineCredibleReferencePrice(lines, requireDispersion(lines));

    expect(result).toMatchObject({
      referencePrice: 60000,
      methodology: 'MEDIAN_COMPARABLE_PRICE',
      qualifyingTransactionCount: 25
    });
  });

  it('uses the weighted average for a single line whose volume share is below the floor', () => {
    const single = [supplierLine('Tata Steel Ltd', 65000, 10)];
    // Declaring 1,000 MT of total volume makes this line's share 1%, which fails the floor.
    const dispersion = { ...requireDispersion(single), totalQuantity: 1000 };
    const result = Module2PriceEngine.determineCredibleReferencePrice(single, dispersion);

    expect(result).toMatchObject({ referencePrice: 65000, methodology: 'MEDIAN_COMPARABLE_PRICE' });
  });

  it('treats a dispersion with no recorded volume as a zero volume share', () => {
    const result = Module2PriceEngine.determineCredibleReferencePrice(PLATE_LINES, {
      ...PLATE_DISPERSION,
      totalQuantity: 0
    });

    expect(result.methodology).toBe('P25_COMPARABLE_PRICE');
    expect(result.referencePrice).toBeCloseTo(58750, 6);
  });
});

describe('Module2PriceEngine.calculateOpportunityScenarios', () => {
  it('marks scenarios unavailable when dispersion is missing', () => {
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, null, PLATE_REFERENCE);

    expect(scenarios.isAvailable).toBe(false);
    expect(scenarios.conservativeOpportunityInr).toBeNull();
    expect(scenarios.baseReferencePrice).toBeNull();
    expect(scenarios.stretchOpportunityInr).toBeNull();
    expect(scenarios.baseMethodology).toBe('N/A');
  });

  it('marks scenarios unavailable when addressable quantity is not positive', () => {
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(0, PLATE_DISPERSION, PLATE_REFERENCE);

    expect(scenarios.isAvailable).toBe(false);
  });

  it('marks scenarios unavailable when the credible reference is not credible', () => {
    const noReference = Module2PriceEngine.determineCredibleReferencePrice([], null);
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, PLATE_DISPERSION, noReference);

    expect(scenarios.isAvailable).toBe(false);
    expect(scenarios.stretchReferencePrice).toBeNull();
  });

  it('quantifies conservative, base and stretch gaps against the weighted average', () => {
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, PLATE_DISPERSION, PLATE_REFERENCE);
    const p25 = PLATE_DISPERSION.p25Price;

    expect(scenarios.isAvailable).toBe(true);
    expect(scenarios.conservativeReferencePrice).toBeCloseTo(p25, 6);
    expect(scenarios.conservativeOpportunityInr).toBe(Math.round((PLATE_WEIGHTED_AVERAGE - p25) * 2900));
    expect(scenarios.baseReferencePrice).toBe(58000);
    expect(scenarios.baseOpportunityInr).toBe(Math.round((PLATE_WEIGHTED_AVERAGE - 58000) * 2900));
    expect(scenarios.stretchReferencePrice).toBe(58000);
    expect(scenarios.stretchOpportunityInr).toBe(Math.round((PLATE_WEIGHTED_AVERAGE - 58000) * 2900));
    expect(scenarios.conservativeOpportunityInr ?? 0).toBeLessThanOrEqual(scenarios.baseOpportunityInr ?? 0);
    expect(scenarios.baseMethodology).toContain('LOWEST_CREDIBLE_PRICE');
  });

  it('uses the median as the base price when the credible reference has no price', () => {
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, PLATE_DISPERSION, {
      ...PLATE_REFERENCE,
      referencePrice: null
    });

    expect(scenarios.baseReferencePrice).toBeCloseTo(59500, 6);
    expect(scenarios.baseOpportunityInr).toBe(Math.round((PLATE_WEIGHTED_AVERAGE - 59500) * 2900));
  });

  it('uses the lowest observed price for stretch when the credible reference price is zero', () => {
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, PLATE_DISPERSION, {
      ...PLATE_REFERENCE,
      referencePrice: 0
    });

    expect(scenarios.baseReferencePrice).toBe(0);
    expect(scenarios.stretchReferencePrice).toBe(58000);
  });

  it('floors negative gaps at zero when the reference price sits above the weighted average', () => {
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, PLATE_DISPERSION, {
      ...PLATE_REFERENCE,
      referencePrice: 70000
    });

    expect(scenarios.baseOpportunityInr).toBe(0);
    expect(scenarios.stretchOpportunityInr).toBe(Math.round((PLATE_WEIGHTED_AVERAGE - 58000) * 2900));
  });

  it('caps the conservative gap at zero when P25 sits above the weighted average', () => {
    const cappedDispersion = { ...PLATE_DISPERSION, p25Price: 62000 };
    const scenarios = Module2PriceEngine.calculateOpportunityScenarios(2900, cappedDispersion, PLATE_REFERENCE);

    expect(scenarios.conservativeOpportunityInr).toBe(0);
  });
});
