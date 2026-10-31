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
import { UI_STRINGS } from '../constants/uiStrings';

function buildTierSummary(
  tierVendors: VendorSupplyRecord[],
  tierConfig: { id: string; minSpendCr: number },
  tierLabel: string,
  alarmTriggered: boolean = false
): VendorSupplyTierSummary {
  const totalSpendCr = tierVendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const multiVendors = tierVendors.filter((v) => v.category_type === 'MULTI_CATEGORY');
  const multiSpendCr = multiVendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const multiSpendPct = totalSpendCr > 0 ? (multiSpendCr / totalSpendCr) * 100 : 0;
  const singleVendors = tierVendors.filter((v) => v.category_type === 'SINGLE_CATEGORY');
  const singleSpendCr = singleVendors.reduce((acc, v) => acc + v.total_spend_inr_cr, 0);
  const singleSpendPct = totalSpendCr > 0 ? (singleSpendCr / totalSpendCr) * 100 : 0;

  return {
    tier_id: tierConfig.id,
    tier_name: tierLabel,
    spend_range_label: tierLabel,
    min_spend_cr: tierConfig.minSpendCr,
    vendor_count: tierVendors.length,
    total_spend_cr: totalSpendCr,
    multi_category_count: multiVendors.length,
    multi_category_spend_cr: multiSpendCr,
    multi_category_spend_pct: multiSpendPct,
    single_category_count: singleVendors.length,
    single_category_spend_cr: singleSpendCr,
    single_category_spend_pct: singleSpendPct,
    alarm_triggered: alarmTriggered
  };
}

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

  const tier1Vendors = vendors.filter((v) => v.total_spend_inr_cr >= VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR);
  const tier2Vendors = vendors.filter(
    (v) =>
      v.total_spend_inr_cr >= VENDOR_SUPPLY_THRESHOLDS.MID_SPEND_THRESHOLD_CR &&
      v.total_spend_inr_cr < VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR
  );
  const tier3Vendors = vendors.filter((v) => v.total_spend_inr_cr < VENDOR_SUPPLY_THRESHOLDS.MID_SPEND_THRESHOLD_CR);

  const vendorSupplyStrings = UI_STRINGS.module2.vendorSupply;
  const tier1Summary = buildTierSummary(
    tier1Vendors,
    VENDOR_SUPPLY_TIERS.TIER_1_HIGH,
    vendorSupplyStrings.tierHighSpendLabel
  );
  const multiCountRatio = tier1Vendors.length > 0 ? tier1Summary.multi_category_count / tier1Vendors.length : 0;
  const highSpendMultiAlarm =
    tier1Vendors.length > 0 &&
    (multiCountRatio >= VENDOR_SUPPLY_THRESHOLDS.MULTI_CATEGORY_ALARM_COUNT_RATIO_THRESHOLD ||
      tier1Summary.multi_category_spend_pct >=
        VENDOR_SUPPLY_THRESHOLDS.MULTI_CATEGORY_ALARM_SPEND_SHARE_THRESHOLD * 100);

  tier1Summary.alarm_triggered = highSpendMultiAlarm;
  const potentialSavingsCr =
    tier1Summary.multi_category_spend_cr * VENDOR_SUPPLY_THRESHOLDS.ESTIMATED_SAVINGS_OPPORTUNITY_RATE;

  const tiers: VendorSupplyTierSummary[] = [
    tier1Summary,
    buildTierSummary(tier2Vendors, VENDOR_SUPPLY_TIERS.TIER_2_MID, vendorSupplyStrings.tierMidSpendLabel),
    buildTierSummary(tier3Vendors, VENDOR_SUPPLY_TIERS.TIER_3_BASE, vendorSupplyStrings.tierBaseSpendLabel)
  ];

  const { indicator, indicatorRationale } = resolveSupplyStructureIndicator(vendors, multiCategorySpendPct);

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
    supply_structure_indicator: indicator,
    indicator_rationale: indicatorRationale,
    alarm_details: {
      title: vendorSupplyStrings.alarmTitle,
      observation: vendorSupplyStrings.alarmObservation(
        tier1Summary.multi_category_spend_pct,
        tier1Summary.multi_category_spend_cr,
        VENDOR_SUPPLY_THRESHOLDS.HIGH_SPEND_THRESHOLD_CR
      ),
      high_spend_multi_pct: tier1Summary.multi_category_spend_pct,
      high_spend_multi_cr: tier1Summary.multi_category_spend_cr,
      affected_vendor_count: tier1Summary.multi_category_count,
      total_high_spend_vendors: tier1Vendors.length,
      potential_savings_cr: potentialSavingsCr,
      recommendation: vendorSupplyStrings.actionRecommendationText
    },
    tiers
  };
}

function resolveSupplyStructureIndicator(
  vendors: VendorSupplyRecord[],
  multiCategorySpendPct: number
): { indicator: import('../types/vendorSupply').CategorySupplyStructureIndicator; indicatorRationale: string } {
  const strings = UI_STRINGS.module2.vendorSupply.supplyStructure;
  if (vendors.length === 0) {
    return {
      indicator: 'INSUFFICIENT_DATA',
      indicatorRationale: strings.insufficient
    };
  }
  if (vendors.length === 1) {
    return {
      indicator: 'SINGLE_SOURCE_DEPENDENT',
      indicatorRationale: strings.singleSource
    };
  }
  if ((vendors[0]?.spend_share_pct || 0) >= 60) {
    return {
      indicator: 'SINGLE_SUPPLIER_CONCENTRATION',
      indicatorRationale: strings.dominantSupplier(vendors[0].vendor_name, vendors[0]?.spend_share_pct || 0)
    };
  }
  if (multiCategorySpendPct >= 40) {
    return {
      indicator: 'CROSS_CATEGORY_SUPPLIER_DEPENDENCY',
      indicatorRationale: strings.crossCategoryDependency(multiCategorySpendPct)
    };
  }
  if (vendors.length >= 8) {
    return {
      indicator: 'TAIL_FRAGMENTATION',
      indicatorRationale: strings.tailFragmentation(vendors.length)
    };
  }
  return {
    indicator: 'BALANCED',
    indicatorRationale: strings.balanced
  };
}
