/**
 * Module 2 Extended Strategic Sourcing Levers: Levers 4 through 10
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { CandidateLeverEvaluation } from '../types/module2Attribution';
import type { MaterialBaselineMap } from './module2AttributionHelpers';
import type { StrategicSourcingLeverType } from '../types/module2AttributionLevers';
import {
  LEVER_PRIORITY_SCORES,
  LEVER_UNQUANTIFIED_REASONS,
  LEVER_EVALUATION_CONFIGS
} from '../constants/module2AttributionLevers';

function makeExtendedCandidate(
  lever: StrategicSourcingLeverType,
  isEligible: boolean,
  reason: string,
  unquantReason: string,
  baseRate: number | null = null
): CandidateLeverEvaluation {
  const config = LEVER_EVALUATION_CONFIGS[lever];
  return {
    lever,
    isEligible,
    eligibilityReason: reason,
    isQuantified: false,
    unquantifiedReason: unquantReason,
    baselineUnitRate: baseRate,
    proposedUnitRate: baseRate,
    grossOpportunityInr: 0,
    priorityScore: LEVER_PRIORITY_SCORES[lever],
    qualificationStatus: 'UNQUANTIFIED',
    observedPriceVarianceInr: 0,
    validatedAttainableOpportunityInr: 0,
    evidenceStatus: isEligible ? 'CANDIDATE_IDENTIFIED' : undefined,
    unresolvedConditions: config.preconditionsForCommercialValidation
  };
}

export function evaluateVolumeAggregation(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'VOLUME_AGGREGATION';
  const hasSpend = (t.total_spend_inr || 0) > 0 && (t.quantity || 0) > 0;
  return makeExtendedCandidate(
    lever,
    hasSpend,
    hasSpend
      ? 'Purchase order eligible for consolidated demand volume aggregation'
      : 'Zero or invalid spend transaction',
    LEVER_UNQUANTIFIED_REASONS.MISSING_VOLUME_TIER_AGREEMENT,
    baseline?.minPrice ?? null
  );
}

export function evaluatePaymentTerms(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'PAYMENT_TERMS_OPTIMISATION';
  const hasSpend = (t.total_spend_inr || 0) > 0;
  return makeExtendedCandidate(
    lever,
    hasSpend,
    hasSpend
      ? 'Transaction eligible for commercial payment terms extension review'
      : 'Zero spend transaction',
    LEVER_UNQUANTIFIED_REASONS.MISSING_PAYMENT_TERMS_DATA,
    baseline?.minPrice ?? null
  );
}

export function evaluateCategorySpecialisation(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'CATEGORY_SPECIALISATION';
  const hasCategory = Boolean((t.spend_category || '').trim());
  return makeExtendedCandidate(
    lever,
    hasCategory,
    hasCategory
      ? 'Category spend eligible for dedicated category management charter'
      : 'Unclassified procurement spend',
    LEVER_UNQUANTIFIED_REASONS.MISSING_SPECIALIST_CHARTER,
    baseline?.minPrice ?? null
  );
}

export function evaluateLogisticsPackaging(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'LOGISTICS_PACKAGING';
  const hasQty = (t.quantity || 0) > 0;
  return makeExtendedCandidate(
    lever,
    hasQty,
    hasQty
      ? 'Physical material flow eligible for logistics and packaging review'
      : 'Non-physical or zero quantity spend item',
    LEVER_UNQUANTIFIED_REASONS.MISSING_FREIGHT_COST_DATA,
    baseline?.minPrice ?? null
  );
}

export function evaluateSpecificationRationalisation(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'SPECIFICATION_RATIONALISATION';
  const hasDesc = Boolean((t.material_desc || '').trim());
  return makeExtendedCandidate(
    lever,
    hasDesc,
    hasDesc
      ? 'Material item eligible for technical specification harmonization'
      : 'Missing item description',
    LEVER_UNQUANTIFIED_REASONS.MISSING_SPECIFICATION_EQUIVALENCE,
    baseline?.minPrice ?? null
  );
}

export function evaluateContractCompliance(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'CONTRACT_COMPLIANCE_AUDIT';
  const hasPo = Boolean((t.po_number || '').trim());
  return makeExtendedCandidate(
    lever,
    hasPo,
    hasPo
      ? 'Purchase order reference eligible for contract rate card audit'
      : 'Missing purchase order reference',
    LEVER_UNQUANTIFIED_REASONS.MISSING_CONTRACT_RATE_CARD,
    baseline?.minPrice ?? null
  );
}

export function evaluateNewVendorDevelopment(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'NEW_VENDOR_DEVELOPMENT';
  const isConstrained = Boolean(baseline && baseline.supplierCount <= 2);
  return makeExtendedCandidate(
    lever,
    isConstrained,
    isConstrained
      ? 'Constrained supply base eligible for alternate vendor development'
      : 'Multi-source competitive market already established',
    LEVER_UNQUANTIFIED_REASONS.MISSING_ALTERNATE_VENDOR_DATA,
    baseline?.minPrice ?? null
  );
}
