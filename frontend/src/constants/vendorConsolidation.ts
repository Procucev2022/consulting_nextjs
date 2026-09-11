export const VENDOR_CONSOLIDATION_THRESHOLDS = {
  MIN_VENDOR_COUNT_THRESHOLD: 5,
  HIGH_SPEND_THRESHOLD_CR: 10.0,
  DEFAULT_EST_SAVINGS_PCT: 14.5,
  MONTHS_IN_YEAR: 12
} as const;

export const CONSOLIDATION_CATEGORY_TABS = [
  'ALL',
  'Direct Materials',
  'Packaging Materials',
  'Indirect & MRO',
  'Logistics & Freight'
] as const;

export const CONSOLIDATION_SORT_OPTIONS = [
  { id: 'SPEND_DESC', label: 'Spend: Highest First' },
  { id: 'VENDORS_DESC', label: 'Vendor Count: Most Fragmented' },
  { id: 'SAVINGS_DESC', label: 'e-Auction Volume Savings: Highest First' }
] as const;

export const DEFAULT_AUCTION_PLATFORM = 'DPS NXT';
export const DEFAULT_TARGET_CONSOLIDATED_VENDORS = 2;
