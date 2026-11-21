import type {
  MonthWiseSummary,
  PcbiWeeklyIndexResponse,
  ValidationPreCheckRecord,
  VendorPriceRank
} from '../types';
import {
  MODULE3_DEFAULT_WEEKS_WINDOW,
  MODULE3_HIGH_CREEP_THRESHOLD_PERCENT,
  MODULE3_CREEP_LEAKAGE_HIGH_FACTOR,
  MODULE3_CREEP_LEAKAGE_REVIEW_FACTOR,
  MODULE3_MAX_DERIVED_VENDORS
} from '../constants/module3';

export interface Module3SummaryMetrics {
  totalLeakageCr: number;
  highCreepCount: number;
  highCreepLeakageCr: number;
  creepAnomalyCount: number;
  avgMarkupPct: string | null;
}

export function sortMonthsChronologically(months: MonthWiseSummary[]): MonthWiseSummary[] {
  return [...months].sort((left, right) => left.month_key.localeCompare(right.month_key));
}

export function formatMonthRangeLabel(months: MonthWiseSummary[]): string {
  if (months.length === 0) return '';
  if (months.length === 1) return months[0].month_label;
  return `${months[0].month_label} – ${months[months.length - 1].month_label}`;
}

export function alignWeeklyIndicesToMonths(
  weeklyIndices: PcbiWeeklyIndexResponse,
  months?: MonthWiseSummary[]
): PcbiWeeklyIndexResponse {
  if (!weeklyIndices || weeklyIndices.length === 0) return [];
  const sortedIndices = [...weeklyIndices].sort((left, right) => left.week_start.localeCompare(right.week_start));

  if (!months || months.length === 0) {
    return sortedIndices.slice(-MODULE3_DEFAULT_WEEKS_WINDOW);
  }

  const sortedMonths = sortMonthsChronologically(months);
  const startPrefix = `${sortedMonths[0].month_key}-01`;
  const endPrefix = `${sortedMonths[sortedMonths.length - 1].month_key}-31`;

  const filtered = sortedIndices.filter(
    (record) => record.week_start >= startPrefix && record.week_start <= endPrefix
  );

  return filtered.length > 0 ? filtered : sortedIndices.slice(-MODULE3_DEFAULT_WEEKS_WINDOW);
}

export function buildCorrelatedMonthlySeries(
  months: MonthWiseSummary[],
  weeklyIndices: PcbiWeeklyIndexResponse
): (number | null)[] {
  if (months.length === 0) return [];
  if (weeklyIndices.length === 0) return months.map(() => null);

  const sortedIndices = [...weeklyIndices].sort((left, right) => left.week_start.localeCompare(right.week_start));

  return months.map((month) => {
    const directMatches = sortedIndices.filter((record) => record.week_start.startsWith(month.month_key));
    if (directMatches.length > 0) {
      const average = directMatches.reduce((sum, item) => sum + item.index_value, 0) / directMatches.length;
      return Number(average.toFixed(1));
    }

    const monthMidEpoch = Date.parse(`${month.month_key}-15T00:00:00Z`);
    let closestRecord = sortedIndices[0];
    let minDiff = Number.POSITIVE_INFINITY;

    for (const record of sortedIndices) {
      const diff = Math.abs(Date.parse(`${record.week_start}T00:00:00Z`) - monthMidEpoch);
      if (diff < minDiff) {
        minDiff = diff;
        closestRecord = record;
      }
    }

    return Number(closestRecord.index_value.toFixed(1));
  });
}

export function normalizeCoreCategory(category?: string): VendorPriceRank['category'] {
  if (!category) return 'Direct Mat.';
  if (category.includes('Direct')) return 'Direct Mat.';
  if (category.includes('Packaging')) return 'Packaging';
  if (category.includes('Freight') || category.includes('Logistics')) return 'Freight';
  if (category.includes('MRO') || category.includes('Indirect')) return 'Indirect / MRO';
  return category;
}

interface VendorAggregate {
  name: string;
  totalSpendCr: number;
  totalSpendRaw: number;
  categoryTally: Record<string, number>;
  prices: Array<{ price: number; date: string; year: number }>;
}

function computePriceCreep(prices: Array<{ price: number; date: string; year: number }>): number {
  if (prices.length < 2) return 0;
  const sorted = [...prices].sort((left, right) => left.date.localeCompare(right.date) || left.year - right.year);
  const mid = Math.floor(sorted.length / 2);
  const earlySlice = sorted.slice(0, mid);
  const lateSlice = sorted.slice(mid);

  const earlyAvg = earlySlice.reduce((sum, item) => sum + item.price, 0) / (earlySlice.length || 1);
  const lateAvg = lateSlice.reduce((sum, item) => sum + item.price, 0) / (lateSlice.length || 1);

  if (earlyAvg <= 0) return 0;
  const creep = ((lateAvg - earlyAvg) / earlyAvg) * 100;
  return Number(creep.toFixed(1));
}

function resolveDominantCategory(categoryTally: Record<string, number>): VendorPriceRank['category'] {
  let bestCategory = 'Direct Mat.';
  let maxCount = -1;
  for (const [rawCategory, count] of Object.entries(categoryTally)) {
    if (count > maxCount) {
      maxCount = count;
      bestCategory = rawCategory;
    }
  }
  return normalizeCoreCategory(bestCategory);
}

function recordSpendCrores(record: ValidationPreCheckRecord): number {
  if (typeof record.inr_crores === 'number') return record.inr_crores;
  if (typeof record.amount_inr === 'number') return record.amount_inr / 10000000;
  return 0;
}

