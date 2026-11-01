import { describe, expect, it } from 'vitest';
import { formatINRAmount, formatINRInCrores, parseDateOrYear } from '../../src/utils/currencyConverter';

describe('D1 currency display helpers', () => {
  it('parses date formats without supplying a made-up date for missing or invalid values', () => {
    expect(parseDateOrYear()).toEqual({});
    expect(parseDateOrYear('')).toEqual({});
    expect(parseDateOrYear(2024)).toEqual({ year: 2024, formattedDate: '2024' });
    expect(parseDateOrYear(2024.5)).toEqual({});
    expect(parseDateOrYear('2024')).toEqual({ year: 2024, formattedDate: '2024' });
    expect(parseDateOrYear('2024-05-18')).toEqual({ year: 2024, monthKey: '2024-05', formattedDate: '2024-05-18' });
    expect(parseDateOrYear('18/05/2024')).toEqual({ year: 2024, monthKey: '2024-05', formattedDate: '2024-05-18' });
    expect(parseDateOrYear('2024-13-18')).toEqual({});
    expect(parseDateOrYear('not a date')).toEqual({});
    expect(parseDateOrYear(45430).year).toBe(2024);
    expect(parseDateOrYear(new Date('2024-05-18T23:00:00-05:00')).formattedDate).toBe('2024-05-19');
    expect(parseDateOrYear(new Date(Number.NaN))).toEqual({});
  });

  it('formats crore, lakh, rupee, negative, and non-finite amounts', () => {
    expect(formatINRInCrores(12_500_000, 1)).toBe('₹1.3 Cr');
    expect(formatINRInCrores(Number.NaN)).toBe('₹0.00 Cr');
    expect(formatINRInCrores(12_500_000, -1)).toBe('₹1.25 Cr');
    expect(formatINRAmount(10_000_000)).toBe('₹1.00 Cr');
    expect(formatINRAmount(-120_000)).toBe('₹-1.20 L');
    expect(formatINRAmount(1_234)).toBe('₹1,234');
    expect(formatINRAmount(Number.POSITIVE_INFINITY)).toBe('₹0');
  });
});
