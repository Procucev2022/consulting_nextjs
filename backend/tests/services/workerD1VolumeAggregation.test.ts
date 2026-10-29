import { describe, expect, it } from 'vitest';
import { buildVolumeAggregationResult } from '../../src/services/workerD1VolumeAggregation';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

const transaction = (overrides: Partial<StrategicInputTransaction> = {}): StrategicInputTransaction => ({
  id: 'TX-1', vendor_name: 'Supplier A', material_code: 'MAT-1', material_desc: 'Resin Grade A',
  quantity: 10, uom: 'KG', unit_price: 100, total_spend_inr: 1000, po_date: '2026-01-10',
  plant: 'PLANT-1', spend_category: 'Resin', ...overrides
});

describe('buildVolumeAggregationResult', () => {
  it('returns reconciled empty coverage for an empty assessment dataset', () => {
    const result = buildVolumeAggregationResult('ASSESSMENT-1', []);
    expect(result.assessmentId).toBe('ASSESSMENT-1');
    expect(result.coverageSummary).toMatchObject({
      totalTransactionsCount: 0, totalMaterialRecordsCount: 0, totalIncurredSpendInr: 0,
      potentiallyAggregatableSpendInr: 0, reconciliationDeltaInr: 0
    });
    expect(result.tier1Opportunities).toEqual([]);
    expect(result.plantProfiles).toEqual([]);
  });

  it('identifies exact material and UOM purchases across plants without claiming savings', () => {
    const rows = [
      transaction({ id: 'TX-1', total_spend_inr: 1000, quantity: 10 }),
      transaction({ id: 'TX-2', plant: 'PLANT-2', po_date: '2026-02-11', total_spend_inr: 3000, quantity: 20 })
    ];
    const result = buildVolumeAggregationResult('ASSESSMENT-2', rows);
    expect(result.tier1Opportunities).toHaveLength(1);
    expect(result.tier1Opportunities[0]).toMatchObject({
      materialCode: 'MAT-1', baseUom: 'KG', plantCount: 2, transactionCount: 2,
      potentiallyAggregatableSpendInr: 4000, aggregatableQuantity: 30,
      opportunityStatus: 'Technical Validation Required', technicalValidationRequired: true,
      isGenuineOpportunity: true
    });
    expect(result.tier1Opportunities[0].wavgUnitPriceInr).toBeCloseTo(4000 / 30);
    expect(result.coverageSummary).toMatchObject({
      totalIncurredSpendInr: 4000, genuineOpportunitySpendInr: 4000,
      excludedPhysicalAggregationSpendInr: 0, reconciliationDeltaInr: 0
    });
    expect(result.methodologyDisclosures[0]).toContain('no savings are estimated');
  });

  it('keeps single-purchase, single-plant and unsupported records out of candidates', () => {
    const rows = [
      transaction({ id: 'TX-SINGLE', material_code: 'MAT-SINGLE', plant: 'P1' }),
      transaction({ id: 'TX-SAME-PLANT', material_code: 'MAT-LOCAL', plant: 'P2' }),
      transaction({ id: 'TX-SAME-PLANT-2', material_code: 'MAT-LOCAL', plant: 'P2' }),
      transaction({ id: 'TX-NO-UOM', material_code: 'MAT-UNKNOWN', plant: 'P3', uom: undefined }),
      transaction({ id: 'TX-NO-CODE', material_code: undefined, plant: 'P4' })
    ];
    const result = buildVolumeAggregationResult('ASSESSMENT-3', rows);
    expect(result.tier1Opportunities).toEqual([]);
    expect(result.coverageSummary.singleIsolatedPurchaseCount).toBe(3);
    expect(result.coverageSummary.uomIncompatibleCount).toBe(1);
    expect(result.materialProfiles.some((profile) => profile.materialCode === '')).toBe(true);
    expect(result.materialProfiles.find((profile) => profile.materialCode === 'MAT-UNKNOWN')?.hasIncompatibleUom).toBe(true);
  });

  it('normalizes material identity and UOM and splits inconsistent UOM records', () => {
    const rows = [
      transaction({ material_code: ' mat-1 ', uom: 'kg', plant: 'P1', po_date: 'bad-date' }),
      transaction({ id: 'TX-2', material_code: 'MAT-1', uom: ' KG ', plant: 'P2', po_date: undefined }),
      transaction({ id: 'TX-3', material_code: 'MAT-1', uom: 'L', plant: 'P3' })
    ];
    const result = buildVolumeAggregationResult('ASSESSMENT-4', rows);
    expect(result.coverageSummary.totalMaterialRecordsCount).toBe(2);
    expect(result.tier1Opportunities).toHaveLength(1);
    expect(result.tier1Opportunities[0].materialCode).toBe('MAT-1');
    expect(result.tier1Opportunities[0].demandClassification).toBe('INSUFFICIENT_HISTORY');
    expect(result.plantProfiles.map((profile) => profile.plantCode)).toEqual(['P1', 'P2', 'P3']);
  });

  it('handles missing plants, suppliers, dates and non-finite source amounts safely', () => {
    const rows = [
      transaction({ id: undefined, vendor_name: '', material_code: '', material_desc: '', uom: '', plant: '', po_date: '', total_spend_inr: NaN, quantity: Infinity })
    ];
    const result = buildVolumeAggregationResult('ASSESSMENT-5', rows);
    expect(result.coverageSummary.totalIncurredSpendInr).toBe(0);
    expect(result.plantProfiles).toMatchObject([{ plantCode: 'UNASSIGNED-1', supplierCount: 0 }]);
    expect(result.tier1Opportunities).toEqual([]);
    expect(result.methodologyDisclosures).toHaveLength(1);
  });

  it('classifies recurrence from multiple observed months and includes weighted unit price', () => {
    const result = buildVolumeAggregationResult('ASSESSMENT-6', [
      transaction({ po_date: '2026-03-01', total_spend_inr: 200, quantity: 4, plant: 'A' }),
      transaction({ id: 'TX-2', po_date: '2026-04-01', total_spend_inr: 400, quantity: 8, plant: 'B' })
    ]);
    expect(result.materialProfiles[0]).toMatchObject({
      demandClassification: 'RECURRING', totalSpendInr: 600, totalQuantity: 12,
      wavgPriceInr: 50, plantVolumeDispersionIndex: 0.5
    });
  });
});
