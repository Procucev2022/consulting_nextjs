/**
 * Commodity PCBI Observation Quality & Continuity Audit Engine
 * Inspects staged workbook observations, verifies temporal frequency continuity,
 * calculates missing periods and duplicate dates, and ensures index/price unit integrity.
 * Conforms to Rule 8 (constants isolation), Rule 9 (strongly typed), Rule 21 (max lines <= 300).
 */

import type {
  ExtractedObservationRecord,
  ObservationQualityReport,
  ObservationStepChange
} from '../types/pcbiWorkbookParser';
import {
  WORKBOOK_METRIC_INDEX_POINTS,
  WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT
} from '../constants/pcbiWorkbookParser';

const MS_PER_DAY = 86400000;

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function extractDayGaps(sortedDates: string[]): number[] {
  const dayGaps: number[] = [];
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const t0 = new Date(sortedDates[i]).getTime();
    const t1 = new Date(sortedDates[i + 1]).getTime();
    if (!isNaN(t0) && !isNaN(t1) && t1 > t0) {
      dayGaps.push(Math.round((t1 - t0) / MS_PER_DAY));
    }
  }
  return dayGaps;
}

function mapMedianToFrequency(
  median: number
): 'WEEKLY' | 'MONTHLY' | 'DAILY' | 'ANNUAL' | 'NONE' {
  if (median >= 6 && median <= 8) return 'WEEKLY';
  if (median >= 26 && median <= 34) return 'MONTHLY';
  if (median >= 1 && median <= 2) return 'DAILY';
  if (median >= 350) return 'ANNUAL';
  return 'NONE';
}

export function detectObservationCadence(
  sortedDates: string[]
): { frequency: 'WEEKLY' | 'MONTHLY' | 'DAILY' | 'ANNUAL' | 'NONE'; medianDays: number } {
  if (sortedDates.length < 2) {
    return { frequency: 'NONE', medianDays: 0 };
  }

  const dayGaps = extractDayGaps(sortedDates);
  if (dayGaps.length === 0) {
    return { frequency: 'NONE', medianDays: 0 };
  }

  const median = calculateMedian(dayGaps);
  return { frequency: mapMedianToFrequency(median), medianDays: median };
}

function calculateStepMissing(days: number, frequency: 'WEEKLY' | 'MONTHLY' | 'DAILY' | 'ANNUAL' | 'NONE'): number {
  if (frequency === 'WEEKLY') {
    const stepWeeks = Math.round(days / 7);
    return stepWeeks > 1 ? stepWeeks - 1 : 0;
  }
  if (frequency === 'MONTHLY') {
    const stepMonths = Math.round(days / 30.4375);
    return stepMonths > 1 ? stepMonths - 1 : 0;
  }
  if (frequency === 'DAILY') {
    return days > 1 ? days - 1 : 0;
  }
  return 0;
}

export function calculateMissingPeriods(
  sortedDates: string[],
  frequency: 'WEEKLY' | 'MONTHLY' | 'DAILY' | 'ANNUAL' | 'NONE'
): number {
  if (sortedDates.length < 2 || frequency === 'NONE') return 0;

  let missingCount = 0;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const t0 = new Date(sortedDates[i]).getTime();
    const t1 = new Date(sortedDates[i + 1]).getTime();
    if (isNaN(t0) || isNaN(t1)) continue;

    const days = Math.round((t1 - t0) / MS_PER_DAY);
    missingCount += calculateStepMissing(days, frequency);
  }

  return missingCount;
}

export function calculateDuplicateDates(observations: ExtractedObservationRecord[]): number {
  const seen = new Set<string>();
  let duplicates = 0;

  for (const obs of observations) {
    if (seen.has(obs.date)) {
      duplicates++;
    } else {
      seen.add(obs.date);
    }
  }

  return duplicates;
}

function resolveQualityUnits(
  observations: ExtractedObservationRecord[]
): { unitConsistency: string; isUniform: boolean; underlyingPriceUnit: string; metricType: 'INDEX_POINTS' | 'PRICE' | 'OTHER' } {
  if (observations.length === 0) {
    return {
      unitConsistency: 'No Records',
      isUniform: false,
      underlyingPriceUnit: WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT,
      metricType: 'OTHER'
    };
  }

  const distinctUnits = Array.from(new Set(observations.map((o) => o.unit)));
  const isUniform = distinctUnits.length === 1;
  const primaryUnit = distinctUnits[0] || WORKBOOK_METRIC_INDEX_POINTS;
  const isIndex = primaryUnit === WORKBOOK_METRIC_INDEX_POINTS || primaryUnit.toLowerCase().includes('index');

  const underlyingUnit =
    observations.find((o) => o.underlyingPriceUnit)?.underlyingPriceUnit || WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT;

  return {
    unitConsistency: isUniform ? `Uniform (${primaryUnit})` : `Mixed (${distinctUnits.join(', ')})`,
    isUniform,
    underlyingPriceUnit: underlyingUnit,
    metricType: isIndex ? 'INDEX_POINTS' : 'PRICE'
  };
}

