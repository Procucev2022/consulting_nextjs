/**
 * Module 2 — Lever 8: Specification Rationalisation (Phase 1)
 * Data Types & Interfaces
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

export type SpecificationRationalisationReviewStatus =
  | 'POTENTIAL_MATCH'
  | 'AWAITING_TECHNICAL_REVIEW'
  | 'TECHNICALLY_VERIFIED'
  | 'REJECTED';

export type SpecificationIdentificationType =
  | 'DUPLICATE_CODE'
  | 'SIMILAR_DESCRIPTION'
  | 'EQUIVALENT_SPECIFICATION'
  | 'CROSS_PLANT_VARIATION'
  | 'MULTIPLE_INTERNAL_CODES'
  | 'STANDARDIZATION_CANDIDATE'
  | 'OVER_SPECIFICATION';

export type AttributeMatchStatus =
  | 'MATCH'
  | 'DIFFERENT'
  | 'SOURCE_MISSING'
  | 'CANDIDATE_MISSING'
  | 'BOTH_MISSING';

export interface TechnicalAttributeComparison {
  attributeName: string;
  sourceValue: string | null;
  candidateValue: string | null;
  matchStatus: AttributeMatchStatus;
  isCritical: boolean;
}

export interface TechnicalReviewRecord {
  reviewId: string;
  reviewerName: string;
  reviewerRole?: string;
  reviewDate: string;
  status: SpecificationRationalisationReviewStatus;
  technicalJustification: string;
  proposedStandard?: string;
  applicationScope?: string;
  rejectionReason?: string;
}

export interface SpecificationMaterialItem {
  code: string;
  description: string;
  normalizedDescription: string;
  plant?: string;
  department?: string;
  totalSpendInr: number;
  totalQuantity: number;
  uom?: string;
  transactionCount: number;
  suppliersCount: number;
}

export interface SpecificationCandidateItem {
  candidateId: string;
  identificationType: SpecificationIdentificationType;
  identificationRationale: string;
  spendCategory: string;
  primaryItem: SpecificationMaterialItem;
  comparisonItem: SpecificationMaterialItem;
  similarityScore: number;
  technicalAttributes: TechnicalAttributeComparison[];
  differencesIdentified: string[];
  missingAttributesDisclosed: string[];
  hasMissingTechnicalData: boolean;
  expenditureUnderReviewInr: number;
  expenditureUnderReviewCr: number;
  quantityUnderReview: number;
  reviewStatus: SpecificationRationalisationReviewStatus;
  reviewHistory: TechnicalReviewRecord[];
  financialBenefitStatus: string;
  potentialRelatedLevers: string[];
  nextRequiredAction: string;
}

export interface SpecificationRationalisationSummary {
  tenantId: string;
  customerName: string;
  totalMaterialsAssessedCount: number;
  totalCandidatesIdentifiedCount: number;
  awaitingTechnicalReviewCount: number;
  technicallyVerifiedCount: number;
  rejectedCount: number;
  potentialMatchCount: number;
  candidatesWithMissingTechnicalDataCount: number;
  totalExpenditureUnderReviewInr: number;
  totalExpenditureUnderReviewCr: number;
  financialBenefitStatus: string;
  commercialSavingsQuantifiedInr: 0;
  commercialSavingsQuantifiedCr: 0;
}

export interface SpecificationRationalisationReviewPayload {
  candidateId: string;
  status: 'TECHNICALLY_VERIFIED' | 'REJECTED' | 'AWAITING_TECHNICAL_REVIEW';
  reviewerName: string;
  reviewerRole?: string;
  technicalJustification: string;
  proposedStandard?: string;
  applicationScope?: string;
  rejectionReason?: string;
}

export interface SpecificationRationalisationOptions {
  reviews?: Record<string, TechnicalReviewRecord | TechnicalReviewRecord[]>;
  similarityThreshold?: number;
}

export interface SpecificationRationalisationResult {
  assessmentId: string;
  customerName: string;
  calculatedAt: string;
  summary: SpecificationRationalisationSummary;
  candidates: SpecificationCandidateItem[];
  methodologyDisclosures: string[];
  financialDisclaimer: string;
}
