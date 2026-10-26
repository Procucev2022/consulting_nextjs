import type {
  CategoryOpportunityBenefit,
  CrossLeverOverlapItem,
  CategorySpecialisationSummary
} from '../types/module2CategorySpecialisation';
import {
  LEVER6_OVERLAP_STATUSES,
  LEVER6_VALIDATION_STATUSES
} from '../constants/module2CategorySpecialisation';
import {
  inrToCrore,
  roundToTwoDecimals
} from './module2CategorySpecialisationCalculators';

interface OverlapResolution {
  overlapStatus: CrossLeverOverlapItem['overlapStatus'];
  deduplicationTreatment: string;
  netBenefitInr: number;
  amountExcludedInr: number;
  exclusionReason: string;
}

function resolveHeadGOrFallback(benefit: CategoryOpportunityBenefit): OverlapResolution {
  if (benefit.headKey === 'HEAD-G') {
    if (benefit.hasVerifiedAlternativeSupplier) {
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.NO_OVERLAP,
        deduplicationTreatment:
          `Verified alternative supplier qualification: ${benefit.alternativeSupplierEvidence || 'Documented'}. ` +
          'Retained in net indicative opportunity.',
        netBenefitInr: benefit.baseEstimateInr,
        amountExcludedInr: 0,
        exclusionReason: ''
      };
    }
    if (!benefit.isEligibleEstablished) {
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.NO_OVERLAP,
        deduplicationTreatment:
          'Identified sourcing-risk / resilience opportunity; monetary savings not yet quantifiable pending verified alternative supplier.',
        netBenefitInr: 0,
        amountExcludedInr: 0,
        exclusionReason: ''
      };
    }
  }
  return {
    overlapStatus: LEVER6_OVERLAP_STATUSES.NO_OVERLAP,
    deduplicationTreatment: 'Retained in full in net indicative opportunity; no overlap detected.',
    netBenefitInr: benefit.baseEstimateInr,
    amountExcludedInr: 0,
    exclusionReason: ''
  };
}

function resolveLeverOverlap(benefit: CategoryOpportunityBenefit): OverlapResolution {
  switch (benefit.relatedLever) {
    case 'LEVER_1':
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED,
        deduplicationTreatment:
          'Potential overlap with Lever 1 (Price Variance). Excluded from net indicative opportunity pending review.',
        netBenefitInr: 0,
        amountExcludedInr: benefit.baseEstimateInr,
        exclusionReason: 'Potential duplicate commercial benefit with Lever 1 Direct Price Improvement.'
      };
    case 'LEVER_2':
      if (benefit.hasDistinctScopeFromLever2 && benefit.distinctScopeEvidence) {
        return {
          overlapStatus: LEVER6_OVERLAP_STATUSES.NO_OVERLAP,
          deduplicationTreatment:
            `Distinct scope verified: ${benefit.distinctScopeEvidence}. Retained in net indicative opportunity.`,
          netBenefitInr: benefit.baseEstimateInr,
          amountExcludedInr: 0,
          exclusionReason: ''
        };
      }
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED,
        deduplicationTreatment:
          'Default exclusion: Potential overlap with Lever 2 (E-Auction / Dynamic Bidding). ' +
          'Excluded from net indicative opportunity pending verified non-overlap evidence.',
        netBenefitInr: 0,
        amountExcludedInr: benefit.baseEstimateInr,
        exclusionReason:
          'Potential duplicate commercial benefit with Lever 2 E-Auction Dynamic Bidding without verified non-overlap evidence.'
      };
    case 'LEVER_3':
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED,
        deduplicationTreatment:
          'Potential overlap with Lever 3 (Supplier Rationalisation). Excluded from net indicative opportunity pending review.',
        netBenefitInr: 0,
        amountExcludedInr: benefit.baseEstimateInr,
        exclusionReason: 'Potential duplicate commercial benefit with Lever 3 Vendor Base Consolidation.'
      };
    case 'LEVER_4':
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED,
        deduplicationTreatment:
          'Potential overlap with Lever 4 (Volume Aggregation). Excluded from net indicative opportunity pending review.',
        netBenefitInr: 0,
        amountExcludedInr: benefit.baseEstimateInr,
        exclusionReason: 'Potential duplicate commercial benefit with Lever 4 Volume Aggregation.'
      };
    case 'LEVER_5':
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.NO_OVERLAP,
        deduplicationTreatment:
          'Zero overlap: Lever 5 addresses working capital and payment terms financing, not unit price or category spend.',
        netBenefitInr: benefit.baseEstimateInr,
        amountExcludedInr: 0,
        exclusionReason: ''
      };
    case 'LEVER_8':
      return {
        overlapStatus: LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED,
        deduplicationTreatment:
          'Potential overlap with Lever 8 (Specification Optimisation). Excluded from net indicative opportunity pending review.',
        netBenefitInr: 0,
        amountExcludedInr: benefit.baseEstimateInr,
        exclusionReason: 'Potential duplicate commercial benefit with Lever 8 Specification Rationalisation.'
      };
    default:
      return resolveHeadGOrFallback(benefit);
  }
}

