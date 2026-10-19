import { describe, it, expect } from 'vitest';
import {
  aggregateDatasetRows,
  buildCurrencyForensicDetails
} from '../../src/services/assessmentDatasetAggregator';
import type { ParseOptions } from '../../src/services/assessmentDatasetParser';

describe('assessmentDatasetAggregator Unit Tests', () => {
  const options: ParseOptions = {
    assessmentId: 'AIC-TEST-AGG',
    dataVersionId: 'v1',
    isTestData: true
  };

  it('aggregates valid rows, deleted rows, and anomalies', () => {
    const rawRows = [
      {
        'PO Number': 'PO-101',
        'Vendor': 'Supplier A',
        'Date': '2025-01-10',
        'Net Value': 100000,
        'Currency': 'INR',
        'Deletion Indicator': 'X'
      },
      {
        'PO Number': 'PO-102',
        'Vendor': 'Supplier B',
        'Date': '2025-01-11',
        'Net Value': -200000,
        'Currency': 'INR'
      },
      {
        'PO Number': 'PO-103',
        'Vendor': 'Supplier C',
        'Date': '2025-02-15',
        'Net Value': 500000,
        'Currency': 'USD'
      },
      {
        'PO Number': 'PO-104',
        'Vendor': 'Supplier D',
        'Date': '2025-02-20',
        'Net Value': 300000,
        'Currency': 'INR'
      }
    ];

    const result = aggregateDatasetRows(rawRows, 'dummy.xlsx', options);
    expect(result.excludedRowCount).toBe(1);
    expect(result.anomalyRowCount).toBe(1);
    expect(result.validRows.length).toBe(2);
    expect(result.totalNormalizedInr).toBeGreaterThan(0);
    expect(result.currenciesDetectedSet.size).toBe(2);
  });

  it('builds currency forensic details correctly for synthetic test data', () => {
    const set = new Set(['USD', 'EUR']);
    const stats = {
      USD: { count: 10, rawVal: 100000, normInr: 8500000, fxRate: 85 },
      EUR: { count: 5, rawVal: 50000, normInr: 4500000, fxRate: 90 }
    };

    const details = buildCurrencyForensicDetails(set, stats, true);
    expect(details.currenciesDetected).toEqual(['USD', 'EUR']);
    expect(details.transactionCountByCurrency.USD).toBe(10);
    expect(details.currencyBridges.length).toBe(2);
    expect(details.currencyBridges[0].fxImpactInr).toBe(8500000 - 100000);
  });

  it('builds currency forensic details correctly for production customer data', () => {
    const set = new Set(['INR']);
    const stats = {
      INR: { count: 20, rawVal: 5000000, normInr: 5000000, fxRate: 1 }
    };

    const details = buildCurrencyForensicDetails(set, stats, false);
    expect(details.currenciesDetected).toEqual(['INR']);
    expect(details.currencyBridges[0].fxImpactInr).toBe(0);
    expect(details.customerProfileSpendByCurrency.INR).toBe(5000000);
  });

  it('handles empty currency stats fallback gracefully', () => {
    const set = new Set(['GBP']);
    const stats: Record<string, { count: number; rawVal: number; normInr: number; fxRate: number }> = {};

    const details = buildCurrencyForensicDetails(set, stats, true);
    expect(details.currenciesDetected).toEqual(['GBP']);
    expect(details.transactionCountByCurrency.GBP).toBe(0);
    expect(details.currencyBridges[0].profileRate).toBe(1.0);
  });

  it('safely normalizes currency whitespace and prevents CHF and SGD substitution', () => {
    const rawRows = [
      {
        'PO Number': 'PO-CHF-1',
        'Vendor': 'Swiss Supplier AG',
        'Date': '2025-01-10',
        'Net Value': 1000,
        'Crcy': '  chf  ',
        'CR': 98.49
      },
      {
        'PO Number': 'PO-SGD-1',
        'Vendor': 'Singapore Trader Pte',
        'Date': '2025-01-11',
        'Net Value': 2000,
        'Crcy': '  SGD  ',
        'CR': 62.15
      }
    ];

    const result = aggregateDatasetRows(rawRows, 'currency_test.xlsx', options);
    expect(result.validRows.length).toBe(2);
    expect(result.currenciesDetectedSet.has('CHF')).toBe(true);
    expect(result.currenciesDetectedSet.has('SGD')).toBe(true);
    expect(result.currenciesDetectedSet.has('chf')).toBe(false);
    expect(result.currenciesDetectedSet.has('sgd')).toBe(false);

    // CHF and SGD remain distinct and are never substituted for each other
    expect(result.currencyStats['CHF'].count).toBe(1);
    expect(result.currencyStats['SGD'].count).toBe(1);
    expect(result.currencyStats['CHF'].fxRate).toBe(98.49);
    expect(result.currencyStats['SGD'].fxRate).toBe(62.15);
  });
});
