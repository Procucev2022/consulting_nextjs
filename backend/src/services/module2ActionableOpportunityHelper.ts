/**
 * Module 2 — Lever 3: Actionable Opportunity Status & Qualification Helper
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import type {
  ActionableOpportunityStatus,
  MappingReviewStatus
} from '../types/module2MaterialMapping';

export interface ActionableOpportunityAssessment {
  actionableStatus: ActionableOpportunityStatus;
  qualificationCriteria: string;
  nextRecommendedAction: string;
}

export function evaluateActionableStatus(
  dispersionPct: number,
  supplierCount: number,
  plantCount: number,
  isComparable: boolean,
  mappingStatus?: MappingReviewStatus,
  isDocumentedValidated: boolean = false
): ActionableOpportunityAssessment {
  if (!isComparable) {
    return {
      actionableStatus: 'Further Data Required',
      qualificationCriteria: 'Inconsistent UOM or currency across source transactions.',
      nextRecommendedAction: 'Harmonize purchase unit of measure and commercial currency before sourcing action.'
    };
  }

  if (mappingStatus === 'AWAITING_REVIEW') {
    return {
      actionableStatus: 'Candidate for Review',
      qualificationCriteria: `Multi-sourced across ${supplierCount} suppliers; pending engineering UNSPSC mapping.`,
      nextRecommendedAction: 'Complete technical taxonomy classification in Mapping Exceptions Queue.'
    };
  }

  if (isDocumentedValidated && supplierCount >= 2) {
    return {
      actionableStatus: 'Validated for Sourcing Action',
      qualificationCriteria:
        'Approved UNSPSC material with documented technical, supplier, contractual, and operational validations.',
      nextRecommendedAction: 'Initiate volume consolidation RFP / commercial negotiations.'
    };
  }

  if (dispersionPct >= 15) {
    return {
      actionableStatus: 'Technical Validation Required',
      qualificationCriteria:
        `Verified material multi-sourced with ${dispersionPct}% price variance across ${supplierCount} suppliers.`,
      nextRecommendedAction: 'Harmonize technical specifications and lot-size pricing with lowest-cost vendor.'
    };
  }

  if (plantCount >= 2 && supplierCount >= 2) {
    return {
      actionableStatus: 'Supplier/Commercial Validation Required',
      qualificationCriteria: `Cross-plant multi-sourced item (${plantCount} plants, ${supplierCount} suppliers).`,
      nextRecommendedAction: 'Validate vendor plant capacity, regional logistics, and volume allocation agreement.'
    };
  }

  return {
    actionableStatus: 'Candidate for Review',
    qualificationCriteria:
      `Multi-sourced material (${supplierCount} suppliers, dispersion: ${dispersionPct}%) pending validation.`,
    nextRecommendedAction: 'Review commercial contract terms and supplier performance history.'
  };
}
