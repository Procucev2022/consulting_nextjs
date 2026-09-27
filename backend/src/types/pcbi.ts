/**
 * PCBI (Procucev Benchmark Intelligence) Domain Types
 */

export type PCBISector =
  | 'Cement'
  | 'Steel'
  | 'Sugar'
  | 'Textile'
  | 'Pharma'
  | 'Chemicals'
  | 'Glass'
  | 'Manufacturing'
  | 'Automotive'
  | 'Engineering'
  | 'FMCG'
  | 'Packaging'
  | 'Other';

export type PCBIBenchmarkScope = 'GLOBAL' | 'MULTI_SECTOR' | 'SECTOR_SPECIFIC';
export type PCBIQualityRating = 'A' | 'B' | 'C';
export type PCBIClassificationMethod = 'UNSPSC_COMMODITY' | 'UNSPSC_CLASS' | 'AI_TEXT' | 'MANUAL';
export type PCBIMappingStatus = 'AUTO_MAPPED' | 'MAPPING_REQUIRED' | 'MANUALLY_MAPPED' | 'VERIFIED';
export type PCBIIndexGapMethod = 'NO_VALUE' | 'FORWARD_FILL' | 'BACKWARD_FILL' | 'LINEAR_INTERPOLATION';

export interface PCBIBenchmarkMaster {
  id: string;
  pcbi_id: string;
  sector: PCBISector | string;
  category: string;
  sub_category?: string;
  unspsc_segment?: string;
  unspsc_family?: string;
  unspsc_class?: string;
  unspsc_commodity?: string;
  benchmark_name: string;
  benchmark_source: string;
  source_series: string;
  benchmark_unit: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'CNY';
  geography: string;
  benchmark_type: 'SINGLE' | 'COMPOSITE';
  benchmarkability_percent: number; // e.g. 70
  residual_percent: number; // e.g. 30
  quality_rating: PCBIQualityRating;
  calculation_method: string;
  benchmark_scope?: PCBIBenchmarkScope;
  applicable_sectors?: string[];
  gap_handling_method?: PCBIIndexGapMethod;
  effective_from: string;
  effective_to?: string;
  version: number;
  notes?: string;
  active: boolean;
}

export interface PCBIBenchmarkComponent {
  id: string;
  pcbi_id: string;
  component_name: string;
  benchmark_source: string;
  source_series: string;
  weight_percent: number; // e.g. 55
  benchmark_unit: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'CNY';
  geography: string;
  quality_rating: PCBIQualityRating;
  active: boolean;
}

export interface PCBIWeeklyIndex {
  id: string;
  pcbi_id: string;
  component_id?: string;
  week_start: string; // Monday (YYYY-MM-DD)
  week_end: string;   // Sunday (YYYY-MM-DD)
  index_value: number;
  base_period_index?: number; // Normalized to 100
  source: string;
  source_series?: string;
  quality_rating: PCBIQualityRating;
  currency: string;
  unit: string;
  created_at: string;
  updated_at?: string;
}

export interface PCBIUNSPSCMapping {
  id?: string;
  unspsc_code: string;
  unspsc_title?: string;
  unspsc_level?: 'SEGMENT' | 'FAMILY' | 'CLASS' | 'COMMODITY';
  match_level?: string;
  pcbi_id: string;
  category?: string;
  sub_category?: string;
  default_benchmarkability?: number;
  quality_rating: PCBIQualityRating;
  active: boolean;
}

export interface PCBIClientPurchaseTransaction {
  id: string;
  upload_id?: string;
  sector: string;
  plant: string;
  po_number: string;
  po_date: string;
  material_code: string;
  short_text: string;
  unspsc?: string;
  unspsc_commodity?: string;
  pcbi_id?: string;
  specification?: string;
  grade?: string;
  brand?: string;
  vendor?: string;
  quantity: number;
  uom: string;
  currency: string;
  unit_price: number;
  total_value: number;
  source_row_number?: number;
  comparable_key?: string;
  created_at?: string;
}

export interface PCBIBasePurchase {
  id: string;
  comparable_key: string;
  transaction_id: string;
  po_number: string;
  material_code: string;
  short_text: string;
  vendor: string;
  base_date: string;
  base_price: number;
  base_quantity: number;
  base_pcbi_id: string;
  base_pcbi_index: number;
  benchmarkability_percent: number;
  base_version: number;
  status: 'ACTIVE' | 'RESET_SUPERSEDED' | 'EXCLUDED';
  reason_if_excluded?: string;
  reset_reason?: string;
  reset_by?: string;
  reset_timestamp?: string;
  created_at: string;
}

export interface PCBIComponentCalculation {
  transaction_id: string;
  component_id: string;
  component_name: string;
  base_component_cost: number;
  base_index: number;
  current_index: number;
  index_movement_ratio: number;
  current_component_cost: number;
  weight_percent: number;
}

