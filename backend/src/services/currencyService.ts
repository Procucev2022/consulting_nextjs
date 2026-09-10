import type { YahooFinanceFXRate, CurrencyConversionResult } from '../utils/currencyConverter';
import {
  yahooFinanceFXRates,
  getYahooFinanceRateToINR,
  getYahooFinanceRateAsOfDate,
  convertToINR
} from '../utils/currencyConverter';

export function getAllFXRates(): Record<string, YahooFinanceFXRate> {
  return yahooFinanceFXRates;
}

export function getFXRate(currency: string, dateOrYear?: string | number | Date): number {
  return getYahooFinanceRateToINR(currency, dateOrYear);
}

export function getFXRateAsOfDate(
  currency: string,
  dateOrYear?: string | number | Date
): {
  rate: number;
  dateStr: string;
  ticker: string;
  currency: string;
  isHistorical: boolean;
} {
  return getYahooFinanceRateAsOfDate(currency, dateOrYear);
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  dateOrYear?: string | number | Date
): CurrencyConversionResult {
  return convertToINR(amount, fromCurrency, dateOrYear);
}
