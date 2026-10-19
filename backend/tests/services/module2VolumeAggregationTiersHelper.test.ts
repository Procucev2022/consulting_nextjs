/**
 * Module 2 — Lever 4: Volume Aggregation TiersHelper & PlantHelper Unit Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import { describe, it, expect } from 'vitest';
import { Module2VolumeAggregationTiersHelper } from '../../src/services/module2VolumeAggregationTiersHelper';
import { Module2VolumeAggregationPlantHelper } from '../../src/services/module2VolumeAggregationPlantHelper';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module2VolumeAggregationTiersHelper & PlantHelper', () => {
  it('flags unverified differing packaging units on same material as FURTHER_DATA_REQUIRED', () => {
    const mixedPackagingMat = new Map<string, StrategicInputTransaction[]>([
      [
        'MAT-MIXED',
        [
          {
            material_code: 'MAT-MIXED',
            material_desc: 'Specialty Bolts',
            vendor_name: 'V1',
            quantity: 50,
            uom: 'BOX',
            unit_price: 100,
            total_spend_inr: 5000,
            plant: '1000'
          },
          {
            material_code: 'MAT-MIXED',
            material_desc: 'Specialty Bolts',
            vendor_name: 'V1',
            quantity: 100,
            uom: 'EA',
            unit_price: 2,
            total_spend_inr: 200,
            plant: '1000'
          }
        ]
      ]
    ]);

    const t1 = Module2VolumeAggregationTiersHelper.buildTier1Opportunities(mixedPackagingMat);
    expect(t1.length).toBe(1);
    expect(t1[0].opportunityStatus).toBe('Further Data Required');
    expect(t1[0].eligibilityType).toBe('INCOMPATIBLE_UOM');
    expect(t1[0].excludedQuantity).toBe(100);
    expect(t1[0].isGenuineOpportunity).toBe(false);
  });

  it('classifies single purchase records as LIMITED_HISTORY without declaring categorically unsuitable', () => {
    const singleMat = new Map<string, StrategicInputTransaction[]>([
      [
        'MAT-SINGLE',
        [
          {
            material_code: 'MAT-SINGLE',
            material_desc: 'Special Tool',
            vendor_name: 'V1',
            quantity: 1,
            uom: 'EA',
            unit_price: 50000,
            total_spend_inr: 50000,
            plant: '1000'
          }
        ]
      ]
    ]);

    const t1 = Module2VolumeAggregationTiersHelper.buildTier1Opportunities(singleMat);
    expect(t1.length).toBe(1);
    expect(t1[0].demandClassification).toBe('INSUFFICIENT_HISTORY');
    expect(t1[0].opportunityStatus).toBe('Commercial Evaluation Required');
    expect(t1[0].eligibilityType).toBe('LIMITED_HISTORY_NO_HISTORICAL_PATTERN');
    expect(t1[0].isGenuineOpportunity).toBe(false);
    expect(t1[0].potentiallyAggregatableSpendInr).toBe(0);
    expect(t1[0].totalHistoricalSpendInr).toBe(50000);
    expect(t1[0].demandClassificationEvidence).toBeDefined();
  });

  it('builds Tier 1, Tier 2, and Tier 3 opportunities with appropriate governance flags', () => {
    const matGroups = new Map<string, StrategicInputTransaction[]>([
      [
        'MAT-01',
        [
          {
            material_code: 'MAT-01',
            material_desc: 'Bearing 6204',
            vendor_name: 'V1',
            quantity: 50,
            uom: 'EA',
            unit_price: 200,
            total_spend_inr: 10000,
            plant: '1000'
          },
          {
            material_code: 'MAT-01',
            material_desc: 'Bearing 6204',
            vendor_name: 'V2',
            quantity: 50,
            uom: 'EA',
            unit_price: 190,
            total_spend_inr: 9500,
            plant: '2200'
          }
        ]
      ]
    ]);

    const t1 = Module2VolumeAggregationTiersHelper.buildTier1Opportunities(matGroups);
    expect(t1.length).toBe(1);
    expect(t1[0].tier).toBe('TIER_1_IDENTICAL');
    expect(t1[0].aggregatableQuantity).toBe(100);
    expect(t1[0].plantCount).toBe(2);
    expect(t1[0].conversionAuditTrail?.length).toBe(2);

    const unspscGroups = new Map<string, StrategicInputTransaction[]>([
      [
        '31171504',
        [
          {
            material_code: 'MAT-A',
            material_desc: 'Roller Bearing A',
            vendor_name: 'V1',
            quantity: 10,
            total_spend_inr: 5000,
            unspsc_code: '31171504'
          },
          {
            material_code: 'MAT-B',
            material_desc: 'Roller Bearing B',
            vendor_name: 'V2',
            quantity: 15,
            total_spend_inr: 7500,
            unspsc_code: '31171504'
          }
        ]
      ]
    ]);

    const t2 = Module2VolumeAggregationTiersHelper.buildTier2Opportunities(unspscGroups);
    expect(t2.length).toBe(1);
    expect(t2[0].tier).toBe('TIER_2_COMPARABLE');
    expect(t2[0].opportunityStatus).toBe('Technical Validation Required');
    expect(t2[0].aggregatableQuantity).toBe(0);

    const catGroups = new Map<string, StrategicInputTransaction[]>([
      [
        'Industrial Consumables',
        [
          {
            material_desc: 'Consumable 1',
            vendor_name: 'V1',
            quantity: 100,
            total_spend_inr: 20000,
            spend_category: 'Industrial Consumables'
          }
        ]
      ]
    ]);

    const t3 = Module2VolumeAggregationTiersHelper.buildTier3Opportunities(catGroups);
    expect(t3.length).toBe(1);
    expect(t3[0].tier).toBe('TIER_3_CATEGORY');
    expect(t3[0].aggregatableQuantity).toBe(0);
  });

  it('builds plant profiles and material profiles with descriptive metrics', () => {
    const txs: StrategicInputTransaction[] = [
      {
        plant: '1000',
        total_spend_inr: 50000,
        quantity: 10,
        material_code: 'M1',
        material_desc: 'Desc 1',
        vendor_name: 'V1'
      },
      {
        plant: '2200',
        total_spend_inr: 50000,
        quantity: 10,
        material_code: 'M1',
        material_desc: 'Desc 1',
        vendor_name: 'V2'
      }
    ];
    const plantProfs = Module2VolumeAggregationPlantHelper.buildPlantProfiles(txs, 100000);
    expect(plantProfs.length).toBe(2);
    expect(plantProfs[0].volumeSharePct).toBe(50);

    const matGroups = new Map([['M1', txs]]);
    const matProfs = Module2VolumeAggregationPlantHelper.buildMaterialProfiles(matGroups);
    expect(matProfs.length).toBe(1);
    expect(matProfs[0].totalQuantity).toBe(20);
    expect(matProfs[0].plantVolumeDispersionIndex).toBe(0.5);
    expect(matProfs[0].demandClassificationEvidence).toBeDefined();
  });

  it('identifies multi-vendor single-facility and temporal repeat lot consolidation', () => {
    const multiVendor = new Map([
      [
        'MV-1',
        [
          {
            material_code: 'MV-1',
            material_desc: 'Paint',
            vendor_name: 'V1',
            quantity: 10,
            uom: 'EA',
            plant: '1000',
            total_spend_inr: 1000
          },
          {
            material_code: 'MV-1',
            material_desc: 'Paint',
            vendor_name: 'V2',
            quantity: 10,
            uom: 'EA',
            plant: '1000',
            total_spend_inr: 1000
          }
        ]
      ]
    ]);
    const mvRes = Module2VolumeAggregationTiersHelper.buildTier1Opportunities(multiVendor);
    expect(mvRes[0].eligibilityType).toBe('MULTI_VENDOR_ALLOCATION');

    const repeatTx = new Map([
      [
        'RP-1',
        [
          {
            material_code: 'RP-1',
            material_desc: 'Grease',
            vendor_name: 'V1',
            quantity: 5,
            uom: 'EA',
            plant: '1000',
            total_spend_inr: 500,
            po_date: '2024-01-01'
          },
          {
            material_code: 'RP-1',
            material_desc: 'Grease',
            vendor_name: 'V1',
            quantity: 5,
            uom: 'EA',
            plant: '1000',
            total_spend_inr: 500,
            po_date: '2024-02-01'
          }
        ]
      ]
    ]);
    const rpRes = Module2VolumeAggregationTiersHelper.buildTier1Opportunities(repeatTx);
    expect(rpRes[0].eligibilityType).toBe('TEMPORAL_LOT_CONSOLIDATION');

    const unkPlant = Module2VolumeAggregationPlantHelper.buildPlantProfiles(
      [{ plant: '9999', total_spend_inr: 1000 }],
      1000
    );
    expect(unkPlant[0].plantName).toBe('Facility 9999');

    const mixedMatProf = Module2VolumeAggregationPlantHelper.buildMaterialProfiles(
      new Map([
        [
          'MX-1',
          [
            { material_code: 'MX-1', material_desc: 'Wire', quantity: 10, uom: 'M', total_spend_inr: 100 },
            {
              material_code: 'MX-1',
              material_desc: 'Wire',
              quantity: 5,
              uom: 'BARREL_UNKNOWN',
              total_spend_inr: 50
            }
          ]
        ]
      ])
    );
    expect(mixedMatProf[0].hasIncompatibleUom).toBe(true);
  });
});
