export type StrategicRiskClassification =
  | 'SOLE_SOURCE_CRITICAL'
  | 'DOMINANT_SUPPLIER_SINGLE_DIGIT_SECONDARY';

export type MitigationUrgency =
  | 'IMMEDIATE_ACTION'
  | 'HIGH_PRIORITY'
  | 'SCHEDULED_REVIEW';

export interface StrategicVendorShare {
  vendor_name: string;
  vendor_id?: string;
  spend_inr_cr: number;
  share_percentage: number;
  is_primary: boolean;
  is_secondary_single_digit: boolean;
}

export interface StrategicSingleVendorItem {
  material_code: string;
  material_desc: string;
  total_spend_inr_cr: number;
  core_bucket: 'Direct Materials' | 'Packaging Materials' | 'Indirect & MRO' | 'Logistics & Freight';
  unspsc_code: string;
  unspsc_commodity_title: string;
  unspsc_class_title: string;
  unspsc_class_code?: string;
  unspsc_family_title: string;
  segment_code: string;
  primary_vendor: StrategicVendorShare;
  secondary_vendor?: StrategicVendorShare;
  risk_level: StrategicRiskClassification;
  risk_score: number; // 0 - 100
  annual_quantity: number;
  unit_of_measure: string;
  po_count: number;
  mitigation_urgency: MitigationUrgency;
  actionable_mitigation: string;
  suggested_action_plan: string[];
}

export interface StrategicRiskSummary {
  totalAtRiskSpendCr: number;
  totalStrategicItems: number;
  soleSourceCount: number;
  singleDigitSecondaryCount: number;
  avgPrimaryConcentrationPct: number;
}

export interface StrategicRiskSummaryBannerProps {
  summary: StrategicRiskSummary;
}

export interface StrategicSingleVendorCardProps {
  item: StrategicSingleVendorItem;
  onSelectDetails: (item: StrategicSingleVendorItem) => void;
}

export interface StrategicRiskMitigationModalProps {
  item: StrategicSingleVendorItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface StrategicSingleVendorRiskSectionProps {
  items?: StrategicSingleVendorItem[];
}
