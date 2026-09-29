/**
 * Module 2 Comparability & Transaction Normalization Engine
 * Version: MODULE_2_SOURCING_LOGIC_V1.0
 * 
 * Enforces strict comparability rules:
 * - Specification, UOM, Currency, and Quality consistency
 * - Outlier and anomaly isolation
 * - Full auditability: ZERO silent exclusions
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ExcludedTransactionRecord,
  ExclusionReason,
  SourcingDataConfidence
} from '../types/module2StrategicSourcing';
import { CREDIBLE_PRICE_RULES } from '../constants/module2StrategicSourcing';

export interface ComparabilityAnalysisResult {
  comparableTransactions: StrategicInputTransaction[];
  partiallyComparableTransactions: StrategicInputTransaction[];
  excludedTransactions: ExcludedTransactionRecord[];
  primaryUom: string;
  primaryCurrency: string;
  totalTransactionsCount: number;
  comparableSpendInr: number;
  comparableQuantity: number;
}

export class Module2ComparabilityEngine {
  public static evaluateDataConfidence(
    activeMonthsCount: number,
    supplierCount: number,
    compTxCount: number,
    excludedCount: number
  ): { dataConfidence: SourcingDataConfidence; confidenceRationale: string } {
    if (activeMonthsCount >= 6 && supplierCount >= 3 && compTxCount >= 5 && excludedCount === 0) {
      return {
        dataConfidence: 'HIGH',
        confidenceRationale: `High confidence: ${activeMonthsCount} months history, ${supplierCount} suppliers, 100% comparable transactions.`
      };
    }
    if (compTxCount >= 2 && supplierCount >= 2) {
      return {
        dataConfidence: 'MEDIUM',
        confidenceRationale: `Moderate confidence: ${compTxCount} comparable transactions across ${supplierCount} suppliers.`
      };
    }
    if (compTxCount >= 1) {
      return {
        dataConfidence: 'LOW',
        confidenceRationale: `Low confidence: Limited comparable transactions (${compTxCount}) or inconsistent specifications.`
      };
    }
    return {
      dataConfidence: 'INSUFFICIENT',
      confidenceRationale: 'Insufficient data: No valid comparable transactions available.'
    };
  }
  /**
   * Determine primary (modal) UOM and Currency across transactions
   */
  private static determinePrimaryAttributes(transactions: StrategicInputTransaction[]): {
    uom: string;
    currency: string;
  } {
    const uomFreq: Record<string, number> = {};
    const currFreq: Record<string, number> = {};

    for (const t of transactions) {
      const u = (t.uom || 'EA').trim().toUpperCase();
      const c = (t.currency || 'INR').trim().toUpperCase();
      uomFreq[u] = (uomFreq[u] || 0) + 1;
      currFreq[c] = (currFreq[c] || 0) + 1;
    }

    let topUom = 'EA';
    let topUomCount = -1;
    for (const [u, count] of Object.entries(uomFreq)) {
      if (count > topUomCount) {
        topUom = u;
        topUomCount = count;
      }
    }

    let topCurr = 'INR';
    let topCurrCount = -1;
    for (const [c, count] of Object.entries(currFreq)) {
      if (count > topCurrCount) {
        topCurr = c;
        topCurrCount = count;
      }
    }

    return { uom: topUom, currency: topCurr };
  }

  /**
   * Calculate median unit price for outlier gating
   */
  private static calculateMedianPrice(transactions: StrategicInputTransaction[]): number {
    const validPrices = transactions
      .map(t => Number(t.unit_price))
      .filter(p => !isNaN(p) && p > 0)
      .sort((a, b) => a - b);

    if (validPrices.length === 0) return 0;
    const mid = Math.floor(validPrices.length / 2);
    return validPrices.length % 2 !== 0
      ? validPrices[mid]
      : (validPrices[mid - 1] + validPrices[mid]) / 2;
  }

  private static validatePriceAndQty(
    price: number,
    qty: number,
    reasons: ExclusionReason[],
    explanations: string[]
  ): void {
    if (price <= 0 || isNaN(price)) {
      reasons.push('INVALID_PRICE');
      explanations.push('Unit price is zero, negative, or invalid');
    }
    if (qty <= 0 || isNaN(qty)) {
      reasons.push('MISSING_QUANTITY');
      explanations.push('Transaction quantity is zero, negative, or missing');
    }
  }

  private static validateUomAndCurrency(
    txUom: string,
    primaryUom: string,
    txCurr: string,
    primaryCurrency: string,
    reasons: ExclusionReason[],
    explanations: string[]
  ): void {
    if (txUom !== primaryUom) {
      reasons.push('UNIT_MISMATCH');
      explanations.push(`Unit '${txUom}' does not match category primary unit '${primaryUom}'`);
    }
    if (txCurr !== primaryCurrency) {
      reasons.push('CURRENCY_MISMATCH');
      explanations.push(`Currency '${txCurr}' requires currency normalization before comparison`);
    }
  }

  private static validateOutlier(
    price: number,
    medianPrice: number,
    reasons: ExclusionReason[],
    explanations: string[]
  ): void {
    if (medianPrice <= 0 || price <= 0) return;
    const isExtremeHigh = price > medianPrice * 4;
    const isExtremeLow = price < medianPrice * (1 - CREDIBLE_PRICE_RULES.MAX_PRICE_VARIANCE_FROM_MEDIAN);
    if (isExtremeHigh || isExtremeLow) {
      reasons.push('OBVIOUS_OUTLIER');
      explanations.push(
        `Unit price ₹${price.toFixed(2)} deviates materially from category median ₹${medianPrice.toFixed(2)}`
      );
    }
  }

  private static checkTransactionExclusions(
    tx: StrategicInputTransaction,
    primaryUom: string,
    primaryCurrency: string,
    medianPrice: number
  ): { reasons: ExclusionReason[]; explanations: string[]; price: number; qty: number; spend: number } {
    const reasons: ExclusionReason[] = [];
    const explanations: string[] = [];
    const price = Number(tx.unit_price) || 0;
    const qty = Number(tx.quantity) || 0;
    const spend = Number(tx.total_spend_inr) || (price * qty);
    const txUom = (tx.uom || 'EA').trim().toUpperCase();
    const txCurr = (tx.currency || 'INR').trim().toUpperCase();

    this.validatePriceAndQty(price, qty, reasons, explanations);
    this.validateUomAndCurrency(txUom, primaryUom, txCurr, primaryCurrency, reasons, explanations);
    this.validateOutlier(price, medianPrice, reasons, explanations);

    return { reasons, explanations, price, qty, spend };
  }

  /**
   * Evaluate each transaction for comparability and record explicit reasons if excluded
   */
  public static evaluateComparability(
    transactions: StrategicInputTransaction[] = []
  ): ComparabilityAnalysisResult {
    if (!transactions || transactions.length === 0) {
      return {
        comparableTransactions: [],
        partiallyComparableTransactions: [],
        excludedTransactions: [],
        primaryUom: 'EA',
        primaryCurrency: 'INR',
        totalTransactionsCount: 0,
        comparableSpendInr: 0,
        comparableQuantity: 0
      };
    }

    const { uom: primaryUom, currency: primaryCurrency } = this.determinePrimaryAttributes(transactions);
    const medianPrice = this.calculateMedianPrice(transactions);

    const comparableTransactions: StrategicInputTransaction[] = [];
    const partiallyComparableTransactions: StrategicInputTransaction[] = [];
    const excludedTransactions: ExcludedTransactionRecord[] = [];

    for (const tx of transactions) {
      const { reasons, explanations, price, qty, spend } = this.checkTransactionExclusions(
        tx,
        primaryUom,
        primaryCurrency,
        medianPrice
      );

      if (reasons.length > 0) {
        excludedTransactions.push({
          transactionId: tx.id || `TX-${tx.po_number || 'UNKNOWN'}-${Date.now()}`,
          poNumber: tx.po_number || 'N/A',
          supplierName: tx.vendor_name || 'UNKNOWN',
          materialDesc: tx.material_desc || 'N/A',
          unitPrice: price,
          quantity: qty,
          totalSpendInr: spend,
          reasons,
          explanation: explanations.join('; ')
        });
      } else {
        comparableTransactions.push(tx);
      }
    }

    const comparableSpendInr = comparableTransactions.reduce(
      (sum, t) => sum + (Number(t.total_spend_inr) || (Number(t.unit_price) * Number(t.quantity))),
      0
    );
    const comparableQuantity = comparableTransactions.reduce(
      (sum, t) => sum + Number(t.quantity),
      0
    );

    return {
      comparableTransactions,
      partiallyComparableTransactions,
      excludedTransactions,
      primaryUom,
      primaryCurrency,
      totalTransactionsCount: transactions.length,
      comparableSpendInr,
      comparableQuantity
    };
  }
}
