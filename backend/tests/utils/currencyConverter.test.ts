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
  it('should export valid fx rates dictionary', () => {
    expect(yahooFinanceFXRates).toBeDefined();
    expect(yahooFinanceFXRates.USD).toBeDefined();
    expect(yahooFinanceFXRates.USD.ticker).toBe('USDINR=X');
    expect(yahooFinanceFXRates.EUR).toBeDefined();
    expect(yahooFinanceFXRates.GBP).toBeDefined();
    expect(yahooFinanceFXRates.INR.currentRate).toBe(1.0);
  });

  describe('getYahooFinanceRateToINR', () => {
    it('should return 1 for INR for any year', () => {
      expect(getYahooFinanceRateToINR('INR')).toBe(1.0);
      expect(getYahooFinanceRateToINR('INR', 2023)).toBe(1.0);
      expect(getYahooFinanceRateToINR('inr', 2024)).toBe(1.0);
    });

    it('should return correct historical rates for USD', () => {
      expect(getYahooFinanceRateToINR('USD', 2023)).toBe(82.60);
      expect(getYahooFinanceRateToINR('USD', 2024)).toBe(83.50);
      expect(getYahooFinanceRateToINR('USD', 2025)).toBe(84.80);
      expect(getYahooFinanceRateToINR('USD', 2026)).toBe(86.50);
      expect(getYahooFinanceRateToINR('USD')).toBe(83.80);
    });

    it('should return currentRate for unknown years', () => {
      expect(getYahooFinanceRateToINR('USD', 1999)).toBe(83.80);
    });

    it('should fallback to 83.8 for unknown currencies', () => {
      expect(getYahooFinanceRateToINR('XYZ')).toBe(83.80);
    });
  });

  describe('convertToINR', () => {
    it('should convert USD to INR correctly', () => {
      const result = convertToINR(100, 'USD', 2024);
      expect(result.amountINR).toBe(8350);
      expect(result.inrCrores).toBe(0.000835);
      expect(result.croresStr).toBe('₹0.00 Cr');
      expect(result.fxRateUsed).toBe(83.50);
      expect(result.yahooTicker).toBe('USDINR=X');
    });

    it('should convert INR to INR directly', () => {
      const result = convertToINR(10000000, 'INR');
      expect(result.amountINR).toBe(10000000);
      expect(result.inrCrores).toBe(1.0);
      expect(result.fxRateUsed).toBe(1.0);
    });

    it('should fallback to USDINR=X ticker for unknown currency', () => {
      const result = convertToINR(100, 'NON_EXISTENT_CURRENCY');
      expect(result.yahooTicker).toBe('USDINR=X');
    });

    it('should handle zero amounts', () => {
      const result = convertToINR(0, 'EUR');
      expect(result.amountINR).toBe(0);
      expect(result.inrCrores).toBe(0);
    });
  });

  describe('formatINRInCrores', () => {
    it('should format INR amount into standard Crores string', () => {
      expect(formatINRInCrores(12345678)).toBe('₹1.23 Cr');
      expect(formatINRInCrores(12345678, 3)).toBe('₹1.235 Cr');
      expect(formatINRInCrores(0)).toBe('₹0.00 Cr');
    });
  });

  describe('formatINRAmount', () => {
    it('should format Crores for >= 1 Cr', () => {
      expect(formatINRAmount(15000000)).toBe('₹1.50 Cr');
    });

    it('should format Lakhs for >= 1 Lakh and < 1 Cr', () => {
      expect(formatINRAmount(250000)).toBe('₹2.50 L');
    });

    it('should format standard INR for < 1 Lakh', () => {
      const res = formatINRAmount(45000);
      expect(res).toContain('45,000');
    });
  });

  describe('calculateLineItemSpend', () => {
    it('should calculate spend with unit price and quantity', () => {
      const spend = calculateLineItemSpend(10, 100, 'USD', 2024);
      expect(spend.orderQuantity).toBe(10);
      expect(spend.netPrice).toBe(100);
      expect(spend.subtotalRaw).toBe(1000);
      expect(spend.fxRateToINR).toBe(83.50);
      expect(spend.amountINR).toBe(83500);
      expect(spend.inrCrores).toBe(0.00835);
      expect(spend.formattedCrores).toBe('₹0.01 Cr');
    });

    it('should fallback currency to USD when currency is empty', () => {
      const spend = calculateLineItemSpend(10, 50, '');
      expect(spend.currency).toBe('USD');
    });

    it('should handle zero or missing quantity and price', () => {
      const spend = calculateLineItemSpend(0, 0, 'USD');
      expect(spend.subtotalRaw).toBe(0);
      expect(spend.amountINR).toBe(0);
      expect(spend.inrCrores).toBe(0);
    });
  });

  describe('calculateTotalSpendFromFile', () => {
    it('should calculate total spend from file items', () => {
      const items = [
        { order_quantity: 10, net_price: 100, raw_currency: 'USD', spend_year: 2024 },
        { amount: 5000, raw_currency: 'INR' },
        { amount: 3000 }, // missing raw_currency -> USD
        { net_price: undefined, amount: 2000 }, // net_price undefined -> amount fallback
        { order_quantity: undefined, net_price: undefined, amount: undefined } // all undefined -> defaults
      ];
      const res = calculateTotalSpendFromFile(items);
      expect(res.totalSpendINR).toBeGreaterThan(0);
      expect(res.lineItemCount).toBe(5);
      expect(res.formattedTotalSpendCrores).toContain('Cr');
    });
  });
});
