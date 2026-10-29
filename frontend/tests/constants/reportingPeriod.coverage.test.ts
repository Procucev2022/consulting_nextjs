import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPORTING_PERIOD_MODE,
  INDIAN_FISCAL_YEAR_END_MONTH,
  INDIAN_FISCAL_YEAR_START_MONTH,
  REPORTING_PERIOD_MODES,
  reportingPeriodSelectionSchema
} from '../../src/constants/reportingPeriod';

const issuesFor = (input: unknown) => {
  const result = reportingPeriodSelectionSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({ code: issue.code, path: issue.path }));
};

describe('reporting period constants', () => {
  it('lists every supported reporting mode in display order', () => {
    expect(REPORTING_PERIOD_MODES).toEqual([
      'ALL_AVAILABLE',
      'LAST_12_MONTHS',
      'LAST_24_MONTHS',
      'LAST_36_MONTHS',
      'CUSTOM',
      'FINANCIAL_YEAR'
    ]);
  });

  it('defaults to all available data on the Indian fiscal calendar (April to March)', () => {
    expect(DEFAULT_REPORTING_PERIOD_MODE).toBe('ALL_AVAILABLE');
    expect(INDIAN_FISCAL_YEAR_START_MONTH).toBe(4);
    expect(INDIAN_FISCAL_YEAR_END_MONTH).toBe(3);
  });
});

describe('reportingPeriodSelectionSchema', () => {
  it.each(['ALL_AVAILABLE', 'LAST_12_MONTHS', 'LAST_24_MONTHS', 'LAST_36_MONTHS'])(
    'accepts the %s mode without custom dates or a fiscal year',
    (mode) => {
      expect(issuesFor({ mode })).toEqual([]);
    }
  );

  it('accepts a custom range whose start and end dates are in order, including a single day', () => {
    expect(
      issuesFor({ mode: 'CUSTOM', customStartDate: '2024-04-01', customEndDate: '2025-03-31' })
    ).toEqual([]);
    expect(
      issuesFor({ mode: 'CUSTOM', customStartDate: '2025-01-15', customEndDate: '2025-01-15' })
    ).toEqual([]);
  });

  it('rejects a custom range that ends before it starts', () => {
    expect(
      issuesFor({ mode: 'CUSTOM', customStartDate: '2025-03-31', customEndDate: '2024-04-01' })
    ).toEqual([{ code: 'custom', path: [] }]);
  });

  it('rejects a custom range that is missing its start or end date', () => {
    expect(issuesFor({ mode: 'CUSTOM', customEndDate: '2025-03-31' })).toEqual([
      { code: 'custom', path: [] }
    ]);
    expect(issuesFor({ mode: 'CUSTOM', customStartDate: '2024-04-01' })).toEqual([
      { code: 'custom', path: [] }
    ]);
  });

  it('accepts a financial year selection that carries a fiscal year code', () => {
    expect(issuesFor({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY25' })).toEqual([]);
  });

  it('rejects a financial year selection without a fiscal year code', () => {
    expect(issuesFor({ mode: 'FINANCIAL_YEAR' })).toEqual([{ code: 'custom', path: [] }]);
  });

  it('rejects dates that do not match the YYYY-MM-DD pattern', () => {
    expect(
      issuesFor({ mode: 'CUSTOM', customStartDate: '2024/04/01', customEndDate: '2025-03-31' })
    ).toContainEqual(expect.objectContaining({ path: ['customStartDate'] }));
  });

  it('rejects a fiscal year code that does not match the FYnn pattern', () => {
    expect(issuesFor({ mode: 'FINANCIAL_YEAR', selectedFiscalYear: 'FY2025' })).toContainEqual(
      expect.objectContaining({ path: ['selectedFiscalYear'] })
    );
  });

  it('rejects a mode outside the supported list', () => {
    expect(issuesFor({ mode: 'WEEKLY' }).length).toBeGreaterThan(0);
  });
});
