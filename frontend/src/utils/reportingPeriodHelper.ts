import type {
  ReportingPeriodSelection,
  DatasetPeriodBounds,
  ReportingPeriodCoverage
} from '../types/reportingPeriod';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export function getIndianFiscalYear(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return 'FY24';
  const str = typeof dateInput === 'string' ? dateInput.trim() : dateInput.toISOString();
  const match = str.match(/^(\d{4})[-/](\d{1,2})/);
  if (!match) return 'FY24';
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (isNaN(year) || isNaN(month)) return 'FY24';
  const fyYear = month >= 4 ? year + 1 : year;
  return `FY${String(fyYear).slice(-2)}`;
}

export function getFiscalYearDateBounds(fyStr: string): { startDate: string; endDate: string } {
  const match = fyStr.match(/FY(\d{2})/i);
  const shortYr = match ? parseInt(match[1], 10) : 24;
  const startYr = 2000 + shortYr - 1;
  const endYr = 2000 + shortYr;
  return {
    startDate: `${startYr}-04-01`,
    endDate: `${endYr}-03-31`
  };
}

export function formatDisplayDate(dateStr: string | undefined | null): string {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const match = String(dateStr).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return String(dateStr);
  const yr = match[1];
  const mo = parseInt(match[2], 10);
  const day = match[3].padStart(2, '0');
  const moName = MONTH_NAMES[(mo - 1 + 12) % 12] || 'Jan';
  return `${day} ${moName} ${yr}`;
}

export function formatDateRange(
  startDate: string,
  endDate: string,
  extraLabel?: string
): string {
  const s = formatDisplayDate(startDate);
  const e = formatDisplayDate(endDate);
  const base = `${s} – ${e}`;
  return extraLabel ? `${base} (${extraLabel})` : base;
}

export function calculateDatasetPeriodBounds(
  dates: (string | undefined | null)[]
): DatasetPeriodBounds {
  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';
  let validCount = 0;
  const monthSet = new Set<string>();
  const fySet = new Set<string>();

  for (const raw of dates) {
    if (!raw) continue;
    const match = String(raw).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (!match) continue;
    const isoDate = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    const monthKey = `${match[1]}-${match[2].padStart(2, '0')}`;
    if (isoDate < minDate) minDate = isoDate;
    if (isoDate > maxDate) maxDate = isoDate;
    monthSet.add(monthKey);
    fySet.add(getIndianFiscalYear(isoDate));
    validCount++;
  }

  if (validCount === 0) {
    return {
      earliestValidDate: 'N/A',
      latestValidDate: 'N/A',
      totalValidTransactions: 0,
      actualDurationMonths: 0,
      availableFiscalYears: [],
      missingFiscalYears: ['FY24', 'FY25', 'FY26'],
      availableMonthsCount: 0
    };
  }

  const availableFiscalYears = Array.from(fySet).sort();
  const standardFys = ['FY23', 'FY24', 'FY25', 'FY26'];
  const missingFiscalYears = standardFys.filter((fy) => !fySet.has(fy));
  const actualDurationMonths = Math.max(monthSet.size, 1);

  return {
    earliestValidDate: minDate,
    latestValidDate: maxDate,
    totalValidTransactions: validCount,
    actualDurationMonths,
    availableFiscalYears,
    missingFiscalYears,
    availableMonthsCount: monthSet.size
  };
}

interface EvaluationState {
  effectiveStartDate: string;
  effectiveEndDate: string;
  selectedDurationMonths: number;
  isFullyCovered: boolean;
  coverageDisclosure?: string;
  isInsufficientHistory: boolean;
  selectedPeriodLabel: string;
}

function createEmptyPeriodCoverage(
  selection: ReportingPeriodSelection,
  bounds: DatasetPeriodBounds
): ReportingPeriodCoverage {
  return {
    ...bounds,
    selection,
    effectiveStartDate: 'N/A',
    effectiveEndDate: 'N/A',
    selectedDurationMonths: 0,
    isFullyCovered: false,
    selectedPeriodLabel: 'No Data Available',
    actualCoverageLabel: '0 months',
    coverageDisclosure: 'No transaction data available.',
    isInsufficientHistory: true
  };
}

function evaluateAllAvailable(bounds: DatasetPeriodBounds): EvaluationState {
  const rangeLabel = formatDateRange(bounds.earliestValidDate, bounds.latestValidDate);
  return {
    effectiveStartDate: bounds.earliestValidDate,
    effectiveEndDate: bounds.latestValidDate,
    selectedDurationMonths: bounds.actualDurationMonths,
    isFullyCovered: true,
    isInsufficientHistory: false,
    selectedPeriodLabel: `Reporting Period: ${rangeLabel}`
  };
}

function evaluateRollingMonths(targetMonths: 12 | 24 | 36, bounds: DatasetPeriodBounds): EvaluationState {
  const effectiveEndDate = bounds.latestValidDate;
  let effectiveStartDate = computeRollingStartDate(bounds.latestValidDate, targetMonths);
  let isFullyCovered = true;
  let isInsufficientHistory = false;
  let coverageDisclosure: string | undefined;

  if (bounds.actualDurationMonths < targetMonths) {
    isFullyCovered = false;
    isInsufficientHistory = true;
    effectiveStartDate = bounds.earliestValidDate;
    const missing = targetMonths - bounds.actualDurationMonths;
    const boundsLabel = formatDateRange(bounds.earliestValidDate, bounds.latestValidDate);
    coverageDisclosure = targetMonths === 12
      ? `Selected period: Last 12 Months. Available history: approximately ${bounds.actualDurationMonths} months (${boundsLabel}).`
      : `Selected period: Last ${targetMonths} Months. Available history: approximately ${bounds.actualDurationMonths} months (${boundsLabel}). Missing ${missing} months of historical coverage.`;
  }

  const rangeLabel = formatDateRange(effectiveStartDate, effectiveEndDate);
  return {
    effectiveStartDate,
    effectiveEndDate,
    selectedDurationMonths: targetMonths,
    isFullyCovered,
    isInsufficientHistory,
    coverageDisclosure,
    selectedPeriodLabel: `Reporting Period: Last ${targetMonths} Months (${rangeLabel})`
  };
}

