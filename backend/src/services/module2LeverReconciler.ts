/**
 * Module 2 Lever-Level Reconciliation & Audit Reporter
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type { TransactionAttributionRecord } from '../types/module2Attribution';
import type { LeverReconciliationSummary, StrategicSourcingLeverType } from '../types/module2AttributionLevers';
import {
  TEN_STRATEGIC_SOURCING_LEVERS,
  LEVER_EVALUATION_CONFIGS
} from '../constants/module2AttributionLevers';
import { ATTRIBUTION_DEFAULTS } from '../constants/module2Attribution';

const toCr = (inr: number): number => {
  return Math.round((inr / ATTRIBUTION_DEFAULTS.CRORE_DIVISOR) * 1000) / 1000;
};

export function initLeverSummary(lever: StrategicSourcingLeverType, leverName: string): LeverReconciliationSummary {
  const config = LEVER_EVALUATION_CONFIGS[lever];
  return {
    lever,
    leverName,
    candidateTransactionCount: 0,
    candidateSpendInr: 0,
    candidateSpendCr: 0,
    eligibleTransactionCount: 0,
    eligibleSpendInr: 0,
    eligibleSpendCr: 0,
    quantifiedTransactionCount: 0,
    quantifiedOpportunityInr: 0,
    quantifiedOpportunityCr: 0,
    unquantifiedTransactionCount: 0,
    unquantifiedSpendInr: 0,
    unquantifiedSpendCr: 0,
    unquantifiedReasonsBreakdown: {},
    primaryTransactionCount: 0,
    primaryAttributedOpportunityInr: 0,
    primaryAttributedOpportunityCr: 0,
    alternativeScenarioOpportunityInr: 0,
    alternativeScenarioOpportunityCr: 0,
    overlapDeductionInr: 0,
    overlapDeductionCr: 0,
    netAttributedOpportunityInr: 0,
    netAttributedOpportunityCr: 0,
    unresolvedCommercialConditions: config ? [...config.preconditionsForCommercialValidation] : []
  };
}

function processCandidateForSummary(
  summary: LeverReconciliationSummary,
  cand: NonNullable<TransactionAttributionRecord['candidateLevers'][0]>,
  r: TransactionAttributionRecord
): void {
  const spend = r.validatedSpendInr;
  summary.candidateTransactionCount += 1;
  summary.candidateSpendInr = Math.round((summary.candidateSpendInr + spend) * 100) / 100;

  if (cand.isEligible) {
    summary.eligibleTransactionCount += 1;
    summary.eligibleSpendInr = Math.round((summary.eligibleSpendInr + spend) * 100) / 100;
  }

  if (cand.isQuantified && cand.grossOpportunityInr > 0) {
    summary.quantifiedTransactionCount += 1;
    summary.quantifiedOpportunityInr =
      Math.round((summary.quantifiedOpportunityInr + cand.grossOpportunityInr) * 100) / 100;
  } else {
    summary.unquantifiedTransactionCount += 1;
    summary.unquantifiedSpendInr = Math.round((summary.unquantifiedSpendInr + spend) * 100) / 100;
    const reason = cand.unquantifiedReason || 'UNQUANTIFIED';
    summary.unquantifiedReasonsBreakdown[reason] = (summary.unquantifiedReasonsBreakdown[reason] || 0) + 1;
  }

  if (r.primaryAttributedLever === cand.lever) {
    summary.primaryTransactionCount += 1;
    summary.primaryAttributedOpportunityInr =
      Math.round((summary.primaryAttributedOpportunityInr + r.netAttributedOpportunityInr) * 100) / 100;
  } else if (cand.grossOpportunityInr > 0) {
    summary.alternativeScenarioOpportunityInr =
      Math.round((summary.alternativeScenarioOpportunityInr + cand.grossOpportunityInr) * 100) / 100;
  }
}

function finalizeSummary(summary: LeverReconciliationSummary): void {
  summary.candidateSpendCr = toCr(summary.candidateSpendInr);
  summary.eligibleSpendCr = toCr(summary.eligibleSpendInr);
  summary.quantifiedOpportunityCr = toCr(summary.quantifiedOpportunityInr);
  summary.unquantifiedSpendCr = toCr(summary.unquantifiedSpendInr);
  summary.primaryAttributedOpportunityCr = toCr(summary.primaryAttributedOpportunityInr);
  summary.alternativeScenarioOpportunityCr = toCr(summary.alternativeScenarioOpportunityInr);

  const overlap = Math.max(0, summary.quantifiedOpportunityInr - summary.primaryAttributedOpportunityInr);
  summary.overlapDeductionInr = Math.round(overlap * 100) / 100;
  summary.overlapDeductionCr = toCr(summary.overlapDeductionInr);
  summary.netAttributedOpportunityInr = summary.primaryAttributedOpportunityInr;
  summary.netAttributedOpportunityCr = summary.primaryAttributedOpportunityCr;
}

export function buildLeverReconciliationSummaries(
  records: TransactionAttributionRecord[]
): Record<string, LeverReconciliationSummary> {
  const result: Record<string, LeverReconciliationSummary> = {};

  for (const [leverKey, leverName] of Object.entries(TEN_STRATEGIC_SOURCING_LEVERS)) {
    result[leverKey] = initLeverSummary(leverKey as StrategicSourcingLeverType, leverName);
  }

  for (const r of records) {
    for (const cand of r.candidateLevers) {
      let summary = result[cand.lever];
      if (!summary) {
        summary = initLeverSummary(cand.lever as StrategicSourcingLeverType, cand.lever);
        result[cand.lever] = summary;
      }
      processCandidateForSummary(summary, cand, r);
    }
  }

  for (const summary of Object.values(result)) {
    finalizeSummary(summary);
  }

  return result;
}
