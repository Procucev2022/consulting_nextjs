import { yahooFinanceFXRates, getYahooFinanceRateToINR, convertToINR, formatINRInCrores, calculateLineItemSpend, YahooFinanceFXRate } from '../utils/currencyConverter';

export function getAllFXRates(): Record<string, YahooFinanceFXRate> {
  return yahooFinanceFXRates;
}

export function getFXRate(currency: string, year?: number): number {
  return getYahooFinanceRateToINR(currency, year);
}

export function convertAmount(amount: number, fromCurrency: string, year?: number) {
  return convertToINR(amount, fromCurrency, year);
}
