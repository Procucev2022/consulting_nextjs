/**
 * Module 2 Temporal Comparability, Volume Attainability & Outlier Controls
 * Version: MODULE_2_ATTRIBUTION_LEDGER_V1.0
 */

import type {
  TemporalComparisonStatus,
  VolumeAttainabilityStatus
} from '../types/module2Attribution';
import {
  ATTRIBUTION_DEFAULTS,
  VOLATILE_COMMODITY_KEYWORDS,
  LEGITIMATE_LOW_PRICE_KEYWORDS
} from '../constants/module2Attribution';

export interface TemporalEvaluationResult {
  status: TemporalComparisonStatus;
  isWithinWindow: boolean;
  reason: string;
}

export interface VolumeEvaluationResult {
  status: VolumeAttainabilityStatus;
  isAttainable: boolean;
  reason: string;
}

export interface OutlierEvaluationResult {
  isPlaceholder: boolean;
  reason: string | null;
}

export function parseTransactionEpochMs(dateStr?: string): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === 'N/A' || trimmed === 'UNKNOWN') return null;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function isVolatileCommodityCategory(category?: string, desc?: string): boolean {
  const text = `${category || ''} ${desc || ''}`.toUpperCase();
  return VOLATILE_COMMODITY_KEYWORDS.some((kw) => text.includes(kw));
}

function isLegitimateLowPriceItem(desc?: string, uom?: string): boolean {
  const d = (desc || '').toUpperCase();
  const u = (uom || '').toUpperCase();
  const hasKeyword = LEGITIMATE_LOW_PRICE_KEYWORDS.some((kw) => d.includes(kw));
  const isUnitUom = u === 'EA' || u === 'NO' || u === 'PC' || u === 'PCS' || u === 'NUM';
  return hasKeyword && isUnitUom;
}

function checkPeerRatioOutlier(unitPrice: number, peerPrices?: number[]): OutlierEvaluationResult | null {
  if (!peerPrices || peerPrices.length < ATTRIBUTION_DEFAULTS.DEFAULT_MIN_PEER_COUNT_FOR_OUTLIER) {
    return null;
  }
  const validPeers = peerPrices.filter((p) => p > 0.1);
  if (validPeers.length < ATTRIBUTION_DEFAULTS.DEFAULT_MIN_PEER_COUNT_FOR_OUTLIER) {
    return null;
  }
  const sorted = [...validPeers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  if (median > 5.0 && unitPrice < median * ATTRIBUTION_DEFAULTS.DEFAULT_OUTLIER_RATIO_THRESHOLD) {
    return {
      isPlaceholder: true,
      reason: 'RATE_OUTLIER_BELOW_PLAUSIBLE_RANGE: Unit rate < 5% of median peer price'
    };
  }
  return null;
}

export function evaluateRateOutlier(
  unitPrice: number,
  desc?: string,
  uom?: string,
  peerPrices?: number[]
): OutlierEvaluationResult {
  if (unitPrice <= 0) {
    return { isPlaceholder: true, reason: 'ZERO_OR_NEGATIVE_RATE' };
  }
  if (unitPrice <= 0.1) {
    if (isLegitimateLowPriceItem(desc, uom)) {
      return { isPlaceholder: false, reason: null };
    }
    return {
      isPlaceholder: true,
      reason: 'SUSPECTED_PLACEHOLDER_RATE: Near-zero rate on non-hardware commodity'
    };
  }
  const peerRatioResult = checkPeerRatioOutlier(unitPrice, peerPrices);
  if (peerRatioResult) {
    return peerRatioResult;
  }
  return { isPlaceholder: false, reason: null };
}

export function evaluateTemporalWindow(
  targetEpochMs: number | null,
  peerEpochsMs: number[],
  windowDays: number = ATTRIBUTION_DEFAULTS.DEFAULT_TEMPORAL_WINDOW_DAYS
): TemporalEvaluationResult {
  if (targetEpochMs === null) {
    return {
      status: 'NOT_APPLICABLE',
      isWithinWindow: true,
      reason: 'Transaction date unavailable; temporal windowing not applied'
    };
  }
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const peersInside = peerEpochsMs.filter((p) => Math.abs(p - targetEpochMs) <= windowMs);
  if (peersInside.length === 0) {
    return {
      status: 'OUTSIDE_TEMPORAL_WINDOW',
      isWithinWindow: false,
      reason: `No comparable transactions found within rolling ${windowDays}-day evaluation window`
    };
  }
  return {
    status: 'INSIDE_WINDOW',
    isWithinWindow: true,
    reason: `Comparable baseline transactions confirmed within rolling ${windowDays}-day window`
  };
}

export function evaluateVolumeAttainability(
  targetQty: number,
  baselineQty: number,
  maxRatio: number = ATTRIBUTION_DEFAULTS.DEFAULT_MAX_VOLUME_RATIO
): VolumeEvaluationResult {
  if (targetQty <= 0 || baselineQty <= 0) {
    return {
      status: 'NOT_APPLICABLE',
      isAttainable: false,
      reason: 'Zero or missing purchase quantity'
    };
  }
  const ratio = Math.max(targetQty, baselineQty) / Math.min(targetQty, baselineQty);
  if (ratio > maxRatio) {
    return {
      status: 'VOLUME_DISPARITY_UNVERIFIED',
      isAttainable: false,
      reason: `Order scale difference (${ratio.toFixed(1)}x) exceeds threshold (${maxRatio}x); volume-tier attainability unverified without contractual MOQ`
    };
  }
  return {
    status: 'VOLUME_PARITY_VERIFIED',
    isAttainable: true,
    reason: `Purchase quantity scale (${ratio.toFixed(1)}x) is commercially comparable to baseline purchase`
  };
}
