export type ReportingPeriodMode =
  | 'ALL_AVAILABLE'
  | 'LAST_12_MONTHS'
  | 'LAST_24_MONTHS'
  | 'LAST_36_MONTHS'
  | 'CUSTOM'
  | 'FINANCIAL_YEAR';

export interface ReportingPeriodSelection {
  mode: ReportingPeriodMode;
  customStartDate?: string;
  customEndDate?: string;
  selectedFiscalYear?: string;
}

export interface DatasetPeriodBounds {
  earliestValidDate: string;
  latestValidDate: string;
  totalValidTransactions: number;
  actualDurationMonths: number;
  availableFiscalYears: string[];
  missingFiscalYears: string[];
  availableMonthsCount: number;
}

export interface ReportingPeriodCoverage extends DatasetPeriodBounds {
  selection: ReportingPeriodSelection;
  effectiveStartDate: string;
  effectiveEndDate: string;
  selectedDurationMonths: number;
  isFullyCovered: boolean;
  selectedPeriodLabel: string;
  actualCoverageLabel: string;
  coverageDisclosure?: string;
  isInsufficientHistory: boolean;
}

export interface PeriodSpendMetric {
  periodKey: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  transactionCount: number;
  spendInr: number;
  spendCr: number;
  isDataAvailable: boolean;
  disclosureNote?: string;
}