function resolveEvidenceStatus(benefit: CategoryOpportunityBenefit): string {
  if (benefit.isEligibleEstablished) {
    if (benefit.hasDistinctScopeFromLever2 || benefit.hasVerifiedAlternativeSupplier) {
      return LEVER6_VALIDATION_STATUSES.APPROVED;
    }
    return LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING;
  }
  if (benefit.dataAndEvidenceStatus === LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED) {
    return LEVER6_VALIDATION_STATUSES.IDENTIFIED_NOT_QUANTIFIED;
  }
  return LEVER6_VALIDATION_STATUSES.DATA_UNAVAILABLE;
}

export function evaluateCrossLeverOverlap(
  benefit: CategoryOpportunityBenefit
): CrossLeverOverlapItem {
  const resolution = resolveLeverOverlap(benefit);

  return {
    headKey: benefit.headKey,
    headTitle: benefit.headTitle,
    categoryName: benefit.categoryName,
    eligibleSpendInr: benefit.eligibleAnnualSpendInr,
    eligibleSpendCr: benefit.eligibleAnnualSpendCr,
    grossPotentialBenefitInr: benefit.baseEstimateInr,
    grossPotentialBenefitCr: benefit.baseEstimateCr,
    relatedLever: benefit.relatedLever,
    overlapStatus: resolution.overlapStatus,
    deduplicationTreatment: resolution.deduplicationTreatment,
    evidenceAndApprovalStatus: resolveEvidenceStatus(benefit),
    netIndicativeBenefitInr: roundToTwoDecimals(resolution.netBenefitInr),
    netIndicativeBenefitCr: inrToCrore(resolution.netBenefitInr),
    amountExcludedInr: roundToTwoDecimals(resolution.amountExcludedInr),
    amountExcludedCr: inrToCrore(resolution.amountExcludedInr),
    exclusionReason: resolution.exclusionReason
  };
}

export function aggregateSpecialisationSummary(
  tenantId: string,
  totalSpendInr: number,
  allBenefits: CategoryOpportunityBenefit[],
  overlapItems: CrossLeverOverlapItem[],
  totalCategoriesCount: number,
  priorityACount: number,
  priorityBCount: number,
  priorityCCount: number,
  dedicatedCount: number,
  sharedCount: number,
  centralisedCount: number,
  automatedCount: number
): CategorySpecialisationSummary {
  let grossLowInr = 0;
  let grossBaseInr = 0;
  let grossHighInr = 0;
  let netLowInr = 0;
  let netBaseInr = 0;
  let netHighInr = 0;
  let overlapReviewInr = 0;
  let countRequiringReview = 0;
  let unquantifiedCount = 0;

  for (let i = 0; i < allBenefits.length; i++) {
    const b = allBenefits[i];
    grossLowInr += b.lowEstimateInr;
    grossBaseInr += b.baseEstimateInr;
    grossHighInr += b.highEstimateInr;

    if (!b.isEligibleEstablished) {
      unquantifiedCount++;
    }

    const overlap = overlapItems[i];
    if (overlap && overlap.overlapStatus === LEVER6_OVERLAP_STATUSES.NO_OVERLAP) {
      netLowInr += b.lowEstimateInr;
      netBaseInr += b.baseEstimateInr;
      netHighInr += b.highEstimateInr;
    } else if (overlap && overlap.overlapStatus === LEVER6_OVERLAP_STATUSES.OVERLAP_REVIEW_REQUIRED) {
      overlapReviewInr += b.baseEstimateInr;
      countRequiringReview++;
    }
  }

  const specialisedCount = priorityACount + priorityBCount;

  return {
    tenantId,
    totalProcurementSpendInr: totalSpendInr,
    totalProcurementSpendCr: inrToCrore(totalSpendInr),
    categoriesAssessedCount: totalCategoriesCount,
    priorityACount,
    priorityBCount,
    priorityCCount,
    grossTentativeOpportunityLowInr: roundToTwoDecimals(grossLowInr),
    grossTentativeOpportunityLowCr: inrToCrore(grossLowInr),
    grossTentativeOpportunityBaseInr: roundToTwoDecimals(grossBaseInr),
    grossTentativeOpportunityBaseCr: inrToCrore(grossBaseInr),
    grossTentativeOpportunityHighInr: roundToTwoDecimals(grossHighInr),
    grossTentativeOpportunityHighCr: inrToCrore(grossHighInr),
    netIndicativeOpportunityLowInr: roundToTwoDecimals(netLowInr),
    netIndicativeOpportunityLowCr: inrToCrore(netLowInr),
    netIndicativeOpportunityBaseInr: roundToTwoDecimals(netBaseInr),
    netIndicativeOpportunityBaseCr: inrToCrore(netBaseInr),
    netIndicativeOpportunityHighInr: roundToTwoDecimals(netHighInr),
    netIndicativeOpportunityHighCr: inrToCrore(netHighInr),
    opportunitiesRequiringOverlapReviewCount: countRequiringReview,
    overlapReviewAmountInr: roundToTwoDecimals(overlapReviewInr),
    overlapReviewAmountCr: inrToCrore(overlapReviewInr),
    unquantifiedOpportunitiesCount: unquantifiedCount,
    categoriesRequiringSpecialisedInterventionCount: specialisedCount,
    dedicatedManagerCount: dedicatedCount,
    sharedManagerCount: sharedCount,
    centralisedManagementCount: centralisedCount,
    automatedProcurementCount: automatedCount
  };
}
