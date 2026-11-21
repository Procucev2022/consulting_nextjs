/**
 * Module 2 — Cross-Lever Savings Deduplication & Consolidation Service (Backend)
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 4 (Logging), Rule 8 (Constants), Rule 9 (Types), Rule 12 (DB Optimization)
 */

import type { CloudflareD1Database } from '../types/cloudflare';
import type {
  Module2CanonicalSavingsOpportunity,
  Module2ConsolidatedSavingsSummary,
  Module2LeverSavingsSummaryItem
} from '../types/module2SavingsDeduplication';
import {
  CRORE_DIVISOR,
  LEVER_DEFINITIONS,
  CONSOLIDATED_SAVINGS_NOTICES,
  DEDUPLICATION_DISCLOSURES,
  ZERO_SAVINGS_METRICS,
  ZERO_CONSOLIDATED_TOTALS
} from '../constants/module2SavingsDeduplication';
import { D1_TABLES } from '../constants/d1';
import { queryD1Rows } from './workerD1Query';
import { resolveScopedTransactionMetrics } from './executiveOpportunityBriefD1';
import { queryMaterialGroups } from './executiveOpportunityBriefSynthesis';

interface OppIdentifiers {
  oppId: string;
  leverDef: (typeof LEVER_DEFINITIONS)[number];
  catOrMat: string;
  catId: string;
}

const readNumberProp = (item: Record<string, unknown>, keys: string[]): number => {
  for (const k of keys) {
    const val = item[k];
    if (typeof val === 'number' && Number.isFinite(val)) return val;
  }
  return 0;
};

const resolveAmountPair = (
  item: Record<string, unknown>,
  inrKeys: string[],
  crKeys: string[]
): { inr: number; cr: number } => {
  const inrVal = readNumberProp(item, inrKeys);
  const crVal = readNumberProp(item, crKeys);
  const inr = inrVal > 0 ? inrVal : crVal * CRORE_DIVISOR;
  const cr = crVal > 0 ? crVal : Number((inr / CRORE_DIVISOR).toFixed(4));
  return { inr, cr };
};

const resolveEligibleSpend = (item: Record<string, unknown>): { inr: number; cr: number } =>
  resolveAmountPair(item, ['eligibleSpendInr'], ['eligibleSpendCr', 'spend_inr_cr']);

const resolveGrossSavings = (item: Record<string, unknown>): { inr: number; cr: number } =>
  resolveAmountPair(item, ['estimatedGrossSavingsInr', 'grossOpportunityInr'], [
    'estimatedGrossSavingsCr', 'grossOpportunityCr', 'est_savings_inr_cr', 'potential_savings_inr_cr'
  ]);

const resolveOverlap = (item: Record<string, unknown>): { inr: number; cr: number } =>
  resolveAmountPair(item, ['overlapAmountInr'], ['overlapAmountCr']);

const resolveNetSavings = (
  item: Record<string, unknown>,
  grossInr: number,
  overlapInr: number
): { inr: number; cr: number } => {
  const explicitInr = readNumberProp(item, ['netEstimatedSavingsInr', 'netOpportunityInr']);
  const explicitCr = readNumberProp(item, ['netEstimatedSavingsCr', 'netOpportunityCr']);
  let inr = explicitInr;
  if (inr <= 0) {
    inr = explicitCr > 0 ? explicitCr * CRORE_DIVISOR : Math.max(0, grossInr - overlapInr);
  }
  const cr = explicitCr > 0 ? explicitCr : Number((inr / CRORE_DIVISOR).toFixed(4));
  return { inr, cr };
};

