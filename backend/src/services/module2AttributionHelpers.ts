/**
 * Module 2 Transaction-Level Opportunity Attribution Ledger Helpers
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  AttributionEligibilityStatus,
  AttributionLeverType,
  CandidateLeverEvaluation,
  AttributionEngineConfig
} from '../types/module2Attribution';
import {
  ATTRIBUTION_PRIORITY_SCORES,
  ATTRIBUTION_UNQUANTIFIED_REASONS
} from '../constants/module2Attribution';
import {
  parseTransactionEpochMs,
  evaluateRateOutlier,
  evaluateTemporalWindow,
  evaluateVolumeAttainability
} from './module2TemporalVolumeHelpers';

export interface MaterialBaselineMap {
  minPrice: number;
  maxPrice: number;
  supplierCount: number;
  distinctPricesCount: number;
  primarySupplier: string;
  baselineQty: number;
  baselineEpochMs: number | null;
  peerEpochsMs: number[];
  peerPrices: number[];
}

interface RawGroupRecord {
  price: number;
  qty: number;
  epochMs: number | null;
  supplier: string;
}

interface RawGroupAccumulator {
  records: RawGroupRecord[];
  suppliers: Set<string>;
  primaryVendor: string;
  maxSpend: number;
}

export function buildTransactionSignature(t: StrategicInputTransaction): string {
  const po = (t.po_number || '').trim();
  const line = (t.po_line || '').trim();
  const date = (t.po_date || '').trim();
  const vendor = (t.vendor_code || t.vendor_name || '').trim();
  const mat = (t.material_code || t.material_desc || '').trim();
  return `${po}|${line}|${date}|${vendor}|${mat}|${Number(t.quantity || 0)}|${Number(t.total_spend_inr || 0)}`;
}

export function buildComparabilityKey(matCode?: string, uom?: string, curr?: string): string {
  const m = (matCode || 'UNKNOWN_MAT').trim().toUpperCase();
  const u = (uom || 'UNKNOWN_UOM').trim().toUpperCase();
  const c = (curr || 'INR').trim().toUpperCase();
  return `${m}::${u}::${c}`;
}

function isValidTx(t: StrategicInputTransaction): boolean {
  return (t.quantity ?? 0) > 0 && (t.total_spend_inr ?? 0) > 0 && (t.unit_price ?? 0) > 0;
}

function hasValidMaterialCode(t: StrategicInputTransaction): boolean {
  const m = (t.material_code || '').trim();
  return m !== '' && m !== 'UNKNOWN_MAT';
}

function isEligibleBaselineTx(t: StrategicInputTransaction, duplicateSignatures?: Set<string>): boolean {
  if (!isValidTx(t) || !hasValidMaterialCode(t)) return false;
  if (duplicateSignatures?.has(buildTransactionSignature(t))) return false;
  return !evaluateRateOutlier(t.unit_price || 0, t.material_desc, t.uom).isPlaceholder;
}

function accumulateMaterialTransaction(
  groups: Map<string, RawGroupAccumulator>,
  t: StrategicInputTransaction,
  duplicateSignatures?: Set<string>
): void {
  if (!isEligibleBaselineTx(t, duplicateSignatures)) return;

  const key = buildComparabilityKey(t.material_code, t.uom, t.currency);
  let entry = groups.get(key);
  if (!entry) {
    entry = { records: [], suppliers: new Set(), primaryVendor: t.vendor_name ?? '', maxSpend: 0 };
    groups.set(key, entry);
  }
  const vendorId = (t.vendor_code ?? t.vendor_name ?? 'UNKNOWN').trim();
  entry.records.push({
    price: t.unit_price || 0,
    qty: t.quantity || 0,
    epochMs: parseTransactionEpochMs(t.po_date),
    supplier: vendorId
  });
  entry.suppliers.add(vendorId);
  const spend = t.total_spend_inr || 0;
  if (spend > entry.maxSpend) {
    entry.maxSpend = spend;
    entry.primaryVendor = t.vendor_name ?? '';
  }
}

function computeMaterialBaselineRecord(val: RawGroupAccumulator): MaterialBaselineMap {
  const sorted = [...val.records].sort((a, b) => a.price - b.price);
  const lowest = sorted[0];
  const prices = val.records.map((r) => r.price);
  const uniquePrices = new Set(prices.map((p) => p.toFixed(4)));
  const epochs = val.records.map((r) => r.epochMs).filter((e): e is number => e !== null);

  return {
    minPrice: lowest ? lowest.price : 0,
    maxPrice: sorted.length > 0 ? sorted[sorted.length - 1].price : 0,
    supplierCount: val.suppliers.size,
    distinctPricesCount: uniquePrices.size,
    primarySupplier: val.primaryVendor,
    baselineQty: lowest ? lowest.qty : 0,
    baselineEpochMs: lowest ? lowest.epochMs : null,
    peerEpochsMs: epochs,
    peerPrices: prices
  };
}

export function extractMaterialBaselines(
  transactions: StrategicInputTransaction[],
  duplicateSignatures?: Set<string>
): Map<string, MaterialBaselineMap> {
  const groups = new Map<string, RawGroupAccumulator>();
  for (const t of transactions) {
    accumulateMaterialTransaction(groups, t, duplicateSignatures);
  }

  const result = new Map<string, MaterialBaselineMap>();
  for (const [key, val] of groups.entries()) {
    result.set(key, computeMaterialBaselineRecord(val));
  }
  return result;
}

export function determineEligibility(
  t: StrategicInputTransaction,
  isDuplicate: boolean
): { status: AttributionEligibilityStatus; reason: string } {
  if (isDuplicate) {
    return {
      status: 'SUSPECTED_DUPLICATE_REVIEW',
      reason: 'Suspected identical transaction duplicate awaiting review; preserved in source spend'
    };
  }
  if ((t.total_spend_inr ?? 0) <= 0 || (t.quantity ?? 0) <= 0) {
    return { status: 'INELIGIBLE', reason: 'Zero or negative spend/quantity transaction' };
  }
  return { status: 'ELIGIBLE', reason: 'Verified valid transaction within assessment evaluation period' };
}

function makeUnquantifiedCandidate(
  lever: AttributionLeverType,
  isEligible: boolean,
  reason: string,
  unquantReason: string,
  baseRate: number | null = null
): CandidateLeverEvaluation {
  return {
    lever,
    isEligible,
    eligibilityReason: reason,
    isQuantified: false,
    unquantifiedReason: unquantReason,
    baselineUnitRate: baseRate,
    proposedUnitRate: baseRate,
    grossOpportunityInr: 0,
    priorityScore: ATTRIBUTION_PRIORITY_SCORES[lever],
    qualificationStatus: 'UNQUANTIFIED',
    observedPriceVarianceInr: 0,
    validatedAttainableOpportunityInr: 0
  };
}

function checkCandidatePrerequisites(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): { isPrereqPassed: boolean; eval?: CandidateLeverEvaluation } {
  const lever = 'VENDOR_CONSOLIDATION';
  if (!hasValidMaterialCode(t)) {
    return {
      isPrereqPassed: false,
      eval: makeUnquantifiedCandidate(
        lever,
        false,
        'Missing material code; cannot establish verifiable item identity',
        ATTRIBUTION_UNQUANTIFIED_REASONS.MISSING_MATERIAL_IDENTIFIER
      )
    };
  }
  if (!baseline || baseline.supplierCount < 2) {
    return {
      isPrereqPassed: false,
      eval: makeUnquantifiedCandidate(
        lever,
        false,
        'Single supplier category; multi-vendor consolidation prerequisite absent',
        ATTRIBUTION_UNQUANTIFIED_REASONS.SINGLE_SUPPLIER_CATEGORY
      )
    };
  }
  return { isPrereqPassed: true };
}

function evaluateRateVariance(
  t: StrategicInputTransaction,
  baseline: MaterialBaselineMap,
  config?: AttributionEngineConfig
): CandidateLeverEvaluation {
  const lever: AttributionLeverType = 'VENDOR_CONSOLIDATION';
  const priorityScore = ATTRIBUTION_PRIORITY_SCORES[lever];
  const rateDelta = (t.unit_price || 0) - baseline.minPrice;
  const oppInr = Math.round(rateDelta * (t.quantity || 0) * 100) / 100;

  const targetEpoch = parseTransactionEpochMs(t.po_date);
  const baselineEpochs = baseline.baselineEpochMs !== null ? [baseline.baselineEpochMs] : baseline.peerEpochsMs;
  const temp = evaluateTemporalWindow(targetEpoch, baselineEpochs, config?.temporalWindowDays);
  if (!temp.isWithinWindow) {
    const unquant = makeUnquantifiedCandidate(
      lever,
      true,
      temp.reason,
      ATTRIBUTION_UNQUANTIFIED_REASONS.OUTSIDE_TEMPORAL_WINDOW,
      baseline.minPrice
    );
    return { ...unquant, observedPriceVarianceInr: oppInr, temporalComparisonStatus: temp.status };
  }

  const vol = evaluateVolumeAttainability(t.quantity || 0, baseline.baselineQty, config?.maxVolumeRatioThreshold);
  return {
    lever,
    isEligible: true,
    eligibilityReason: vol.isAttainable
      ? 'Supplier charges unit rate above lowest verified supplier with temporal and volume parity'
      : vol.reason,
    isQuantified: true,
    baselineUnitRate: baseline.minPrice,
    proposedUnitRate: baseline.minPrice,
    grossOpportunityInr: oppInr,
    priorityScore,
    qualificationStatus: vol.isAttainable ? 'VALIDATED_ATTAINABLE_OPPORTUNITY' : 'OBSERVED_PRICE_VARIANCE',
    observedPriceVarianceInr: oppInr,
    validatedAttainableOpportunityInr: vol.isAttainable ? oppInr : 0,
    temporalComparisonStatus: temp.status,
    volumeAttainabilityStatus: vol.status
  };
}

export function evaluateVendorConsolidationCandidate(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap,
  config?: AttributionEngineConfig
): CandidateLeverEvaluation {
  const lever = 'VENDOR_CONSOLIDATION';
  const prereq = checkCandidatePrerequisites(t, baseline);
  if (!prereq.isPrereqPassed || !baseline) {
    return prereq.eval ?? makeUnquantifiedCandidate(lever, false, 'Prerequisite check failed', 'UNQUANTIFIED');
  }

  const outlier = evaluateRateOutlier(t.unit_price || 0, t.material_desc, t.uom, baseline.peerPrices);
  if (outlier.isPlaceholder) {
    return makeUnquantifiedCandidate(
      lever,
      true,
      outlier.reason || 'Suspicious outlier or placeholder unit rate',
      ATTRIBUTION_UNQUANTIFIED_REASONS.SUSPECTED_PLACEHOLDER_RATE,
      baseline.minPrice
    );
  }

  if (baseline.distinctPricesCount <= 1) {
    return makeUnquantifiedCandidate(
      lever,
      true,
      'Multiple suppliers present but unit rates are uniform across suppliers',
      ATTRIBUTION_UNQUANTIFIED_REASONS.UNIFORM_PRICING,
      baseline.minPrice
    );
  }

  if ((t.unit_price || 0) > baseline.minPrice) {
    return evaluateRateVariance(t, baseline, config);
  }

  return makeUnquantifiedCandidate(
    lever,
    true,
    'Supplier unit rate equals lowest verified baseline',
    'Supplier unit rate equals lowest verified baseline',
    baseline.minPrice
  );
}

export function evaluateEAuctionCandidate(
  t: StrategicInputTransaction,
  baseline?: MaterialBaselineMap
): CandidateLeverEvaluation {
  const hasMat = hasValidMaterialCode(t);
  const isMultiSupplier = Boolean(hasMat && baseline && baseline.supplierCount >= 2);

  return makeUnquantifiedCandidate(
    'E_AUCTION',
    isMultiSupplier,
    isMultiSupplier
      ? 'Liquid competitive supply base eligible for reverse auction discovery'
      : (hasMat ? 'Insufficient supplier liquidity for reverse auction' : 'Missing material identifier'),
    hasMat
      ? ATTRIBUTION_UNQUANTIFIED_REASONS.MISSING_BASELINE_PRICE
      : ATTRIBUTION_UNQUANTIFIED_REASONS.MISSING_MATERIAL_IDENTIFIER,
    baseline?.minPrice ?? null
  );
}