export async function computeSha256Hex(buffer: Uint8Array): Promise<string> {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', buffer as unknown as BufferSource);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

export function detectStepChanges(observations: ExtractedObservationRecord[]): ObservationStepChange[] {
  const sorted = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  const changes: ObservationStepChange[] = [];
  let prevVal: number | null = null;

  for (const obs of sorted) {
    if (prevVal !== null && obs.value !== prevVal) {
      changes.push({
        date: obs.date,
        value: obs.value,
        delta: Number((obs.value - prevVal).toFixed(4)),
        effectiveDate: obs.effectiveDate
      });
    }
    prevVal = obs.value;
  }

  return changes;
}

const PROXY_KEYWORD_REGEX = /tata|proxy|comparability|mithapur/;
const GHCL_MATERIAL_REGEX = /ghcl|100sa02g|pcbi-ind-chm-sda-001/;

export function evaluateSpecificationGovernance(
  materialCode?: string,
  materialDesc?: string,
  sourceNoteOrText?: string
): { status: 'CONFIRMED' | 'PENDING_VERIFICATION'; rationale: string } {
  const meta = `${materialCode ?? ''} ${materialDesc ?? ''}`.toLowerCase();
  const note = (sourceNoteOrText ?? '').toLowerCase();

  const isBorosilGhcl = GHCL_MATERIAL_REGEX.test(meta);
  const hasProxyOrComparability = PROXY_KEYWORD_REGEX.test(note);

  if (isBorosilGhcl && hasProxyOrComparability) {
    return {
      status: 'PENDING_VERIFICATION',
      rationale:
        'Ex-Works Gujarat price basis derived from Tata Chemicals Mithapur proxy circulars requires formal commercial comparability confirmation against Borosil GHCL (100SA02G) contract delivery terms.'
    };
  }

  return {
    status: 'CONFIRMED',
    rationale: 'Specification and price basis match authoritative material requirement.'
  };
}

function resolveFrequencyOutcome(hasConflict: boolean, frequency: string, reqFreqUpper?: string): {
  conflictMessage?: string;
  frequencyStatus: 'MISMATCH' | 'VALIDATED' | 'INSUFFICIENT_DATA';
  frequencyLabel: string;
} {
  if (hasConflict) {
    return {
      conflictMessage: `Frequency Mismatch: Uploaded series is ${frequency} but series specification requires ${reqFreqUpper}.`,
      frequencyStatus: 'MISMATCH',
      frequencyLabel: `Conflict (${frequency} vs Required ${reqFreqUpper})`
    };
  }
  if (frequency !== 'NONE') {
    return {
      frequencyStatus: 'VALIDATED',
      frequencyLabel: `Validated (${frequency})`
    };
  }
  return {
    frequencyStatus: 'INSUFFICIENT_DATA',
    frequencyLabel: 'No Observations Available'
  };
}

function gatherContextNotes(observations: ExtractedObservationRecord[], contextText?: string): string {
  const notes: string[] = [];
  if (contextText) notes.push(contextText);
  const sample = observations.slice(0, 5);
  for (const o of sample) {
    if (o.note) notes.push(o.note);
    if (o.sourceText) notes.push(o.sourceText);
  }
  return notes.join(' ');
}

export function auditObservationQuality(
  observations: ExtractedObservationRecord[],
  requiredFrequency?: string,
  context?: {
    materialCode?: string;
    materialDescription?: string;
    sourceNoteOrText?: string;
    provenanceHash?: string;
  }
): ObservationQualityReport {
  const total = observations.length;
  if (total === 0) {
    return {
      totalObservations: 0, detectedFrequency: 'NONE', requiredFrequency,
      frequencyStatus: 'INSUFFICIENT_DATA', frequencyLabel: 'No Observations Available',
      missingPeriodsCount: 0, duplicateDatesCount: 0, unitConsistency: 'None', isUnitUniform: false,
      detectedMetricType: 'OTHER', underlyingPriceUnit: WORKBOOK_UNDERLYING_PRICE_UNIT_DEFAULT,
      dateRange: { startDate: 'N/A', endDate: 'N/A' }, hasFrequencyConflict: false
    };
  }

  const sortedUniqueDates = Array.from(new Set(observations.map((o) => o.date))).sort();
  const { frequency } = detectObservationCadence(sortedUniqueDates);
  const missingPeriodsCount = calculateMissingPeriods(sortedUniqueDates, frequency);
  const duplicateDatesCount = calculateDuplicateDates(observations);
  const unitInfo = resolveQualityUnits(observations);
  const stepChanges = detectStepChanges(observations);

  const contextNotes = gatherContextNotes(observations, context?.sourceNoteOrText);
  const specGov = evaluateSpecificationGovernance(
    context?.materialCode,
    context?.materialDescription,
    contextNotes
  );

  const reqFreqUpper = requiredFrequency?.toUpperCase();
  const hasFrequencyConflict = Boolean(
    reqFreqUpper && frequency !== 'NONE' && reqFreqUpper !== frequency
  );
  const outcome = resolveFrequencyOutcome(hasFrequencyConflict, frequency, reqFreqUpper);

  return {
    totalObservations: total,
    detectedFrequency: frequency,
    requiredFrequency,
    frequencyStatus: outcome.frequencyStatus,
    frequencyLabel: outcome.frequencyLabel,
    missingPeriodsCount,
    duplicateDatesCount,
    unitConsistency: unitInfo.unitConsistency,
    isUnitUniform: unitInfo.isUniform,
    detectedMetricType: unitInfo.metricType,
    underlyingPriceUnit: unitInfo.underlyingPriceUnit,
    dateRange: {
      startDate: sortedUniqueDates[0] ?? 'N/A',
      endDate: sortedUniqueDates[sortedUniqueDates.length - 1] ?? 'N/A'
    },
    hasFrequencyConflict,
    conflictMessage: outcome.conflictMessage,
    provenanceHash: context?.provenanceHash,
    specificationStatus: specGov.status,
    specificationRationale: specGov.rationale,
    stepChanges
  };
}
