export type ConsolidationCategory =
  | 'Direct Materials'
  | 'Packaging Materials'
  | 'Indirect & MRO'
  | 'Logistics & Freight';

export type SupplierTierStatus = 'Primary' | 'Incumbent' | 'Spot / Peripheral';

export interface ConsolidationSupplier {
  vendor_id: string;
  vendor_name: string;
  annual_spend_inr_cr: number;
  spend_share_pct: number;
  unit_rate_index: number;
  monthly_po_count: number;
  status: SupplierTierStatus;
}

export interface RecurringConsolidationItem {
  id: string;
  category: ConsolidationCategory;
  item_group_title: string;
  item_group_code: string;
  unspsc_family: string;
  unspsc_code: string;
  total_spend_inr_cr: number;
  vendor_count: number;
  recurring_monthly: boolean;
  procurement_cadence: string;
  monthly_po_avg: number;
  annual_units: number;
  unit_of_measure: string;
  price_variance_pct: number;
  target_consolidated_vendors: number;
  est_volume_savings_pct: number;
  est_volume_savings_cr: number;
  recommended_auction_type: string;
  auction_platform: string;
  suppliers: ConsolidationSupplier[];
  consolidation_roadmap: string[];
}

export interface VendorConsolidationSummary {
  totalFragmentedSpendCr: number;
  categoriesCount: number;
  totalActiveVendors: number;
  avgVendorsPerCategory: number;
  potentialVolumeSavingsCr: number;
  avgSavingsPct: number;
}

export interface VendorConsolidationSummaryBannerProps {
  summary: VendorConsolidationSummary;
}

export interface VendorConsolidationCardProps {
  item: RecurringConsolidationItem;
  onInitiateConsolidation: (item: RecurringConsolidationItem) => void;
}

export interface VendorConsolidationModalProps {
  item: RecurringConsolidationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface VendorConsolidationSectionProps {
  items?: RecurringConsolidationItem[];
}
