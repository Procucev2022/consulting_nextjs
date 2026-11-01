export interface ExecutiveOpportunityBriefTenant {
  tenantId: string;
  enterpriseName: string;
}

export type ExecutiveOpportunityBriefDataClassification = 'CUSTOMER_DATA' | 'DEMO_ONLY' | 'MIXED';

export interface ExecutiveOpportunityBriefMetricGroup {
  label: string;
  count: number;
  estimatedSavingsCr: number;
}

export interface ExecutiveOpportunityBriefOpportunity {
  id: string;
  category: string;
  title: string;
  currentSpendCr: number;
  estimatedSavingsCr: number;
  lever: string;
  recommendedAction: string;
  status: string;
  riskLevel: string;
  confidence: number;
}

export interface ExecutiveOpportunityBriefReport {
  tenant: ExecutiveOpportunityBriefTenant;
  dataClassification: ExecutiveOpportunityBriefDataClassification;
  generatedAt: string;
  scopeDescription: string;
  metrics: {
    transactionCount: number;
    totalSpendCr: number;
    supplierCount: number;
    materialCount: number;
    plantCount: number;
    purchaseOrderCount: number;
    firstTransactionDate: string | null;
    lastTransactionDate: string | null;
    opportunityCount: number;
    estimatedSavingsCr: number;
    averageConfidence: number;
  };
  opportunities: ExecutiveOpportunityBriefOpportunity[];
  levers: ExecutiveOpportunityBriefMetricGroup[];
  statuses: ExecutiveOpportunityBriefMetricGroup[];
  risks: ExecutiveOpportunityBriefMetricGroup[];
}

export type ExecutiveOpportunityBriefLoadResult =
  | { ok: true; report: ExecutiveOpportunityBriefReport }
  | { ok: false; reason: 'no-tenant' | 'ambiguous-tenant' | 'no-transactions' };

export type ExecutiveOpportunityBriefRequestLoad =
  | { ok: true; report: ExecutiveOpportunityBriefReport; requestId: string; startedAt: number }
  | { ok: false; response: Response };

export interface ExecutiveOpportunityBriefTenantRow {
  tenant_id: string;
  enterprise_name: string;
}

export interface ExecutiveOpportunityBriefTenantProvenanceRow {
  classification: string;
}

export interface ExecutiveOpportunityBriefTransactionMetricsRow {
  transaction_count: number | string;
  total_spend_cr: number | string;
  supplier_count: number | string;
  material_count: number | string;
  plant_count: number | string;
  purchase_order_count: number | string;
  first_transaction_date: string | null;
  last_transaction_date: string | null;
}

export interface ExecutiveOpportunityBriefOpportunityMetricsRow {
  opportunity_count: number | string;
  estimated_savings_cr: number | string;
  average_confidence: number | string;
}

export interface ExecutiveOpportunityBriefOpportunityRow {
  opp_id: string;
  category: string;
  title: string | null;
  current_spend_cr: number | string | null;
  estimated_savings_cr: number | string;
  lever: string | null;
  recommended_action: string | null;
  status: string | null;
  risk_level: string | null;
  confidence_score: number | string | null;
}

export interface ExecutiveOpportunityBriefGroupRow {
  label: string;
  record_count: number | string;
  estimated_savings_cr: number | string;
}
