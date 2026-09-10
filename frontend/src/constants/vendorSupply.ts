/**
 * Vendor Material Supply Categorization & Spend Trend Constants
 */

export const VENDOR_SUPPLY_THRESHOLDS = {
  HIGH_SPEND_THRESHOLD_CR: 15.0,
  MID_SPEND_THRESHOLD_CR: 5.0,
  MULTI_CATEGORY_ALARM_SPEND_SHARE_THRESHOLD: 0.50, // >50% multi-category spend triggers alarm
  MULTI_CATEGORY_ALARM_COUNT_RATIO_THRESHOLD: 0.50,  // >50% multi-category vendor count triggers alarm
  ESTIMATED_SAVINGS_OPPORTUNITY_RATE: 0.085         // 8.5% unbundling & consolidation savings
} as const;

export const VENDOR_SUPPLY_TIERS = {
  TIER_1_HIGH: {
    id: 'TIER_1_HIGH',
    name: 'Tier 1: High Spend',
    label: '> ₹15 Cr Spend',
    minSpendCr: 15.0
  },
  TIER_2_MID: {
    id: 'TIER_2_MID',
    name: 'Tier 2: Mid Spend',
    label: '₹5 Cr – ₹15 Cr Spend',
    minSpendCr: 5.0
  },
  TIER_3_BASE: {
    id: 'TIER_3_BASE',
    name: 'Tier 3: Base / Tail Spend',
    label: '< ₹5 Cr Spend',
    minSpendCr: 0.0
  }
} as const;

export const VENDOR_SUPPLY_BADGE_STYLES = {
  SINGLE_CATEGORY: {
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    indicatorClass: 'bg-emerald-500'
  },
  MULTI_CATEGORY: {
    badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    indicatorClass: 'bg-amber-500'
  },
  HIGH_RISK: {
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800'
  },
  MEDIUM_RISK: {
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  OPTIMAL: {
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  }
} as const;

export const VENDOR_SUPPLY_YOY_STYLES = {
  INCREASE: {
    textClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
    tagClass:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    indicatorDotClass: 'bg-rose-500',
    prefix: '+'
  },
  DECREASE: {
    textClass: 'text-amber-600 dark:text-amber-400 font-bold',
    tagClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    indicatorDotClass: 'bg-blue-500',
    prefix: ''
  },
  NEUTRAL: {
    textClass: 'text-slate-500 dark:text-slate-400 font-medium',
    tagClass:
      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
    indicatorDotClass: 'bg-slate-400',
    prefix: ''
  }
} as const;

