import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../constants/executiveOpportunityBriefConstants';
import type {
  CloudflareD1Database,
  ExecutiveOpportunityBriefAssessmentRow,
  ExecutiveOpportunityBriefGroupRow,
  ExecutiveOpportunityBriefLoadResult,
  ExecutiveOpportunityBriefOpportunityMetricsRow,
  ExecutiveOpportunityBriefOpportunityRow,
  ExecutiveOpportunityBriefReport,
  ExecutiveOpportunityBriefTenantRow,
  ExecutiveOpportunityBriefTenantProvenanceRow,
  ExecutiveOpportunityBriefDataClassification,
  ExecutiveOpportunityBriefTransactionMetricsRow,
  ExecutiveOpportunityBriefMetricGroup,
  ExecutiveOpportunityBriefOpportunity
} from '../types';

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toLabel = (value: string | null | undefined, fallback: string): string => value?.trim() || fallback;

const toDataClassification = (value: string | null | undefined): ExecutiveOpportunityBriefDataClassification => {
  if (value === 'DEMO_ONLY' || value === 'MIXED') return value;
  return 'CUSTOMER_DATA';
};

const resolveScopeDescription = (
  classification: ExecutiveOpportunityBriefDataClassification,
  isAssessmentScoped: boolean
): string => {
  if (classification === 'DEMO_ONLY') return EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.demoScope;
  if (classification === 'MIXED') return EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.mixedScope;
  return isAssessmentScoped
    ? EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.assessmentScope
    : EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.customerScope;
};

const toGroup = (row: ExecutiveOpportunityBriefGroupRow): ExecutiveOpportunityBriefMetricGroup => ({
  label: toLabel(row.label, 'Unspecified'),
  count: toNumber(row.record_count),
  estimatedSavingsCr: toNumber(row.estimated_savings_cr)
});

const toOpportunity = (row: ExecutiveOpportunityBriefOpportunityRow): ExecutiveOpportunityBriefOpportunity => ({
  id: row.opp_id,
  category: toLabel(row.category, 'Uncategorized'),
  title: toLabel(row.title, toLabel(row.recommended_action, toLabel(row.category, 'Uncategorized'))),
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
  query: string,
  tenantId: string
): Promise<ExecutiveOpportunityBriefMetricGroup[]> => {
  const result = await db.prepare(query).bind(tenantId).all<ExecutiveOpportunityBriefGroupRow>();
  return (result.results ?? []).map(toGroup);
};

const transactionMetrics = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<ExecutiveOpportunityBriefTransactionMetricsRow | null> =>
  db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics).bind(tenantId)
    .first<ExecutiveOpportunityBriefTransactionMetricsRow>();

const assessmentTransactionMetrics = async (
  db: CloudflareD1Database,
  tenantId: string,
  assessmentId: string
): Promise<ExecutiveOpportunityBriefTransactionMetricsRow | null> =>
  db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.assessmentTransactionMetrics)
    .bind(tenantId, assessmentId)
    .first<ExecutiveOpportunityBriefTransactionMetricsRow>();

const resolveScopedTransactionMetrics = async (
  db: CloudflareD1Database,
  tenantId: string,
  assessmentId?: string
): Promise<{ row: ExecutiveOpportunityBriefTransactionMetricsRow | null; isAssessmentScoped: boolean }> => {
  if (assessmentId) {
    return { row: await assessmentTransactionMetrics(db, tenantId, assessmentId), isAssessmentScoped: true };
  }
  const baseline = await transactionMetrics(db, tenantId);
  if (toNumber(baseline?.transaction_count) > 0) {
    return { row: baseline, isAssessmentScoped: false };
  }
  const latestAssessment = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.latestAssessmentWithTransactions)
    .bind(tenantId)
    .first<ExecutiveOpportunityBriefAssessmentRow>();
  const fallbackAssessmentId = latestAssessment?.assessment_id?.trim();
  if (!fallbackAssessmentId) {
    return { row: baseline, isAssessmentScoped: false };
  }
  return {
    row: await assessmentTransactionMetrics(db, tenantId, fallbackAssessmentId),
    isAssessmentScoped: true
  };
};

const opportunityMetrics = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<ExecutiveOpportunityBriefOpportunityMetricsRow | null> =>
  db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunityMetrics).bind(tenantId)
    .first<ExecutiveOpportunityBriefOpportunityMetricsRow>();

export const loadExecutiveOpportunityBriefFromD1 = async (
  db: CloudflareD1Database,
  tenantId: string,
  generatedAt: Date = new Date(),
  assessmentId?: string
): Promise<ExecutiveOpportunityBriefLoadResult> => {
  if (!tenantId) return { ok: false, reason: 'tenant-scope-required' };
  const tenant = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenant)
    .bind(tenantId)
    .first<ExecutiveOpportunityBriefTenantRow>();
  if (!tenant) {
    return { ok: false, reason: 'no-tenant' };
  }
  const [
    scopedTransactions,
    opportunityRow,
    opportunityResult,
    levers,
    statuses,
    risks,
    provenanceRow
  ] = await Promise.all([
    resolveScopedTransactionMetrics(db, tenant.tenant_id, assessmentId),
    opportunityMetrics(db, tenant.tenant_id),
    db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities)
      .bind(tenant.tenant_id)
      .all<ExecutiveOpportunityBriefOpportunityRow>(),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.leverBreakdown, tenant.tenant_id),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.statusBreakdown, tenant.tenant_id),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.riskBreakdown, tenant.tenant_id),
    db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenantProvenance).bind(tenant.tenant_id)
      .first<ExecutiveOpportunityBriefTenantProvenanceRow>()
  ]);
  const transactionRow = scopedTransactions.row;
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
  const dataClassification = toDataClassification(provenanceRow?.classification);
  const scopeDescription = resolveScopeDescription(dataClassification, scopedTransactions.isAssessmentScoped);
  const report: ExecutiveOpportunityBriefReport = {
    tenant: { tenantId: tenant.tenant_id, enterpriseName: tenant.enterprise_name },
    dataClassification,
    generatedAt: generatedAt.toISOString(),
    scopeDescription,
    metrics,
    opportunities: (opportunityResult.results ?? []).map(toOpportunity),
    levers,
    statuses,
    risks
  };
  return { ok: true, report };
};
