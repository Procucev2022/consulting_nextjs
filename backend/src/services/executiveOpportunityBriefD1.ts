import { EXECUTIVE_OPPORTUNITY_BRIEF_SQL } from '../constants/executiveOpportunityBriefConstants';
import type {
  CloudflareD1Database,
  ExecutiveOpportunityBriefGroupRow,
  ExecutiveOpportunityBriefLoadResult,
  ExecutiveOpportunityBriefOpportunityMetricsRow,
  ExecutiveOpportunityBriefOpportunityRow,
  ExecutiveOpportunityBriefReport,
  ExecutiveOpportunityBriefTenantRow,
  ExecutiveOpportunityBriefTransactionMetricsRow,
  ExecutiveOpportunityBriefMetricGroup,
  ExecutiveOpportunityBriefOpportunity
} from '../types';

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toLabel = (value: string | null | undefined, fallback: string): string => value?.trim() || fallback;

const toGroup = (row: ExecutiveOpportunityBriefGroupRow): ExecutiveOpportunityBriefMetricGroup => ({
  label: toLabel(row.label, 'Unspecified'),
  count: toNumber(row.record_count),
  estimatedSavingsCr: toNumber(row.estimated_savings_cr)
});

const toOpportunity = (row: ExecutiveOpportunityBriefOpportunityRow): ExecutiveOpportunityBriefOpportunity => ({
  id: row.opp_id,
  category: toLabel(row.category, 'Uncategorized'),
  title: toLabel(row.title, toLabel(row.recommended_action, row.category)),
  currentSpendCr: toNumber(row.current_spend_cr),
  estimatedSavingsCr: toNumber(row.estimated_savings_cr),
  lever: toLabel(row.lever, 'Unspecified'),
  recommendedAction: toLabel(row.recommended_action, 'Review this opportunity with the procurement owner.'),
  status: toLabel(row.status, 'Unspecified'),
  riskLevel: toLabel(row.risk_level, 'Unspecified'),
  confidence: toNumber(row.confidence_score)
});

const queryGroups = async (
  db: CloudflareD1Database,
  query: string
): Promise<ExecutiveOpportunityBriefMetricGroup[]> => {
  const result = await db.prepare(query).all<ExecutiveOpportunityBriefGroupRow>();
  return (result.results ?? []).map(toGroup);
};

const transactionMetrics = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<ExecutiveOpportunityBriefTransactionMetricsRow | null> =>
  db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics).bind(tenantId)
    .first<ExecutiveOpportunityBriefTransactionMetricsRow>();

const opportunityMetrics = async (
  db: CloudflareD1Database
): Promise<ExecutiveOpportunityBriefOpportunityMetricsRow | null> =>
  db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunityMetrics)
    .first<ExecutiveOpportunityBriefOpportunityMetricsRow>();

export const loadExecutiveOpportunityBriefFromD1 = async (
  db: CloudflareD1Database,
  generatedAt: Date = new Date()
): Promise<ExecutiveOpportunityBriefLoadResult> => {
  const tenants = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenants).all<ExecutiveOpportunityBriefTenantRow>();
  const tenantRows = tenants.results ?? [];
  if (tenantRows.length === 0) {
    return { ok: false, reason: 'no-tenant' };
  }
  if (tenantRows.length > 1) {
    return { ok: false, reason: 'ambiguous-tenant' };
  }

  const tenant = tenantRows[0];
  const [transactionRow, opportunityRow, opportunityResult, levers, statuses, risks] = await Promise.all([
    transactionMetrics(db, tenant.tenant_id),
    opportunityMetrics(db),
    db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities).all<ExecutiveOpportunityBriefOpportunityRow>(),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.leverBreakdown),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.statusBreakdown),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.riskBreakdown)
  ]);
  if (toNumber(transactionRow?.transaction_count) === 0) {
    return { ok: false, reason: 'no-transactions' };
  }

  const summary = opportunityRow ?? {
    opportunity_count: 0,
    estimated_savings_cr: 0,
    average_confidence: 0
  };
  const metrics = {
    transactionCount: toNumber(transactionRow?.transaction_count),
    totalSpendCr: toNumber(transactionRow?.total_spend_cr),
    supplierCount: toNumber(transactionRow?.supplier_count),
    materialCount: toNumber(transactionRow?.material_count),
    plantCount: toNumber(transactionRow?.plant_count),
    purchaseOrderCount: toNumber(transactionRow?.purchase_order_count),
    firstTransactionDate: transactionRow?.first_transaction_date ?? null,
    lastTransactionDate: transactionRow?.last_transaction_date ?? null,
    opportunityCount: toNumber(summary.opportunity_count),
    estimatedSavingsCr: toNumber(summary.estimated_savings_cr),
    averageConfidence: toNumber(summary.average_confidence)
  };
  const report: ExecutiveOpportunityBriefReport = {
    tenant: { tenantId: tenant.tenant_id, enterpriseName: tenant.enterprise_name },
    generatedAt: generatedAt.toISOString(),
    scopeDescription: 'Baseline transaction rows exclude assessment-specific copies. Savings opportunity rows are read from the D1 opportunity register.',
    metrics,
    opportunities: (opportunityResult.results ?? []).map(toOpportunity),
    levers,
    statuses,
    risks
  };
  return { ok: true, report };
};
