/**
 * Module 2 — Lever 5: Payment Terms Optimisation Calculators
 * Compliant with Rule 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import {
  PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS,
  DAYS_IN_STANDARD_YEAR,
  STANDARD_CREDIT_INTERVAL_DAYS
} from '../constants/module2PaymentTerms';
import type {
  PaymentTermsDataAvailabilityStatus,
  PaymentTermsDataGapReason
} from '../types/module2PaymentTerms';

export interface ParsedPaymentTermResult {
  rawTerms: string;
  creditDays: number;
  hasDiscount: boolean;
  discountPct?: number;
  discountDays?: number;
  isParsed: boolean;
  status: PaymentTermsDataAvailabilityStatus;
  gapReason?: PaymentTermsDataGapReason;
  gapDetails?: string;
}

export class Module2PaymentTermsCalculators {
  /**
   * Linear pro-rata financing benefit calculation per Prompt 448 Section B:
   * Indicative Annual Financing Benefit = Eligible Purchases * 1.5% * (Additional Credit Days / 30)
   * Strictly linear, non-compounded.
   */
  public static calculateIndicativeFinancingBenefit(
    eligibleAnnualPurchasesInr: number,
    additionalCreditDays: number,
    ratePer30Days: number = PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS
  ): number {
    if (eligibleAnnualPurchasesInr <= 0 || additionalCreditDays <= 0 || ratePer30Days <= 0) {
      return 0.0;
    }
    const daysFactor = additionalCreditDays / STANDARD_CREDIT_INTERVAL_DAYS;
    const benefit = eligibleAnnualPurchasesInr * ratePer30Days * daysFactor;
    return Math.round(benefit * 100) / 100;
  }

  /**
   * Working capital released calculation per Prompt 448 Section C:
   * Indicative Working Capital Released = Eligible Purchases / 365 * Additional Credit Days
   * Strictly segregated from financing benefits.
   */
  public static calculateWorkingCapitalReleased(
    eligibleAnnualPurchasesInr: number,
    additionalCreditDays: number
  ): number {
    if (eligibleAnnualPurchasesInr <= 0 || additionalCreditDays <= 0) {
      return 0.0;
    }
    const released = (eligibleAnnualPurchasesInr / DAYS_IN_STANDARD_YEAR) * additionalCreditDays;
    return Math.round(released * 100) / 100;
  }

  /**
   * Annualized yield from early payment discounts (e.g. 2/10 Net 30).
   * Segregated to avoid double-counting with payment-term extension.
   */
  public static calculateEarlyPaymentDiscount(
    spendInr: number,
    discountPct: number,
    discountDays: number,
    netCreditDays: number
  ): { cashDiscountInr: number; annualizedYieldPct: number } {
    if (spendInr <= 0 || discountPct <= 0 || discountDays >= netCreditDays) {
      return { cashDiscountInr: 0, annualizedYieldPct: 0 };
    }
    const cashDiscountInr = Math.round(spendInr * (discountPct / 100) * 100) / 100;
    const daysAccelerated = netCreditDays - discountDays;
    const rate = discountPct / 100;
    const annualizedYieldPct =
      Number((((rate / (1 - rate)) * (DAYS_IN_STANDARD_YEAR / daysAccelerated)) * 100).toFixed(2));
    return { cashDiscountInr, annualizedYieldPct };
  }

  /**
   * Parses payment term strings using evidence-based pattern matching.
   * Transparently detects missing data without inventing false credit terms.
   */
  public static parsePaymentTerms(rawTerm?: string): ParsedPaymentTermResult {
    const term = (rawTerm || '').trim();

    if (!term || term.toUpperCase() === 'UNKNOWN' || term.toUpperCase() === 'N/A' || term === '-') {
      return {
        rawTerms: 'UNAVAILABLE',
        creditDays: 0,
        hasDiscount: false,
        isParsed: false,
        status: 'DATA_UNAVAILABLE',
        gapReason: 'FIELD_NOT_IN_SOURCE_ERP',
        gapDetails: 'Payment terms field is missing, null, or blank in source transaction.'
      };
    }

    // Pattern 1: Early payment discount format (e.g., "2/10 Net 30", "1/15 Net 60")
    const discountMatch = term.match(/^(\d+(\.\d+)?)\s*\/\s*(\d+)\s*(?:net\s*)?(\d+)?/i);
    if (discountMatch) {
      const discPct = parseFloat(discountMatch[1]);
      const discDays = parseInt(discountMatch[3], 10);
      const netDays = discountMatch[4] ? parseInt(discountMatch[4], 10) : 30;
      return {
        rawTerms: term,
        creditDays: netDays,
        hasDiscount: true,
        discountPct: discPct,
        discountDays: discDays,
        isParsed: true,
        status: 'OPPORTUNITY_IDENTIFIED'
      };
    }

    // Pattern 2: Standard Net Days format (e.g., "Net 30", "Net 45", "Net 60", "30 Days", "60 Days")
    const netMatch = term.match(/(?:net\s*)?(\d+)\s*(?:days?|d)?/i);
    if (netMatch) {
      const days = parseInt(netMatch[1], 10);
      if (days > 0 && days <= 365) {
        return {
          rawTerms: term,
          creditDays: days,
          hasDiscount: false,
          isParsed: true,
          status: 'OPPORTUNITY_IDENTIFIED'
        };
      }
    }

    // Pattern 3: Advance, Immediate, COD (Non-credit terms)
    if (/^(advance|immediate|cod|cash|lc|letter of credit)/i.test(term)) {
      return {
        rawTerms: term,
        creditDays: 0,
        hasDiscount: false,
        isParsed: true,
        status: 'AWAITING_VALIDATION',
        gapReason: 'ADVANCE_OR_NON_CREDIT_TERMS',
        gapDetails: `Supplier operates on non-credit commercial terms (${term}); requires commercial credit review.`
      };
    }

    // Unparseable format
    return {
      rawTerms: term,
      creditDays: 0,
      hasDiscount: false,
      isParsed: false,
      status: 'NOT_YET_QUANTIFIABLE',
      gapReason: 'UNPARSEABLE_PAYMENT_TERM_FORMAT',
      gapDetails: `Payment term text '${term}' could not be unambiguously resolved to standard credit days.`
    };
  }
}
