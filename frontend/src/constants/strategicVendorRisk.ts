import type { StrategicSingleVendorItem, StrategicRiskSummary } from '../types';

export const HIGH_VALUE_MIN_SPEND_CR = 1.0;
export const SINGLE_DIGIT_SECONDARY_MAX_PCT = 9.9;
export const DOMINANT_PRIMARY_MIN_PCT = 90.0;

export const STRATEGIC_RISK_FILTER_TYPES = {
  ALL: 'ALL',
  SOLE_SOURCE: 'SOLE_SOURCE',
  SINGLE_DIGIT_SECONDARY: 'SINGLE_DIGIT_SECONDARY'
} as const;

export type StrategicRiskFilterType =
  (typeof STRATEGIC_RISK_FILTER_TYPES)[keyof typeof STRATEGIC_RISK_FILTER_TYPES];

export function isSoleSource(item: StrategicSingleVendorItem): boolean {
  return item.risk_level === 'SOLE_SOURCE_CRITICAL' || !item.secondary_vendor;
}

export function isSingleDigitSecondary(item: StrategicSingleVendorItem): boolean {
  if (!item.secondary_vendor) {
    return false;
  }
  return item.secondary_vendor.share_percentage <= SINGLE_DIGIT_SECONDARY_MAX_PCT;
}

export function calculateStrategicRiskSummary(
  items: StrategicSingleVendorItem[]
): StrategicRiskSummary {
  if (!items || items.length === 0) {
    return {
      totalAtRiskSpendCr: 0,
      totalStrategicItems: 0,
      soleSourceCount: 0,
      singleDigitSecondaryCount: 0,
      avgPrimaryConcentrationPct: 0
    };
  }

  let totalSpend = 0;
  let soleCount = 0;
  let singleDigitCount = 0;
  let sumPrimaryPct = 0;

  for (const item of items) {
    totalSpend += item.total_spend_inr_cr;
    sumPrimaryPct += item.primary_vendor.share_percentage;

    if (isSoleSource(item)) {
      soleCount += 1;
    } else if (isSingleDigitSecondary(item)) {
      singleDigitCount += 1;
    }
  }

  const avgPrimary = Number((sumPrimaryPct / items.length).toFixed(1));

  return {
    totalAtRiskSpendCr: Number(totalSpend.toFixed(2)),
    totalStrategicItems: items.length,
    soleSourceCount: soleCount,
    singleDigitSecondaryCount: singleDigitCount,
    avgPrimaryConcentrationPct: avgPrimary
  };
}