function recordTransactionYear(record: ValidationPreCheckRecord, date: string): number {
  if (typeof record.spend_year === 'number') return record.spend_year;
  return date.length >= 4 ? Number(date.slice(0, 4)) : 2024;
}

function ingestRecordIntoAggregate(aggregate: VendorAggregate, record: ValidationPreCheckRecord): void {
  const inrCr = recordSpendCrores(record);
  const inrRaw = typeof record.amount_inr === 'number' ? record.amount_inr : inrCr * 10000000;
  aggregate.totalSpendCr += inrCr;
  aggregate.totalSpendRaw += inrRaw;

  const categoryKey = record.core_category ?? record.column_l_code ?? 'Direct Materials';
  aggregate.categoryTally[categoryKey] = (aggregate.categoryTally[categoryKey] || 0) + 1;

  const price = record.net_price ?? record.unit_price ?? 0;
  if (price > 0) {
    const date = record.transaction_date ?? (record.spend_year ? `${record.spend_year}-01-01` : '');
    const year = recordTransactionYear(record, date);
    aggregate.prices.push({ price, date, year });
  }
}

function collectVendorAggregates(records: ValidationPreCheckRecord[]): Map<string, VendorAggregate> {
  const aggregates = new Map<string, VendorAggregate>();
  for (const record of records) {
    const rawName = record.vendor_name?.trim();
    if (!rawName) continue;

    let aggregate = aggregates.get(rawName);
    if (!aggregate) {
      aggregate = {
        name: rawName,
        totalSpendCr: 0,
        totalSpendRaw: 0,
        categoryTally: {},
        prices: []
      };
      aggregates.set(rawName, aggregate);
    }
    ingestRecordIntoAggregate(aggregate, record);
  }
  return aggregates;
}

function resolveRiskAndLeakage(
  totalSpendCr: number,
  creepPct: number
): { riskStatus: VendorPriceRank['risk_status']; leakageCr: number } {
  if (creepPct > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT) {
    const leakageFactor = (Math.abs(creepPct) / 100) * MODULE3_CREEP_LEAKAGE_HIGH_FACTOR;
    return {
      riskStatus: 'HIGH CREEP',
      leakageCr: Number((totalSpendCr * leakageFactor).toFixed(2))
    };
  }
  if (creepPct > 0) {
    const leakageFactor = (Math.abs(creepPct) / 100) * MODULE3_CREEP_LEAKAGE_REVIEW_FACTOR;
    return {
      riskStatus: 'REVIEW',
      leakageCr: Number((totalSpendCr * leakageFactor).toFixed(2))
    };
  }
  return { riskStatus: 'ALIGNED', leakageCr: 0 };
}

function convertAggregateToRanking(aggregate: VendorAggregate, index: number): VendorPriceRank {
  const dominantCategory = resolveDominantCategory(aggregate.categoryTally);
  const creepPct = computePriceCreep(aggregate.prices);
  const { riskStatus, leakageCr } = resolveRiskAndLeakage(aggregate.totalSpendCr, creepPct);

  return {
    vendor_name: aggregate.name,
    master_id: `VEN-M-${5000 + index}`,
    category: dominantCategory,
    price_creep_pct: creepPct,
    total_spend: Math.round(aggregate.totalSpendRaw),
    total_spend_inr_cr: Number(aggregate.totalSpendCr.toFixed(2)),
    risk_status: riskStatus,
    risk_level: riskStatus === 'HIGH CREEP' ? 'High' : riskStatus === 'REVIEW' ? 'Medium' : 'Low',
    variance_leakage_inr_cr: leakageCr,
    variance_leakage_usd: Math.round((leakageCr * 10000000) / 83.8),
    benchmark_index: 'Composite Industrial Bearing Index'
  };
}

export function deriveVendorRankingsFromValidationRecords(
  records: ValidationPreCheckRecord[]
): VendorPriceRank[] {
  if (!records || records.length === 0) return [];
  const aggregates = collectVendorAggregates(records);

  const rankings: VendorPriceRank[] = [];
  let index = 0;

  for (const aggregate of aggregates.values()) {
    index += 1;
    rankings.push(convertAggregateToRanking(aggregate, index));
  }

  return rankings
    .sort((left, right) => (right.total_spend_inr_cr ?? 0) - (left.total_spend_inr_cr ?? 0))
    .slice(0, MODULE3_MAX_DERIVED_VENDORS);
}

export function calculateModule3SummaryMetrics(rankings: VendorPriceRank[]): Module3SummaryMetrics {
  const totalLeakageCr = rankings.reduce((sum, v) => sum + (v.variance_leakage_inr_cr || 0), 0);
  const highCreepVendors = rankings.filter(
    (v) => v.risk_status === 'HIGH CREEP' || (v.price_creep_pct ?? 0) > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT
  );
  const creepAnomalyCount = rankings.filter(
    (v) => v.risk_status === 'HIGH CREEP' || v.risk_status === 'REVIEW' ||
      (v.price_creep_pct ?? 0) > MODULE3_HIGH_CREEP_THRESHOLD_PERCENT
  ).length;
  const highCreepCount = highCreepVendors.length;
  const highCreepLeakageCr = highCreepVendors.reduce((sum, v) => sum + (v.variance_leakage_inr_cr || 0), 0);
  const avgMarkupPct = rankings.length > 0
    ? (rankings.reduce((sum, v) => sum + (v.price_creep_pct || 0), 0) / rankings.length).toFixed(1)
    : null;

  return {
    totalLeakageCr,
    highCreepCount,
    highCreepLeakageCr,
    creepAnomalyCount,
    avgMarkupPct
  };
}
