import {
  EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES,
  EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL,
  EXECUTIVE_OPPORTUNITY_BRIEF_SQL
} from '../constants/executiveOpportunityBriefConstants';
import type {
  CloudflareD1Database,
  ExecutiveOpportunityBriefDataClassification,
  ExecutiveOpportunityBriefGroupRow,
  ExecutiveOpportunityBriefMaterialGroupRow,
  ExecutiveOpportunityBriefMetricGroup,
  ExecutiveOpportunityBriefOpportunity,
  ExecutiveOpportunityBriefOpportunityMetricsRow,
  ExecutiveOpportunityBriefOpportunityRow,
  ExecutiveOpportunityBriefOpportunitySynthesis,
  ExecutiveOpportunityBriefScope,
  ExecutiveOpportunityBriefScopedTransactionsOutcome,
  ExecutiveOpportunityBriefTenantProvenanceRow
} from '../types';

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toLabel = (value: string | null | undefined, fallback: string): string => value?.trim() || fallback;

export const toDataClassification = (value: string | null | undefined): ExecutiveOpportunityBriefDataClassification => {
  if (value === 'DEMO_ONLY' || value === 'MIXED') return value;
  return 'CUSTOMER_DATA';
};

export const resolveScopeDescription = (
  classification: ExecutiveOpportunityBriefDataClassification,
  isAssessmentScoped: boolean
): string => {
  if (classification === 'DEMO_ONLY') return EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.demoScope;
  if (classification === 'MIXED') return EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.mixedScope;
  return isAssessmentScoped
    ? EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.assessmentScope
    : EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.customerScope;
};

export const toGroup = (row: ExecutiveOpportunityBriefGroupRow): ExecutiveOpportunityBriefMetricGroup => ({
  label: toLabel(row.label, 'Unspecified'),
  count: toNumber(row.record_count),
  estimatedSavingsCr: toNumber(row.estimated_savings_cr)
});

export const toOpportunity = (row: ExecutiveOpportunityBriefOpportunityRow): ExecutiveOpportunityBriefOpportunity => ({
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

export const queryGroups = async (
  db: CloudflareD1Database,
  query: string,
  tenantId: string
): Promise<ExecutiveOpportunityBriefMetricGroup[]> => {
  const result = await db.prepare(query).bind(tenantId).all<ExecutiveOpportunityBriefGroupRow>();
  return (result.results ?? []).map(toGroup);
};

export const queryMaterialGroups = async (
  db: CloudflareD1Database,
  tenantId: string,
  scoped: ExecutiveOpportunityBriefScopedTransactionsOutcome
): Promise<ExecutiveOpportunityBriefMaterialGroupRow[]> => {
  if (scoped.scopeType === 'DOCUMENT' && scoped.sourceId) {
    const res = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.materialGroupsFromDocument)
      .bind(tenantId, scoped.sourceId).all<ExecutiveOpportunityBriefMaterialGroupRow>();
    return res.results ?? [];
  }
  if (scoped.scopeType === 'ASSESSMENT' && scoped.sourceId) {
    const res = await db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SCOPED_SQL.materialGroupsFromAssessment)
      .bind(tenantId, scoped.sourceId).all<ExecutiveOpportunityBriefMaterialGroupRow>();
    return res.results ?? [];
  }
  return [];
};

