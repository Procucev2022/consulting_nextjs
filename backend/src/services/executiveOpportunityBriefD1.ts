import {
  EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../constants/executiveOpportunityBriefConstants';
import type {
  CloudflareD1Database,
  ExecutiveOpportunityBriefAssessmentRow,
  ExecutiveOpportunityBriefLoadResult,
  ExecutiveOpportunityBriefReport,
  ExecutiveOpportunityBriefTenantRow,
  ExecutiveOpportunityBriefTenantProvenanceRow,
  ExecutiveOpportunityBriefTransactionMetricsRow,
  ExecutiveOpportunityBriefScope,
  ExecutiveOpportunityBriefScopedTransactionsOutcome
} from '../types';
import {
  buildMaterialGroupOpportunities,
  queryBaselineOpportunityData,
  queryMaterialGroups,
  resolveScopeClassification
} from './executiveOpportunityBriefSynthesis';

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const assessmentTransactionMetrics = async (
  db: CloudflareD1Database,
  tenantId: string,
  assessmentId: string
): Promise<ExecutiveOpportunityBriefTransactionMetricsRow | null> =>
  db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.assessmentTransactionMetrics)
    .bind(tenantId, assessmentId)
    .first<ExecutiveOpportunityBriefTransactionMetricsRow>();

const queryDocumentTransactions = async (
  db: CloudflareD1Database,
  tenantId: string,
  documentId: string
): Promise<ExecutiveOpportunityBriefTransactionMetricsRow | null> => {
  const row = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.documentTransactionMetrics)
    .bind(tenantId, documentId).first<ExecutiveOpportunityBriefTransactionMetricsRow>();
  if (toNumber(row?.transaction_count) > 0) return row;

  const validation = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.validationDocumentMetrics)
    .bind(tenantId, documentId).first<ExecutiveOpportunityBriefTransactionMetricsRow>();
  if (toNumber(validation?.transaction_count) > 0) return validation;

  return null;
};

const resolveExplicitScopedMetrics = async (
  db: CloudflareD1Database,
  tenantId: string,
  scope: ExecutiveOpportunityBriefScope
): Promise<ExecutiveOpportunityBriefScopedTransactionsOutcome | null> => {
  if (scope.documentId) {
    const docRow = await queryDocumentTransactions(db, tenantId, scope.documentId);
    if (toNumber(docRow?.transaction_count) > 0) {
      return { row: docRow, scopeType: 'DOCUMENT', sourceId: scope.documentId };
    }
  }
  if (scope.assessmentId) {
    const row = await assessmentTransactionMetrics(db, tenantId, scope.assessmentId);
    if (toNumber(row?.transaction_count) > 0) {
      return { row, scopeType: 'ASSESSMENT', sourceId: scope.assessmentId };
    }
  }
  return null;
};

const resolveLatestScopedMetrics = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<ExecutiveOpportunityBriefScopedTransactionsOutcome | null> => {
  const latestDoc = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.latestUploadedDocument)
    .bind(tenantId).first<{ doc_id: string; file_name: string; records_count: number; converted_inr_crores: number }>();
  if (latestDoc?.doc_id) {
    const docRow = await queryDocumentTransactions(db, tenantId, latestDoc.doc_id);
    if (toNumber(docRow?.transaction_count) > 0) {
      return { row: docRow, scopeType: 'DOCUMENT', documentName: latestDoc.file_name, sourceId: latestDoc.doc_id };
    }
  }
  const latestAssessment = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.latestAssessmentWithTransactions)
    .bind(tenantId).first<ExecutiveOpportunityBriefAssessmentRow>();
  const fallbackAssessmentId = latestAssessment?.assessment_id?.trim();
  if (fallbackAssessmentId) {
    const row = await assessmentTransactionMetrics(db, tenantId, fallbackAssessmentId);
    if (toNumber(row?.transaction_count) > 0) {
      return { row, scopeType: 'ASSESSMENT', sourceId: fallbackAssessmentId };
    }
  }
  return null;
};

