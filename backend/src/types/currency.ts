/**
 * Currency Conversion Types and Interfaces Module (Backend)
 */

export interface YahooFinanceFXRate {
  ticker: string;
  currencyPair: string;
  currencyCode: string;
  name: string;
  rate2023: number;
  rate2024: number;
  rate2025: number;
  rate2026: number;
  currentRate: number;
  lastUpdated: string;
}

export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'JPY' | 'SGD';

export interface CurrencyConversionResult {
  amountINR: number;
  inrCrores: number;
  croresStr: string;
  fxRateUsed: number;
  yahooTicker: string;
}

export interface LineItemSpendResult {
  orderQuantity: number;
  netPrice: number;
  subtotalRaw: number;
  currency: string;
  fxRateToINR: number;
  amountINR: number;
  inrCrores: number;
  formattedCrores: string;
}

export interface SpendLineItemInput {
  order_quantity?: number;
  net_price?: number;
  raw_currency?: string;
  amount?: number;
  spend_year?: number;
}

export interface TotalSpendResult {
  totalSpendINR: number;
  totalSpendCrores: number;
  formattedTotalSpendCrores: string;
  lineItemCount: number;
}