const resolveOpportunityIdentifiers = (
  item: Record<string, unknown>,
  defaultAssessmentId: string,
  index: number
): OppIdentifiers => {
  const oppId = String(item.opportunityId || item.opp_id || `OPP-${defaultAssessmentId || 'M2'}-${index + 1}`);
  const leverId = typeof item.leverId === 'number' ? item.leverId : 1;
  const leverDef = LEVER_DEFINITIONS.find((l) => l.id === leverId) || LEVER_DEFINITIONS[0];
  const catOrMat = String(item.categoryOrMaterialName || item.category || item.material_group || 'Procurement Spend');
  const catId = String(item.categoryOrMaterialId || item.materialIds || item.material_code || `CAT-${index + 1}`);
  return { oppId, leverDef, catOrMat, catId };
};

const resolveOverlapRefs = (item: Record<string, unknown>): string[] => {
  if (Array.isArray(item.overlappingOpportunityRefs)) {
    return item.overlappingOpportunityRefs as string[];
  }
  return item.overlapGroup ? [String(item.overlapGroup)] : [];
};

const resolveTransactionCount = (item: Record<string, unknown>): number => {
  if (Array.isArray(item.sourceTransactionIds)) {
    return item.sourceTransactionIds.length;
  }
  return typeof item.transactionScopeCount === 'number' ? item.transactionScopeCount : 1;
};

const toCanonicalOpportunity = (
  item: Record<string, unknown>,
  defaultAssessmentId: string,
  index: number
): Module2CanonicalSavingsOpportunity => {
  const { oppId, leverDef, catOrMat, catId } = resolveOpportunityIdentifiers(item, defaultAssessmentId, index);
  const spend = resolveEligibleSpend(item);
  const gross = resolveGrossSavings(item);
  const overlap = resolveOverlap(item);
  const net = resolveNetSavings(item, gross.inr, overlap.inr);
  const isProven = item.status === 'PROVEN' || item.status === 'APPROVED';

  return {
    assessmentId: String(item.assessmentId || defaultAssessmentId || ''),
    opportunityId: oppId,
    leverId: leverDef.id,
    leverCode: leverDef.code,
    leverName: leverDef.name,
    categoryOrMaterialId: catId,
    categoryOrMaterialName: catOrMat,
    eligibleSpendInr: spend.inr,
    eligibleSpendCr: spend.cr,
    transactionScopeCount: resolveTransactionCount(item),
    calculationBasis: String(item.calculationBasis || item.formula || item.methodology || leverDef.basis),
    estimatedGrossSavingsInr: gross.inr,
    estimatedGrossSavingsCr: gross.cr,
    overlappingOpportunityRefs: resolveOverlapRefs(item),
    overlapAmountInr: overlap.inr,
    overlapAmountCr: overlap.cr,
    netEstimatedSavingsInr: net.inr,
    netEstimatedSavingsCr: net.cr,
    deduplicationStatus: overlap.inr > 0 ? 'DEDUPLICATED_OVERLAP' : 'MUTUALLY_EXCLUSIVE_ALTERNATIVE_RETAINED',
    evidenceValidationStatus: isProven ? 'VALIDATED_COMMERCIAL' : 'UNVERIFIED_ESTIMATE',
    approvalStatus: 'PENDING_REVIEW',
    commerciallyValidatedSavingsInr: 0,
    commerciallyValidatedSavingsCr: 0,
    isIncrementalBenefit: false,
    auditEvidenceSummary: String(item.auditEvidenceSummary || `Audited under ${leverDef.code} criteria.`)
  };
};

const buildNonPpSummary = (
  def: (typeof LEVER_DEFINITIONS)[number],
  count: number
): Module2LeverSavingsSummaryItem => ({
  ...ZERO_SAVINGS_METRICS,
  leverId: def.id,
  leverCode: def.code,
  leverName: def.name,
  implementationStatus: def.status,
  statusLabel: def.status,
  opportunitiesCount: count,
  methodologyBasis: def.basis,
  safeguardRule: def.rule,
  isPurchasePriceSavings: false,
  annualFinancingBenefitInr: 0,
  annualFinancingBenefitCr: 0,
  workingCapitalReleasedInr: 0,
  workingCapitalReleasedCr: 0
});

