/**
 * Module 2 — Lever 4: Volume Aggregation Tiers 2 & 3 Helper Unit Tests
 * Strict >= 90% per-file code coverage, max 300 lines, complexity <= 10
 */

import { describe, it, expect } from 'vitest';
import { Module2VolumeAggregationTiers2And3Helper } from '../../src/services/module2VolumeAggregationTiers2And3Helper';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';

describe('Module2VolumeAggregationTiers2And3Helper', () => {
  it('builds Tier 2 opportunities when >= 2 distinct material codes exist', () => {
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
            unspsc_code: '31171504',
            plant: '1000',
            spend_category: 'Mechanical Spares'
          },
          {
            material_code: 'MAT-B',
            material_desc: 'Roller Bearing B',
            vendor_name: 'V2',
            quantity: 15,
            total_spend_inr: 7500,
            unspsc_code: '31171504',
            plant: '2200',
            spend_category: 'Mechanical Spares'
          }
        ]
      ],
      [
        '31171505',
        [
          {
            material_code: 'MAT-SINGLE',
            material_desc: 'Single Spec Bearing',
            vendor_name: 'V1',
            total_spend_inr: 2000,
            unspsc_code: '31171505',
            plant: '1000'
          }
        ]
      ],
      ['00000000', [{ material_code: 'M-DEFAULT', total_spend_inr: 1000 }]],
      ['EMPTY_GRP', []]
    ]);

    const t2 = Module2VolumeAggregationTiers2And3Helper.buildTier2Opportunities(unspscGroups);
    expect(t2.length).toBe(1);
    expect(t2[0].opportunityId).toBe('L4-T2-31171504');
    expect(t2[0].tier).toBe('TIER_2_COMPARABLE');
    expect(t2[0].opportunityStatus).toBe('Technical Validation Required');
    expect(t2[0].aggregatableQuantity).toBe(0);
    expect(t2[0].excludedQuantity).toBe(25);
    expect(t2[0].plantCount).toBe(2);
    expect(t2[0].eligibilityType).toBe('MULTI_FACILITY_POOLING');
    expect(t2[0].isGenuineOpportunity).toBe(true);
  });

  it('sets eligibilityType to MULTI_VENDOR_ALLOCATION for single-plant Tier 2', () => {
    const unspscGroups = new Map<string, StrategicInputTransaction[]>([
      [
        '31171506',
        [
          {
            material_code: 'MAT-C',
            material_desc: 'Bearing C',
            vendor_name: 'V1',
            quantity: 5,
            total_spend_inr: 3000,
            unspsc_code: '31171506',
            plant: '1000'
          },
          {
            material_code: 'MAT-D',
            material_desc: 'Bearing D',
            vendor_name: 'V2',
            quantity: 8,
            total_spend_inr: 4000,
            unspsc_code: '31171506',
            plant: '1000'
          }
        ]
      ]
    ]);

    const t2 = Module2VolumeAggregationTiers2And3Helper.buildTier2Opportunities(unspscGroups);
    expect(t2.length).toBe(1);
    expect(t2[0].plantCount).toBe(1);
    expect(t2[0].eligibilityType).toBe('MULTI_VENDOR_ALLOCATION');
  });

  it('builds Tier 3 category sourcing opportunities and sorts by spend', () => {
    const catGroups = new Map<string, StrategicInputTransaction[]>([
      [
        'Mechanical Hardware',
        [
          {
            material_desc: 'Fastener A',
            vendor_name: 'V1',
            quantity: 100,
            total_spend_inr: 50000,
            spend_category: 'Mechanical Hardware',
            plant: '1000'
          }
        ]
      ],
      [
        'Industrial Lubricants',
        [
          {
            material_desc: 'Gear Oil ISO 320',
            vendor_name: 'V2',
            quantity: 500,
            total_spend_inr: 250000,
            spend_category: 'Industrial Lubricants',
            plant: '2200'
          }
        ]
      ],
      ['EMPTY_CATEGORY', []]
    ]);

    const t3 = Module2VolumeAggregationTiers2And3Helper.buildTier3Opportunities(catGroups);
    expect(t3.length).toBe(2);
    // Industrial Lubricants (2.5 Lakhs) should be first, Mechanical Hardware (0.5 Lakhs) second
    expect(t3[0].category).toBe('Industrial Lubricants');
    expect(t3[0].tier).toBe('TIER_3_CATEGORY');
    expect(t3[0].totalHistoricalSpendInr).toBe(250000);
    expect(t3[0].isGenuineOpportunity).toBe(true);
    expect(t3[1].category).toBe('Mechanical Hardware');
  });
});
