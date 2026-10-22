/**
 * Module 2 — Cross-Lever Savings Deduplication Helpers
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 4, 8, 9: Max 300 lines, complexity <= 10
 */

import { CRORE_DIVISOR } from '../constants/module2SavingsDeduplication';
import type {
  Module2CanonicalSavingsOpportunity,
  DeduplicationStatus,
  EvidenceValidationStatus,
  OpportunityApprovalStatus
} from '../types/module2SavingsDeduplication';

export const round2 = (num: number): number => Math.round(num * 100) / 100;

export const toCrores = (inr: number): number => {
  return Number((round2(inr) / CRORE_DIVISOR).toFixed(4));
};

export const makeOpportunityId = (
  assessmentId: string,
  leverCode: string,
  entityId: string
): string => {
  const cleanEntity = entityId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  return `OPP-${assessmentId}-${leverCode}-${cleanEntity}`;
};

export interface RawOpportunityParams {
  assessmentId: string;
  leverId: number;
  leverCode: string;
  leverName: string;
  categoryOrMaterialId: string;
  categoryOrMaterialName: string;
  eligibleSpendInr: number;
  transactionScopeCount: number;
  calculationBasis: string;
  estimatedGrossSavingsInr: number;
  deduplicationStatus?: DeduplicationStatus;
  evidenceValidationStatus?: EvidenceValidationStatus;
  approvalStatus?: OpportunityApprovalStatus;
  commerciallyValidatedSavingsInr?: number;
  isIncrementalBenefit?: boolean;
  isFinancingBenefitOnly?: boolean;
  isExploratoryPipeline?: boolean;
  validationEvidenceRequired?: string;
  workingCapitalReleasedInr?: number;
  auditEvidenceSummary: string;
}

interface ResolvedState {
  dedupStatus: DeduplicationStatus;
  valStatus: EvidenceValidationStatus;
  appStatus: OpportunityApprovalStatus;
  netInr: number;
  overlapInr: number;
}

function resolveOpportunityState(params: RawOpportunityParams, grossInr: number, isExp: boolean): ResolvedState {
  const dedupStatus = params.deduplicationStatus || (isExp ? 'EXPLORATORY_PIPELINE' : 'INDEPENDENT');
  const valStatus = params.evidenceValidationStatus || (isExp ? 'PLANNING_ASSUMPTION' : 'UNVERIFIED_ESTIMATE');
  const appStatus = params.approvalStatus ?? 'PENDING_REVIEW';
  const isDedup = dedupStatus === 'DEDUPLICATED_OVERLAP';
  const netInr = isDedup || isExp ? 0 : grossInr;
  const overlapInr = isDedup ? grossInr : 0;
  return { dedupStatus, valStatus, appStatus, netInr, overlapInr };
}

export function buildCanonicalOpportunity(
  params: RawOpportunityParams
): Module2CanonicalSavingsOpportunity {
  const oppId = makeOpportunityId(params.assessmentId, params.leverCode, params.categoryOrMaterialId);
  const grossInr = round2(params.estimatedGrossSavingsInr);
  const valInr = round2(params.commerciallyValidatedSavingsInr ?? 0);
  const isExp = Boolean(params.isExploratoryPipeline);
  const { dedupStatus, valStatus, appStatus, netInr, overlapInr } = resolveOpportunityState(params, grossInr, isExp);
  const wcInr = params.workingCapitalReleasedInr;

  return {
    assessmentId: params.assessmentId,
    opportunityId: oppId,
    leverId: params.leverId,
    leverCode: params.leverCode,
    leverName: params.leverName,
    categoryOrMaterialId: params.categoryOrMaterialId,
    categoryOrMaterialName: params.categoryOrMaterialName,
    eligibleSpendInr: round2(params.eligibleSpendInr),
    eligibleSpendCr: toCrores(params.eligibleSpendInr),
    transactionScopeCount: params.transactionScopeCount,
    calculationBasis: params.calculationBasis,
    estimatedGrossSavingsInr: grossInr,
    estimatedGrossSavingsCr: toCrores(grossInr),
    overlappingOpportunityRefs: [],
    overlapAmountInr: overlapInr,
    overlapAmountCr: toCrores(overlapInr),
    netEstimatedSavingsInr: netInr,
    netEstimatedSavingsCr: toCrores(netInr),
    deduplicationStatus: dedupStatus,
    evidenceValidationStatus: valStatus,
    approvalStatus: appStatus,
    commerciallyValidatedSavingsInr: valInr,
    commerciallyValidatedSavingsCr: toCrores(valInr),
    isIncrementalBenefit: Boolean(params.isIncrementalBenefit),
    isFinancingBenefitOnly: params.isFinancingBenefitOnly,
    isExploratoryPipeline: isExp,
    validationEvidenceRequired: params.validationEvidenceRequired,
    workingCapitalReleasedInr: wcInr ? round2(wcInr) : undefined,
    workingCapitalReleasedCr: wcInr ? toCrores(wcInr) : undefined,
    auditEvidenceSummary: params.auditEvidenceSummary
  };
}

export function createZeroSavingsOpportunity(
  assessmentId: string,
  leverId: number,
  leverCode: string,
  leverName: string,
  basis: string,
  auditNotice: string
): Module2CanonicalSavingsOpportunity {
  return buildCanonicalOpportunity({
    assessmentId,
    leverId,
    leverCode,
    leverName,
    categoryOrMaterialId: `${leverCode}-PORTFOLIO`,
    categoryOrMaterialName: `${leverName} Portfolio`,
    eligibleSpendInr: 0,
    transactionScopeCount: 0,
    calculationBasis: basis,
    estimatedGrossSavingsInr: 0,
    deduplicationStatus: 'NOT_APPLICABLE',
    evidenceValidationStatus: 'DISCOVERY_ONLY',
    approvalStatus: 'EXCLUDED_FROM_NET',
    commerciallyValidatedSavingsInr: 0,
    auditEvidenceSummary: auditNotice
  });
}
