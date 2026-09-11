export type PoConsolidationCadence = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';

export interface CadenceSavingsBenefit {
  cadence: PoConsolidationCadence;
  label: string;
  target_pos_per_year: number;
  po_reduction_pct: number;
  scale_discount_pct: number;
  scale_savings_cr: number;
  admin_savings_lakhs: number;
  total_benefit_cr: number;
}

export interface MonthlyPoDistribution {
  month: string;
  po_count: number;
  spend_inr_lakhs: number;
}

export interface MultiplePoItem {
  id: string;
  vendor_id: string;
  vendor_name: string;
  category: string;
  item_description: string;
  material_code: string;
  total_annual_spend_cr: number;
  annual_po_count: number;
  avg_pos_per_month: number;
  avg_po_value_lakhs: number;
  monthly_distribution: MonthlyPoDistribution[];
  primary_plant: string;
  cadence_options: Record<PoConsolidationCadence, CadenceSavingsBenefit>;
  recommended_cadence: PoConsolidationCadence;
  best_practice_recommendation: string;
  blanket_po_strategy: string;
}

export interface PoConsolidationSummary {
  totalFragmentedSpendCr: number;
  totalCurrentPos: number;
  totalTargetPos: number;
  totalAdminCostSavingsLakhs: number;
  totalScaleSavingsCr: number;
  avgPoReductionPct: number;
  qualifiedSuppliersCount: number;
}

export interface PoConsolidationSummaryBannerProps {
  summary: PoConsolidationSummary;
  selectedGlobalCadence: PoConsolidationCadence;
  onSelectGlobalCadence: (cadence: PoConsolidationCadence) => void;
}

export interface PoConsolidationCardProps {
  item: MultiplePoItem;
  selectedCadence: PoConsolidationCadence;
  onSelectCadence: (itemId: string, cadence: PoConsolidationCadence) => void;
  onOpenModal: (item: MultiplePoItem) => void;
}

export interface PoConsolidationModalProps {
  item: MultiplePoItem | null;
  isOpen: boolean;
  onClose: () => void;
  activeCadence: PoConsolidationCadence;
  onCadenceChange: (cadence: PoConsolidationCadence) => void;
}

export interface PoConsolidationSectionProps {
  items?: MultiplePoItem[];
}
