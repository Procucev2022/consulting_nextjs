import type { PCBIQualityRating } from './pcbi';

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
  overall_score: number;
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
