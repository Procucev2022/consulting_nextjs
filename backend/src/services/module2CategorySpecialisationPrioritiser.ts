import type {
  CategoryPriority,
  CategoryManagementApproach,
  CategorySpecialisationProfile,
  Lever6ThresholdConfig
} from '../types/module2CategorySpecialisation';
import {
  LEVER6_PRIORITIES,
  LEVER6_APPROACHES,
  LEVER6_VALIDATION_STATUSES,
  LEVER6_EVIDENCE_DISCLOSURES,
  LEVER6_THRESHOLDS
} from '../constants/module2CategorySpecialisation';
import {
  type CategoryMetrics,
  inrToCrore,
  roundToTwoDecimals
} from './module2CategorySpecialisationCalculators';

export interface CategoryClassification {
  priority: CategoryPriority;
  priorityRationale: string;
  recommendedApproach: CategoryManagementApproach;
  approachRationale: string;
  dataLimitations: string;
}

function determinePriority(
  metrics: CategoryMetrics,
  spendSharePct: number,
  customThresholds?: Lever6ThresholdConfig
): { priority: CategoryPriority; priorityRationale: string } {
  const thresholds = { ...LEVER6_THRESHOLDS, ...customThresholds };
  const share = roundToTwoDecimals(spendSharePct);
  if (spendSharePct >= thresholds.STRATEGIC_SPEND_SHARE_PCT ||
      metrics.distinctSuppliersCount >= thresholds.COMPLEX_SUPPLIER_COUNT ||
      metrics.priceVariationCoefficient >= thresholds.PRICE_VARIATION_SIGNIFICANT) {
    return {
      priority: LEVER6_PRIORITIES.PRIORITY_A,
      priorityRationale:
        'Strategic classification driven by high spend share (' +
        String(share) +
        '% of portfolio), supplier complexity (' +
        String(metrics.distinctSuppliersCount) +
        ' suppliers), and active market dynamics.'
    };
  }

  if (spendSharePct >= thresholds.OPTIMISATION_SPEND_SHARE_PCT ||
      metrics.distinctSuppliersCount >= (thresholds.MODERATE_SUPPLIER_COUNT ?? 4) ||
      metrics.priceVariationCoefficient > 0) {
    return {
      priority: LEVER6_PRIORITIES.PRIORITY_B,
      priorityRationale:
        'Optimisation candidate driven by moderate spend share (' +
        String(share) +
        '%), addressable supplier base (' +
        String(metrics.distinctSuppliersCount) +
        ' suppliers), and consolidation potential.'
    };
  }

  return {
    priority: LEVER6_PRIORITIES.PRIORITY_C,
    priorityRationale:
      'Routine category characterized by low spend share (' +
      String(share) +
      '%), standard operational procurement profiles, and low supplier fragmentation.'
  };
}

function determineApproach(
  priority: CategoryPriority,
  metrics: CategoryMetrics
): { approach: CategoryManagementApproach; rationale: string } {
  if (priority === LEVER6_PRIORITIES.PRIORITY_A &&
      (metrics.distinctPlantsCount >= 3 || metrics.transactionCount >= 500)) {
    return {
      approach: LEVER6_APPROACHES.DEDICATED_CATEGORY_MANAGER,
      rationale:
        'Dedicated Category Manager recommended due to high strategic criticality across ' +
        String(metrics.distinctPlantsCount) +
        ' plants and substantial transaction volume (' +
        String(metrics.transactionCount) +
        ' transactions).'
    };
  }

  if (priority === LEVER6_PRIORITIES.PRIORITY_A ||
      (priority === LEVER6_PRIORITIES.PRIORITY_B && metrics.distinctPlantsCount >= 2)) {
    return {
      approach: LEVER6_APPROACHES.SHARED_CATEGORY_MANAGER,
      rationale:
        'Shared Category Manager recommended to balance strategic governance across related categories serving ' +
        String(metrics.distinctPlantsCount) +
        ' plants without dedicated staffing overhead.'
    };
  }

  if (priority === LEVER6_PRIORITIES.PRIORITY_B) {
    return {
      approach: LEVER6_APPROACHES.CENTRALISED_CATEGORY_MGMT,
      rationale:
        'Centralised Category Management recommended to consolidate standard sourcing events and volume aggregation.'
    };
  }

  return {
    approach: LEVER6_APPROACHES.STANDARD_AUTOMATED,
    rationale:
      'Standard or Automated Procurement recommended to minimise transaction processing costs for routine purchasing.'
  };
}

export function classifyCategory(
  metrics: CategoryMetrics,
  totalAssessmentSpendInr: number,
  customThresholds?: Lever6ThresholdConfig
): CategoryClassification {
  const spendSharePct = totalAssessmentSpendInr > 0
    ? (metrics.totalSpendInr / totalAssessmentSpendInr) * 100
    : 0;

  const prioResult = determinePriority(metrics, spendSharePct, customThresholds);
  const approachResult = determineApproach(prioResult.priority, metrics);

  const dataLimitations = metrics.contractCoveragePct <= 0
    ? LEVER6_EVIDENCE_DISCLOSURES.CONTRACT_DATA_GAP
    : LEVER6_EVIDENCE_DISCLOSURES.OPERATING_COST_GAP;

  return {
    priority: prioResult.priority,
    priorityRationale: prioResult.priorityRationale,
    recommendedApproach: approachResult.approach,
    approachRationale: approachResult.rationale,
    dataLimitations
  };
}

export function buildCategoryProfile(
  metrics: CategoryMetrics,
  totalAssessmentSpendInr: number,
  classification: CategoryClassification
): CategorySpecialisationProfile {
  const spendSharePct = totalAssessmentSpendInr > 0
    ? roundToTwoDecimals((metrics.totalSpendInr / totalAssessmentSpendInr) * 100)
    : 0;

  const requiresSpecialised = classification.priority === LEVER6_PRIORITIES.PRIORITY_A ||
    classification.priority === LEVER6_PRIORITIES.PRIORITY_B;

  return {
    categoryName: metrics.categoryName,
    priority: classification.priority,
    priorityRationale: classification.priorityRationale,
    recommendedApproach: classification.recommendedApproach,
    approachRationale: classification.approachRationale,
    annualSpendInr: metrics.totalSpendInr,
    annualSpendCr: inrToCrore(metrics.totalSpendInr),
    spendSharePct,
    transactionCount: metrics.transactionCount,
    distinctSuppliersCount: metrics.distinctSuppliersCount,
    distinctMaterialsCount: metrics.distinctMaterialsCount,
    distinctPlantsCount: metrics.distinctPlantsCount,
    topSupplierConcentrationPct: metrics.topSupplierSharePct,
    herfindahlIndex: metrics.herfindahlIndex,
    priceVariationCoefficient: metrics.priceVariationCoefficient,
    contractCoveragePct: metrics.contractCoveragePct,
    dataLimitations: classification.dataLimitations,
    validationStatus: requiresSpecialised
      ? LEVER6_VALIDATION_STATUSES.TENTATIVE_PENDING
      : LEVER6_VALIDATION_STATUSES.DATA_PARTIALLY_AVAILABLE,
    requiresSpecialisedManagement: requiresSpecialised,
    opportunities: []
  };
}
