import type { YahooFinanceFXRate, CurrencyConversionResult } from '../utils/currencyConverter';
import { yahooFinanceFXRates, getYahooFinanceRateToINR, convertToINR } from '../utils/currencyConverter';

export function getAllFXRates(): Record<string, YahooFinanceFXRate> {
  return yahooFinanceFXRates;
}

export function getFXRate(currency: string, year?: number): number {
  return getYahooFinanceRateToINR(currency, year);
}

export function convertAmount(amount: number, fromCurrency: string, year?: number): CurrencyConversionResult {
  return convertToINR(amount, fromCurrency, year);
}
