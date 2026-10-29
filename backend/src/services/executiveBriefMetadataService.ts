/**
 * Certified metadata, financial reconciliation, and summary metric lookup for the Executive Brief.
 * The certified figures come from constants. Reconciliation compares the metadata with those figures and checks the
 * presentation waterfall (gross minus overlaps minus exclusions equals net) and the net composition (direct plus
 * strategic equals net).
 */
import { DEFAULT_CLIENT_PROFILE, EXECUTIVE_BRIEF_VERSION } from '../constants/executiveBriefConstants';
import { REPORT_DATE_SEPARATOR } from '../constants/executiveBriefExportConstants';
import {
  EXECUTIVE_BRIEF_PRESENTATION_CONTRACT,
  validateNetComposition,
  validateWaterfallMath
} from '../constants/executiveBriefPresentationConstants';
import {
  CERTIFIED_ADDRESSABLE_SPEND_INR,
  CERTIFIED_APPROVED_SAVINGS_INR,
  CERTIFIED_CONFIDENCE_SUMMARY,
  CERTIFIED_GROSS_OPPORTUNITY_INR,
  CERTIFIED_MODULES_INCLUDED,
  CERTIFIED_NET_DEFENSIBLE_INR,
  CERTIFIED_OPPORTUNITY_COUNT,
  CERTIFIED_REALIZED_SAVINGS_INR,
  CERTIFIED_TOTAL_SPEND_INR,
  RECONCILIATION_TOLERANCE_INR,
  VARIANCE_DETECTED_MESSAGE
} from '../constants/executiveBriefCertifiedFigureConstants';
import type { ExecutiveBriefMetadata } from '../types/executiveBriefTypes';
import type { FinancialConsistencyCheck } from '../types/executiveBriefExportTypes';
import type {
  ExecutiveBriefFinancialReconciliation,
  ExecutiveBriefSummaryMetric
} from '../types/executiveBriefServices';

/**
 * Maps a requested client name to the certified client (case-insensitive, trimmed). Any other name returns null,
 * because the Worker serves only the certified profile. Callers default an omitted name to the certified client.
 */
export const resolveCertifiedClientName = (requestedName: string): string | null => {
  const matches = requestedName.trim().toLowerCase() === DEFAULT_CLIENT_PROFILE.clientName.toLowerCase();
  return matches ? DEFAULT_CLIENT_PROFILE.clientName : null;
};

export const toReportDate = (date: Date): string => date.toISOString().split(REPORT_DATE_SEPARATOR)[0];

export const buildExecutiveBriefMetadata = (clientName: string, reportDate: string): ExecutiveBriefMetadata => ({
  client: clientName,
  reportDate,
  analysisPeriod: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.analysisPeriod,
  modulesIncluded: [...CERTIFIED_MODULES_INCLUDED],
  transactionCount: EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineTransactions,
  totalSpendInr: CERTIFIED_TOTAL_SPEND_INR,
  addressableSpendInr: CERTIFIED_ADDRESSABLE_SPEND_INR,
  grossOpportunityInr: CERTIFIED_GROSS_OPPORTUNITY_INR,
  netDefensibleOpportunityInr: CERTIFIED_NET_DEFENSIBLE_INR,
  approvedSavingsInr: CERTIFIED_APPROVED_SAVINGS_INR,
  realizedSavingsInr: CERTIFIED_REALIZED_SAVINGS_INR,
  opportunityCount: CERTIFIED_OPPORTUNITY_COUNT,
  confidenceSummary: { ...CERTIFIED_CONFIDENCE_SUMMARY },
  sourceReferences: DEFAULT_CLIENT_PROFILE.publicFacts.map((fact) => ({
    topic: fact.characteristic,
    source: fact.source,
    sourceDate: fact.sourceDate
  })),
  reportVersion: EXECUTIVE_BRIEF_VERSION
});

const varianceFrom = (actual: number, certified: number): number => Math.abs(actual - certified);

export const verifyFinancialConsistency = (metadata: ExecutiveBriefMetadata): FinancialConsistencyCheck => {
  const totalSpendVarianceInr = varianceFrom(metadata.totalSpendInr, CERTIFIED_TOTAL_SPEND_INR);
  const addressableSpendVarianceInr = varianceFrom(metadata.addressableSpendInr, CERTIFIED_ADDRESSABLE_SPEND_INR);
  const grossOpportunityVarianceInr = varianceFrom(metadata.grossOpportunityInr, CERTIFIED_GROSS_OPPORTUNITY_INR);
  const netDefensibleVarianceInr = varianceFrom(metadata.netDefensibleOpportunityInr, CERTIFIED_NET_DEFENSIBLE_INR);
  const approvedSavingsVarianceInr = varianceFrom(metadata.approvedSavingsInr, CERTIFIED_APPROVED_SAVINGS_INR);
  const realizedSavingsVarianceInr = varianceFrom(metadata.realizedSavingsInr, CERTIFIED_REALIZED_SAVINGS_INR);
  const totalVariance =
    totalSpendVarianceInr +
    addressableSpendVarianceInr +
    grossOpportunityVarianceInr +
    netDefensibleVarianceInr +
    approvedSavingsVarianceInr +
    realizedSavingsVarianceInr;
  const isConsistent = totalVariance <= RECONCILIATION_TOLERANCE_INR;
  return {
    totalSpendVarianceInr,
    addressableSpendVarianceInr,
    grossOpportunityVarianceInr,
    netDefensibleVarianceInr,
    approvedSavingsVarianceInr,
    realizedSavingsVarianceInr,
    isConsistent,
    status: isConsistent ? 'PASS' : 'FAIL',
    errorMessage: isConsistent ? undefined : VARIANCE_DETECTED_MESSAGE
  };
};

export const reconcileExecutiveBrief = (metadata: ExecutiveBriefMetadata): ExecutiveBriefFinancialReconciliation => {
  const consistency = verifyFinancialConsistency(metadata);
  const waterfallValid = validateWaterfallMath(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT);
  const netCompositionValid = validateNetComposition(EXECUTIVE_BRIEF_PRESENTATION_CONTRACT);
  return {
    consistency,
    waterfallValid,
    netCompositionValid,
    isReconciled: consistency.isConsistent && waterfallValid && netCompositionValid
  };
};

export const readSummaryMetric = (metric: ExecutiveBriefSummaryMetric, metadata: ExecutiveBriefMetadata): number => {
  switch (metric) {
    case 'totalSpend':
      return metadata.totalSpendInr;
    case 'addressableSpend':
      return metadata.addressableSpendInr;
    case 'grossOpportunity':
      return metadata.grossOpportunityInr;
    case 'approvedSavings':
      return metadata.approvedSavingsInr;
    case 'realizedSavings':
      return metadata.realizedSavingsInr;
    case 'opportunityCount':
      return metadata.opportunityCount;
    case 'transactionCount':
      return metadata.transactionCount;
    case 'baselineSuppliers':
      return EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineSuppliers;
    case 'baselineMaterialGroups':
      return EXECUTIVE_BRIEF_PRESENTATION_CONTRACT.baselineMaterialGroups;
  }
};
