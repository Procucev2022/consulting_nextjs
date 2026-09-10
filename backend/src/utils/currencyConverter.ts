import type {
  YahooFinanceFXRate,
  CurrencyConversionResult,
  LineItemSpendResult,
  SpendLineItemInput,
  TotalSpendResult
} from '../types';
import {
  yahooFinanceFXRates,
  yahooFinanceHistoricalMonthlyRates,
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

export interface ParsedDateInfo {
  year?: number;
  monthKey?: string;
  formattedDate?: string;
}

function parseNumericDate(val: number): ParsedDateInfo {
  if (val >= 1900 && val <= 2100) {
    return { year: val, formattedDate: `${val}` };
  }
  if (val > 30000 && val < 60000) {
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return { year: y, monthKey: `${y}-${m}`, formattedDate: `${y}-${m}-${day}` };
  }
  return { year: 2024 };
}

function parseStringDate(str: string): ParsedDateInfo {
  const trimmed = str.trim();
  if (/^\d{4}$/.test(trimmed)) {
    const y = parseInt(trimmed, 10);
    return { year: y, formattedDate: `${y}` };
  }
  const matchIso = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (matchIso) {
    const y = parseInt(matchIso[1], 10);
    const m = String(parseInt(matchIso[2], 10)).padStart(2, '0');
    const day = matchIso[3] ? String(parseInt(matchIso[3], 10)).padStart(2, '0') : '01';
    return { year: y, monthKey: `${y}-${m}`, formattedDate: `${y}-${m}-${day}` };
  }
  const matchDmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (matchDmy) {
    const day = String(parseInt(matchDmy[1], 10)).padStart(2, '0');
    const m = String(parseInt(matchDmy[2], 10)).padStart(2, '0');
    const y = parseInt(matchDmy[3], 10);
    return { year: y, monthKey: `${y}-${m}`, formattedDate: `${y}-${m}-${day}` };
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return { year: y, monthKey: `${y}-${m}`, formattedDate: `${y}-${m}-${day}` };
  }
  return {};
}

/**
 * Parse any date input (string, number, Date) into year, YYYY-MM monthKey, and standard formattedDate
 */
export function parseDateOrYear(dateOrYear?: string | number | Date): ParsedDateInfo {
  if (!dateOrYear) return {};
  if (typeof dateOrYear === 'number') return parseNumericDate(dateOrYear);
  if (typeof dateOrYear === 'string') return parseStringDate(dateOrYear);
  if (dateOrYear instanceof Date && !isNaN(dateOrYear.getTime())) {
    const y = dateOrYear.getUTCFullYear();
    const m = String(dateOrYear.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dateOrYear.getUTCDate()).padStart(2, '0');
    return { year: y, monthKey: `${y}-${m}`, formattedDate: `${y}-${m}-${day}` };
  }
  return {};
}

function getYearlyRate(fxObj: (typeof yahooFinanceFXRates)[string], year: number): number {
  if (year === 2023) return fxObj.rate2023;
  if (year === 2024) return fxObj.rate2024;
  if (year === 2025) return fxObj.rate2025;
  if (year === 2026) return fxObj.rate2026;
  return fxObj.currentRate;
}

/**
 * Get the Yahoo Finance exchange rate to INR for a specific currency and transaction date or year
 */
export function getYahooFinanceRateToINR(fromCurrency: string, dateOrYear?: string | number | Date): number {
  const curr = (fromCurrency || 'USD').toUpperCase().trim();
  const fxObj = yahooFinanceFXRates[curr];
  if (!fxObj) return 83.80;

  const { year, monthKey } = parseDateOrYear(dateOrYear);
  if (monthKey && yahooFinanceHistoricalMonthlyRates[curr]?.[monthKey] !== undefined) {
    return yahooFinanceHistoricalMonthlyRates[curr][monthKey];
  }
  if (year) return getYearlyRate(fxObj, year);
  return fxObj.currentRate;
}

/**
 * Get detailed Yahoo Finance exchange rate info as on a specific transaction date
 */
export function getYahooFinanceRateAsOfDate(
  fromCurrency: string,
  dateOrYear?: string | number | Date
): {
  rate: number;
  dateStr: string;
  ticker: string;
  currency: string;
  isHistorical: boolean;
} {
  const curr = (fromCurrency || 'USD').toUpperCase().trim();
  const fxObj = yahooFinanceFXRates[curr] || yahooFinanceFXRates.USD;
  const { year, monthKey, formattedDate } = parseDateOrYear(dateOrYear);

  let rate = fxObj.currentRate;
  let isHistorical = false;
  const dateStr = formattedDate || (year ? String(year) : 'Current Live Quote');

  if (monthKey && yahooFinanceHistoricalMonthlyRates[curr]?.[monthKey] !== undefined) {
    rate = yahooFinanceHistoricalMonthlyRates[curr][monthKey];
    isHistorical = true;
  } else if (year) {
    rate = getYearlyRate(fxObj, year);
    isHistorical = true;
  }

  return {
    rate,
    dateStr,
    ticker: fxObj.ticker,
    currency: curr,
    isHistorical
  };
}

/**
 * Convert any multi-currency amount to INR based on historical Yahoo Finance rate as on transaction date
 */
export function convertToINR(
  amount: number,
  fromCurrency: string,
  dateOrYear?: string | number | Date
): CurrencyConversionResult {
  const rateInfo = getYahooFinanceRateAsOfDate(fromCurrency, dateOrYear);
  const amountINR = Math.round(amount * rateInfo.rate);
  const inrCrores = amountINR / INR_CRORES_DIVISOR;
  const croresStr = `₹${inrCrores.toFixed(2)} Cr`;

  return {
    amountINR,
    inrCrores,
    croresStr,
    fxRateUsed: rateInfo.rate,
    yahooTicker: rateInfo.ticker,
    transactionDate: rateInfo.dateStr,
    effectiveDate: rateInfo.dateStr
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
 * Line Item Total = Order Quantity * Net Price * Currency in INR (as on transaction date)
 */
export function calculateLineItemSpend(
  orderQuantity: number,
  netPrice: number,
  currency: string,
  dateOrYear?: string | number | Date
): LineItemSpendResult {
  const qty = Number(orderQuantity) || 0;
  const price = Number(netPrice) || 0;
  const subtotalRaw = qty * price;
  const rateInfo = getYahooFinanceRateAsOfDate(currency, dateOrYear);
  const amountINR = Math.round(qty * price * rateInfo.rate);
  const inrCrores = amountINR / INR_CRORES_DIVISOR;
  const formattedCrores = `₹${inrCrores.toFixed(2)} Cr`;

  return {
    orderQuantity: qty,
    netPrice: price,
    subtotalRaw,
    currency: rateInfo.currency,
    fxRateToINR: rateInfo.rate,
    amountINR,
    inrCrores,
    formattedCrores,
    transactionDate: rateInfo.dateStr,
    effectiveDate: rateInfo.dateStr
  };
}

/**
 * Calculate Cumulative Total Spend from File by summing all line items:
 * Total Spend = SUM(Order Quantity * Net Price * Currency in INR as on transaction date)
 */
export function calculateTotalSpendFromFile(
  items: SpendLineItemInput[]
): TotalSpendResult {
  let totalINR = 0;
  items.forEach((item) => {
    const qty = item.order_quantity !== undefined ? item.order_quantity : 1;
    const price = item.net_price !== undefined ? item.net_price : (item.amount || 0);
    const curr = item.raw_currency || 'USD';
    const dateOrYear = item.transaction_date || item.spend_year;
    const fx = getYahooFinanceRateToINR(curr, dateOrYear);
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