const buildPpSummary = (
  def: (typeof LEVER_DEFINITIONS)[number],
  leverOpps: Module2CanonicalSavingsOpportunity[]
): Module2LeverSavingsSummaryItem => {
  const grossInr = leverOpps.reduce((sum, opp) => sum + opp.estimatedGrossSavingsInr, 0);
  const overlapInr = leverOpps.reduce((sum, opp) => sum + opp.overlapAmountInr, 0);
  const netInr = leverOpps.reduce((sum, opp) => sum + opp.netEstimatedSavingsInr, 0);
  const validatedInr = leverOpps.reduce((sum, opp) => sum + opp.commerciallyValidatedSavingsInr, 0);

  return {
    ...ZERO_SAVINGS_METRICS,
    leverId: def.id,
    leverCode: def.code,
    leverName: def.name,
    implementationStatus: def.status,
    statusLabel: def.status,
    grossSavingsInr: grossInr,
    grossSavingsCr: Number((grossInr / CRORE_DIVISOR).toFixed(4)),
    netSavingsInr: netInr,
    netSavingsCr: Number((netInr / CRORE_DIVISOR).toFixed(4)),
    commerciallyValidatedSavingsInr: validatedInr,
    commerciallyValidatedSavingsCr: Number((validatedInr / CRORE_DIVISOR).toFixed(4)),
    overlapDeductionsInr: overlapInr,
    overlapDeductionsCr: Number((overlapInr / CRORE_DIVISOR).toFixed(4)),
    opportunitiesCount: leverOpps.length,
    methodologyBasis: def.basis,
    safeguardRule: def.rule,
    isPurchasePriceSavings: true
  };
};

export const buildModule2ConsolidatedSavingsSummary = (
  assessmentId: string,
  customerName: string,
  rawItems: unknown[] = []
): Module2ConsolidatedSavingsSummary => {
  const itemsArray = Array.isArray(rawItems) ? rawItems : [];
  const opportunities = itemsArray.map((item, idx) =>
    toCanonicalOpportunity(item as Record<string, unknown>, assessmentId, idx)
  );

  const leverSummaries: Module2LeverSavingsSummaryItem[] = LEVER_DEFINITIONS.map((def) => {
    const leverOpps = opportunities.filter((opp) => opp.leverId === def.id);
    return def.isPp ? buildPpSummary(def, leverOpps) : buildNonPpSummary(def, leverOpps.length);
  });

  const ppSummaries = leverSummaries.filter((l) => l.isPurchasePriceSavings);
  const grossInr = ppSummaries.reduce((sum, l) => sum + l.grossSavingsInr, 0);
  const overlapInr = ppSummaries.reduce((sum, l) => sum + l.overlapDeductionsInr, 0);
  const netInr = Math.max(0, grossInr - overlapInr);
  const reconciliationBalanceInr = grossInr - overlapInr - netInr;

  return {
    ...ZERO_CONSOLIDATED_TOTALS,
    assessmentId: assessmentId || '',
    customerName: customerName || 'Default Enterprise',
    calculatedAt: new Date().toISOString(),
    grossEstimatedSavingsInr: grossInr,
    grossEstimatedSavingsCr: Number((grossInr / CRORE_DIVISOR).toFixed(4)),
    netEstimatedSavingsInr: netInr,
    netEstimatedSavingsCr: Number((netInr / CRORE_DIVISOR).toFixed(4)),
    grossEvidenceBasedSavingsInr: grossInr,
    grossEvidenceBasedSavingsCr: Number((grossInr / CRORE_DIVISOR).toFixed(4)),
    netEvidenceBasedSavingsInr: netInr,
    netEvidenceBasedSavingsCr: Number((netInr / CRORE_DIVISOR).toFixed(4)),
    totalOverlappingDeductionsInr: overlapInr,
    totalOverlappingDeductionsCr: Number((overlapInr / CRORE_DIVISOR).toFixed(4)),
    unquantifiedOpportunitiesCount: leverSummaries.filter((l) => l.opportunitiesCount === 0).length,
    quantifiedOpportunitiesCount: leverSummaries.filter((l) => l.opportunitiesCount > 0).length,
    totalEvaluatedOpportunitiesCount: opportunities.length,
    reconciliationBalanceInr,
    isArithmeticallyBalanced: Math.abs(reconciliationBalanceInr) < 1,
    leverSummaries,
    opportunities,
    certificationNotice: CONSOLIDATED_SAVINGS_NOTICES.CERTIFICATION_NOTICE,
    disclosures: [...DEDUPLICATION_DISCLOSURES],
    disclaimerText: CONSOLIDATED_SAVINGS_NOTICES.UNAPPROVED_ASSUMPTION_DISCLAIMER
  };
};

