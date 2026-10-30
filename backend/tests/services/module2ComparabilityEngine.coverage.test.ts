/**
 * Coverage tests for Module2ComparabilityEngine.
 * Drives the data-confidence ladder, the modal unit and currency selection, every exclusion reason,
 * the median-based outlier gate, and identifier fallbacks for excluded lines.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComparabilityAnalysisResult } from '../../src/services/module2ComparabilityEngine';
import type { ExcludedTransactionRecord } from '../../src/types/module2StrategicSourcing';
import type { StrategicInputTransaction } from '../../src/types/strategicSourcing';
import { Module2ComparabilityEngine } from '../../src/services/module2ComparabilityEngine';

function purchase(
  id: string,
  unitPrice: number,
  quantity: number,
  overrides: Partial<StrategicInputTransaction> = {}
): StrategicInputTransaction {
  return {
    id,
    po_number: `PO-${id}`,
    vendor_name: 'Tata Steel Ltd',
    material_desc: 'Carbon Steel Plate 10mm',
    quantity,
    uom: 'MT',
    unit_price: unitPrice,
    total_spend_inr: unitPrice * quantity,
    currency: 'INR',
    spend_category: 'Structural Steel',
    ...overrides
  };
}

function excludedRecord(result: ComparabilityAnalysisResult, transactionId: string): ExcludedTransactionRecord {
  const match = result.excludedTransactions.find(record => record.transactionId === transactionId);
  if (!match) {
    throw new Error(`Expected ${transactionId} to be excluded`);
  }
  return match;
}

function comparableIds(result: ComparabilityAnalysisResult): Array<string | undefined> {
  return result.comparableTransactions.map(transaction => transaction.id);
}

describe('Module2ComparabilityEngine.evaluateDataConfidence', () => {
  it('grades HIGH with enough history, supplier breadth and a fully comparable set', () => {
    const result = Module2ComparabilityEngine.evaluateDataConfidence(6, 3, 5, 0);

    expect(result.dataConfidence).toBe('HIGH');
    expect(result.confidenceRationale).toContain('6 months history, 3 suppliers');
  });

  it('drops to MEDIUM when any transaction is excluded', () => {
    const result = Module2ComparabilityEngine.evaluateDataConfidence(6, 3, 5, 1);

    expect(result.dataConfidence).toBe('MEDIUM');
    expect(result.confidenceRationale).toContain('5 comparable transactions across 3 suppliers');
  });

  it('drops to MEDIUM when history is shorter than six months', () => {
    expect(Module2ComparabilityEngine.evaluateDataConfidence(5, 3, 5, 0).dataConfidence).toBe('MEDIUM');
  });

  it('drops to MEDIUM when fewer than three suppliers are active', () => {
    expect(Module2ComparabilityEngine.evaluateDataConfidence(6, 2, 5, 0).dataConfidence).toBe('MEDIUM');
  });

  it('drops to MEDIUM when fewer than five transactions are comparable', () => {
    expect(Module2ComparabilityEngine.evaluateDataConfidence(6, 3, 4, 0).dataConfidence).toBe('MEDIUM');
  });

  it('grades MEDIUM with two comparable transactions across two suppliers', () => {
    expect(Module2ComparabilityEngine.evaluateDataConfidence(1, 2, 2, 3).dataConfidence).toBe('MEDIUM');
  });

  it('grades LOW when comparable transactions exist but do not span two suppliers', () => {
    const result = Module2ComparabilityEngine.evaluateDataConfidence(1, 1, 3, 0);

    expect(result.dataConfidence).toBe('LOW');
    expect(result.confidenceRationale).toContain('(3)');
  });

  it('grades LOW with a single comparable transaction', () => {
    expect(Module2ComparabilityEngine.evaluateDataConfidence(1, 1, 1, 2).dataConfidence).toBe('LOW');
  });

  it('grades INSUFFICIENT when no transaction is comparable', () => {
    const result = Module2ComparabilityEngine.evaluateDataConfidence(12, 5, 0, 4);

    expect(result.dataConfidence).toBe('INSUFFICIENT');
    expect(result.confidenceRationale).toContain('Insufficient data');
  });
});

describe('Module2ComparabilityEngine.evaluateComparability units, currency and spend', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty result when no transactions are supplied', () => {
    const expected = {
      comparableTransactions: [],
      partiallyComparableTransactions: [],
      excludedTransactions: [],
      primaryUom: 'EA',
      primaryCurrency: 'INR',
      totalTransactionsCount: 0,
      comparableSpendInr: 0,
      comparableQuantity: 0
    };

    expect(Module2ComparabilityEngine.evaluateComparability()).toEqual(expected);
    expect(Module2ComparabilityEngine.evaluateComparability([])).toEqual(expected);
  });

  it('keeps a consistent set comparable and totals only comparable spend and quantity', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 100, 10, { uom: 'EA' }),
      purchase('TX-2', 110, 10, { uom: 'EA' }),
      purchase('TX-3', 120, 10, { uom: undefined, currency: undefined })
    ]);

    expect(comparableIds(result)).toEqual(['TX-1', 'TX-2', 'TX-3']);
    expect(result.excludedTransactions).toEqual([]);
    expect(result).toMatchObject({
      primaryUom: 'EA',
      primaryCurrency: 'INR',
      totalTransactionsCount: 3,
      comparableSpendInr: 3300,
      comparableQuantity: 30
    });
  });

  it('excludes a line whose unit differs from the modal unit of measure', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 100, 10, { uom: 'MT' }),
      purchase('TX-2', 100, 10, { uom: 'mt ' }),
      purchase('TX-3', 100, 10, { uom: 'KG' })
    ]);

    expect(result.primaryUom).toBe('MT');
    expect(excludedRecord(result, 'TX-3').reasons).toEqual(['UNIT_MISMATCH']);
    expect(excludedRecord(result, 'TX-3').explanation).toContain("'KG'");
    expect(comparableIds(result)).toEqual(['TX-1', 'TX-2']);
  });

  it('breaks a unit-of-measure tie in favour of the unit seen first', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 100, 10, { uom: 'EA' }),
      purchase('TX-2', 100, 10, { uom: 'MT' })
    ]);

    expect(result.primaryUom).toBe('EA');
    expect(excludedRecord(result, 'TX-2').reasons).toEqual(['UNIT_MISMATCH']);
  });

  it('excludes a line in a different currency from the primary currency', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 100, 10),
      purchase('TX-2', 100, 10, { currency: 'USD' }),
      purchase('TX-3', 100, 10)
    ]);

    expect(result.primaryCurrency).toBe('INR');
    expect(excludedRecord(result, 'TX-2').reasons).toEqual(['CURRENCY_MISMATCH']);
  });

  it('breaks a currency tie in favour of the currency seen first', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 100, 10, { currency: 'USD' }),
      purchase('TX-2', 100, 10)
    ]);

    expect(result.primaryCurrency).toBe('USD');
    expect(excludedRecord(result, 'TX-2').reasons).toEqual(['CURRENCY_MISMATCH']);
  });

  it('excludes zero, negative and non-numeric prices as invalid', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-OK', 100, 10),
      purchase('TX-ZERO', 0, 10, { total_spend_inr: 0 }),
      purchase('TX-NEG', -50, 10, { total_spend_inr: -500 }),
      purchase('TX-NAN', Number.NaN, 10, { total_spend_inr: 1000 })
    ]);

    expect(excludedRecord(result, 'TX-ZERO').reasons).toEqual(['INVALID_PRICE']);
    expect(excludedRecord(result, 'TX-NEG').reasons).toEqual(['INVALID_PRICE']);
    expect(excludedRecord(result, 'TX-NAN').reasons).toEqual(['INVALID_PRICE']);
    expect(comparableIds(result)).toEqual(['TX-OK']);
  });

  it('excludes zero and non-numeric quantities as missing', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-OK', 100, 10),
      purchase('TX-QZERO', 100, 0, { total_spend_inr: 0 }),
      purchase('TX-QNAN', 100, Number.NaN, { total_spend_inr: 500 })
    ]);

    expect(excludedRecord(result, 'TX-QZERO').reasons).toEqual(['MISSING_QUANTITY']);
    expect(excludedRecord(result, 'TX-QNAN').reasons).toEqual(['MISSING_QUANTITY']);
  });

  it('reports both reasons and joins the explanations when price and quantity are both invalid', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-OK', 100, 10),
      purchase('TX-BOTH', 0, 0, { total_spend_inr: 0 })
    ]);
    const record = excludedRecord(result, 'TX-BOTH');

    expect(record.reasons).toEqual(['INVALID_PRICE', 'MISSING_QUANTITY']);
    expect(record.explanation.split('; ')).toHaveLength(2);
  });

  it('flags prices above four times, or below half, the median as obvious outliers', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-LOW', 30, 10),
      purchase('TX-M1', 100, 10),
      purchase('TX-M2', 100, 10),
      purchase('TX-M3', 100, 10),
      purchase('TX-M4', 100, 10),
      purchase('TX-HIGH', 1000, 10)
    ]);

    expect(excludedRecord(result, 'TX-LOW').reasons).toEqual(['OBVIOUS_OUTLIER']);
    expect(excludedRecord(result, 'TX-HIGH').reasons).toEqual(['OBVIOUS_OUTLIER']);
    expect(comparableIds(result)).toEqual(['TX-M1', 'TX-M2', 'TX-M3', 'TX-M4']);
  });

  it('uses the mean of the two middle prices as the outlier median for an even count', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-LOW-1', 50, 10),
      purchase('TX-LOW-2', 60, 10),
      purchase('TX-HIGH-1', 200, 10),
      purchase('TX-HIGH-2', 210, 10)
    ]);

    expect(excludedRecord(result, 'TX-LOW-1').reasons).toEqual(['OBVIOUS_OUTLIER']);
    expect(excludedRecord(result, 'TX-LOW-2').reasons).toEqual(['OBVIOUS_OUTLIER']);
    expect(comparableIds(result)).toEqual(['TX-HIGH-1', 'TX-HIGH-2']);
  });

  it('does not run the outlier test on a zero-priced line that is already invalid', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-ZERO', 0, 10, { total_spend_inr: 0 }),
      purchase('TX-A', 100, 10),
      purchase('TX-B', 100, 10)
    ]);

    expect(excludedRecord(result, 'TX-ZERO').reasons).toEqual(['INVALID_PRICE']);
    expect(comparableIds(result)).toEqual(['TX-A', 'TX-B']);
  });

  it('skips the median and outlier checks when no line carries a positive price', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 0, 10, { total_spend_inr: 0 }),
      purchase('TX-2', 0, 10, { total_spend_inr: 0 })
    ]);

    expect(result.comparableTransactions).toEqual([]);
    expect(result.excludedTransactions.map(record => record.reasons)).toEqual([['INVALID_PRICE'], ['INVALID_PRICE']]);
  });

  it('values comparable lines from price times quantity when the recorded spend is zero', () => {
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-1', 200, 5, { total_spend_inr: 0 }),
      purchase('TX-2', 200, 5)
    ]);

    expect(result.comparableTransactions).toHaveLength(2);
    expect(result.comparableSpendInr).toBe(2000);
    expect(result.comparableQuantity).toBe(10);
  });

  it('builds identifiers and labels for excluded lines that lack them', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    const result = Module2ComparabilityEngine.evaluateComparability([
      purchase('TX-OK', 100, 10),
      { vendor_name: '', material_desc: '', quantity: 10, unit_price: 0, total_spend_inr: 0, uom: 'MT' },
      {
        po_number: 'PO-77',
        vendor_name: 'Tata Steel Ltd',
        material_desc: 'Carbon Steel Plate 10mm',
        quantity: 10,
        unit_price: 0,
        total_spend_inr: 0,
        uom: 'MT'
      },
      purchase('TX-KEEP', 0, 10, { total_spend_inr: 0 })
    ]);

    expect(result.excludedTransactions.map(record => record.transactionId)).toEqual([
      'TX-UNKNOWN-1700000000000',
      'TX-PO-77-1700000000000',
      'TX-KEEP'
    ]);
    expect(result.excludedTransactions[0]).toMatchObject({
      poNumber: 'N/A',
      supplierName: 'UNKNOWN',
      materialDesc: 'N/A',
      unitPrice: 0,
      quantity: 10,
      totalSpendInr: 0
    });
    expect(result.excludedTransactions[1]).toMatchObject({ poNumber: 'PO-77', supplierName: 'Tata Steel Ltd' });
  });
});
