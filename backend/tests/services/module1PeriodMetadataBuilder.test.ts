import { describe, it, expect } from 'vitest';
import { Module1PeriodMetadataBuilder } from '../../src/services/module1PeriodMetadataBuilder';
import type { VgtMonthlySpendItem } from '../../src/types/module1Canonical';

describe('Module1PeriodMetadataBuilder Unit Tests', () => {
  it('1. correctly maps calendar months to Indian Fiscal Years (Apr-Mar cycle)', () => {
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('2021-04')).toBe('FY22');
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('2021-12')).toBe('FY22');
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('2022-01')).toBe('FY22');
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('2022-03')).toBe('FY22');
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('2022-04')).toBe('FY23');
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('2023-03')).toBe('FY23');
    expect(Module1PeriodMetadataBuilder.getIndianFiscalYear('invalid-key')).toBe('FY22');
  });

  it('2. handles empty monthly spend gracefully with safe fallbacks', () => {
    const meta = Module1PeriodMetadataBuilder.build([]);
    expect(meta.minTransactionDate).toBe('N/A');
    expect(meta.maxTransactionDate).toBe('N/A');
    expect(meta.actualBillingMonths).toBe(0);
    expect(meta.actualFiscalYears).toEqual([]);
    expect(meta.actualMonthKeys).toEqual([]);
    expect(meta.fiscalMonthCoverage).toBe('0 months');
    expect(meta.availableMonthsByFiscalYear).toEqual({});
    expect(meta.missingMonthsByFiscalYear).toEqual({});
    expect(meta.hasMultiYearComparison).toBe(false);
    expect(meta.has36MonthCoverage).toBe(false);
  });

  it('3. builds single-year VGT 10-month metadata (Apr 2021 - Jan 2022) with missing Feb and Mar 2022', () => {
    const vgtMonthKeys = [
      '2021-04', '2021-05', '2021-06', '2021-07', '2021-08',
      '2021-09', '2021-10', '2021-11', '2021-12', '2022-01'
    ];
    const monthLabels = [
      'Apr 2021', 'May 2021', 'Jun 2021', 'Jul 2021', 'Aug 2021',
      'Sep 2021', 'Oct 2021', 'Nov 2021', 'Dec 2021', 'Jan 2022'
    ];

    const monthlyItems: VgtMonthlySpendItem[] = vgtMonthKeys.map((mk, idx) => ({
      monthKey: mk,
      month_key: mk,
      monthLabel: monthLabels[idx],
      month_label: monthLabels[idx],
      fiscalYear: 'FY22',
      records_count: 100,
      spend_inr_cr: 100,
      spendCr: 100
    }));

    const meta = Module1PeriodMetadataBuilder.build(monthlyItems);
    expect(meta.actualBillingMonths).toBe(10);
    expect(meta.actualFiscalYears).toEqual(['FY22']);
    expect(meta.minTransactionDate).toBe('April 2021');
    expect(meta.maxTransactionDate).toBe('January 2022');
    expect(meta.fiscalMonthCoverage).toBe('FY22 | 10 of 12 months available');
    expect(meta.availableMonthsByFiscalYear).toEqual({ FY22: 10 });
    expect(meta.missingMonthsByFiscalYear).toEqual({ FY22: ['February 2022', 'March 2022'] });
    expect(meta.hasMultiYearComparison).toBe(false);
    expect(meta.has36MonthCoverage).toBe(false);
  });

  it('4. builds multi-year dataset metadata correctly', () => {
    const multiItems: VgtMonthlySpendItem[] = [
      { monthKey: '2021-04', monthLabel: 'Apr 2021', month_label: 'Apr 2021', month_key: '2021-04', fiscalYear: 'FY22', records_count: 10, spend_inr_cr: 1, spendCr: 1 },
      { monthKey: '2022-04', monthLabel: 'Apr 2022', month_label: 'Apr 2022', month_key: '2022-04', fiscalYear: 'FY23', records_count: 10, spend_inr_cr: 1, spendCr: 1 }
    ];

    const meta = Module1PeriodMetadataBuilder.build(multiItems);
    expect(meta.actualBillingMonths).toBe(2);
    expect(meta.actualFiscalYears).toEqual(['FY22', 'FY23']);
    expect(meta.hasMultiYearComparison).toBe(true);
    expect(meta.has36MonthCoverage).toBe(false);
    expect(meta.fiscalMonthCoverage).toBe('2 Billing Months');
  });

  it('5. handles 36 months enabling has36MonthCoverage flag', () => {
    const items: VgtMonthlySpendItem[] = [];
    let y = 2021;
    let m = 4;
    for (let i = 0; i < 36; i++) {
      const mStr = String(m).padStart(2, '0');
      const mk = `${y}-${mStr}`;
      items.push({
        monthKey: mk,
        month_key: mk,
        monthLabel: mk,
        month_label: mk,
        fiscalYear: Module1PeriodMetadataBuilder.getIndianFiscalYear(mk),
        records_count: 1,
        spend_inr_cr: 1,
        spendCr: 1
      });
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    const meta = Module1PeriodMetadataBuilder.build(items);
    expect(meta.actualBillingMonths).toBe(36);
    expect(meta.has36MonthCoverage).toBe(true);
    expect(meta.hasMultiYearComparison).toBe(true);
  });

  it('6. handles missing fiscalYear and fallback labels in month spend', () => {
    const items: VgtMonthlySpendItem[] = [
      {
        month_key: '2021-05',
        month_label: 'CustomLabel',
        records_count: 5,
        spend_inr_cr: 10,
        spendCr: 10
      },
      {
        month_key: 'invalid',
        month_label: '',
        records_count: 5,
        spend_inr_cr: 10,
        spendCr: 10
      }
    ];

    const meta = Module1PeriodMetadataBuilder.build(items);
    expect(meta.actualBillingMonths).toBe(2);
    expect(meta.actualFiscalYears.length).toBeGreaterThan(0);
  });
});
