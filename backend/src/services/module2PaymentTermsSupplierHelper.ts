/**
 * Module 2 — Lever 5: Payment Terms Supplier Helper
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import { PAYMENT_TERMS_STATUS_DISPLAY_LABELS } from '../constants/module2PaymentTerms';
import { Module2PaymentTermsCalculators } from './module2PaymentTermsCalculators';
import type {
  PaymentTermsOpportunity,
  SupplierPaymentTermsProfile,
  PaymentTermsDataAvailabilityStatus
} from '../types/module2PaymentTerms';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

interface SupplierAggregationEntry {
  name: string;
  category: string;
  spend: number;
  txCount: number;
  termsSet: Set<string>;
  parsedDays: number[];
  hasDiscount: boolean;
  discountPct: number;
  discountDays: number;
  hasMissing: boolean;
}

export class Module2PaymentTermsSupplierHelper {
  private static getOrCreateSupplier(
    suppMap: Map<string, SupplierAggregationEntry>,
    t: StrategicInputTransaction
  ): SupplierAggregationEntry {
    const code = t.vendor_code || t.vendor_name || 'UNKNOWN';
    let entry = suppMap.get(code);
    if (!entry) {
      entry = {
        name: t.vendor_name || 'UNKNOWN',
        category: t.spend_category || 'General',
        spend: 0,
        txCount: 0,
        termsSet: new Set(),
        parsedDays: [],
        hasDiscount: false,
        discountPct: 0,
        discountDays: 0,
        hasMissing: false
      };
      suppMap.set(code, entry);
    }
    return entry;
  }

  private static processTransactionTerm(
    entry: SupplierAggregationEntry,
    raw: string | undefined
  ): void {
    if (!raw) {
      entry.hasMissing = true;
      return;
    }
    entry.termsSet.add(raw);
    const p = Module2PaymentTermsCalculators.parsePaymentTerms(raw);
    if (p.isParsed) {
      entry.parsedDays.push(p.creditDays);
      if (p.hasDiscount && p.discountPct) {
        entry.hasDiscount = true;
        entry.discountPct = p.discountPct;
        entry.discountDays = p.discountDays || 10;
      }
    }
  }

  private static aggregateTransactions(
    transactions: StrategicInputTransaction[],
    extractTerm: (t: StrategicInputTransaction) => string | undefined
  ): Map<string, SupplierAggregationEntry> {
    const suppMap = new Map<string, SupplierAggregationEntry>();
    for (const t of transactions) {
      const entry = this.getOrCreateSupplier(suppMap, t);
      entry.spend += t.total_spend_inr ?? 0;
      entry.txCount++;
      const raw = extractTerm(t);
      this.processTransactionTerm(entry, raw);
    }
    return suppMap;
  }

  private static resolveStatus(
    hasVerifiedTerms: boolean,
    hasMissing: boolean
  ): PaymentTermsDataAvailabilityStatus {
    if (hasVerifiedTerms && !hasMissing) {
      return 'OPPORTUNITY_IDENTIFIED';
    }
    if (hasVerifiedTerms && hasMissing) {
      return 'DATA_PARTIALLY_AVAILABLE';
    }
    return 'DATA_UNAVAILABLE';
  }

  private static createOpportunity(
    code: string,
    s: SupplierAggregationEntry,
    wavgDays: number,
    targetDays: number,
    rate: number,
    additionalDays: number,
    benefitInr: number,
    wcReleasedInr: number,
    discountInr: number,
    status: PaymentTermsDataAvailabilityStatus
  ): PaymentTermsOpportunity {
    const primaryTerms = s.termsSet.size > 0 ? Array.from(s.termsSet)[0] : 'Not Found in Source Data';
    return {
      opportunityId: `OPP-PAY-${code}`,
      supplierCode: code,
      supplierName: s.name,
      spendCategory: s.category,
      annualSpendInr: s.spend,
      annualSpendCr: Number((s.spend / 10000000).toFixed(4)),
      currentPaymentTerms: primaryTerms,
      currentCreditDays: wavgDays,
      targetPaymentTerms: `Net ${targetDays} Days`,
      targetCreditDays: targetDays,
      additionalCreditDays: additionalDays,
      financingRatePer30Days: rate,
      indicativeAnnualFinancingBenefitInr: benefitInr,
      indicativeAnnualFinancingBenefitCr: Number((benefitInr / 10000000).toFixed(4)),
      indicativeWorkingCapitalReleasedInr: wcReleasedInr,
      indicativeWorkingCapitalReleasedCr: Number((wcReleasedInr / 10000000).toFixed(4)),
      earlyPaymentDiscountRate: s.hasDiscount ? s.discountPct : undefined,
      earlyPaymentAnnualSpendInr: s.hasDiscount ? discountInr : undefined,
      availabilityStatus: status,
      statusLabel: status === 'OPPORTUNITY_IDENTIFIED'
        ? 'Illustrative Scenario (Pending Approval)'
        : PAYMENT_TERMS_STATUS_DISPLAY_LABELS[status],
      evidenceSource: 'ERP PO Terms Extract & Verified Contract History (Scenario Pending Approval)',
      approvalStatus: 'PENDING_APPROVAL',
      isScenario: true
    };
  }

  private static createSupplierProfile(
    code: string,
    s: SupplierAggregationEntry,
    wavgDays: number,
    benefitInr: number,
    wcReleasedInr: number,
    discountInr: number,
    status: PaymentTermsDataAvailabilityStatus
  ): SupplierPaymentTermsProfile {
    const primaryTerms = s.termsSet.size > 0 ? Array.from(s.termsSet)[0] : 'Not Found in Source Data';
    return {
      supplierCode: code,
      supplierName: s.name,
      spendCategory: s.category,
      totalSpendInr: s.spend,
      totalSpendCr: Number((s.spend / 10000000).toFixed(4)),
      transactionCount: s.txCount,
      observedPaymentTerms: Array.from(s.termsSet),
      primaryPaymentTerms: primaryTerms,
      weightedAvgCreditDays: wavgDays,
      dataAvailability: status,
      indicativeWorkingCapitalReleasedCr: Number((wcReleasedInr / 10000000).toFixed(4)),
      indicativeFinancingBenefitCr: Number((benefitInr / 10000000).toFixed(4)),
      earlyPaymentDiscountOpportunityCr: Number((discountInr / 10000000).toFixed(4)),
      requiresValidation: status === 'DATA_PARTIALLY_AVAILABLE'
    };
  }

  public static buildSupplierOpportunities(
    transactions: StrategicInputTransaction[],
    rate: number,
    targetDays: number,
    extractTerm: (t: StrategicInputTransaction) => string | undefined
  ): {
    opportunities: PaymentTermsOpportunity[];
    supplierProfiles: SupplierPaymentTermsProfile[];
    totalWcReleasedInr: number;
    totalFinancingBenefitInr: number;
    totalDiscountsInr: number;
  } {
    const suppMap = this.aggregateTransactions(transactions, extractTerm);
    const opportunities: PaymentTermsOpportunity[] = [];
    const supplierProfiles: SupplierPaymentTermsProfile[] = [];
    let totalWcReleasedInr = 0;
    let totalFinancingBenefitInr = 0;
    let totalDiscountsInr = 0;

    for (const [code, s] of suppMap.entries()) {
      const hasVerifiedTerms = s.parsedDays.length > 0;
      const wavgDays = hasVerifiedTerms
        ? Math.round(s.parsedDays.reduce((a, b) => a + b, 0) / s.parsedDays.length)
        : 0;

      const status = this.resolveStatus(hasVerifiedTerms, s.hasMissing);
      const additionalDays = hasVerifiedTerms ? Math.max(0, targetDays - wavgDays) : 0;
      const benefitInr = hasVerifiedTerms
        ? Module2PaymentTermsCalculators.calculateIndicativeFinancingBenefit(s.spend, additionalDays, rate)
        : 0;
      const wcReleasedInr = hasVerifiedTerms
        ? Module2PaymentTermsCalculators.calculateWorkingCapitalReleased(s.spend, additionalDays)
        : 0;

      let discountInr = 0;
      if (s.hasDiscount && hasVerifiedTerms) {
        const disc = Module2PaymentTermsCalculators.calculateEarlyPaymentDiscount(
          s.spend,
          s.discountPct,
          s.discountDays,
          wavgDays
        );
        discountInr = disc.cashDiscountInr;
        totalDiscountsInr += discountInr;
      }

      totalWcReleasedInr += wcReleasedInr;
      totalFinancingBenefitInr += benefitInr;

      if (hasVerifiedTerms && additionalDays > 0) {
        opportunities.push(
          this.createOpportunity(
            code, s, wavgDays, targetDays, rate, additionalDays,
            benefitInr, wcReleasedInr, discountInr, status
          )
        );
      }

      supplierProfiles.push(
        this.createSupplierProfile(code, s, wavgDays, benefitInr, wcReleasedInr, discountInr, status)
      );
    }

    return {
      opportunities,
      supplierProfiles,
      totalWcReleasedInr,
      totalFinancingBenefitInr,
      totalDiscountsInr
    };
  }
}