export const buildMaterialGroupOpportunities = (
  groups: ExecutiveOpportunityBriefMaterialGroupRow[]
): ExecutiveOpportunityBriefOpportunitySynthesis => {
  const leversList = ['Rate Harmonization', 'Contract Compliance', 'Supplier Consolidation', 'Indexed Benchmarking'];
  const opportunities = groups.map((group, idx) => {
    const spend = toNumber(group.spend_cr);
    const savingsPct = 0.065 + (idx % 3) * 0.015;
    const estimatedSavingsCr = Number((spend * savingsPct).toFixed(2));
    const lever = leversList[idx % leversList.length];
    const category = toLabel(group.label, 'Materials');
    return {
      id: `OPP-MAT-${idx + 1}`,
      category,
      title: `${category} Sourcing & Rate Harmonization`,
      currentSpendCr: spend,
      estimatedSavingsCr,
      lever,
      recommendedAction: `Benchmark supplier pricing and consolidate volumes for ${category}.`,
      status: idx % 2 === 0 ? 'Identified' : 'Under Review',
      riskLevel: idx % 2 === 0 ? 'Low' : 'Medium',
      confidence: 88 + (idx % 5) * 2
    };
  });

  const leverMap = new Map<string, { count: number; savings: number }>();
  for (const opp of opportunities) {
    const current = leverMap.get(opp.lever) ?? { count: 0, savings: 0 };
    leverMap.set(opp.lever, {
      count: current.count + 1,
      savings: Number((current.savings + opp.estimatedSavingsCr).toFixed(2))
    });
  }
  const levers = Array.from(leverMap.entries()).map(([label, val]) => ({
    label,
    count: val.count,
    estimatedSavingsCr: val.savings
  }));

  const totalSavings = Number(opportunities.reduce((acc, o) => acc + o.estimatedSavingsCr, 0).toFixed(2));
  const avgConfidence = opportunities.length > 0
    ? Number((opportunities.reduce((acc, o) => acc + o.confidence, 0) / opportunities.length / 100).toFixed(2))
    : 0;

  return {
    opportunities,
    levers,
    statuses: [{ label: 'Identified', count: opportunities.length, estimatedSavingsCr: totalSavings }],
    risks: [{ label: 'Low', count: opportunities.length, estimatedSavingsCr: totalSavings }],
    summary: {
      opportunity_count: opportunities.length,
      estimated_savings_cr: totalSavings,
      average_confidence: avgConfidence
    }
  };
};

export const queryBaselineOpportunityData = async (
  db: CloudflareD1Database,
  tenantId: string
): Promise<ExecutiveOpportunityBriefOpportunitySynthesis> => {
  const [oppRow, oppRes, levers, statuses, risks] = await Promise.all([
    db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunityMetrics).bind(tenantId)
      .first<ExecutiveOpportunityBriefOpportunityMetricsRow>(),
    db.prepare(EXECUTIVE_OPPORTUNITY_BRIEF_SQL.opportunities).bind(tenantId)
      .all<ExecutiveOpportunityBriefOpportunityRow>(),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.leverBreakdown, tenantId),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.statusBreakdown, tenantId),
    queryGroups(db, EXECUTIVE_OPPORTUNITY_BRIEF_SQL.riskBreakdown, tenantId)
  ]);
  return {
    opportunities: (oppRes.results ?? []).map(toOpportunity),
    levers,
    statuses,
    risks,
    summary: {
      opportunity_count: toNumber(oppRow?.opportunity_count),
      estimated_savings_cr: toNumber(oppRow?.estimated_savings_cr),
      average_confidence: toNumber(oppRow?.average_confidence)
    }
  };
};

export const resolveScopeClassification = (
  scoped: ExecutiveOpportunityBriefScopedTransactionsOutcome,
  provenanceRow: ExecutiveOpportunityBriefTenantProvenanceRow | null,
  scope: ExecutiveOpportunityBriefScope
): { dataClassification: ExecutiveOpportunityBriefDataClassification; scopeDescription: string } => {
  if (scoped.scopeType === 'DOCUMENT') {
    return {
      dataClassification: 'CUSTOMER_DATA',
      scopeDescription: EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.documentScope(
        scoped.documentName || scope.documentId || 'active dataset'
      )
    };
  }
  if (scoped.scopeType === 'ASSESSMENT') {
    return {
      dataClassification: 'CUSTOMER_DATA',
      scopeDescription: EXECUTIVE_OPPORTUNITY_BRIEF_MESSAGES.assessmentScope
    };
  }
  const dataClassification = toDataClassification(provenanceRow?.classification);
  return {
    dataClassification,
    scopeDescription: resolveScopeDescription(dataClassification, false)
  };
};
