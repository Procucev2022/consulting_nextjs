import { describe, it, expect } from 'vitest';
import {
  getIndianFiscalYear,
  getFiscalYearDateBounds,
  formatDisplayDate,
  formatDateRange,
  calculateDatasetPeriodBounds,
  evaluateReportingPeriod,
  computeRollingStartDate,
  isDateWithinCoverage
} from '../../src/utils/reportingPeriodHelper';
import {
  REPORTING_PERIOD_MODES,
  DEFAULT_REPORTING_PERIOD_MODE,
  reportingPeriodSelectionSchema
} from '../../src/constants/reportingPeriod';

describe('Frontend reportingPeriodHelper & constants Unit Tests', () => {
  describe('Constants and Schemas', () => {
    it('validates REPORTING_PERIOD_MODES and defaults', () => {
      expect(REPORTING_PERIOD_MODES).toHaveLength(6);
      expect(DEFAULT_REPORTING_PERIOD_MODE).toBe('ALL_AVAILABLE');
    });

    it('validates reportingPeriodSelectionSchema correctly', () => {
      const validAll = reportingPeriodSelectionSchema.safeParse({ mode: 'ALL_AVAILABLE' });
      expect(validAll.success).toBe(true);

      const validFy = reportingPeriodSelectionSchema.safeParse({
        mode: 'FINANCIAL_YEAR',
        selectedFiscalYear: 'FY24'
      });
      expect(validFy.success).toBe(true);

      const invalidFy = reportingPeriodSelectionSchema.safeParse({ mode: 'FINANCIAL_YEAR' });
      expect(invalidFy.success).toBe(false);

      const validCustom = reportingPeriodSelectionSchema.safeParse({
        mode: 'CUSTOM',
        customStartDate: '2023-01-01',
        customEndDate: '2023-12-31'
      });
      expect(validCustom.success).toBe(true);

      const invalidCustom = reportingPeriodSelectionSchema.safeParse({
        mode: 'CUSTOM',
        customStartDate: '2023-12-31',
        customEndDate: '2023-01-01'
      });
      expect(invalidCustom.success).toBe(false);
    });
  });

  describe('Fiscal Year and Date Formatting', () => {
    it('determines Indian Fiscal Year accurately', () => {
      expect(getIndianFiscalYear('2023-01-15')).toBe('FY23');
      expect(getIndianFiscalYear('2023-03-31')).toBe('FY23');
      expect(getIndianFiscalYear('2023-04-01')).toBe('FY24');
      expect(getIndianFiscalYear('2023-12-30')).toBe('FY24');
      expect(getIndianFiscalYear('2024-03-31')).toBe('FY24');
      expect(getIndianFiscalYear('2024-04-01')).toBe('FY25');
      expect(getIndianFiscalYear(new Date('2025-05-10'))).toBe('FY26');
      expect(getIndianFiscalYear('')).toBe('FY24');
      expect(getIndianFiscalYear('invalid-date')).toBe('FY24');
      expect(getIndianFiscalYear(null)).toBe('FY24');
    });

    it('returns fiscal year date bounds', () => {
      const fy24 = getFiscalYearDateBounds('FY24');
      expect(fy24.startDate).toBe('2023-04-01');
      expect(fy24.endDate).toBe('2024-03-31');

      const fy23 = getFiscalYearDateBounds('FY23');
      expect(fy23.startDate).toBe('2022-04-01');
      expect(fy23.endDate).toBe('2023-03-31');

      const fallback = getFiscalYearDateBounds('OTHER');
      expect(fallback.startDate).toBe('2023-04-01');
      expect(fallback.endDate).toBe('2024-03-31');
    });

    it('formats display dates and date ranges cleanly', () => {
      expect(formatDisplayDate('2023-01-02')).toBe('02 Jan 2023');
      expect(formatDisplayDate('2023-12-30')).toBe('30 Dec 2023');
      expect(formatDisplayDate('N/A')).toBe('N/A');
      expect(formatDisplayDate(null)).toBe('N/A');
      expect(formatDisplayDate('invalid')).toBe('invalid');

      expect(formatDateRange('2023-01-02', '2023-12-30')).toBe('02 Jan 2023 – 30 Dec 2023');
      expect(formatDateRange('2023-04-01', '2024-03-31', 'FY24')).toBe('01 Apr 2023 – 31 Mar 2024 (FY24)');
    });
  });

  describe('Dataset Period Bounds Calculation', () => {
    it('handles empty dates array', () => {
      const bounds = calculateDatasetPeriodBounds([]);
      expect(bounds.totalValidTransactions).toBe(0);
      expect(bounds.actualDurationMonths).toBe(0);
      expect(bounds.earliestValidDate).toBe('N/A');
    });

    it('calculates bounds for a single 12-month calendar year dataset (like AIC-2026-0002)', () => {
      const dates = [
        '2023-01-02',
        '2023-05-10',
        '2023-08-20',
        '2023-12-30',
        null,
        'invalid'
      ];
      const bounds = calculateDatasetPeriodBounds(dates);
      expect(bounds.totalValidTransactions).toBe(4);
      expect(bounds.earliestValidDate).toBe('2023-01-02');
      expect(bounds.latestValidDate).toBe('2023-12-30');
      expect(bounds.availableFiscalYears).toContain('FY23');
      expect(bounds.availableFiscalYears).toContain('FY24');
      expect(bounds.missingFiscalYears).toContain('FY25');
      expect(bounds.missingFiscalYears).toContain('FY26');
      expect(bounds.actualDurationMonths).toBe(4);
    });
  });

  describe('evaluateReportingPeriod Logic', () => {
    const mockBounds = {
      earliestValidDate: '2023-01-02',
      latestValidDate: '2023-12-30',
      totalValidTransactions: 23570,
      actualDurationMonths: 12,
      availableFiscalYears: ['FY23', 'FY24'],
      missingFiscalYears: ['FY25', 'FY26'],
      availableMonthsCount: 12
    };

    it('evaluates ALL_AVAILABLE mode', () => {
      const cov = evaluateReportingPeriod({ mode: 'ALL_AVAILABLE' }, mockBounds);
      expect(cov.effectiveStartDate).toBe('2023-01-02');
      expect(cov.effectiveEndDate).toBe('2023-12-30');
      expect(cov.isFullyCovered).toBe(true);
      expect(cov.selectedPeriodLabel).toContain('02 Jan 2023 – 30 Dec 2023');
    });

    it('evaluates LAST_12_MONTHS mode with full coverage', () => {
      const cov = evaluateReportingPeriod({ mode: 'LAST_12_MONTHS' }, mockBounds);
      expect(cov.effectiveEndDate).toBe('2023-12-30');
      expect(cov.selectedDurationMonths).toBe(12);
      expect(cov.isFullyCovered).toBe(true);

      const partialBounds = { ...mockBounds, actualDurationMonths: 6 };
      const covPartial = evaluateReportingPeriod({ mode: 'LAST_12_MONTHS' }, partialBounds);
      expect(covPartial.isFullyCovered).toBe(false);
      expect(covPartial.isInsufficientHistory).toBe(true);
      expect(covPartial.coverageDisclosure).toContain('Available history: approximately 6 months');
    });

    it('handles rolling start date across year boundary (startMo <= 0)', () => {
      const covRolling = evaluateReportingPeriod(
        { mode: 'LAST_24_MONTHS' },
        { ...mockBounds, latestValidDate: '2023-01-15' }
      );
      expect(covRolling.effectiveEndDate).toBe('2023-01-15');
    });

    it('discloses insufficient history when user selects LAST_36_MONTHS on 12-month dataset', () => {
      const cov = evaluateReportingPeriod({ mode: 'LAST_36_MONTHS' }, mockBounds);
      expect(cov.selectedDurationMonths).toBe(36);
      expect(cov.isFullyCovered).toBe(false);
      expect(cov.isInsufficientHistory).toBe(true);
      expect(cov.coverageDisclosure).toContain('Missing 24 months of historical coverage');
    });

    it('discloses insufficient history for LAST_24_MONTHS', () => {
      const cov = evaluateReportingPeriod({ mode: 'LAST_24_MONTHS' }, mockBounds);
      expect(cov.selectedDurationMonths).toBe(24);
      expect(cov.isFullyCovered).toBe(false);
      expect(cov.coverageDisclosure).toContain('Missing 12 months');
    });

    it('evaluates FINANCIAL_YEAR mode and discloses partial boundaries', () => {
      const cov = evaluateReportingPeriod({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY24' }, mockBounds);
      expect(cov.effectiveStartDate).toBe('2023-04-01');
      expect(cov.effectiveEndDate).toBe('2024-03-31');
      expect(cov.coverageDisclosure).toContain('coverage in dataset: 01 Apr 2023 – 30 Dec 2023');

      // Test dataset that fully spans the FY boundaries
      const fullSpanBounds = {
        ...mockBounds,
        earliestValidDate: '2023-01-01',
        latestValidDate: '2024-05-01'
      };
      const covFull = evaluateReportingPeriod({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY24' }, fullSpanBounds);
      expect(covFull.isFullyCovered).toBe(true);
      expect(covFull.coverageDisclosure).toBeUndefined();

      // Test dataset where earliest date is before FY start, but latest is before FY end
      const earlyStartBounds = {
        ...mockBounds,
        earliestValidDate: '2023-03-01',
        latestValidDate: '2023-12-31'
      };
      const covEarly = evaluateReportingPeriod({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY24' }, earlyStartBounds);
      expect(covEarly.isFullyCovered).toBe(false);
      expect(covEarly.coverageDisclosure).toContain('01 Apr 2023 – 31 Dec 2023');

      // Test dataset where earliest date is after FY start date
      const lateStartBounds = {
        ...mockBounds,
        earliestValidDate: '2023-06-01',
        latestValidDate: '2024-05-01'
      };
      const covLate = evaluateReportingPeriod({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY24' }, lateStartBounds);
      expect(covLate.isFullyCovered).toBe(false);
      expect(covLate.coverageDisclosure).toContain('01 Jun 2023 – 31 Mar 2024');

      const covMissing = evaluateReportingPeriod({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY26' }, mockBounds);
      expect(covMissing.isFullyCovered).toBe(false);
      expect(covMissing.coverageDisclosure).toContain('FY26 is not present in the uploaded dataset');
    });

    it('tests computeRollingStartDate with month wrap and invalid input', () => {
      expect(computeRollingStartDate('2024-03-15', 5)).toBe('2023-10-15');
      expect(computeRollingStartDate('invalid-date', 12)).toBe('invalid-date');
    });

    it('evaluates CUSTOM mode with boundary checking', () => {
      const covIn = evaluateReportingPeriod({
        mode: 'CUSTOM',
        customStartDate: '2023-03-01',
        customEndDate: '2023-09-30'
      }, mockBounds);
      expect(covIn.effectiveStartDate).toBe('2023-03-01');
      expect(covIn.effectiveEndDate).toBe('2023-09-30');
      expect(covIn.isFullyCovered).toBe(true);

      const covOut = evaluateReportingPeriod({
        mode: 'CUSTOM',
        customStartDate: '2022-01-01',
        customEndDate: '2023-12-30'
      }, mockBounds);
      expect(covOut.isFullyCovered).toBe(false);
      expect(covOut.coverageDisclosure).toContain('Selected custom range extends beyond available dataset history');
    });

    it('handles empty bounds in evaluateReportingPeriod', () => {
      const emptyBounds = calculateDatasetPeriodBounds([]);
      const cov = evaluateReportingPeriod({ mode: 'ALL_AVAILABLE' }, emptyBounds);
      expect(cov.isInsufficientHistory).toBe(true);
      expect(cov.selectedPeriodLabel).toBe('No Data Available');
    });
  });

  describe('isDateWithinCoverage check', () => {
    const coverage = evaluateReportingPeriod(
      { mode: 'ALL_AVAILABLE' },
      {
        earliestValidDate: '2023-01-02',
        latestValidDate: '2023-12-30',
        totalValidTransactions: 100,
        actualDurationMonths: 12,
        availableFiscalYears: ['FY23', 'FY24'],
        missingFiscalYears: [],
        availableMonthsCount: 12
      }
    );

    it('correctly filters transactions inside and outside period', () => {
      expect(isDateWithinCoverage('2023-01-02', coverage)).toBe(true);
      expect(isDateWithinCoverage('2023-06-15', coverage)).toBe(true);
      expect(isDateWithinCoverage('2023-12-30', coverage)).toBe(true);
      expect(isDateWithinCoverage('2022-12-31', coverage)).toBe(false);
      expect(isDateWithinCoverage('2024-01-01', coverage)).toBe(false);
      expect(isDateWithinCoverage('', coverage)).toBe(false);
      expect(isDateWithinCoverage(null, coverage)).toBe(false);
      expect(isDateWithinCoverage('invalid', coverage)).toBe(false);
    });
  });
});
