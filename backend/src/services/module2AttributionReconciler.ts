/**
 * Module 2 Transaction Attribution Reconciliation & Audit Reporter
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type {
  TransactionAttributionRecord,
  AttributionReconciliationReport,
  AttributionPopulationMetrics,
  AttributionEligibilityMetrics,
  AttributionQuantifiabilityMetrics,
  AttributionSpendCategoryMetrics,
  LeverAllocationSummary,
  AlternativeScenarioSummary,
  OpportunityWaterfallSummary
} from '../types/module2Attribution';
import {
  ATTRIBUTION_CALCULATION_VERSION,
  ATTRIBUTION_NOT_YET_CERTIFIED_NOTICE,
  ATTRIBUTION_DEFAULTS
} from '../constants/module2Attribution';
import { buildLeverReconciliationSummaries } from './module2LeverReconciler';

const toCr = (inr: number): number => {
  return Math.round((inr / ATTRIBUTION_DEFAULTS.CRORE_DIVISOR) * 1000) / 1000;
};

export function buildPopulationMetrics(records: TransactionAttributionRecord[]): AttributionPopulationMetrics {
  let totalSpendInr = 0;
  let suspectedDupCount = 0;
  let suspectedDupSpend = 0;
  let zeroNegCount = 0;
  let zeroNegSpend = 0;

  for (const r of records) {
    totalSpendInr += r.validatedSpendInr;
    if (r.isSuspectedDuplicate) {
      suspectedDupCount += 1;
      suspectedDupSpend += r.validatedSpendInr;
    }
    if (r.isZeroOrNegativeSpend) {
      zeroNegCount += 1;
      zeroNegSpend += r.validatedSpendInr;
    }
  }

  return {
    totalTransactionCount: records.length,
    totalSpendInr: Math.round(totalSpendInr * 100) / 100,
    totalSpendCr: toCr(totalSpendInr),
    suspectedDuplicateTransactionCount: suspectedDupCount,
    suspectedDuplicateSpendInr: Math.round(suspectedDupSpend * 100) / 100,
    zeroOrNegativeTransactionCount: zeroNegCount,
    zeroOrNegativeSpendInr: Math.round(zeroNegSpend * 100) / 100
  };
}

export function buildEligibilityMetrics(records: TransactionAttributionRecord[]): AttributionEligibilityMetrics {
  let eligibleSpendInr = 0;
  let eligibleCount = 0;
  let ineligibleSpendInr = 0;
  let ineligibleCount = 0;

  for (const r of records) {
    if (r.eligibilityStatus === 'ELIGIBLE') {
      eligibleSpendInr += r.validatedSpendInr;
      eligibleCount += 1;
    } else {
      ineligibleSpendInr += r.validatedSpendInr;
      ineligibleCount += 1;
    }
  }

  return {
    eligibleSpendInr: Math.round(eligibleSpendInr * 100) / 100,
    eligibleSpendCr: toCr(eligibleSpendInr),
    eligibleTransactionCount: eligibleCount,
    ineligibleSpendInr: Math.round(ineligibleSpendInr * 100) / 100,
    ineligibleSpendCr: toCr(ineligibleSpendInr),
    ineligibleTransactionCount: ineligibleCount
  };
}

export function buildSpendCategoryMetrics(
  records: TransactionAttributionRecord[],
  predicate: (r: TransactionAttributionRecord) => boolean
): AttributionSpendCategoryMetrics {
  let spendInr = 0;
  let count = 0;
  for (const r of records) {
    if (predicate(r)) {
      spendInr += r.validatedSpendInr;
      count += 1;
    }
  }
  return {
    spendInr: Math.round(spendInr * 100) / 100,
    spendCr: toCr(spendInr),
    transactionCount: count
  };
}

export function buildQuantifiabilityMetrics(
  records: TransactionAttributionRecord[]
): AttributionQuantifiabilityMetrics {
  let quantifiedSpendInr = 0;
  let quantifiedCount = 0;
  let unquantifiedSpendInr = 0;
  let unquantifiedCount = 0;
  const reasons: Record<string, number> = {};

  for (const r of records) {
    if (r.eligibilityStatus === 'ELIGIBLE') {
      if (r.netAttributedOpportunityInr > 0 || r.observedPriceVarianceInr > 0) {
        quantifiedSpendInr += r.validatedSpendInr;
        quantifiedCount += 1;
      } else {
        unquantifiedSpendInr += r.validatedSpendInr;
        unquantifiedCount += 1;
        const mainCandidate = r.candidateLevers[0];
        const reason = mainCandidate?.unquantifiedReason || 'UNQUANTIFIED_RATE_BASELINE';
        reasons[reason] = (reasons[reason] || 0) + 1;
      }
    }
  }

  return {
    quantifiedSpendInr: Math.round(quantifiedSpendInr * 100) / 100,
    quantifiedSpendCr: toCr(quantifiedSpendInr),
    quantifiedTransactionCount: quantifiedCount,
    unquantifiedSpendInr: Math.round(unquantifiedSpendInr * 100) / 100,
    unquantifiedSpendCr: toCr(unquantifiedSpendInr),
    unquantifiedTransactionCount: unquantifiedCount,
    unquantifiedReasonsBreakdown: reasons
  };
}

function recordPrimaryAllocation(
  allocations: Record<string, LeverAllocationSummary>,
  r: TransactionAttributionRecord
): void {
  const pLever = r.primaryAttributedLever;
  if (pLever === 'NONE' || pLever === 'UNQUANTIFIED') return;

  let alloc = allocations[pLever];
  if (!alloc) {
    alloc = {
      transactionCount: 0,
      allocatedSpendInr: 0,
      allocatedSpendCr: 0,
      netOpportunityInr: 0,
      netOpportunityCr: 0
    };
    allocations[pLever] = alloc;
  }
  alloc.transactionCount += 1;
  alloc.allocatedSpendInr = Math.round((alloc.allocatedSpendInr + r.validatedSpendInr) * 100) / 100;
  alloc.allocatedSpendCr = toCr(alloc.allocatedSpendInr);
  alloc.netOpportunityInr = Math.round((alloc.netOpportunityInr + r.netAttributedOpportunityInr) * 100) / 100;
  alloc.netOpportunityCr = toCr(alloc.netOpportunityInr);
}

function recordAlternativeScenarios(
  scenarios: Record<string, AlternativeScenarioSummary>,
  r: TransactionAttributionRecord
): void {
  for (const c of r.candidateLevers) {
    if (c.lever !== r.primaryAttributedLever && c.grossOpportunityInr > 0) {
      let alt = scenarios[c.lever];
      if (!alt) {
        alt = { transactionCount: 0, unrealizedOpportunityInr: 0, unrealizedOpportunityCr: 0 };
        scenarios[c.lever] = alt;
      }
      alt.transactionCount += 1;
      alt.unrealizedOpportunityInr = Math.round((alt.unrealizedOpportunityInr + c.grossOpportunityInr) * 100) / 100;
      alt.unrealizedOpportunityCr = toCr(alt.unrealizedOpportunityInr);
    }
  }
}

export function buildAllocationsAndWaterfall(
  records: TransactionAttributionRecord[]
): {
  primaryAllocations: Record<string, LeverAllocationSummary>;
  alternativeScenarios: Record<string, AlternativeScenarioSummary>;
  waterfall: OpportunityWaterfallSummary;
} {
  const primaryAllocations: Record<string, LeverAllocationSummary> = {};
  const alternativeScenarios: Record<string, AlternativeScenarioSummary> = {};
  let grossOppTotalInr = 0;
  let netOppTotalInr = 0;
  let observedTotalInr = 0;
  let validatedTotalInr = 0;
  let multiLeverOverlapTotalInr = 0;
  let volumeDisparityExclusionTotalInr = 0;
  let otherQualificationExclusionTotalInr = 0;

  for (const r of records) {
    const qLevers = r.candidateLevers.filter((c) => c.isQuantified && c.grossOpportunityInr > 0);
    const recGross = qLevers.reduce((s, c) => s + c.grossOpportunityInr, 0);
    const primNet = r.netAttributedOpportunityInr;

    grossOppTotalInr += recGross;
    netOppTotalInr += primNet;
    observedTotalInr += r.observedPriceVarianceInr;
    validatedTotalInr += r.validatedAttainableOpportunityInr;

    if (qLevers.length > 1) {
      multiLeverOverlapTotalInr += Math.max(0, recGross - primNet);
    } else if (qLevers.length === 0) {
      if (r.volumeAttainabilityStatus === 'VOLUME_DISPARITY_UNVERIFIED') {
        volumeDisparityExclusionTotalInr += r.observedPriceVarianceInr;
      } else if (r.qualificationStatus === 'UNVERIFIED_PRICE_VARIANCE' ||
                 r.temporalComparisonStatus === 'OUTSIDE_TEMPORAL_WINDOW') {
        otherQualificationExclusionTotalInr += r.observedPriceVarianceInr;
      }
    }

    recordPrimaryAllocation(primaryAllocations, r);
    recordAlternativeScenarios(alternativeScenarios, r);
  }

  const grossInr = Math.round(grossOppTotalInr * 100) / 100;
  const netInr = Math.round(netOppTotalInr * 100) / 100;
  const overlapInr = Math.round(multiLeverOverlapTotalInr * 100) / 100;
  const volExclInr = Math.round(volumeDisparityExclusionTotalInr * 100) / 100;
  const otherExclInr = Math.round(otherQualificationExclusionTotalInr * 100) / 100;
  const balanceInr = Math.round((grossInr - overlapInr - netInr) * 100) / 100;
  const obsInr = Math.round(observedTotalInr * 100) / 100;
  const valInr = Math.round(validatedTotalInr * 100) / 100;

  const waterfall: OpportunityWaterfallSummary = {
    grossOpportunityInr: grossInr, grossOpportunityCr: toCr(grossInr),
    overlapDeductionsInr: overlapInr, overlapDeductionsCr: toCr(overlapInr),
    netOpportunityInr: netInr, netOpportunityCr: toCr(netInr),
    grossCandidateOpportunityInr: grossInr, grossCandidateOpportunityCr: toCr(grossInr),
    multiLeverOverlapDeductionsInr: overlapInr, multiLeverOverlapDeductionsCr: toCr(overlapInr),
    volumeDisparityExclusionsInr: volExclInr, volumeDisparityExclusionsCr: toCr(volExclInr),
    otherQualificationExclusionsInr: otherExclInr, otherQualificationExclusionsCr: toCr(otherExclInr),
    netQualifiedCandidateOpportunityInr: netInr, netQualifiedCandidateOpportunityCr: toCr(netInr),
    commerciallyValidatedSavingsInr: 0, commerciallyValidatedSavingsCr: 0,
    totalObservedVarianceInr: obsInr, totalObservedVarianceCr: toCr(obsInr),
    totalValidatedOpportunityInr: valInr, totalValidatedOpportunityCr: toCr(valInr),
    reconciliationBalanceInr: balanceInr,
    isArithmeticallyBalanced: Math.abs(balanceInr) < 0.001,
    isCertified: false,
    certificationNotice: ATTRIBUTION_NOT_YET_CERTIFIED_NOTICE
  };

  return { primaryAllocations, alternativeScenarios, waterfall };
}

export function compileReconciliationReport(
  records: TransactionAttributionRecord[],
  assessmentId: string
): AttributionReconciliationReport {
  const sourcePopulation = buildPopulationMetrics(records);
  const spendEligibility = buildEligibilityMetrics(records);
  const spendExcludedFromBaseline = buildSpendCategoryMetrics(records, (r) => r.isExcludedFromBaseline);
  const spendWithObservedVariance = buildSpendCategoryMetrics(
    records,
    (r) => r.qualificationStatus === 'OBSERVED_PRICE_VARIANCE'
  );
  const spendWithValidatedOpportunity = buildSpendCategoryMetrics(
    records,
    (r) => r.qualificationStatus === 'VALIDATED_ATTAINABLE_OPPORTUNITY'
  );
  const quantifiability = buildQuantifiabilityMetrics(records);
  const { primaryAllocations, alternativeScenarios, waterfall } = buildAllocationsAndWaterfall(records);
  const leverReconciliation = buildLeverReconciliationSummaries(records);

  return {
    assessmentId,
    timestamp: new Date().toISOString(),
    version: ATTRIBUTION_CALCULATION_VERSION,
    sourcePopulation,
    spendEligibility,
    spendExcludedFromBaseline,
    spendWithObservedVariance,
    spendWithValidatedOpportunity,
    quantifiability,
    primaryAllocationsByLever: primaryAllocations,
    alternativeScenariosByLever: alternativeScenarios,
    opportunityWaterfall: waterfall,
    leverReconciliation
  };
}