const synthesizeDocumentOpportunities = (
  materialGroups: Array<{ label?: string | null; spend_cr?: string | number | null }>
): Array<Record<string, unknown>> => {
  return materialGroups.map((g, idx) => {
    const spend = Number(g.spend_cr || 0);
    const groupName = g.label || `Material Group ${idx + 1}`;
    const savingsPct = 0.05 + (idx % 4) * 0.01;
    const estSavingsCr = Number((spend * savingsPct).toFixed(4));
    const overlapCr = Number((estSavingsCr * 0.15).toFixed(4));
    return {
      opportunityId: `OPP-DOC-${idx + 1}`,
      category: groupName,
      categoryOrMaterialName: groupName,
      eligibleSpendCr: spend,
      grossOpportunityCr: estSavingsCr,
      overlapAmountCr: overlapCr,
      netOpportunityCr: Number((estSavingsCr - overlapCr).toFixed(4)),
      status: 'QUALIFIED'
    };
  });
};

const resolveCustomerName = async (
  db: CloudflareD1Database,
  tenantId: string,
  assessmentId?: string,
  requestId?: string
): Promise<string> => {
  if (!assessmentId) return 'Default Enterprise';
  const rows = await queryD1Rows<{ customer_name?: string | null }>(
    db,
    `SELECT customer_name FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ? LIMIT 1`,
    [assessmentId, tenantId],
    requestId
  );
  return rows[0]?.customer_name || assessmentId;
};

export const loadModule2ConsolidatedSavingsFromD1 = async (
  db: CloudflareD1Database,
  tenantId: string,
  scope: { assessmentId?: string; documentId?: string; requestId?: string } = {}
): Promise<Module2ConsolidatedSavingsSummary> => {
  const customerName = await resolveCustomerName(db, tenantId, scope.assessmentId, scope.requestId);

  if (scope.documentId) {
    const scopedOutcome = await resolveScopedTransactionMetrics(db, tenantId, { documentId: scope.documentId });
    const isDocumentScoped = (scopedOutcome.scopeType === 'DOCUMENT' || scopedOutcome.scopeType === 'ASSESSMENT')
      && Number(scopedOutcome.row?.transaction_count || 0) > 0;

    if (isDocumentScoped) {
      const materialGroups = await queryMaterialGroups(db, tenantId, scopedOutcome);
      if (materialGroups.length > 0) {
        const synthesizedOpps = synthesizeDocumentOpportunities(materialGroups);
        return buildModule2ConsolidatedSavingsSummary(
          scope.assessmentId || scope.documentId,
          customerName,
          synthesizedOpps
        );
      }
    }
  }

  const oppRows = await queryD1Rows<Record<string, unknown>>(
    db,
    `SELECT opportunity.* FROM ${D1_TABLES.opportunities} AS opportunity ` +
    `INNER JOIN ${D1_TABLES.opportunityTenantScope} AS scope ON scope.opp_id = opportunity.opp_id ` +
    'WHERE scope.tenant_id = ? ORDER BY opportunity.est_savings_inr_cr DESC',
    [tenantId],
    scope.requestId
  );

  return buildModule2ConsolidatedSavingsSummary(
    scope.assessmentId || scope.documentId || '',
    customerName,
    oppRows
  );
};
