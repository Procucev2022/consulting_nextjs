import type { PoConsolidationCadence } from '../types/poConsolidation';

export const PO_CONSOLIDATION_THRESHOLDS = {
  MIN_MONTHLY_PO_COUNT: 2,
  HIGH_FRAGMENTATION_MONTHLY_POS: 8,
  ADMIN_COST_PER_PO_INR: 3500,
  MONTHS_IN_YEAR: 12
} as const;

export const PO_CADENCE_KEYS: Record<string, PoConsolidationCadence> = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  HALF_YEARLY: 'HALF_YEARLY',
  ANNUAL: 'ANNUAL'
} as const;

export const PO_CONSOLIDATION_CATEGORY_TABS = [
  'ALL',
  'Direct Materials',
  'Packaging Materials',
  'Indirect & MRO',
  'Logistics & Freight'
] as const;

export const PO_CONSOLIDATION_SORT_OPTIONS = [
  { id: 'POS_DESC', label: 'PO Frequency: Most Fragmented' },
  { id: 'SPEND_DESC', label: 'Annual Spend: Highest First' },
  { id: 'SAVINGS_DESC', label: 'Scale Benefit: Highest Savings' }
] as const;

export const getCadenceBadgeClass = (cadence: PoConsolidationCadence): string => {
  switch (cadence) {
    case 'ANNUAL':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
    case 'HALF_YEARLY':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700';
    case 'QUARTERLY':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    case 'MONTHLY':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  }
};
