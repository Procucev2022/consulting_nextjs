/**
 * Module 2 Transaction-Level Opportunity Attribution Ledger Engine
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type { Module2CanonicalInput } from '../types/module2Canonical';
import type {
  TransactionAttributionRecord,
  TransactionAttributionLedgerResult,
  AttributionLeverType,
  CandidateLeverEvaluation,
  AttributionPrimarySelection,
  AttributionHeaderMeta,
  AttributionItemMeta,
  AttributionPriceEvidence,
  AttributionEngineConfig
} from '../types/module2Attribution';
import {
  ATTRIBUTION_CALCULATION_METHOD,
  ATTRIBUTION_CALCULATION_VERSION,
  DEFAULT_ATTRIBUTION_PRIORITY_ORDER
} from '../constants/module2Attribution';
import {
  buildTransactionSignature,
  buildComparabilityKey,
  extractMaterialBaselines,
  determineEligibility
} from './module2AttributionHelpers';
import {
  evaluateDirectPriceImprovement, evaluateEAuction, evaluateVendorConsolidation
} from './module2LeversCore';
import {
  evaluateVolumeAggregation, evaluatePaymentTerms, evaluateCategorySpecialisation,
  evaluateLogisticsPackaging, evaluateSpecificationRationalisation,
  evaluateContractCompliance, evaluateNewVendorDevelopment
} from './module2LeversExtended';
import {
  evaluateRateOutlier,
  isVolatileCommodityCategory
} from './module2TemporalVolumeHelpers';
import { compileReconciliationReport } from './module2AttributionReconciler';
import logger from '../utils/logger';

function evaluateTransactionCandidates(
  t: StrategicInputTransaction,
  eligStatus: string,
  baseline?: ReturnType<typeof extractMaterialBaselines> extends Map<string, infer V> ? V : never,
  config?: AttributionEngineConfig
): CandidateLeverEvaluation[] {
  if (eligStatus !== 'ELIGIBLE') {
    return [];
  }
  return [
    evaluateDirectPriceImprovement(t, baseline, config),
    evaluateEAuction(t, baseline),
    evaluateVendorConsolidation(t, baseline, config),
    evaluateVolumeAggregation(t, baseline),
    evaluatePaymentTerms(t, baseline),
    evaluateCategorySpecialisation(t, baseline),
    evaluateLogisticsPackaging(t, baseline),
    evaluateSpecificationRationalisation(t, baseline),
    evaluateContractCompliance(t, baseline),
    evaluateNewVendorDevelopment(t, baseline)
  ];
}

function resolveBaselineExclusion(
  t: StrategicInputTransaction,
  isDuplicate: boolean
): { isExcluded: boolean; reason: string | null } {
  if (isDuplicate) return { isExcluded: true, reason: 'SUSPECTED_DUPLICATE' };
  if ((t.unit_price ?? 0) <= 0 || (t.total_spend_inr ?? 0) <= 0) {
    return { isExcluded: true, reason: 'ZERO_OR_NEGATIVE_RATE' };
  }
  const outlier = evaluateRateOutlier(t.unit_price || 0, t.material_desc, t.uom);
  if (outlier.isPlaceholder) return { isExcluded: true, reason: outlier.reason };
  return { isExcluded: false, reason: null };
}

function resolveHeaderMeta(t: StrategicInputTransaction, assessmentId: string, idx: number): AttributionHeaderMeta {
  const rowNum = idx + 1;
  const po = t.po_number ?? 'N/A';
  return {
    assessmentId, sourceTransactionId: t.id ?? `TX-${assessmentId}-${rowNum}`,
    sourceRowReference: rowNum, poNumber: po,
    lineItemId: `${po}-${t.material_code ?? rowNum}`,
    supplierId: t.vendor_code ?? 'N/A', supplierName: t.vendor_name ?? 'Unknown Supplier'
  };
}

function resolveItemMeta(t: StrategicInputTransaction): AttributionItemMeta {
  const spend = t.total_spend_inr ?? 0;
  return {
    materialCode: t.material_code ?? 'N/A', itemDescription: t.material_desc ?? 'Unspecified Item',
    procurementCategory: t.spend_category ?? 'General', unspscCode: t.unspsc_code ?? '00000000',
    transactionDate: t.po_date ?? 'N/A', quantity: t.quantity ?? 0, uom: t.uom ?? 'EA',
    originalCurrency: t.currency ?? 'INR', originalAmount: spend, validatedSpendInr: spend
  };
}

function resolvePriceEvidence(primary: AttributionPrimarySelection, curr: string): AttributionPriceEvidence {
  return {
    baselineEv: primary.baselinePrice !== null ? `Lowest verified supplier rate in ${curr}` : null,
    proposedEv: primary.proposedPrice !== null ? `Attributed rate for ${primary.primaryLever}` : null
  };
}

function buildAttributionRecord(
  t: StrategicInputTransaction,
  assessmentId: string,
  idx: number,
  params: {
    isDuplicate: boolean;
    eligStatus: ReturnType<typeof determineEligibility>['status'];
    eligReason: string;
    candidates: CandidateLeverEvaluation[];
    primary: AttributionPrimarySelection;
    exclusion: { isExcluded: boolean; reason: string | null };
    requiresVolatileReview: boolean;
  }
): TransactionAttributionRecord {
  const header = resolveHeaderMeta(t, assessmentId, idx);
  const item = resolveItemMeta(t);
  const evidence = resolvePriceEvidence(params.primary, item.originalCurrency);
  const grossInr = params.candidates.reduce((sum, c) => sum + (c.isQuantified ? c.grossOpportunityInr : 0), 0);

  return {
    ...header,
    ...item,
    candidateLevers: params.candidates,
    eligibilityStatus: params.eligStatus,
    eligibilityReason: params.eligReason,
    qualificationStatus: params.primary.qualificationStatus,
    observedPriceVarianceInr: params.primary.observedVarianceInr,
    validatedAttainableOpportunityInr: params.primary.validatedOpportunityInr,
    primaryAttributedLever: params.primary.primaryLever,
    baselineUnitRate: params.primary.baselinePrice,
    baselineEvidence: evidence.baselineEv,
    proposedUnitRate: params.primary.proposedPrice,
    proposedEvidence: evidence.proposedEv,
    grossOpportunityAmountInr: grossInr,
    overlapTreatment: params.primary.overlapTreatment,
    netAttributedOpportunityInr: params.primary.netInr,
    confidenceStatus: params.primary.confidence,
    calculationMethod: ATTRIBUTION_CALCULATION_METHOD,
    calculationVersion: ATTRIBUTION_CALCULATION_VERSION,
    isSuspectedDuplicate: params.isDuplicate,
    isZeroOrNegativeSpend: (t.total_spend_inr ?? 0) <= 0 || (t.quantity ?? 0) <= 0,
    isMissingRequiredEvidence: params.primary.qualificationStatus === 'OBSERVED_PRICE_VARIANCE',
    isExcludedFromBaseline: params.exclusion.isExcluded,
    baselineExclusionReason: params.exclusion.reason,
    temporalComparisonStatus: params.primary.temporalStatus,
    volumeAttainabilityStatus: params.primary.volumeStatus,
    requiresCategoryTemporalReview: params.requiresVolatileReview
  };
}

function buildPrimarySelectionFromChosen(
  chosen: CandidateLeverEvaluation,
  hasMultiple: boolean
): AttributionPrimarySelection {
  const qStatus = chosen.qualificationStatus || 'VALIDATED_ATTAINABLE_OPPORTUNITY';
  const obsInr = chosen.observedPriceVarianceInr ?? chosen.grossOpportunityInr;
  const isObservedOnly = qStatus === 'OBSERVED_PRICE_VARIANCE';
  const valInr = chosen.validatedAttainableOpportunityInr ?? (isObservedOnly ? 0 : chosen.grossOpportunityInr);

  return {
    primaryLever: chosen.lever,
    netInr: valInr,
    overlapTreatment: hasMultiple ? 'MUTUALLY_EXCLUSIVE_PRIMARY' : 'NO_OVERLAP',
    baselinePrice: chosen.baselineUnitRate,
    proposedPrice: chosen.proposedUnitRate,
    confidence: qStatus === 'VALIDATED_ATTAINABLE_OPPORTUNITY' ? 'HIGH' : 'MEDIUM',
    qualificationStatus: qStatus,
    observedVarianceInr: obsInr,
    validatedOpportunityInr: valInr,
    temporalStatus: chosen.temporalComparisonStatus || 'NOT_APPLICABLE',
    volumeStatus: chosen.volumeAttainabilityStatus || 'NOT_APPLICABLE'
  };
}

function buildUnquantifiedSelection(cand?: CandidateLeverEvaluation): AttributionPrimarySelection {
  return {
    primaryLever: 'UNQUANTIFIED',
    netInr: 0,
    overlapTreatment: 'UNQUANTIFIED',
    baselinePrice: cand?.baselineUnitRate ?? null,
    proposedPrice: null,
    confidence: 'UNQUANTIFIED',
    qualificationStatus: cand?.qualificationStatus ?? 'UNQUANTIFIED',
    observedVarianceInr: cand?.observedPriceVarianceInr ?? 0,
    validatedOpportunityInr: 0,
    temporalStatus: cand?.temporalComparisonStatus ?? 'NOT_APPLICABLE',
    volumeStatus: cand?.volumeAttainabilityStatus ?? 'NOT_APPLICABLE'
  };
}

export class Module2AttributionLedgerEngine {
  private static selectPrimaryLever(
    candidates: CandidateLeverEvaluation[],
    priorityOrder: AttributionLeverType[]
  ): AttributionPrimarySelection {
    const quantified = candidates
      .filter((c) => c.isQuantified && c.grossOpportunityInr > 0)
      .sort((a, b) => {
        const rankA = priorityOrder.indexOf(a.lever) === -1 ? 999 : priorityOrder.indexOf(a.lever);
        const rankB = priorityOrder.indexOf(b.lever) === -1 ? 999 : priorityOrder.indexOf(b.lever);
        return rankA - rankB;
      });

    const chosen = quantified[0];
    if (chosen) {
      return buildPrimarySelectionFromChosen(chosen, quantified.length > 1);
    }
    const withObserved = candidates.find((c) => (c.observedPriceVarianceInr ?? 0) > 0);
    return buildUnquantifiedSelection(withObserved || candidates[0]);
  }

  private static processTransaction(
    t: StrategicInputTransaction,
    assessmentId: string,
    idx: number,
    seenSignatures: Set<string>,
    baselines: ReturnType<typeof extractMaterialBaselines>,
    priorityOrder: AttributionLeverType[],
    config?: AttributionEngineConfig
  ): TransactionAttributionRecord {
    const sig = buildTransactionSignature(t);
    const isDuplicate = seenSignatures.has(sig);
    seenSignatures.add(sig);

    const { status: eligStatus, reason: eligReason } = determineEligibility(t, isDuplicate);
    const compKey = buildComparabilityKey(t.material_code, t.uom, t.currency);
    const baseline = baselines.get(compKey);

    const candidates = evaluateTransactionCandidates(t, eligStatus, baseline, config);
    const primary = this.selectPrimaryLever(candidates, priorityOrder);
    const exclusion = resolveBaselineExclusion(t, isDuplicate);
    const requiresVolatileReview = isVolatileCommodityCategory(t.spend_category, t.material_desc);

    return buildAttributionRecord(t, assessmentId, idx, {
      isDuplicate,
      eligStatus,
      eligReason,
      candidates,
      primary,
      exclusion,
      requiresVolatileReview
    });
  }

  public static buildAttributionLedger(
    assessmentId: string,
    canonicalInput: Module2CanonicalInput,
    customPriorityOrder?: AttributionLeverType[],
    config?: AttributionEngineConfig
  ): TransactionAttributionLedgerResult {
    const priorityOrder = customPriorityOrder || DEFAULT_ATTRIBUTION_PRIORITY_ORDER;
    const transactions = canonicalInput.transactions || [];

    const seenSignatures = new Set<string>();
    const duplicateSignatures = new Set<string>();
    for (const t of transactions) {
      const sig = buildTransactionSignature(t);
      if (seenSignatures.has(sig)) duplicateSignatures.add(sig);
      else seenSignatures.add(sig);
    }

    const baselines = extractMaterialBaselines(transactions, duplicateSignatures);
    const evalSignatures = new Set<string>();

    logger.info('Executing Module 2 Opportunity Attribution Ledger Engine', {
      assessmentId,
      transactionCount: transactions.length,
      baselineGroupsCount: baselines.size,
      version: ATTRIBUTION_CALCULATION_VERSION
    });

    const records: TransactionAttributionRecord[] = transactions.map((t, idx) =>
      this.processTransaction(t, assessmentId, idx, evalSignatures, baselines, priorityOrder, config)
    );

    const reconciliation = compileReconciliationReport(records, assessmentId);

    return {
      assessmentId,
      recordCount: records.length,
      records,
      reconciliation,
      timestamp: new Date().toISOString(),
      version: ATTRIBUTION_CALCULATION_VERSION
    };
  }
}
