import type { YahooFinanceFXRate, CurrencyConversionResult } from '../utils/currencyConverter';
import {
  yahooFinanceFXRates,
  getYahooFinanceRateToINR,
  getYahooFinanceRateAsOfDate,
  convertToINR
} from '../utils/currencyConverter';

let lastLiveFetchTime = 0;
let liveRatesCache: Record<string, number> = {};

export async function refreshLiveFXRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (now - lastLiveFetchTime < 3600000 && Object.keys(liveRatesCache).length > 0) {
    return liveRatesCache;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data: any = await res.json();
      const inrPerUsd = data.rates?.INR || 83.8;
      liveRatesCache = {
        USD: Number(inrPerUsd.toFixed(2)),
        EUR: Number((inrPerUsd / (data.rates?.EUR || 1)).toFixed(2)),
        GBP: Number((inrPerUsd / (data.rates?.GBP || 1)).toFixed(2)),
        AED: Number((inrPerUsd / (data.rates?.AED || 3.6725)).toFixed(2)),
        JPY: Number((inrPerUsd / (data.rates?.JPY || 150)).toFixed(2)),
        SGD: Number((inrPerUsd / (data.rates?.SGD || 1.35)).toFixed(2)),
        INR: 1.0
      };
      lastLiveFetchTime = now;
      for (const [curr, rate] of Object.entries(liveRatesCache)) {
        if (yahooFinanceFXRates[curr]) {
          yahooFinanceFXRates[curr].currentRate = rate;
          yahooFinanceFXRates[curr].lastUpdated = 'Live Global Exchange Market API';
        }
      }
    }
  } catch {
    // Keep cached rates
  }
  return liveRatesCache;
}

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
