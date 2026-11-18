import type { D1Record, D1ValidationRecordCursor } from './d1';

export interface D1DocumentMaterialGroupSummary {
  group_code: string;
  group_name: string;
  primary_segment: string;
  spend_inr_cr: number;
  spend_usd_m: number;
  share_pct: number;
  records_count: number;
  po_count: number;
  unique_items_count: number;
  unique_vendors_count: number;
  item_count: number;
  active_vendors_count: number;
  sample_item?: string;
  top_supplier?: string;
  total_spend_inr_cr: number;
}

export interface D1DocumentPlantSummary {
  plant_code: string;
  plant_name: string;
  region: string;
  location: string;
  records_count: number;
  po_count: number;
  total_po_count: number;
  spend_inr_cr: number;
  spend_usd_m: number;
  share_pct: number;
  unique_items_count: number;
  unique_vendors_count: number;
  active_vendors_count: number;
  top_material_group: string;
}

export interface D1DocumentMonthSummary {
  month_key: string;
  month_label: string;
  fiscal_year: string;
  spend_inr_cr: number;
  spend_usd_m: number;
  records_count: number;
  po_count: number;
  line_items_count: number;
  vendors_count: number;
  unique_items_count: number;
  unique_vendors_count: number;
  top_material_group: string;
  top_plant: string;
}

export interface D1DocumentIngestionAnalytics {
  materialGroupSummaries: D1DocumentMaterialGroupSummary[];
  plantSummaries: D1DocumentPlantSummary[];
  monthWiseSummaries: D1DocumentMonthSummary[];
  uniqueItemsCount: number;
  uniqueVendorsCount: number;
}

export interface D1DocumentEnrichmentOptions {
  validationCursor?: D1ValidationRecordCursor;
  includeSummary: boolean;
  requestId?: string;
}

export interface D1EntityCountsRow {
  transactionCount: number;
  uniqueItemsCount: number;
  uniqueVendorsCount: number;
  totalSpendCr: number;
}

export type D1SummaryMetricRow = D1Record;