export interface PCBITransactionCalculation {
  id: string;
  transaction_id: string;
  po_number: string;
  po_date: string;
  material_code: string;
  short_text: string;
  vendor: string;
  plant: string;
  sector: string;
  comparable_key: string;
  base_transaction_id: string;
  base_po_number: string;
  base_date: string;
  base_price: number;
  base_pcbi_id: string;
  base_pcbi_index: number;
  current_date: string;
  current_pcbi_index: number;
  benchmarkability_percent: number;
  residual_percent: number;
  expected_price: number;
  actual_price: number;
  price_gap_per_unit: number; // MAX(0, Actual - Expected)
  quantity: number;
  opportunity_value: number;  // price_gap_per_unit * quantity
  favourable_variance: number;// MAX(0, Expected - Actual) * quantity
  benchmark_quality: PCBIQualityRating;
  calculation_method: 'SINGLE_BENCHMARK' | 'COMPOSITE_BENCHMARK';
  calculation_status: 'SUCCESS' | 'BASE_RECORD' | 'BENCHMARK_DATA_MISSING' | 'MAPPING_REQUIRED';
  component_breakdowns?: PCBIComponentCalculation[];
  created_at: string;
}

export interface PCBIExplainabilityAudit {
  transaction_id: string;
  po_number: string;
  material_code: string;
  material_description: string;
  vendor: string;
  sector: string;
  category: string;
  pcbi_id: string;
  benchmark_name: string;
  quality_rating: PCBIQualityRating;
  base_purchase: {
    po_number: string;
    date: string;
    price: number;
    pcbi_index: number;
    quantity: number;
  };
  current_purchase: {
    po_number: string;
    date: string;
    price: number;
    pcbi_index: number;
    quantity: number;
  };
  benchmarkability_percent: number;
  residual_percent: number;
  formula_display: string;
  residual_component_value: number;
  benchmark_adjusted_component_value: number;
  expected_price: number;
  actual_price: number;
  price_gap_per_unit: number;
  quantity: number;
  opportunity_value: number;
  opportunity_value_lakhs: number;
  opportunity_value_crores: number;
  favourable_variance: number;
  favourable_variance_lakhs: number;
  favourable_variance_crores: number;
  is_composite: boolean;
  components?: Array<{
    name: string;
    weight: number;
    base_cost: number;
    base_index: number;
    current_index: number;
    movement_pct: number;
    current_cost: number;
  }>;
}

export interface PCBIDataQualityReport {
  overall_score: number; // 0 - 100
  total_records: number;
  clean_records: number;
  records_with_warnings: number;
  records_with_errors: number;
  benchmarkable_records: number;
  mapping_required_records: number;
  missing_dates_count: number;
  missing_quantities_count: number;
  missing_prices_count: number;
  missing_unspsc_count: number;
  missing_indices_count: number;
  quality_grade_counts: {
    A: number;
    B: number;
    C: number;
    UNMAPPED: number;
  };
  validation_issues: Array<{
    row_index: number;
    po_number: string;
    material_code: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    field: string;
  }>;
}

export interface PCBIExecutiveSummary {
  total_spend_inr: number;
  total_spend_inr_cr: number;
  mapped_spend_inr: number;
  mapped_spend_inr_cr: number;
  mapped_spend_percent: number;
  benchmarkable_spend_inr: number;
  benchmarkable_spend_inr_cr: number;
  benchmarkable_spend_percent: number;
  total_opportunity_inr: number;
  total_opportunity_inr_cr: number;
  opportunity_percent: number;
  total_favourable_variance_inr: number;
  total_favourable_variance_inr_cr: number;
  total_transactions: number;
  benchmarkable_transactions: number;
  mapping_required_transactions: number;
  data_quality_score: number;
  category_aggregations: Array<{
    category: string;
    spend_cr: number;
    opportunity_cr: number;
    opportunity_pct: number;
    favourable_cr: number;
    items_count: number;
    quality: PCBIQualityRating;
  }>;
  vendor_aggregations: Array<{
    vendor: string;
    spend_cr: number;
    opportunity_cr: number;
    opportunity_pct: number;
    items_count: number;
    avg_price_gap_pct: number;
    top_category: string;
  }>;
  material_aggregations: Array<{
    material_code: string;
    short_text: string;
    category: string;
    spend_cr: number;
    opportunity_cr: number;
    opportunity_pct: number;
    base_price: number;
    latest_actual_price: number;
    latest_expected_price: number;
    price_trend_gap_pct: number;
    benchmark_quality: PCBIQualityRating;
  }>;
  monthly_trend: Array<{
    month_year: string;
    spend_cr: number;
    expected_spend_cr: number;
    opportunity_cr: number;
    favourable_cr: number;
    pcbi_index_avg: number;
  }>;
}

// Upgrade Request & OTP Validation Types (Prompt 81)
export interface UpgradeRequestRecord {
  id: string;
  customer_user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  company_details?: string;
  current_tier: 'BRONZE' | 'SILVER' | 'GOLD';
  requested_tier: 'SILVER' | 'GOLD' | 'ENTERPRISE';
  requirements_note?: string;
  status: 'PENDING_ADMIN_ACTION' | 'OTP_VERIFIED_CODE_SENT' | 'UPGRADE_COMPLETED' | 'REJECTED';
  generated_unique_code?: string;
  code_generated_at?: string;
  code_redeemed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminOTPValidationSession {
  request_id: string;
  admin_email: string;
  admin_mobile: string;
  otp_code: string;
  expires_at: number;
  verified: boolean;
}

export type PCBICalculationResult = PCBITransactionCalculation;