const resolveScopedTransactionMetrics = async (
  db: CloudflareD1Database,
  tenantId: string,
  scope: ExecutiveOpportunityBriefScope
): Promise<ExecutiveOpportunityBriefScopedTransactionsOutcome> => {
  const explicit = await resolveExplicitScopedMetrics(db, tenantId, scope);
  if (explicit) return explicit;

  if (!scope.documentId && !scope.assessmentId) {
    const latest = await resolveLatestScopedMetrics(db, tenantId);
    if (latest) return latest;
  }

  const baseline = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.transactionMetrics).bind(tenantId)
    .first<ExecutiveOpportunityBriefTransactionMetricsRow>();
  return { row: baseline, scopeType: 'BASELINE' };
};

const resolveEnterpriseName = async (
  db: CloudflareD1Database,
  tenant: ExecutiveOpportunityBriefTenantRow,
  scope: ExecutiveOpportunityBriefScope
): Promise<string> => {
  if (scope.client && scope.client.trim().length > 0) return scope.client.trim();
  if (scope.assessmentId) {
    const row = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.customerFromAssessment)
      .bind(scope.assessmentId).first<{ customer_name: string | null }>();
    if (row?.customer_name?.trim()) return row.customer_name.trim();
  }
  const customerRow = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.latestCustomer)
    .bind(tenant.tenant_id).first<{ customer_name: string | null }>();
  if (customerRow?.customer_name?.trim()) return customerRow.customer_name.trim();

  return tenant.enterprise_name;
};

export const loadExecutiveOpportunityBriefFromD1 = async (
  db: CloudflareD1Database,
  tenantId: string,
  generatedAt: Date = new Date(),
  assessmentIdOrScope?: string | ExecutiveOpportunityBriefScope
): Promise<ExecutiveOpportunityBriefLoadResult> => {
  if (!tenantId) return { ok: false, reason: 'tenant-scope-required' };
  const tenant = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenant)
    .bind(tenantId)
    .first<ExecutiveOpportunityBriefTenantRow>();
  if (!tenant) return { ok: false, reason: 'no-tenant' };

  const scope: ExecutiveOpportunityBriefScope = typeof assessmentIdOrScope === 'string'
    ? { assessmentId: assessmentIdOrScope }
    : (assessmentIdOrScope ?? {});

  const [scopedTransactions, enterpriseName, provenanceRow] = await Promise.all([
    resolveScopedTransactionMetrics(db, tenant.tenant_id, scope),
    resolveEnterpriseName(db, tenant, scope),
    db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.tenantProvenance).bind(tenant.tenant_id)
      .first<ExecutiveOpportunityBriefTenantProvenanceRow>()
  ]);

  const transactionRow = scopedTransactions.row;
  if (toNumber(transactionRow?.transaction_count) === 0) {
    return { ok: false, reason: 'no-transactions' };
  }

  const materialGroups = await queryMaterialGroups(db, tenant.tenant_id, scopedTransactions);
  const opportunityData = materialGroups.length > 0
    ? buildMaterialGroupOpportunities(materialGroups)
    : await queryBaselineOpportunityData(db, tenant.tenant_id);

  const { dataClassification, scopeDescription } = resolveScopeClassification(
    scopedTransactions,
    provenanceRow,
    scope
  );

  const report: ExecutiveOpportunityBriefReport = {
    tenant: { tenantId: tenant.tenant_id, enterpriseName },
    dataClassification,
    generatedAt: generatedAt.toISOString(),
    scopeDescription,
    metrics: {
      transactionCount: toNumber(transactionRow?.transaction_count),
      totalSpendCr: toNumber(transactionRow?.total_spend_cr),
      supplierCount: toNumber(transactionRow?.supplier_count),
      materialCount: toNumber(transactionRow?.material_count),
      plantCount: toNumber(transactionRow?.plant_count),
      purchaseOrderCount: toNumber(transactionRow?.purchase_order_count),
      firstTransactionDate: transactionRow?.first_transaction_date ?? null,
      lastTransactionDate: transactionRow?.last_transaction_date ?? null,
      opportunityCount: opportunityData.summary.opportunity_count,
      estimatedSavingsCr: opportunityData.summary.estimated_savings_cr,
      averageConfidence: opportunityData.summary.average_confidence
    },
    opportunities: opportunityData.opportunities,
    levers: opportunityData.levers,
    statuses: opportunityData.statuses,
    risks: opportunityData.risks
  };

  return { ok: true, report };
};
