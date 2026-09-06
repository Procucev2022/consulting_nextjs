import { describe, it, expect } from 'vitest';
import {
  yahooFinanceFXRates,
  getYahooFinanceRateToINR,
  convertToINR,
  formatINRInCrores,
  formatINRAmount,
  calculateLineItemSpend,
  calculateTotalSpendFromFile
} from '../../src/utils/currencyConverter';

describe('currencyConverter utility', () => {
  it('should have rates defined for supported currencies', () => {
    expect(yahooFinanceFXRates.USD).toBeDefined();
    expect(yahooFinanceFXRates.EUR).toBeDefined();
    expect(yahooFinanceFXRates.GBP).toBeDefined();
    expect(yahooFinanceFXRates.AED).toBeDefined();
    expect(yahooFinanceFXRates.JPY).toBeDefined();
    expect(yahooFinanceFXRates.SGD).toBeDefined();
    expect(yahooFinanceFXRates.INR).toBeDefined();
  });

  describe('getYahooFinanceRateToINR', () => {
    it('should return historical rates for specific years', () => {
      expect(getYahooFinanceRateToINR('USD', 2023)).toBe(82.60);
      expect(getYahooFinanceRateToINR('USD', 2024)).toBe(83.50);
      expect(getYahooFinanceRateToINR('USD', 2025)).toBe(84.80);
      expect(getYahooFinanceRateToINR('USD', 2026)).toBe(86.50);
    });

    it('should return currentRate if year is undefined or not 2023-2026', () => {
      expect(getYahooFinanceRateToINR('USD')).toBe(83.80);
      expect(getYahooFinanceRateToINR('USD', 2020)).toBe(83.80);
    });

    it('should handle case insensitivity and whitespace', () => {
      expect(getYahooFinanceRateToINR('  eur  ', 2024)).toBe(90.80);
      expect(getYahooFinanceRateToINR('gbp', 2023)).toBe(102.80);
    });

    it('should fallback to 83.80 if currency not found', () => {
      expect(getYahooFinanceRateToINR('UNKNOWN_CURRENCY')).toBe(83.80);
    });

    it('should default to USD if fromCurrency is empty string or undefined', () => {
      expect(getYahooFinanceRateToINR('', 2024)).toBe(83.50);
      // @ts-ignore
      expect(getYahooFinanceRateToINR(undefined, 2024)).toBe(83.50);
    });
  });

  describe('convertToINR', () => {
    it('should convert USD to INR and format crores', () => {
      const result = convertToINR(1000000, 'USD', 2024);
      expect(result.fxRateUsed).toBe(83.50);
      expect(result.amountINR).toBe(83500000);
      expect(result.inrCrores).toBe(8.35);
      expect(result.croresStr).toBe('₹8.35 Cr');
      expect(result.yahooTicker).toBe('USDINR=X');
    });

    it('should fallback yahooTicker to USDINR=X for unknown currency', () => {
      const result = convertToINR(100, 'XYZ');
      expect(result.yahooTicker).toBe('USDINR=X');
    });

    it('should handle empty or undefined fromCurrency', () => {
      // @ts-ignore
      const result = convertToINR(100, undefined);
      expect(result.yahooTicker).toBe('USDINR=X');
    });
  });

  describe('formatINRInCrores', () => {
    it('should format amounts in crores with default and custom decimals', () => {
      expect(formatINRInCrores(10000000)).toBe('₹1.00 Cr');
      expect(formatINRInCrores(25450000, 3)).toBe('₹2.545 Cr');
    });
  });

  describe('formatINRAmount', () => {
    it('should format >= 1 Crore', () => {
      expect(formatINRAmount(15000000)).toBe('₹1.50 Cr');
      expect(formatINRAmount(-15000000)).toBe('₹-1.50 Cr');
    });

    it('should format >= 1 Lakh and < 1 Crore', () => {
      expect(formatINRAmount(550000)).toBe('₹5.50 L');
      expect(formatINRAmount(-550000)).toBe('₹-5.50 L');
    });

    it('should format amounts < 1 Lakh using standard locale format', () => {
      expect(formatINRAmount(45000)).toBe('₹45,000');
    });
  });

  describe('calculateLineItemSpend', () => {
    it('should calculate line item spend in INR and Crores', () => {
      const res = calculateLineItemSpend(100, 50, 'USD', 2024);
      expect(res.orderQuantity).toBe(100);
      expect(res.netPrice).toBe(50);
      expect(res.subtotalRaw).toBe(5000);
      expect(res.amountINR).toBe(5000 * 83.50);
      expect(res.currency).toBe('USD');
      expect(res.formattedCrores).toBe(`₹${(res.amountINR / 10000000).toFixed(2)} Cr`);
    });

    it('should handle invalid or falsy numbers gracefully', () => {
      // @ts-ignore
      const res = calculateLineItemSpend(null, undefined, '');
      expect(res.orderQuantity).toBe(0);
      expect(res.netPrice).toBe(0);
      expect(res.subtotalRaw).toBe(0);
      expect(res.currency).toBe('USD');
    });
  });

  describe('calculateTotalSpendFromFile', () => {
    it('should compute cumulative total spend across line items', () => {
      const items = [
        { order_quantity: 10, net_price: 100, raw_currency: 'USD', spend_year: 2024 },
        { order_quantity: 5, net_price: 200, raw_currency: 'EUR', spend_year: 2024 }
      ];
      const result = calculateTotalSpendFromFile(items);
      const expectedINR = Math.round(10 * 100 * 83.50 + 5 * 200 * 90.80);
      expect(result.totalSpendINR).toBe(expectedINR);
      expect(result.lineItemCount).toBe(2);
      expect(result.formattedTotalSpendCrores).toBe(`₹${(expectedINR / 10000000).toFixed(2)} Cr`);
    });

    it('should use default quantity 1 and amount fallback when fields are omitted', () => {
      const items = [
        { amount: 500 }
      ];
      const result = calculateTotalSpendFromFile(items);
      expect(result.totalSpendINR).toBe(Math.round(1 * 500 * 83.80));
      expect(result.lineItemCount).toBe(1);
    });

    it('should handle item without amount or net_price', () => {
      const items = [{}];
      const result = calculateTotalSpendFromFile(items);
      expect(result.totalSpendINR).toBe(0);
    });
  });
});
