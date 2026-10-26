/**
 * Module 2 Material Mapping Coverage & Update Payload Extractors
 */

import type {
  ClassificationCoverageSummary,
  MaterialMappingEntry,
  MappingReviewStatus,
  UpdateMaterialMappingPayload
} from '../types/module2MaterialMapping';

export interface ExtractedMappingUpdate {
  sourceMaterialId: string;
  unspscCode: string;
  reviewStatus: MappingReviewStatus;
  reviewedBy?: string;
  auditNotes?: string;
  assessmentId?: string;
  extra: Partial<MaterialMappingEntry>;
}

export function extractMappingUpdate(
  payloadOrMaterialId: UpdateMaterialMappingPayload | string,
  partialOrAssessmentId?: Partial<MaterialMappingEntry> | string,
  assessmentIdParam?: string
): ExtractedMappingUpdate {
  if (typeof payloadOrMaterialId === 'string') {
    const isObj = typeof partialOrAssessmentId === 'object' && partialOrAssessmentId !== null;
    const extra = isObj ? partialOrAssessmentId : {};
    const code = extra.unspsc_code || extra.assignedUnspscCode || '';
    const reviewStatus = (extra.reviewStatus as MappingReviewStatus) || 'CLIENT_APPROVED';
    const assessmentId =
      assessmentIdParam || (typeof partialOrAssessmentId === 'string' ? partialOrAssessmentId : undefined);
    return {
      sourceMaterialId: payloadOrMaterialId,
      unspscCode: code,
      reviewStatus,
      reviewedBy: extra.reviewedBy,
      auditNotes: extra.auditNotes,
      assessmentId,
      extra
    };
  }

  const assessmentId = typeof partialOrAssessmentId === 'string' ? partialOrAssessmentId : undefined;
  return {
    sourceMaterialId: payloadOrMaterialId.sourceMaterialId,
    unspscCode: payloadOrMaterialId.unspscCode,
    reviewStatus: payloadOrMaterialId.reviewStatus,
    reviewedBy: payloadOrMaterialId.reviewedBy,
    auditNotes: payloadOrMaterialId.auditNotes,
    assessmentId,
    extra: {}
  };
}

interface MetricSummary {
  cntPct: number;
  spdCr: number;
  spdPct: number;
}

const buildMetric = (cnt: number, spd: number, totalCount: number, totalSpend: number): MetricSummary => ({
  cntPct: totalCount > 0 ? Math.round((cnt / totalCount) * 1000) / 10 : 0,
  spdCr: Math.round((spd / 10000000) * 10000) / 10000,
  spdPct: totalSpend > 0 ? Math.round((spd / totalSpend) * 1000) / 10 : 0
});

export function calculateMappingCoverage(register: MaterialMappingEntry[]): ClassificationCoverageSummary {
  const totalMaterialsCount = register.length;
  const totalSpendInr = Math.round(register.reduce((sum, e) => sum + e.totalSpendInr, 0) * 100) / 100;
  const totalSpendCr = Math.round((totalSpendInr / 10000000) * 10000) / 10000;
  let taxVerCount = 0;
  let taxVerSpend = 0;
  let provCount = 0;
  let provSpend = 0;
  let revCount = 0;
  let revSpend = 0;
  let clientAppCount = 0;
  let clientAppSpend = 0;

  for (const e of register) {
    if (e.reviewStatus === 'CLIENT_APPROVED') {
      clientAppCount++;
      clientAppSpend += e.totalSpendInr;
    } else if (e.reviewStatus === 'TAXONOMY_VERIFIED' || e.reviewStatus === 'APPROVED') {
      taxVerCount++;
      taxVerSpend += e.totalSpendInr;
    } else if (e.reviewStatus === 'PROVISIONAL') {
      provCount++;
      provSpend += e.totalSpendInr;
    } else {
      revCount++;
      revSpend += e.totalSpendInr;
    }
  }

  const tv = buildMetric(taxVerCount, taxVerSpend, totalMaterialsCount, totalSpendInr);
  const ca = buildMetric(clientAppCount, clientAppSpend, totalMaterialsCount, totalSpendInr);
  const pv = buildMetric(provCount, provSpend, totalMaterialsCount, totalSpendInr);
  const rv = buildMetric(revCount, revSpend, totalMaterialsCount, totalSpendInr);

  return {
    totalMaterialsCount,
    totalSpendInr,
    totalSpendCr,
    taxonomyVerifiedCount: taxVerCount,
    taxonomyVerifiedSpendInr: taxVerSpend,
    taxonomyVerifiedSpendCr: tv.spdCr,
    taxonomyVerifiedMaterialPct: tv.cntPct,
    taxonomyVerifiedSpendPct: tv.spdPct,
    clientApprovedCount: clientAppCount,
    clientApprovedSpendInr: clientAppSpend,
    clientApprovedSpendCr: ca.spdCr,
    clientApprovedMaterialPct: ca.cntPct,
    clientApprovedSpendPct: ca.spdPct,
    approvedCount: taxVerCount,
    approvedSpendInr: taxVerSpend,
    approvedSpendCr: tv.spdCr,
    approvedMaterialPct: tv.cntPct,
    approvedSpendPct: tv.spdPct,
    provisionalCount: provCount,
    provisionalSpendInr: provSpend,
    provisionalSpendCr: pv.spdCr,
    provisionalMaterialPct: pv.cntPct,
    provisionalSpendPct: pv.spdPct,
    awaitingReviewCount: revCount,
    awaitingReviewSpendInr: revSpend,
    awaitingReviewSpendCr: rv.spdCr,
    awaitingReviewMaterialPct: rv.cntPct,
    awaitingReviewSpendPct: rv.spdPct,
    workflowCoveragePct: totalMaterialsCount > 0 ? 100.0 : 0.0
  };
}
