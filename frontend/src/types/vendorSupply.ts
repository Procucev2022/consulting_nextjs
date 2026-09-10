/**
 * Vendor Material Supply Categorization & Spend Distribution Types
 *
 * Types for classifying vendors as Single Category Specialists or Multi-Category Suppliers,
 * evaluating spend trends for the Top 50 vendors, and detecting high-spend concentration alarms.
 */

export type VendorSupplyCategoryType = 'SINGLE_CATEGORY' | 'MULTI_CATEGORY';

export type VendorSupplyRiskLevel = 'HIGH_RISK' | 'MEDIUM_RISK' | 'OPTIMAL';

export interface VendorItemYoYDetail {
  material_code: string;
  material_description: string;
  po_number: string;
  unspsc_code: string;
  unspsc_title: string;
  spend_yoy_pct: number;
  qty_yoy_pct: number;
  price_yoy_pct: number;
  observation_mark?: string;
  remark?: string;
}

export interface VendorSupplyRecord {
  rank: number;
  vendor_name: string;
  master_vendor_id: string;
  total_spend_inr_cr: number;
  spend_fy24_cr: number;
  spend_fy25_cr: number;
  spend_fy26_cr: number;
  yoy_growth_pct: number;
  category_type: VendorSupplyCategoryType;
  category_count: number;
  primary_category: string;
  supplied_categories: string[];
  irrelevant_categories: string[];
  line_items_count: number;
  risk_level: VendorSupplyRiskLevel;
  observation_note: string;
  spend_share_pct: number;
  spend_yoy_pct?: number;
  qty_yoy_pct?: number;
  price_yoy_pct?: number;
  yoy_observation_mark?: string;
  yoy_remark?: string;
  top_items?: VendorItemYoYDetail[];
}

export interface VendorSupplyTierSummary {
  tier_id: string;
  tier_name: string;
  spend_range_label: string;
  min_spend_cr: number;
  vendor_count: number;
  total_spend_cr: number;
  multi_category_count: number;
  multi_category_spend_cr: number;
  multi_category_spend_pct: number;
  single_category_count: number;
  single_category_spend_cr: number;
  single_category_spend_pct: number;
  alarm_triggered: boolean;
}

export interface VendorSupplyAlarmDetails {
  title: string;
  observation: string;
  high_spend_multi_pct: number;
  high_spend_multi_cr: number;
  affected_vendor_count: number;
  total_high_spend_vendors: number;
  potential_savings_cr: number;
  recommendation: string;
}

export interface VendorSupplyOverview {
  total_vendors: number;
  total_spend_cr: number;
  single_category_vendors_count: number;
  single_category_spend_cr: number;
  single_category_spend_pct: number;
  multi_category_vendors_count: number;
  multi_category_spend_cr: number;
  multi_category_spend_pct: number;
  high_spend_multi_category_alarm: boolean;
  alarm_details: VendorSupplyAlarmDetails;
  tiers: VendorSupplyTierSummary[];
}

export interface VendorSupplyFilterState {
  searchQuery: string;
  categoryTypeFilter: 'ALL' | VendorSupplyCategoryType;
  spendTierFilter: 'ALL' | 'TIER_1_HIGH' | 'TIER_2_MID' | 'TIER_3_BASE';
  onlyAlarmRisk: boolean;
}

export interface VendorCategorySupplyMatrixProps {
  vendors?: VendorSupplyRecord[];
  onSelectVendor?: (vendor: VendorSupplyRecord) => void;
}

export interface VendorSupplyAlarmBannerProps {
  alarmDetails: VendorSupplyAlarmDetails;
}

export interface VendorSupplyMetricsCardsProps {
  overview: VendorSupplyOverview;
}

export interface VendorSupplyTierDistributionProps {
  tiers: VendorSupplyTierSummary[];
}

export interface VendorSupplyFilterBarProps {
  searchQuery: string;
  categoryFilter: 'ALL' | VendorSupplyCategoryType;
  highSpendOnly: boolean;
  riskOnly: boolean;
  totalCount: number;
  filteredCount: number;
  onSearchChange: (val: string) => void;
  onCategoryFilterChange: (cat: 'ALL' | VendorSupplyCategoryType) => void;
  onHighSpendToggle: () => void;
  onRiskToggle: () => void;
  onResetFilters: () => void;
}

export interface VendorSupplyYoYBadgeProps {
  pct: number;
  label?: string;
  observationMark?: string;
  remark?: string;
  compact?: boolean;
}

export interface VendorSupplyItemDetailsModalProps {
  vendor: VendorSupplyRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface VendorSupplyTableProps {
  vendors: VendorSupplyRecord[];
  onSelectVendor: (vendor: VendorSupplyRecord) => void;
  onViewItems: (vendor: VendorSupplyRecord) => void;
  onResetFilters: () => void;
}
