/**
 * Vendor Category Supply Overview Calculator
 * Computes spend distribution metrics, tier analytics, and triggers executive alarms
 * if multi-category vendors dominate upper spend tiers.
 */

import type {
  VendorSupplyRecord,
  VendorSupplyOverview,
  VendorSupplyTierSummary
} from '../types/vendorSupply';
import {
  VENDOR_SUPPLY_THRESHOLDS,
  VENDOR_SUPPLY_TIERS
} from '../constants/vendorSupply';

export function computeVendorSupplyOverview(
  vendors: VendorSupplyRecord[] = []
): VendorSupplyOverview {
  const totalVendors = vendors.length;
  const totalSpendCr = vendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);

  const singleCategoryVendors = vendors.filter((v) => v.category_type === 'SINGLE_CATEGORY');
  const multiCategoryVendors = vendors.filter((v) => v.category_type === 'MULTI_CATEGORY');

  const singleCategorySpendCr = singleCategoryVendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const multiCategorySpendCr = multiCategoryVendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);

  const singleCategorySpendPct = totalSpendCr > 0 ? (singleCategorySpendCr / totalSpendCr) * 100 : 0;
  const multiCategorySpendPct = totalSpendCr > 0 ? (multiCategorySpendCr / totalSpendCr) * 100 : 0;

  // Tier 1: High Spend (> ₹15 Cr)
  const tier1Vendors = vendors.filter((v) => v.total_spend_inr_cr >= VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR);
  const tier1SpendCr = tier1Vendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier1Multi = tier1Vendors.filter((v) => v.category_type === 'MULTI_CATEGORY');
  const tier1MultiSpendCr = tier1Multi.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier1MultiSpendPct = tier1SpendCr > 0 ? (tier1MultiSpendCr / tier1SpendCr) * 100 : 0;
  const tier1Single = tier1Vendors.filter((v) => v.category_type === 'SINGLE_CATEGORY');
  const tier1SingleSpendCr = tier1Single.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier1SingleSpendPct = tier1SpendCr > 0 ? (tier1SingleSpendCr / tier1SpendCr) * 100 : 0;

  // Tier 2: Mid Spend (₹5 Cr – ₹15 Cr)
  const tier2Vendors = vendors.filter(
    (v) =>
      v.total_spend_inr_cr >= VENDOR_SUPPLY_THRESHOLDS.MID_SPEND_THRESHOLD_CR &&
      v.total_spend_inr_cr < VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR
  );
  const tier2SpendCr = tier2Vendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier2Multi = tier2Vendors.filter((v) => v.category_type === 'MULTI_CATEGORY');
  const tier2MultiSpendCr = tier2Multi.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier2MultiSpendPct = tier2SpendCr > 0 ? (tier2MultiSpendCr / tier2SpendCr) * 100 : 0;
  const tier2Single = tier2Vendors.filter((v) => v.category_type === 'SINGLE_CATEGORY');
  const tier2SingleSpendCr = tier2Single.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier2SingleSpendPct = tier2SpendCr > 0 ? (tier2SingleSpendCr / tier2SpendCr) * 100 : 0;

  // Tier 3: Base Spend (< ₹5 Cr)
  const tier3Vendors = vendors.filter((v) => v.total_spend_inr_cr < VENDOR_SUPPLY_THRESHOLDS.MID_SPEND_THRESHOLD_CR);
  const tier3SpendCr = tier3Vendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier3Multi = tier3Vendors.filter((v) => v.category_type === 'MULTI_CATEGORY');
  const tier3MultiSpendCr = tier3Multi.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier3MultiSpendPct = tier3SpendCr > 0 ? (tier3MultiSpendCr / tier3SpendCr) * 100 : 0;
  const tier3Single = tier3Vendors.filter((v) => v.category_type === 'SINGLE_CATEGORY');
  const tier3SingleSpendCr = tier3Single.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const tier3SingleSpendPct = tier3SpendCr > 0 ? (tier3SingleSpendCr / tier3SpendCr) * 100 : 0;

  // Alarm condition: If Multi-Category vendors account for >50% of spend in Tier 1 OR >50% of vendor count in Tier 1
  const highSpendMultiAlarm =
    tier1Vendors.length > 0 &&
    (tier1Multi.length / tier1Vendors.length >= VENDOR_SUPPLY_THRESHOLDS.MULTI_CATEGORY_ALARM_COUNT_RATIO_THRESHOLD ||
      tier1MultiSpendPct >= VENDOR_SUPPLY_THRESHOLDS.MULTI_CATEGORY_ALARM_SPEND_SHARE_THRESHOLD * 100);

  const potentialSavingsCr = tier1MultiSpendCr * VENDOR_SUPPLY_THRESHOLDS.ESTIMATED_SAVINGS_OPPORTUNITY_RATE;

  const tiers: VendorSupplyTierSummary[] = [
    {
      tier_id: VENDOR_SUPPLY_TIERS.TIER_1_HIGH.id,
      tier_name: VENDOR_SUPPLY_TIERS.TIER_1_HIGH.name,
      spend_range_label: VENDOR_SUPPLY_TIERS.TIER_1_HIGH.label,
      min_spend_cr: VENDOR_SUPPLY_TIERS.TIER_1_HIGH.minSpendCr,
      vendor_count: tier1Vendors.length,
      total_spend_cr: tier1SpendCr,
      multi_category_count: tier1Multi.length,
      multi_category_spend_cr: tier1MultiSpendCr,
      multi_category_spend_pct: tier1MultiSpendPct,
      single_category_count: tier1Single.length,
      single_category_spend_cr: tier1SingleSpendCr,
      single_category_spend_pct: tier1SingleSpendPct,
      alarm_triggered: highSpendMultiAlarm
    },
    {
      tier_id: VENDOR_SUPPLY_TIERS.TIER_2_MID.id,
      tier_name: VENDOR_SUPPLY_TIERS.TIER_2_MID.name,
      spend_range_label: VENDOR_SUPPLY_TIERS.TIER_2_MID.label,
      min_spend_cr: VENDOR_SUPPLY_TIERS.TIER_2_MID.minSpendCr,
      vendor_count: tier2Vendors.length,
      total_spend_cr: tier2SpendCr,
      multi_category_count: tier2Multi.length,
      multi_category_spend_cr: tier2MultiSpendCr,
      multi_category_spend_pct: tier2MultiSpendPct,
      single_category_count: tier2Single.length,
      single_category_spend_cr: tier2SingleSpendCr,
      single_category_spend_pct: tier2SingleSpendPct,
      alarm_triggered: false
    },
    {
      tier_id: VENDOR_SUPPLY_TIERS.TIER_3_BASE.id,
      tier_name: VENDOR_SUPPLY_TIERS.TIER_3_BASE.name,
      spend_range_label: VENDOR_SUPPLY_TIERS.TIER_3_BASE.label,
      min_spend_cr: VENDOR_SUPPLY_TIERS.TIER_3_BASE.minSpendCr,
      vendor_count: tier3Vendors.length,
      total_spend_cr: tier3SpendCr,
      multi_category_count: tier3Multi.length,
      multi_category_spend_cr: tier3MultiSpendCr,
      multi_category_spend_pct: tier3MultiSpendPct,
      single_category_count: tier3Single.length,
      single_category_spend_cr: tier3SingleSpendCr,
      single_category_spend_pct: tier3SingleSpendPct,
      alarm_triggered: false
    }
  ];

  return {
    total_vendors: totalVendors,
    total_spend_cr: totalSpendCr,
    single_category_vendors_count: singleCategoryVendors.length,
    single_category_spend_cr: singleCategorySpendCr,
    single_category_spend_pct: singleCategorySpendPct,
    multi_category_vendors_count: multiCategoryVendors.length,
    multi_category_spend_cr: multiCategorySpendCr,
    multi_category_spend_pct: multiCategorySpendPct,
    high_spend_multi_category_alarm: highSpendMultiAlarm,
    alarm_details: {
      title: 'High-Spend Multi-Category Supply Disparity & Maverick Leakage Detected',
      observation: `Analysis of top spend tiers reveals that among high-spend suppliers (> ₹${VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR} Cr), ${tier1MultiSpendPct.toFixed(1)}% of spend (₹${tier1MultiSpendCr.toFixed(2)} Cr) is captured by Multi-Category Vendors supplying disparate, unrelated material categories.`,
      high_spend_multi_pct: tier1MultiSpendPct,
      high_spend_multi_cr: tier1MultiSpendCr,
      affected_vendor_count: tier1Multi.length,
      total_high_spend_vendors: tier1Vendors.length,
      potential_savings_cr: potentialSavingsCr,
      recommendation: 'Initiate priority category unbundling audits, restrict multi-category PO issuance, and issue targeted RFPs to consolidate volume with dedicated Single-Category specialists.'
    },
    tiers
  };
}
