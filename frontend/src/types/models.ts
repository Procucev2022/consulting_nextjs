/**
 * Domain Models Module (Frontend)
 */

export interface TenantMaster {
  tenant_id: string;
  enterprise_name: string;
  region: 'NA' | 'EU' | 'APAC' | 'GLOBAL';
  base_currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  status: 'ACTIVE' | 'ONBOARDING' | 'DIAGNOSTIC';
  total_spend_evaluated: number;
  total_spend_evaluated_inr?: number; // In INR Crores
}

export interface RawDocumentIngestion {
  doc_id: string;
  tenant_id: string;
  file_name: string;
  file_type: 'PDF' | 'XLSX' | 'CSV' | 'XML' | 'ZIP';
  file_size_mb: number;
  ocr_status: 'Completed' | 'Parsing OCR' | 'Pending' | 'Error';
  progress: number;
  uploaded_at: string;
  records_count: number;
  detected_currencies?: string[];
  converted_inr_crores?: number;
}

export interface ValidationPreCheckRecord {
  record_id: string;
  po_number: string;
  vendor_name: string;
  raw_desc: string;
  order_quantity?: number; // Order Quantity (Q)
  net_price?: number;      // Net Price (P)
  subtotal_raw?: number;   // Q * P in original currency
  amount: number;          // Total original currency amount (Q * P)
  raw_currency?: string;
  amount_inr?: number;     // Q * P * Currency in INR
  inr_crores?: number;     // (Q * P * Currency in INR) / 10,000,000
  fx_rate_applied?: number;
  yahoo_ticker?: string;
  spend_year?: number;
  column_l_code?: string;
  core_category?: 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight';
  issue_flag: 'Missing Currency Code' | 'Unmapped Supplier Name' | 'Passed Clean' | 'Duplicate PO' | 'Tax Discrepancy';
  action_status: 'Fix (INR)' | 'Merge Vendor' | 'Ready' | 'Resolved' | 'Reviewed';
  resolved: boolean;
}

export interface SpendCategorySummary {
  id: string;
  name: string;
  spend: number;
  spend_inr?: number;
  spend_inr_crores?: number;
  targetReductionPct: number;
  lineItemsCount: number;
  color: string;
  column_l_code?: string;
  spend_2023?: number;
  spend_2024?: number;
  spend_2025_26?: number;
  spend_inr_2023?: number;
  spend_inr_2024?: number;
  spend_inr_2025_26?: number;
}

export interface BalanceCategoryItem {
  name: string;
  column_l_code: string;
  spend_inr_cr: number;
  share_pct: number;
}

export interface CategoryTopItem {
  item_id: string;
  item_desc: string;
  column_l_code: string;
  vendor_name: string;
  po_number: string;
  unit_of_measure: string;
  raw_currency: string;
  order_qty_annual: number;
  price_fy24: number; // Unit Price in FY24 (1 Apr 2023 - 31 Mar 2024)
  price_fy25: number; // Unit Price in FY25 (1 Apr 2024 - 31 Mar 2025)
  price_fy26: number; // Unit Price in FY26 (1 Apr 2025 - 31 Mar 2026)
  fx_rate_applied: number;
  total_spend_inr_cr: number; // Sum of Q * P * FX across 3 yrs in ₹ Cr
  price_change_pct: number; // 3-yr price variance %
  trend_direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  leakage_flag?: string;
  opportunity_potential_inr_lakhs?: number;
}

export interface CategoryYearDetail {
  id?: string;
  rank?: number;
  category: string;
  core_bucket?: 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight' | 'Other Balance';
  sample_column_l_code: string;
  sample_column_l_title: string;
  spend_2023?: number;
  spend_2024?: number;
  spend_2025_26?: number;
  total_3yr_spend?: number;
  spend_inr_2023_cr: number;
  spend_inr_2024_cr: number;
  spend_inr_2025_26_cr: number;
  spend_fy24_cr?: number; // FY24 (1 Apr 2023 - 31 Mar 2024)
  spend_fy25_cr?: number; // FY25 (1 Apr 2024 - 31 Mar 2025)
  spend_fy26_cr?: number; // FY26 (1 Apr 2025 - 31 Mar 2026)
  total_3yr_spend_inr_cr: number;
  yoy_growth_pct: number;
  line_items_count: number;
  color: string;
  is_balance_category?: boolean;
  balance_items?: BalanceCategoryItem[];
  top_items?: CategoryTopItem[];
}

export interface BalanceVendorItem {
  vendor_name: string;
  category: string;
  column_l_code: string;
  spend_inr_cr: number;
  share_pct: number;
  line_items_count: number;
}

export interface VendorYearDetail {
  id: string;
  rank?: number;
  vendor_name: string;
  master_vendor_id: string;
  primary_category: string;
  sample_column_l_code: string;
  sample_column_l_title: string;
  spend_fy24_cr: number; // 1 Apr 2023 - 31 Mar 2024
  spend_fy25_cr: number; // 1 Apr 2024 - 31 Mar 2025
  spend_fy26_cr: number; // 1 Apr 2025 - 31 Mar 2026
  total_3yr_spend_inr_cr: number;
  yoy_growth_pct: number;
  line_items_count: number;
  color: string;
  risk_status?: 'HIGH CREEP' | 'REVIEW' | 'ALIGNED' | 'FAVORABLE';
  price_creep_pct?: number;
  is_balance_vendor?: boolean;
  balance_vendors?: BalanceVendorItem[];
  top_items?: CategoryTopItem[];
}

export interface LineItemMapping {
  mapping_id: string;
  line_item_id: string;
  raw_desc: string;
  vendor_identified: string;
  master_supplier_id?: string;
  unspsc_code: string; // Column L: 8-digit Commodity Code
  unspsc_category_name: string;
  core_bucket: 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight';
  ai_confidence: number;
  status: 'Confirmed' | 'Pending Review' | 'Re-Assigned';
  unit_price: number;
  qty: number;
  total_spend: number;
  raw_currency?: string;
  amount_inr?: number;
  inr_crores?: number;
  fx_rate_applied?: number;
  invoice_date: string;
  spend_year?: number;
  po_number: string;
}

export interface VendorPriceRank {
  vendor_name: string;
  master_id: string;
  category: 'Direct Mat.' | 'Packaging' | 'Freight' | 'Indirect / MRO';
  price_creep_pct: number;
  total_spend: number;
  total_spend_inr_cr?: number;
  risk_status: 'HIGH CREEP' | 'REVIEW' | 'ALIGNED' | 'FAVORABLE';
  variance_leakage_usd: number;
  variance_leakage_inr_cr?: number;
  benchmark_index: string;
  last_36mo_trend: number[];
}

export interface SavingsOpportunity {
  opp_id: string;
  category: 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight';
  title: string;
  current_spend: number;
  current_spend_inr_cr?: number;
  target_savings_pct: number;
  est_savings: number;
  est_savings_inr_cr?: number;
  recommended_action: string;
  push_to_module: 'proCPX' | 'DPS NXT';
  status: 'Identified' | 'Pushed to proCPX' | 'Pushed to DPS NXT' | 'Executed';
  risk_level: 'Low' | 'Medium' | 'High';
  contract_leak_type: string;
}

export interface ConversionFunnelPhase {
  phase_num: 1 | 2 | 3;
  phase_name: string;
  platform_actionable_focus: string;
  value_outcome_delivered: string;
  commercial_lock_in_metric: string;
  completion_pct: number;
  status: 'Completed' | 'In Progress' | 'Upcoming';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