function evaluateFinancialYear(selection: ReportingPeriodSelection, bounds: DatasetPeriodBounds): EvaluationState {
  const fy = selection.selectedFiscalYear || bounds.availableFiscalYears[0] || 'FY24';
  const fyBounds = getFiscalYearDateBounds(fy);
  let isFullyCovered = true;
  let isInsufficientHistory = false;
  let coverageDisclosure: string | undefined;

  const fyStartInRange = bounds.earliestValidDate <= fyBounds.endDate;
  const fyEndInRange = bounds.latestValidDate >= fyBounds.startDate;
  if (!fyStartInRange || !fyEndInRange) {
    isFullyCovered = false;
    isInsufficientHistory = true;
    const boundsLabel = formatDateRange(bounds.earliestValidDate, bounds.latestValidDate);
    coverageDisclosure = `${fy} is not present in the uploaded dataset (${boundsLabel}).`;
  } else {
    const overlapStart = bounds.earliestValidDate > fyBounds.startDate
      ? bounds.earliestValidDate
      : fyBounds.startDate;
    const overlapEnd = bounds.latestValidDate < fyBounds.endDate
      ? bounds.latestValidDate
      : fyBounds.endDate;
    if (overlapStart > fyBounds.startDate || overlapEnd < fyBounds.endDate) {
      isFullyCovered = false;
      const coverageLabel = formatDateRange(overlapStart, overlapEnd);
      coverageDisclosure = `${fy} coverage in dataset: ${coverageLabel}. Boundaries outside this range are unavailable.`;
    }
  }

  return {
    effectiveStartDate: fyBounds.startDate,
    effectiveEndDate: fyBounds.endDate,
    selectedDurationMonths: 12,
    isFullyCovered,
    isInsufficientHistory,
    coverageDisclosure,
    selectedPeriodLabel: `Reporting Period: ${formatDateRange(fyBounds.startDate, fyBounds.endDate, fy)}`
  };
}

function evaluateCustomRange(selection: ReportingPeriodSelection, bounds: DatasetPeriodBounds): EvaluationState {
  const effectiveStartDate = selection.customStartDate || bounds.earliestValidDate;
  const effectiveEndDate = selection.customEndDate || bounds.latestValidDate;
  let isFullyCovered = true;
  let isInsufficientHistory = false;
  let coverageDisclosure: string | undefined;

  if (effectiveStartDate < bounds.earliestValidDate || effectiveEndDate > bounds.latestValidDate) {
    isFullyCovered = false;
    isInsufficientHistory = true;
    const boundsLabel = formatDateRange(bounds.earliestValidDate, bounds.latestValidDate);
    coverageDisclosure = `Selected custom range extends beyond available dataset history (${boundsLabel}). Missing intervals are not evaluated as zero spend.`;
  }

  const rangeLabel = formatDateRange(effectiveStartDate, effectiveEndDate);
  return {
    effectiveStartDate,
    effectiveEndDate,
    selectedDurationMonths: bounds.actualDurationMonths,
    isFullyCovered,
    isInsufficientHistory,
    coverageDisclosure,
    selectedPeriodLabel: `Reporting Period: ${rangeLabel}`
  };
}

function resolvePeriodState(
  selection: ReportingPeriodSelection,
  bounds: DatasetPeriodBounds
): EvaluationState {
  switch (selection.mode) {
    case 'LAST_12_MONTHS':
      return evaluateRollingMonths(12, bounds);
    case 'LAST_24_MONTHS':
      return evaluateRollingMonths(24, bounds);
    case 'LAST_36_MONTHS':
      return evaluateRollingMonths(36, bounds);
    case 'FINANCIAL_YEAR':
      return evaluateFinancialYear(selection, bounds);
    case 'CUSTOM':
      return evaluateCustomRange(selection, bounds);
    default:
      return evaluateAllAvailable(bounds);
  }
}

export function evaluateReportingPeriod(
  selection: ReportingPeriodSelection,
  bounds: DatasetPeriodBounds
): ReportingPeriodCoverage {
  if (bounds.totalValidTransactions === 0) {
    return createEmptyPeriodCoverage(selection, bounds);
  }

  const state = resolvePeriodState(selection, bounds);
  const actualCoverageLabel = `${bounds.actualDurationMonths} month${bounds.actualDurationMonths === 1 ? '' : 's'}`;

  return {
    ...bounds,
    selection,
    ...state,
    actualCoverageLabel
  };
}

export function computeRollingStartDate(endDateStr: string, monthsBack: number): string {
  const match = endDateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return endDateStr;
  const endYr = parseInt(match[1], 10);
  const endMo = parseInt(match[2], 10);
  const endDay = parseInt(match[3], 10);

  let startYr = endYr - Math.floor(monthsBack / 12);
  let startMo = endMo - (monthsBack % 12);
  if (startMo <= 0) {
    startYr -= 1;
    startMo += 12;
  }
  return `${startYr}-${String(startMo).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
}

export function isDateWithinCoverage(
  dateInput: string | undefined | null,
  coverage: ReportingPeriodCoverage
): boolean {
  if (!dateInput) return false;
  const match = String(dateInput).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return false;
  const iso = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  return iso >= coverage.effectiveStartDate && iso <= coverage.effectiveEndDate;
}
