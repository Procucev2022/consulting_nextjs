/**
 * Module 2 Core Strategic Sourcing Levers: Levers 1, 2, and 3
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  CandidateLeverEvaluation,
  AttributionEngineConfig
} from '../types/module2Attribution';
import type { MaterialBaselineMap } from './module2AttributionHelpers';
import {
  LEVER_PRIORITY_SCORES,
  LEVER_UNQUANTIFIED_REASONS,
  LEVER_EVALUATION_CONFIGS
} from '../constants/module2AttributionLevers';
import {
  parseTransactionEpochMs,
  evaluateRateOutlier,
  evaluateTemporalWindow,
  evaluateVolumeAttainability
} from './module2TemporalVolumeHelpers';

function makeLeverCandidate(
  lever: 'DIRECT_PRICE_IMPROVEMENT' | 'E_AUCTION' | 'VENDOR_CONSOLIDATION',
  isEligible: boolean,
  reason: string,
  unquantReason?: string,
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

function checkPriceLeverPrerequisites(
  t: StrategicInputTransaction,
  baseline: MaterialBaselineMap | undefined,
  lever: 'DIRECT_PRICE_IMPROVEMENT' | 'VENDOR_CONSOLIDATION'
): CandidateLeverEvaluation | null {
  const mat = (t.material_code || '').trim();
  if (!mat || mat === 'UNKNOWN_MAT') {
    return makeLeverCandidate(lever, false, 'Missing material code', 'MISSING_MATERIAL_IDENTIFIER');
  }
  if (!baseline || baseline.supplierCount < 2) {
    return makeLeverCandidate(lever, false, 'Single supplier category', 'SINGLE_SUPPLIER_CATEGORY');
  }
  const outlier = evaluateRateOutlier(t.unit_price || 0, t.material_desc, t.uom, baseline.peerPrices);
  if (outlier.isPlaceholder) {
    return makeLeverCandidate(
      lever, true, outlier.reason || 'Placeholder rate', 'SUSPECTED_PLACEHOLDER_RATE', baseline.minPrice
    );
  }
  if (baseline.distinctPricesCount <= 1) {
    return makeLeverCandidate(lever, true, 'Uniform pricing across suppliers', 'UNIFORM_PRICING', baseline.minPrice);
  }
  if ((t.unit_price || 0) <= baseline.minPrice) {
    return makeLeverCandidate(
      lever, true, 'Unit rate equals lowest verified baseline',
      'Supplier unit rate equals lowest verified baseline', baseline.minPrice
    );
  }
  return null;
}

function checkCoalQualification(
  t: StrategicInputTransaction,
  config?: AttributionEngineConfig
): { reason: string; unquantReason: string } | null {
  if (config?.coalSpecificationVerified) return null;
  const desc = (t.material_desc || '').toUpperCase();
  const cat = (t.spend_category || '').toUpperCase();
  if (!desc.includes('COAL') && !cat.includes('COAL')) return null;

  const uom = (t.uom || '').toUpperCase();
  if (uom === 'EA' || uom === 'NO' || uom === 'PCS') {
    return {
      reason: 'Coal measured in non-standard discrete unit (EA) lacking mass/GCV conversion evidence',
      unquantReason: LEVER_UNQUANTIFIED_REASONS.SUSPICIOUS_COMMODITY_UOM
    };
  }
  return {
    reason: 'Volatile energy commodity lacking verified calorific value (GCV) grade matching and market indexation',
    unquantReason: LEVER_UNQUANTIFIED_REASONS.UNVERIFIED_PRICE_VARIANCE
  };
}

function checkComplexSpecMismatch(
  t: StrategicInputTransaction,
  baseline: MaterialBaselineMap
): { reason: string; unquantReason: string } | null {
  const desc = (t.material_desc || '').toUpperCase();
  const isComplex = desc.includes('SCRAPPER') || desc.includes('ADAPTER') || desc.includes('VALVE');
  if (!isComplex) return null;

  const priceRatio = (t.unit_price || 0) / (baseline.minPrice || 1);
  if (priceRatio > 3.0) {
    return {
      reason: `Suspected specification mismatch: unit price ${priceRatio.toFixed(1)}x above baseline on engineered part`,
      unquantReason: LEVER_UNQUANTIFIED_REASONS.UNVERIFIED_SPECIFICATION_EQUIVALENCE
    };
  }
  return null;
}

function checkCommodityAndSpecQualification(
  t: StrategicInputTransaction,
  baseline: MaterialBaselineMap,
  config?: AttributionEngineConfig
): { reason: string; unquantReason: string } | null {
  return checkCoalQualification(t, config) || checkComplexSpecMismatch(t, baseline);
}

function calculatePeerRateOpportunity(
  t: StrategicInputTransaction,
  baseline: MaterialBaselineMap,
  lever: 'DIRECT_PRICE_IMPROVEMENT' | 'VENDOR_CONSOLIDATION',
  config?: AttributionEngineConfig
): CandidateLeverEvaluation {
  const rateDelta = (t.unit_price || 0) - baseline.minPrice;
  const oppInr = Math.round(rateDelta * (t.quantity || 0) * 100) / 100;
  const targetEpoch = parseTransactionEpochMs(t.po_date);
  const baselineEpochs = baseline.baselineEpochMs !== null ? [baseline.baselineEpochMs] : baseline.peerEpochsMs;
  const temp = evaluateTemporalWindow(targetEpoch, baselineEpochs, config?.temporalWindowDays);

  if (!temp.isWithinWindow) {
    const unquant = makeLeverCandidate(lever, true, temp.reason, 'OUTSIDE_TEMPORAL_WINDOW', baseline.minPrice);
    return {
      ...unquant,
      observedPriceVarianceInr: oppInr,
      temporalComparisonStatus: temp.status,
      evidenceStatus: 'OBSERVED_PRICE_VARIANCE'
    };
  }

  const vol = evaluateVolumeAttainability(t.quantity || 0, baseline.baselineQty, config?.maxVolumeRatioThreshold);
  if (!vol.isAttainable) {
    const unquant = makeLeverCandidate(lever, true, vol.reason, vol.status, baseline.minPrice);
    return {
      ...unquant,
      observedPriceVarianceInr: oppInr,
      temporalComparisonStatus: temp.status,
      volumeAttainabilityStatus: vol.status,
      qualificationStatus: 'OBSERVED_PRICE_VARIANCE',
      evidenceStatus: 'OBSERVED_PRICE_VARIANCE'
    };
  }

  const reasonText = lever === 'DIRECT_PRICE_IMPROVEMENT'
    ? 'Direct price improvement potential against lowest peer'
    : 'Vendor base consolidation candidate with verified price gap';

  return {
    lever,
    isEligible: true,
    eligibilityReason: reasonText,
    isQuantified: true,
    baselineUnitRate: baseline.minPrice,
    proposedUnitRate: baseline.minPrice,
    grossOpportunityInr: oppInr,
    priorityScore: LEVER_PRIORITY_SCORES[lever],
    qualificationStatus: 'VALIDATED_ATTAINABLE_OPPORTUNITY',
    observedPriceVarianceInr: oppInr,
    validatedAttainableOpportunityInr: oppInr,
    temporalComparisonStatus: temp.status,
    volumeAttainabilityStatus: vol.status,
    evidenceStatus: 'OPPORTUNITY_CALCULATED',
    unresolvedConditions: LEVER_EVALUATION_CONFIGS[lever].preconditionsForCommercialValidation
  };
}

export function evaluateDirectPriceImprovement(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap,
  config?: AttributionEngineConfig
): CandidateLeverEvaluation {
  const lever = 'DIRECT_PRICE_IMPROVEMENT';
  const prereqFailure = checkPriceLeverPrerequisites(t, baseline, lever);
  if (prereqFailure) return prereqFailure;

  const validBaseline = baseline as MaterialBaselineMap;
  const specIssue = checkCommodityAndSpecQualification(t, validBaseline, config);
  if (specIssue) {
    const rateDelta = (t.unit_price || 0) - validBaseline.minPrice;
    const oppInr = Math.round(rateDelta * (t.quantity || 0) * 100) / 100;
    const unquant = makeLeverCandidate(lever, true, specIssue.reason, specIssue.unquantReason, validBaseline.minPrice);
    return {
      ...unquant,
      qualificationStatus: 'UNVERIFIED_PRICE_VARIANCE',
      observedPriceVarianceInr: oppInr,
      evidenceStatus: 'OBSERVED_PRICE_VARIANCE'
    };
  }

  return calculatePeerRateOpportunity(t, validBaseline, lever, config);
}

export function evaluateEAuction(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const lever = 'E_AUCTION';
  const hasMat = Boolean((t.material_code || '').trim() && t.material_code !== 'UNKNOWN_MAT');
  const isCompetitive = Boolean(hasMat && baseline && baseline.supplierCount >= 2 && (t.total_spend_inr || 0) > 0);

  return makeLeverCandidate(
    lever,
    isCompetitive,
    isCompetitive
      ? 'Liquid competitive supply base eligible for reverse auction discovery'
      : 'Insufficient supplier liquidity or missing item identifier',
    isCompetitive ? LEVER_UNQUANTIFIED_REASONS.MISSING_BID_EVIDENCE : 'SINGLE_SUPPLIER_CATEGORY',
    baseline?.minPrice ?? null
  );
}

export function evaluateVendorConsolidation(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap,
  config?: AttributionEngineConfig
): CandidateLeverEvaluation {
  const lever = 'VENDOR_CONSOLIDATION';
  const prereqFailure = checkPriceLeverPrerequisites(t, baseline, lever);
  if (prereqFailure) return prereqFailure;

  const validBaseline = baseline as MaterialBaselineMap;
  const hasCapacityEvidence = Boolean(config?.supplierCapacityVerified);
  if (!hasCapacityEvidence) {
    const rateDelta = (t.unit_price || 0) - validBaseline.minPrice;
    const oppInr = Math.round(rateDelta * (t.quantity || 0) * 100) / 100;
    const unquant = makeLeverCandidate(
      lever,
      true,
      'Multi-supplier category candidate; capacity verification required for consolidation',
      LEVER_UNQUANTIFIED_REASONS.MISSING_SUPPLIER_CAPACITY,
      validBaseline.minPrice
    );
    return {
      ...unquant,
      observedPriceVarianceInr: oppInr,
      evidenceStatus: 'CANDIDATE_IDENTIFIED'
    };
  }

  return calculatePeerRateOpportunity(t, validBaseline, lever, config);
}
