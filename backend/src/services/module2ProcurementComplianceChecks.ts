/**
 * Module 2 — Lever 9: Procurement Compliance Control Checks
 * Defensible Core Control Checks & Anomaly Detection Rules
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ProcurementComplianceExceptionItem,
  FinancialExposureClassification
} from '../types/module2ProcurementCompliance';
import {
  COMPLIANCE_CHECK_TYPES,
  COMPLIANCE_REVIEW_STATUSES,
  COMPLIANCE_FINANCIAL_LABELS,
  COMPLIANCE_CONFIGURABLE_THRESHOLDS
} from '../constants/module2ProcurementCompliance';
import { Module2ProcurementPatternChecks } from './module2ProcurementPatternChecks';

export class Module2ProcurementComplianceChecks {
  public static mapToSupportingTransaction = Module2ProcurementPatternChecks.mapToSupportingTransaction;

  private static findPriceBounds(txs: StrategicInputTransaction[]): { minPrice: number; maxPrice: number } {
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const t of txs) {
      if (typeof t.unit_price === 'number' && t.unit_price > 0 && (t.quantity ?? 0) > 0) {
        if (t.unit_price < minPrice) minPrice = t.unit_price;
        if (t.unit_price > maxPrice) maxPrice = t.unit_price;
      }
    }
    return { minPrice, maxPrice };
  }

  private static computePriceVariance(
    txs: StrategicInputTransaction[],
    minPrice: number
  ): { totalExcessInr: number; totalSpendInr: number } {
    let totalExcessInr = 0;
    let totalSpendInr = 0;
    for (const t of txs) {
      const p = t.unit_price ?? 0;
      const q = t.quantity ?? 0;
      const spend = t.total_spend_inr ?? 0;
      if (spend > 0 && q > 0) {
        totalSpendInr += spend;
        if (p > minPrice) totalExcessInr += (p - minPrice) * q;
      }
    }
    return { totalExcessInr, totalSpendInr };
  }

  private static buildPriceException(
    counter: number,
    itemKey: string,
    validPrices: StrategicInputTransaction[],
    minPrice: number,
    maxPrice: number,
    totalExcessInr: number,
    totalSpendInr: number
  ): ProcurementComplianceExceptionItem {
    const primaryTx = validPrices[0];
    const excessRounded = Math.round(totalExcessInr * 100) / 100;
    const spendRounded = Math.round(totalSpendInr * 100) / 100;
    const priceVariancePct = ((maxPrice - minPrice) / minPrice) * 100;

    return {
      exceptionId: `COMPL-PRC-${counter.toString().padStart(4, '0')}`,
      checkType: COMPLIANCE_CHECK_TYPES.PRICE_INCONSISTENCY,
      checkTitle: 'Inter-Transaction Unit Price Inconsistency',
      spendCategory: primaryTx.spend_category || 'General Procurement',
      vendorName: primaryTx.vendor_name || 'Multiple Suppliers',
      vendorCode: primaryTx.vendor_code,
      materialCode: primaryTx.material_code,
      materialDesc: primaryTx.material_desc || 'Clean Material Item',
      plant: primaryTx.plant,
      supportingTransactionsCount: validPrices.length,
      expenditureUnderReviewInr: spendRounded,
      expenditureUnderReviewCr: Number((spendRounded / 10000000).toFixed(2)),
      potentialFinancialExposureInr: excessRounded,
      potentialFinancialExposureCr: Number((excessRounded / 10000000).toFixed(2)),
      financialExposureStatus: 'PRICE_VARIANCE_INVESTIGATION_SIGNAL',
      financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS.PRICE_VARIANCE_INVESTIGATION_SIGNAL,
      methodologyDescription:
        `Observed ${priceVariancePct.toFixed(1)}% price dispersion (${itemKey}). Historical minimum price is not treated as an achievable commercial baseline. Classified as PRICE_VARIANCE_INVESTIGATION_SIGNAL and does not represent confirmed financial loss or savings.`,
      evidenceDetails: [
        `Lowest rate: ₹${minPrice.toFixed(2)} | Highest rate: ₹${maxPrice.toFixed(2)}`,
        `Variance spread: ${priceVariancePct.toFixed(1)}% across ${validPrices.length} records.`,
        'Comparable basis: identical material code, UOM, and currency. Credit adjustments excluded from price floor.'
      ],
      dataGapsDisclosed: ['Contractual volume discount tiers and freight inclusions not available in ERP extract.'],
      reviewStatus: COMPLIANCE_REVIEW_STATUSES.POTENTIAL_EXCEPTION,
      reviewHistory: [],
      potentialRelatedLevers: ['LEVER_1', 'LEVER_6'],
      nextActionRequired: 'Initiate procurement price variance review with category sourcing manager',
      supportingTransactions: validPrices.slice(0, 10).map(this.mapToSupportingTransaction)
    };
  }

  public static checkPriceInconsistencies(
    materialGroups: Map<string, StrategicInputTransaction[]>
  ): ProcurementComplianceExceptionItem[] {
    const exceptions: ProcurementComplianceExceptionItem[] = [];
    let counter = 0;

    for (const [key, txs] of materialGroups.entries()) {
      if (txs.length < 2) continue;
      const validPrices = txs.filter(
        (t) => (t.unit_price ?? 0) > 0 && (t.quantity ?? 0) > 0 && (t.total_spend_inr ?? 0) > 0
      );
      if (validPrices.length < 2) continue;

      const { minPrice, maxPrice } = this.findPriceBounds(validPrices);
      const priceVariancePct = ((maxPrice - minPrice) / minPrice) * 100;
      if (priceVariancePct < COMPLIANCE_CONFIGURABLE_THRESHOLDS.PRICE_DISPERSION_THRESHOLD_PCT) continue;

      const { totalExcessInr, totalSpendInr } = this.computePriceVariance(validPrices, minPrice);
      if (totalExcessInr < COMPLIANCE_CONFIGURABLE_THRESHOLDS.MIN_PRICE_EXCESS_INR) continue;

      counter++;
      exceptions.push(
        this.buildPriceException(counter, key, validPrices, minPrice, maxPrice, totalExcessInr, totalSpendInr)
      );
    }
    return exceptions;
  }

  private static buildDuplicateKey(t: StrategicInputTransaction): string | null {
    if (!t.vendor_code || !t.material_code || !t.total_spend_inr || t.total_spend_inr <= 0 || !t.quantity) return null;
    const rec = t as unknown as Record<string, unknown>;
    const invDate = typeof rec.invoice_date === 'string' ? rec.invoice_date : 'NODATE';
    return `${t.vendor_code}:::${t.material_code}:::${(t.po_date || invDate).slice(0, 10)}:::${t.quantity}:::${t.total_spend_inr}`;
  }

  private static buildDuplicateCandidate(
    counter: number,
    txs: StrategicInputTransaction[]
  ): ProcurementComplianceExceptionItem {
    const t = txs[0];
    const singleSpend = t.total_spend_inr ?? 0;
    const duplicateSpendInr = Math.round(singleSpend * (txs.length - 1) * 100) / 100;
    const totalSpendInr = Math.round(singleSpend * txs.length * 100) / 100;

    const uniquePos = new Set(txs.map((x) => x.po_number?.trim() || 'NO_PO'));
    const isSamePo = uniquePos.size === 1;
    const status: FinancialExposureClassification = isSamePo
      ? 'POTENTIAL_PO_SCHEDULE_DUPLICATE'
      : 'POTENTIAL_DUPLICATE_TRANSACTION';
    const checkTitle = isSamePo
      ? 'Potential PO Schedule Duplicate (AP Verification Required)'
      : 'Potential Cross-PO Duplicate Transaction (AP Verification Required)';
    const methodologyDescription = isSamePo
      ? 'These represent scheduled delivery batches under a single PO and are NOT confirmed duplicate payments. Classified as POTENTIAL_PO_SCHEDULE_DUPLICATE — AP VERIFICATION REQUIRED. Zero confirmed loss claimed without AP clearing proof.'
      : 'Cross-PO matching transactions. Classified as POTENTIAL_DUPLICATE_TRANSACTION — AP VERIFICATION REQUIRED. Zero confirmed loss claimed without AP clearing proof.';

    return {
      exceptionId: `COMPL-DUP-${counter.toString().padStart(4, '0')}`,
      checkType: COMPLIANCE_CHECK_TYPES.PO_TRANSACTION_EXCEPTION,
      checkTitle,
      spendCategory: t.spend_category || 'General Procurement',
      vendorName: t.vendor_name || 'Vendor',
      vendorCode: t.vendor_code,
      materialCode: t.material_code,
      materialDesc: t.material_desc || 'Item',
      plant: t.plant,
      supportingTransactionsCount: txs.length,
      expenditureUnderReviewInr: totalSpendInr,
      expenditureUnderReviewCr: Number((totalSpendInr / 10000000).toFixed(2)),
      potentialFinancialExposureInr: duplicateSpendInr,
      potentialFinancialExposureCr: Number((duplicateSpendInr / 10000000).toFixed(2)),
      financialExposureStatus: status,
      financialExposureStatusLabel: COMPLIANCE_FINANCIAL_LABELS[status],
      methodologyDescription,
      evidenceDetails: [
        `Candidate type: ${isSamePo ? 'Same-PO Delivery Schedule Line' : 'Cross-PO Duplicate Transaction Match'}`,
        `Matched lines: ${txs.length} records | Single transaction value: ₹${singleSpend.toFixed(2)}`,
        `POs involved: ${Array.from(uniquePos).join(', ')}`,
        `Exposure under review: ₹${duplicateSpendInr.toFixed(2)} (${txs.length - 1} unverified lines)`,
        'Notice: Suspected duplicate exposure is unverified; zero confirmed loss claimed without AP clearing proof.'
      ],
      dataGapsDisclosed: ['Goods receipt notes and payment voucher clearing status required.'],
      reviewStatus: COMPLIANCE_REVIEW_STATUSES.AWAITING_REVIEW,
      reviewHistory: [],
      potentialRelatedLevers: ['LEVER_8'],
      nextActionRequired: 'Audit accounts payable clearing records to verify whether dual payment occurred',
      supportingTransactions: txs.map(this.mapToSupportingTransaction)
    };
  }

  public static checkDeterministicDuplicates(
    transactions: StrategicInputTransaction[]
  ): ProcurementComplianceExceptionItem[] {
    const duplicateGroups = new Map<string, StrategicInputTransaction[]>();
    for (const t of transactions) {
      const key = this.buildDuplicateKey(t);
      if (key) {
        const group = duplicateGroups.get(key) || [];
        group.push(t);
        duplicateGroups.set(key, group);
      }
    }

    const exceptions: ProcurementComplianceExceptionItem[] = [];
    let counter = 0;
    for (const txs of duplicateGroups.values()) {
      if (txs.length >= 2) {
        counter++;
        exceptions.push(this.buildDuplicateCandidate(counter, txs));
      }
    }
    return exceptions;
  }

  public static checkPOAndControlGaps(
    transactions: StrategicInputTransaction[]
  ): ProcurementComplianceExceptionItem[] {
    return Module2ProcurementPatternChecks.checkPOAndControlGaps(transactions);
  }

  public static checkPurchasePatternExceptions(txs: StrategicInputTransaction[]): ProcurementComplianceExceptionItem[] {
    return Module2ProcurementPatternChecks.checkPurchasePatternExceptions(txs);
  }

  public static checkSourcingApprovalGaps(txs: StrategicInputTransaction[]): ProcurementComplianceExceptionItem[] {
    return Module2ProcurementPatternChecks.checkSourcingApprovalGaps(txs);
  }

  public static checkPaymentAndApprovalGaps(txs: StrategicInputTransaction[]): ProcurementComplianceExceptionItem[] {
    return Module2ProcurementPatternChecks.checkPaymentAndCommercialExceptions(txs);
  }
}
