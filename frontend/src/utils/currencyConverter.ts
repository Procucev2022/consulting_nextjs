import type {
  YahooFinanceFXRate,
  CurrencyConversionResult,
  LineItemSpendResult,
  SpendLineItemInput,
  TotalSpendResult
} from '../types';
import {
  yahooFinanceFXRates,
  INR_CRORES_DIVISOR
} from '../constants';

export type {
  YahooFinanceFXRate,
  CurrencyConversionResult,
  LineItemSpendResult,
  SpendLineItemInput,
  TotalSpendResult
};
export { yahooFinanceFXRates };


/**
 * Get the Yahoo Finance exchange rate to INR for a specific currency and transaction year
 */
export function getYahooFinanceRateToINR(fromCurrency: string, year?: number): number {
  const curr = (fromCurrency || 'USD').toUpperCase().trim();
  const fxObj = yahooFinanceFXRates[curr];
  if (!fxObj) return 83.80; // Default fallback to USD rate

  if (year === 2023) return fxObj.rate2023;
  if (year === 2024) return fxObj.rate2024;
  if (year === 2025) return fxObj.rate2025;
  if (year === 2026) return fxObj.rate2026;
  return fxObj.currentRate;
}

/**
 * Convert any multi-currency amount to INR based on historical Yahoo Finance rate
 */
export function convertToINR(amount: number, fromCurrency: string, year?: number): CurrencyConversionResult {
  const fxRateUsed = getYahooFinanceRateToINR(fromCurrency, year);
  const amountINR = Math.round(amount * fxRateUsed);
  const inrCrores = amountINR / INR_CRORES_DIVISOR; // 1 Crore = 10,000,000 INR
  const croresStr = `₹${inrCrores.toFixed(2)} Cr`;
  const curr = (fromCurrency || 'USD').toUpperCase().trim();
  const yahooTicker = yahooFinanceFXRates[curr]?.ticker || 'USDINR=X';

  return {
    amountINR,
    inrCrores,
    croresStr,
    fxRateUsed,
    yahooTicker
  };
}

/**
 * Format any INR amount into standard Crores string (₹ XX.XX Cr)
 */
export function formatINRInCrores(inrAmount: number, decimals: number = 2): string {
  const cr = inrAmount / INR_CRORES_DIVISOR;
  return `₹${cr.toFixed(decimals)} Cr`;
}

/**
 * Dynamic INR Formatter (Crores for >= 1 Cr, Lakhs for >= 1 L, otherwise standard)
 */
export function formatINRAmount(inrAmount: number): string {
  if (Math.abs(inrAmount) >= INR_CRORES_DIVISOR) {
    const cr = inrAmount / INR_CRORES_DIVISOR;
    return `₹${cr.toFixed(2)} Cr`;
  }
  if (Math.abs(inrAmount) >= 100000) {
    const lk = inrAmount / 100000;
    return `₹${lk.toFixed(2)} L`;
  }
  return `₹${Math.round(inrAmount).toLocaleString('en-IN')}`;
}

/**
 * Calculate Line Item Spend in INR using the standard formula:
 * Line Item Total = Order Quantity * Net Price * Currency in INR
 */
export function calculateLineItemSpend(
  orderQuantity: number,
  netPrice: number,
  currency: string,
  year?: number
): LineItemSpendResult {
  const qty = Number(orderQuantity) || 0;
  const price = Number(netPrice) || 0;
  const subtotalRaw = qty * price;
  const fxRateToINR = getYahooFinanceRateToINR(currency, year);
  const amountINR = Math.round(qty * price * fxRateToINR);
  const inrCrores = amountINR / INR_CRORES_DIVISOR;
  const formattedCrores = `₹${inrCrores.toFixed(2)} Cr`;

  return {
    orderQuantity: qty,
    netPrice: price,
    subtotalRaw,
    currency: (currency || 'USD').toUpperCase().trim(),
    fxRateToINR,
    amountINR,
    inrCrores,
    formattedCrores
  };
}

/**
 * Calculate Cumulative Total Spend from File by summing all line items:
 * Total Spend = SUM(Order Quantity * Net Price * Currency in INR)
 */
export function calculateTotalSpendFromFile(
  items: SpendLineItemInput[]
): TotalSpendResult {
  let totalINR = 0;
  items.forEach((item) => {
    const qty = item.order_quantity !== undefined ? item.order_quantity : 1;
    const price = item.net_price !== undefined ? item.net_price : (item.amount || 0);
    const curr = item.raw_currency || 'USD';
    const fx = getYahooFinanceRateToINR(curr, item.spend_year);
    totalINR += qty * price * fx;
  });

  const totalSpendINR = Math.round(totalINR);
  const totalSpendCrores = totalSpendINR / INR_CRORES_DIVISOR;
  return {
    totalSpendINR,
    totalSpendCrores,
    formattedTotalSpendCrores: `₹${totalSpendCrores.toFixed(2)} Cr`,
    lineItemCount: items.length
  };
}
