import { describe, expect, it } from 'vitest';
import {
  DOMINANT_PRIMARY_MIN_PCT,
  HIGH_VALUE_MIN_SPEND_CR,
  SINGLE_DIGIT_SECONDARY_MAX_PCT,
  STRATEGIC_RISK_FILTER_TYPES,
  calculateStrategicRiskSummary,
  isSingleDigitSecondary,
  isSoleSource
} from '../../src/constants/strategicVendorRisk';
import type { StrategicRiskFilterType } from '../../src/constants/strategicVendorRisk';
import type {
  StrategicRiskSummary,
  StrategicSingleVendorItem,
  StrategicVendorShare
} from '../../src/types/strategicVendorRisk';

const buildShare = (overrides: Partial<StrategicVendorShare>): StrategicVendorShare => ({
  vendor_name: 'Primary Supplier',
  vendor_id: 'VEN-001',
  spend_inr_cr: 5,
  share_percentage: 70,
  is_primary: true,
  is_secondary_single_digit: false,
  ...overrides
});

const buildItem = (overrides: Partial<StrategicSingleVendorItem>): StrategicSingleVendorItem => ({
  material_code: 'MAT-001',
  material_desc: 'Corrugated carton',
  total_spend_inr_cr: 10,
  core_bucket: 'Packaging Materials',
  unspsc_code: '24101500',
  unspsc_commodity_title: 'Boxes',
  unspsc_class_title: 'Containers',
  unspsc_family_title: 'Packaging',
  segment_code: '24',
  primary_vendor: buildShare({}),
  risk_level: 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY',
  risk_score: 55,
  annual_quantity: 1000,
  unit_of_measure: 'EA',
  po_count: 12,
  mitigation_urgency: 'SCHEDULED_REVIEW',
  actionable_mitigation: 'Qualify a second supplier.',
  suggested_action_plan: ['Qualify a second supplier.'],
  ...overrides
});

describe('strategic vendor risk thresholds and filter types', () => {
  it('defines the high value, single-digit secondary, and dominant primary thresholds', () => {
    expect(HIGH_VALUE_MIN_SPEND_CR).toBe(1.0);
    expect(SINGLE_DIGIT_SECONDARY_MAX_PCT).toBe(9.9);
    expect(DOMINANT_PRIMARY_MIN_PCT).toBe(90.0);
  });

  it('enumerates the filter types used by the strategic risk section', () => {
    const selected: StrategicRiskFilterType = STRATEGIC_RISK_FILTER_TYPES.SOLE_SOURCE;

    expect(selected).toBe('SOLE_SOURCE');
    expect(Object.values(STRATEGIC_RISK_FILTER_TYPES)).toEqual([
      'ALL',
      'SOLE_SOURCE',
      'SINGLE_DIGIT_SECONDARY'
    ]);
  });
});

describe('isSoleSource', () => {
  it('treats a critical sole-source classification as sole source even with a secondary supplier', () => {
    const item = buildItem({
      risk_level: 'SOLE_SOURCE_CRITICAL',
      secondary_vendor: buildShare({ share_percentage: 30 })
    });

    expect(isSoleSource(item)).toBe(true);
  });

  it('treats an item without a secondary supplier as sole source', () => {
    expect(isSoleSource(buildItem({}))).toBe(true);
  });

  it('treats a dominant item with a secondary supplier as not sole source', () => {
    const item = buildItem({ secondary_vendor: buildShare({ share_percentage: 5 }) });

    expect(isSoleSource(item)).toBe(false);
  });
});

describe('isSingleDigitSecondary', () => {
  it('returns false when there is no secondary supplier', () => {
    expect(isSingleDigitSecondary(buildItem({}))).toBe(false);
  });

  it.each([0, 5, 9.9])('accepts a secondary share of %s percent as single digit', (sharePct) => {
    const item = buildItem({ secondary_vendor: buildShare({ share_percentage: sharePct }) });

    expect(isSingleDigitSecondary(item)).toBe(true);
  });

  it.each([9.91, 25])('rejects a secondary share of %s percent', (sharePct) => {
    const item = buildItem({ secondary_vendor: buildShare({ share_percentage: sharePct }) });

    expect(isSingleDigitSecondary(item)).toBe(false);
  });
});

describe('calculateStrategicRiskSummary', () => {
  it('returns zeroed totals for an empty or missing item list', () => {
    const zeroed: StrategicRiskSummary = {
      totalAtRiskSpendCr: 0,
      totalStrategicItems: 0,
      soleSourceCount: 0,
      singleDigitSecondaryCount: 0,
      avgPrimaryConcentrationPct: 0
    };

    expect(calculateStrategicRiskSummary([])).toEqual(zeroed);
    expect(calculateStrategicRiskSummary(null)).toEqual(zeroed);
    expect(calculateStrategicRiskSummary(undefined)).toEqual(zeroed);
  });

  it('totals spend, counts sole-source and single-digit secondary items, and averages primary concentration', () => {
    const items = [
      buildItem({
        material_code: 'A',
        total_spend_inr_cr: 1.005,
        risk_level: 'SOLE_SOURCE_CRITICAL',
        primary_vendor: buildShare({ share_percentage: 70 }),
        secondary_vendor: buildShare({ share_percentage: 30 })
      }),
      buildItem({
        material_code: 'B',
        total_spend_inr_cr: 2.001,
        primary_vendor: buildShare({ share_percentage: 30 })
      }),
      buildItem({
        material_code: 'C',
        total_spend_inr_cr: 3.5,
        primary_vendor: buildShare({ share_percentage: 95 }),
        secondary_vendor: buildShare({ share_percentage: 5 })
      }),
      buildItem({
        material_code: 'D',
        total_spend_inr_cr: 4.25,
        primary_vendor: buildShare({ share_percentage: 55 }),
        secondary_vendor: buildShare({ share_percentage: 20 })
      })
    ];

    expect(calculateStrategicRiskSummary(items)).toEqual({
      totalAtRiskSpendCr: 10.76,
      totalStrategicItems: 4,
      soleSourceCount: 2,
      singleDigitSecondaryCount: 1,
      avgPrimaryConcentrationPct: 62.5
    });
  });

  it('summarises a single item and rounds its primary concentration to one decimal', () => {
    const summary = calculateStrategicRiskSummary([
      buildItem({
        total_spend_inr_cr: 0.5,
        primary_vendor: buildShare({ share_percentage: 91.26 })
      })
    ]);

    expect(summary.totalStrategicItems).toBe(1);
    expect(summary.totalAtRiskSpendCr).toBe(0.5);
    expect(summary.avgPrimaryConcentrationPct).toBe(91.3);
  });
});
