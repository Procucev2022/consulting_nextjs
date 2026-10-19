/**
 * Module 2 — Lever 5: Payment Terms Optimisation Engine
 * Compliant with Rule 4, 8, 9, max 300 lines, cyclomatic complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import {
  PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS,
  DEFAULT_TARGET_CREDIT_DAYS_SCENARIO,
  PAYMENT_TERMS_METHODOLOGY_DISCLOSURES,
  PAYMENT_TERMS_STATUS_DISPLAY_LABELS
} from '../constants/module2PaymentTerms';
import { Module2PaymentTermsCalculators } from './module2PaymentTermsCalculators';
import { Module2PaymentTermsSupplierHelper } from './module2PaymentTermsSupplierHelper';
import type {
  PaymentTermsResult,
  PaymentTermsCoverageSummary,
  PaymentTermsRecordCoverage,
  PaymentTermsCalculationOptions,
  PaymentTermsDataAvailabilityStatus
} from '../types/module2PaymentTerms';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

interface RecordClassification {
  parsed: ReturnType<typeof Module2PaymentTermsCalculators.parsePaymentTerms>;
  isComplete: boolean;
  isPartial: boolean;
  isMissing: boolean;
  reqVal: boolean;
  spendVerified: number;
  spendMissing: number;
}

export class Module2PaymentTermsEngine {
  private static extractTransactionTerm(t: StrategicInputTransaction): string | undefined {
    const record = t as unknown as Record<string, unknown>;
    const raw = record.payment_terms || record.paymentTerms || record.credit_terms || record.zterm;
    return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : undefined;
  }

  private static classifyRecord(spend: number, rawTerm: string | undefined): RecordClassification {
    const parsed = Module2PaymentTermsCalculators.parsePaymentTerms(rawTerm);
    const isComplete = parsed.isParsed && parsed.status === 'OPPORTUNITY_IDENTIFIED';
    const isMissing = !rawTerm || parsed.status === 'DATA_UNAVAILABLE';
    const isPartial = !isComplete && !isMissing;
    const reqVal = parsed.status === 'AWAITING_VALIDATION' || parsed.status === 'NOT_YET_QUANTIFIABLE';

    let spendVerified = 0;
    let spendMissing = 0;
    if (isComplete) {
      spendVerified = spend;
    } else if (isPartial) {
      spendVerified = spend * 0.5;
      spendMissing = spend * 0.5;
    } else {
      spendMissing = spend;
    }

    return { parsed, isComplete, isPartial, isMissing, reqVal, spendVerified, spendMissing };
  }

  private static createCoverageRecord(
    t: StrategicInputTransaction,
    idx: number,
    spend: number,
    rawTerm: string | undefined,
    cl: RecordClassification
  ): PaymentTermsRecordCoverage {
    return {
      recordId: t.id || `TX-${idx + 1}`,
      vendorCode: t.vendor_code || 'N/A',
      vendorName: t.vendor_name || 'UNKNOWN',
      poNumber: t.po_number || 'N/A',
      poDate: t.po_date || 'N/A',
      spendInr: spend,
      rawPaymentTerms: rawTerm,
      parsedCreditDays: cl.parsed.creditDays,
      hasDiscountTerms: cl.parsed.hasDiscount,
      discountPercent: cl.parsed.discountPct,
      discountDays: cl.parsed.discountDays,
      coverageStatus: cl.isComplete ? 'COMPLETE' : cl.isPartial ? 'PARTIAL' : 'MISSING',
      gapReason: cl.parsed.gapReason,
      gapDetails: cl.parsed.gapDetails,
      requiresValidation: cl.reqVal
    };
  }

  private static processRecordsCoverage(transactions: StrategicInputTransaction[]): {
    coverageRecords: PaymentTermsRecordCoverage[];
    verifiedSpendInr: number;
    missingSpendInr: number;
    completeCount: number;
    partialCount: number;
    missingCount: number;
    validationCount: number;
    gapCounts: Record<string, number>;
  } {
    const coverageRecords: PaymentTermsRecordCoverage[] = [];
    let verifiedSpendInr = 0;
    let missingSpendInr = 0;
    let completeCount = 0;
    let partialCount = 0;
    let missingCount = 0;
    let validationCount = 0;
    const gapCounts: Record<string, number> = {};

    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      const spend = t.total_spend_inr ?? 0;
      const rawTerm = this.extractTransactionTerm(t);
      const cl = this.classifyRecord(spend, rawTerm);

      verifiedSpendInr += cl.spendVerified;
      missingSpendInr += cl.spendMissing;
      if (cl.isComplete) completeCount++;
      else if (cl.isPartial) partialCount++;
      else missingCount++;

      if (cl.reqVal) validationCount++;
      if (cl.parsed.gapReason) {
        gapCounts[cl.parsed.gapReason] = (gapCounts[cl.parsed.gapReason] || 0) + 1;
      }

      coverageRecords.push(this.createCoverageRecord(t, i, spend, rawTerm, cl));
    }

    return {
      coverageRecords,
      verifiedSpendInr,
      missingSpendInr,
      completeCount,
      partialCount,
      missingCount,
      validationCount,
      gapCounts
    };
  }

  private static determineOverallStatus(
    completeCount: number,
    partialCount: number,
    totalCount: number
  ): PaymentTermsDataAvailabilityStatus {
    if (completeCount === totalCount && totalCount > 0) {
      return 'OPPORTUNITY_IDENTIFIED';
    }
    if (completeCount > 0 || partialCount > 0) {
      return 'DATA_PARTIALLY_AVAILABLE';
    }
    return 'DATA_UNAVAILABLE';
  }

  public static calculate(
    assessmentId: string,
    options?: PaymentTermsCalculationOptions
  ): PaymentTermsResult {
    const startTime = Date.now();
    logger.info('Starting Lever 5 Payment Terms Optimisation calculation', { assessmentId, options });

    const transactions = Module2CanonicalService.getCanonicalTransactions(assessmentId);
    const rate = options?.customFinancingRatePer30Days ?? PROCUCEV_STANDARD_FINANCING_RATE_PER_30_DAYS;
    const targetDays = options?.targetCreditDaysScenario ?? DEFAULT_TARGET_CREDIT_DAYS_SCENARIO;

    const totalSpendAnalysedInr = transactions.reduce((sum, t) => sum + (t.total_spend_inr ?? 0), 0);
    const totalSpendAnalysedCr = Number((totalSpendAnalysedInr / 10000000).toFixed(4));

    const cov = this.processRecordsCoverage(transactions);
    const supp = Module2PaymentTermsSupplierHelper.buildSupplierOpportunities(
      transactions,
      rate,
      targetDays,
      (t) => this.extractTransactionTerm(t)
    );

    const overallStatus = this.determineOverallStatus(cov.completeCount, cov.partialCount, transactions.length);
    const verifiedSpendCr = Number((cov.verifiedSpendInr / 10000000).toFixed(4));
    const missingSpendCr = Number((cov.missingSpendInr / 10000000).toFixed(4));
    const verifiedSpendPct = totalSpendAnalysedInr > 0
      ? Number(((cov.verifiedSpendInr / totalSpendAnalysedInr) * 100).toFixed(2))
      : 0;
    const missingSpendPct = totalSpendAnalysedInr > 0
      ? Number(((cov.missingSpendInr / totalSpendAnalysedInr) * 100).toFixed(2))
      : 0;

    const reconciliationDeltaInr = Number(
      Math.abs(totalSpendAnalysedInr - (cov.verifiedSpendInr + cov.missingSpendInr)).toFixed(4)
    );

    const coverageSummary: PaymentTermsCoverageSummary = {
      assessmentId,
      totalSpendAnalysedInr,
      totalSpendAnalysedCr,
      verifiedSpendInr: cov.verifiedSpendInr,
      verifiedSpendCr,
      missingSpendInr: cov.missingSpendInr,
      missingSpendCr,
      verifiedSpendPct,
      missingSpendPct,
      totalRecordsCount: transactions.length,
      completeRecordsCount: cov.completeCount,
      partialRecordsCount: cov.partialCount,
      missingRecordsCount: cov.missingCount,
      recordsRequiringValidationCount: cov.validationCount,
      gapReasonCounts: cov.gapCounts,
      overallDataAvailabilityStatus: overallStatus,
      overallStatusDisplayText: PAYMENT_TERMS_STATUS_DISPLAY_LABELS[overallStatus],
      reconciliationDeltaInr,
      procucevModellingRatePctPer30Days: Number((rate * 100).toFixed(2)),
      totalWorkingCapitalReleasedCr: Number((supp.totalWcReleasedInr / 10000000).toFixed(4)),
      totalFinancingBenefitCr: Number((supp.totalFinancingBenefitInr / 10000000).toFixed(4)),
      totalEarlyPaymentDiscountsCr: Number((supp.totalDiscountsInr / 10000000).toFixed(4))
    };

    logger.info('Lever 5 Payment Terms calculation completed', {
      assessmentId,
      durationMs: Date.now() - startTime,
      totalSpendCr: totalSpendAnalysedCr,
      overallStatus,
      opportunitiesCount: supp.opportunities.length
    });

    return {
      assessmentId,
      coverageSummary,
      opportunities: supp.opportunities,
      supplierProfiles: supp.supplierProfiles,
      coverageRecords: cov.coverageRecords,
      methodologyDisclosures: PAYMENT_TERMS_METHODOLOGY_DISCLOSURES
    };
  }
}
