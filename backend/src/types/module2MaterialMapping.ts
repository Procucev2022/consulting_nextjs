/**
 * Module 2 — Lever 3: Material UNSPSC Classification & Mapping Register Types
 * Strict separation of interfaces per Rule 9, max 300 lines
 */

export type MappingReviewStatus =
  | 'TAXONOMY_VERIFIED'
  | 'PROVISIONAL'
  | 'AWAITING_REVIEW'
  | 'CLIENT_APPROVED'
  | 'APPROVED';

export type MaterialMappingMethod =
  | 'EXACT_IDENTIFIER'
  | 'MATERIAL_DESCRIPTION_MATCH'
  | 'SPECIFICATION_OR_SYNONYM'
  | 'CONTEXTUAL_HEURISTIC'
  | 'MANUAL_REVIEW_REQUIRED';

export interface MaterialMappingEntry {
  sourceMaterialId: string;
  sourceDescription: string;
  sourceCategory: string;
  assignedUnspscCode: string;
  assignedUnspscTitle: string;
  unspscSegment: string;
  unspscFamily: string;
  unspscClass: string;
  unspscCommodity: string;
  taxonomyVersion: string;
  mappingMethod: MaterialMappingMethod;
  confidenceScore: number;
  evidence: string;
  reviewStatus: MappingReviewStatus;
  mappingDate: string;
  totalSpendInr: number;
  totalSpendCr: number;
  transactionCount: number;
  qualifyingSuppliersCount: number;
  reviewReason?: string;
  reviewedBy?: string;
  auditNotes?: string;
  unspsc_code?: string;
  unspsc_commodity_title?: string;
  unspsc_class_title?: string;
  unspsc_category_name?: string;
}

export interface ClassificationCoverageSummary {
  totalMaterialsCount: number;
  totalSpendInr: number;
  totalSpendCr: number;
  taxonomyVerifiedCount: number;
  taxonomyVerifiedSpendInr: number;
  taxonomyVerifiedSpendCr: number;
  taxonomyVerifiedMaterialPct: number;
  taxonomyVerifiedSpendPct: number;
  clientApprovedCount: number;
  clientApprovedSpendInr: number;
  clientApprovedSpendCr: number;
  clientApprovedMaterialPct: number;
  clientApprovedSpendPct: number;
  approvedCount: number;
  approvedSpendInr: number;
  approvedSpendCr: number;
  approvedMaterialPct: number;
  approvedSpendPct: number;
  provisionalCount: number;
  provisionalSpendInr: number;
  provisionalSpendCr: number;
  provisionalMaterialPct: number;
  provisionalSpendPct: number;
  awaitingReviewCount: number;
  awaitingReviewSpendInr: number;
  awaitingReviewSpendCr: number;
  awaitingReviewMaterialPct: number;
  awaitingReviewSpendPct: number;
  workflowCoveragePct: number;
}

export type ActionableOpportunityStatus =
  | 'Candidate for Review'
  | 'Technical Validation Required'
  | 'Supplier/Commercial Validation Required'
  | 'Further Data Required'
  | 'Not Currently Suitable'
  | 'Validated for Sourcing Action';

export type DimensionViewType =
  | 'UNSPSC'
  | 'SOURCE_GROUP'
  | 'PLANT'
  | 'SUPPLIER'
  | 'MATERIAL'
  | 'MAPPING_QUEUE';

export interface UpdateMaterialMappingPayload {
  sourceMaterialId: string;
  unspscCode: string;
  reviewStatus: MappingReviewStatus;
  reviewedBy: string;
  auditNotes?: string;
}
