/**
 * Module 2 — Lever 9: Procurement Compliance & Control Engine
 * Synthesis, Evaluation & Financial Exposure Accounting
 * Compliant with Rule 4, 8, 9, max 300 lines, line length <= 120 chars, complexity <= 10
 */

import logger from '../utils/logger';
import { Module2CanonicalService } from './module2CanonicalService';
import type { StrategicInputTransaction } from '../types/strategicSourcing';
import type {
  ProcurementComplianceExceptionItem, ProcurementComplianceSummary,
  ComplianceControlCheckSummary, ProcurementComplianceResult,
  ProcurementComplianceOptions, ComplianceReviewRecord,
  ProcurementComplianceStatus, ProcurementComplianceCheckType,
  ComplianceReviewStatusCounts, ComplianceFinancialAggregation
} from '../types/module2ProcurementCompliance';
import {
  COMPLIANCE_REVIEW_STATUSES, COMPLIANCE_DISCLOSURES,
  COMPLIANCE_METHODOLOGY_SAFEGUARDS, COMPLIANCE_CONTROL_CHECKS_CONFIG
} from '../constants/module2ProcurementCompliance';
import { Module2ProcurementComplianceChecks } from './module2ProcurementComplianceChecks';
import { resolveAssessmentCustomerName } from '../utils/assessmentContextResolver';

export class Module2ProcurementComplianceEngine {
  private static groupMaterials(
    transactions: StrategicInputTransaction[]
  ): Map<string, StrategicInputTransaction[]> {
    const map = new Map<string, StrategicInputTransaction[]>();
    for (const t of transactions) {
      if (!t.material_code) continue;
      const key = `${t.material_code.trim().toUpperCase()}:::${(t.uom || 'units').trim()}:::${t.currency || 'INR'}`;
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    }
    return map;
  }

  private static resolveReviewState(
    overrideReviewRaw: ComplianceReviewRecord | ComplianceReviewRecord[] | undefined,
    defaultStatus: ProcurementComplianceStatus
  ): { history: ComplianceReviewRecord[]; finalStatus: ProcurementComplianceStatus } {
    if (!overrideReviewRaw) {
      return { history: [], finalStatus: defaultStatus };
    }
    const history = Array.isArray(overrideReviewRaw) ? overrideReviewRaw : [overrideReviewRaw];
    const latest = history[history.length - 1];
    return {
      history,
      finalStatus: latest ? latest.status : defaultStatus
    };
  }

  private static applyOverrides(
    exceptions: ProcurementComplianceExceptionItem[],
    options?: ProcurementComplianceOptions
  ): ProcurementComplianceExceptionItem[] {
    return exceptions.map((item) => {
      const override = options?.reviews?.[item.exceptionId];
      const { history, finalStatus } = this.resolveReviewState(override, item.reviewStatus);

      let nextAction = item.nextActionRequired;
      if (finalStatus === COMPLIANCE_REVIEW_STATUSES.VERIFIED_EXCEPTION) {
        nextAction = 'Exception verified by controller; route for commercial recovery or process remediation';
      } else if (finalStatus === COMPLIANCE_REVIEW_STATUSES.NOT_AN_EXCEPTION) {
        nextAction = 'Exception dismissed by controller; documented justification on file';
      }

      return {
        ...item,
        reviewStatus: finalStatus,
        reviewHistory: history,
        nextActionRequired: nextAction
      };
    });
  }

  private static countReviewStatuses(
    exceptions: ProcurementComplianceExceptionItem[]
  ): ComplianceReviewStatusCounts {
    let awaiting = 0;
    let verified = 0;
    let dismissed = 0;
    let potential = 0;
    let insufficient = 0;
    for (const ex of exceptions) {
      if (ex.reviewStatus === COMPLIANCE_REVIEW_STATUSES.AWAITING_REVIEW) awaiting++;
      else if (ex.reviewStatus === COMPLIANCE_REVIEW_STATUSES.VERIFIED_EXCEPTION) verified++;
      else if (ex.reviewStatus === COMPLIANCE_REVIEW_STATUSES.NOT_AN_EXCEPTION) dismissed++;
      else if (ex.reviewStatus === COMPLIANCE_REVIEW_STATUSES.DATA_INSUFFICIENT) insufficient++;
      else potential++;
    }
    return { awaiting, verified, dismissed, potential, insufficient };
  }

  private static aggregateFinancialMetrics(
    exceptions: ProcurementComplianceExceptionItem[]
  ): ComplianceFinancialAggregation {
    let totalExposureInr = 0;
    let priceVarianceInr = 0;
    let samePoScheduleDuplicateInr = 0;
    let crossPoDuplicateInr = 0;
    let otherGovernanceExceptionsCount = 0;
    let nonQuantifiable = 0;

    for (const ex of exceptions) {
      if (ex.potentialFinancialExposureInr > 0) {
        totalExposureInr += ex.potentialFinancialExposureInr;
      } else {
        nonQuantifiable++;
      }

      if (ex.financialExposureStatus === 'PRICE_VARIANCE_INVESTIGATION_SIGNAL') {
        priceVarianceInr += ex.potentialFinancialExposureInr;
      } else if (ex.financialExposureStatus === 'POTENTIAL_PO_SCHEDULE_DUPLICATE') {
        samePoScheduleDuplicateInr += ex.potentialFinancialExposureInr;
      } else if (ex.financialExposureStatus === 'POTENTIAL_DUPLICATE_TRANSACTION') {
        crossPoDuplicateInr += ex.potentialFinancialExposureInr;
      } else {
        otherGovernanceExceptionsCount++;
      }
    }

    return {
      totalExposureInr,
      priceVarianceInr,
      samePoScheduleDuplicateInr,
      crossPoDuplicateInr,
      otherGovernanceExceptionsCount,
      nonQuantifiable
    };
  }

  private static calculateCrossCheckOverlap(
    tenantId: string,
    exceptions: ProcurementComplianceExceptionItem[]
  ): { overlapInr: number; uniqueSpendInr: number } {
    const reviewedPoLines = new Set<string>();
    let uniqueSpendInr = 0;
    const txToCheckTypes = new Map<string, { checkType: ProcurementComplianceCheckType; exposure: number }[]>();

    for (const ex of exceptions) {
      for (const st of ex.supportingTransactions) {
        const key = `${tenantId}:::${st.poNumber}:::${st.vendorCode}:::${st.materialCode}:::${st.totalSpendInr}`;
        if (!reviewedPoLines.has(key)) {
          reviewedPoLines.add(key);
          uniqueSpendInr += st.totalSpendInr;
        }
        const list = txToCheckTypes.get(key) || [];
        list.push({ checkType: ex.checkType, exposure: ex.potentialFinancialExposureInr });
        txToCheckTypes.set(key, list);
      }
    }

    let overlapInr = 0;
    for (const list of txToCheckTypes.values()) {
      const distinctChecks = new Set(list.map((l) => l.checkType));
      if (distinctChecks.size > 1) {
        const positiveList = list.filter((l) => l.exposure > 0);
        if (positiveList.length > 1) {
          overlapInr += Math.min(...positiveList.map((l) => l.exposure));
        }
      }
    }
    return { overlapInr, uniqueSpendInr };
  }

  private static buildSummary(
    tenantId: string,
    customerName: string,
    totalTransactions: number,
    exceptions: ProcurementComplianceExceptionItem[]
  ): ProcurementComplianceSummary {
    const counts = this.countReviewStatuses(exceptions);
    const metrics = this.aggregateFinancialMetrics(exceptions);
    const { overlapInr, uniqueSpendInr } = this.calculateCrossCheckOverlap(tenantId, exceptions);

    const roundedExpenditure = Math.round(uniqueSpendInr * 100) / 100;
    const roundedExposure = Math.round(metrics.totalExposureInr * 100) / 100;
    const roundedPrice = Math.round(metrics.priceVarianceInr * 100) / 100;
    const roundedSamePo = Math.round(metrics.samePoScheduleDuplicateInr * 100) / 100;
    const roundedCrossPo = Math.round(metrics.crossPoDuplicateInr * 100) / 100;
    const totalAwaitingAp = Math.round((roundedSamePo + roundedCrossPo) * 100) / 100;
    const roundedOverlap = Math.round(overlapInr * 100) / 100;

    return {
      tenantId,
      customerName,
      totalTransactionsReviewedCount: totalTransactions,
      totalExceptionsIdentifiedCount: exceptions.length,
      awaitingReviewCount: counts.awaiting,
      verifiedExceptionsCount: counts.verified,
      dismissedCount: counts.dismissed,
      potentialExceptionsCount: counts.potential,
      dataInsufficientCount: counts.insufficient,
      totalExpenditureUnderReviewInr: roundedExpenditure,
      totalExpenditureUnderReviewCr: Number((roundedExpenditure / 10000000).toFixed(2)),
      totalPotentialFinancialExposureInr: roundedExposure,
      totalPotentialFinancialExposureCr: Number((roundedExposure / 10000000).toFixed(2)),
      uniqueExpenditureUnderReviewInr: roundedExpenditure,
      uniqueExpenditureUnderReviewCr: Number((roundedExpenditure / 10000000).toFixed(2)),
      priceVarianceInvestigationInr: roundedPrice,
      priceVarianceInvestigationCr: Number((roundedPrice / 10000000).toFixed(2)),
      samePoScheduleDuplicateInr: roundedSamePo,
      samePoScheduleDuplicateCr: Number((roundedSamePo / 10000000).toFixed(2)),
      crossPoDuplicateInr: roundedCrossPo,
      crossPoDuplicateCr: Number((roundedCrossPo / 10000000).toFixed(2)),
      totalAwaitingApVerificationInr: totalAwaitingAp,
      totalAwaitingApVerificationCr: Number((totalAwaitingAp / 10000000).toFixed(2)),
      otherGovernanceExceptionsCount: metrics.otherGovernanceExceptionsCount,
      quantifiedDefensibleExposureInr: 0,
      quantifiedDefensibleExposureCr: 0,
      verifiedFinancialImpactInr: 0,
      verifiedFinancialImpactCr: 0,
      crossCheckOverlapAmountInr: roundedOverlap,
      crossCheckOverlapAmountCr: Number((roundedOverlap / 10000000).toFixed(2)),
      nonQuantifiableExceptionsCount: metrics.nonQuantifiable,
      totalDisclosedDataGapsCount: exceptions.reduce((acc, x) => acc + x.dataGapsDisclosed.length, 0),
      contractComplianceStatus: COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE,
      financialDisclaimer: COMPLIANCE_DISCLOSURES.FINANCIAL_EXPOSURE_NOTICE
    };
  }

  private static buildControlChecksSummary(
    totalTransactions: number,
    exceptions: ProcurementComplianceExceptionItem[]
  ): ComplianceControlCheckSummary[] {
    return COMPLIANCE_CONTROL_CHECKS_CONFIG.map((c) => {
      const matchingEx = exceptions.filter((x) => x.checkType === c.type);
      let spendInr = 0;
      let exposureInr = 0;
      for (const x of matchingEx) {
        spendInr += x.expenditureUnderReviewInr;
        exposureInr += x.potentialFinancialExposureInr;
      }
      return {
        checkType: c.type,
        checkTitle: c.title,
        eligibleTransactionsCount: totalTransactions,
        exceptionsIdentifiedCount: matchingEx.length,
        expenditureUnderReviewInr: Math.round(spendInr * 100) / 100,
        expenditureUnderReviewCr: Number((spendInr / 10000000).toFixed(2)),
        potentialFinancialExposureInr: Math.round(exposureInr * 100) / 100,
        potentialFinancialExposureCr: Number((exposureInr / 10000000).toFixed(2)),
        dataCoveragePct: totalTransactions > 0 ? 100 : 0,
        primaryDataGapNotice: c.gap
      };
    });
  }

  public static async calculateProcurementCompliance(
    assessmentId: string,
    options?: ProcurementComplianceOptions
  ): Promise<ProcurementComplianceResult> {
    logger.info('Executing Module 2 Lever 9 Procurement Compliance & Control', {
      assessmentId,
      hasOverrides: Boolean(options?.reviews)
    });

    const txs = await Module2CanonicalService.getCanonicalTransactions(assessmentId);
    const customerName = resolveAssessmentCustomerName(assessmentId);

    const materialMap = this.groupMaterials(txs);
    const rawExceptions: ProcurementComplianceExceptionItem[] = [
      ...Module2ProcurementComplianceChecks.checkPriceInconsistencies(materialMap),
      ...Module2ProcurementComplianceChecks.checkPurchasePatternExceptions(txs),
      ...Module2ProcurementComplianceChecks.checkDeterministicDuplicates(txs),
      ...Module2ProcurementComplianceChecks.checkPOAndControlGaps(txs),
      ...Module2ProcurementComplianceChecks.checkSourcingApprovalGaps(txs),
      ...Module2ProcurementComplianceChecks.checkPaymentAndApprovalGaps(txs)
    ];

    const exceptions = this.applyOverrides(rawExceptions, options);
    const summary = this.buildSummary(assessmentId, customerName, txs.length, exceptions);
    const controlChecks = this.buildControlChecksSummary(txs.length, exceptions);

    return {
      assessmentId,
      customerName,
      calculatedAt: new Date().toISOString(),
      summary,
      controlChecks,
      exceptions,
      methodologySafeguards: COMPLIANCE_METHODOLOGY_SAFEGUARDS,
      financialDisclaimer: COMPLIANCE_DISCLOSURES.FINANCIAL_EXPOSURE_NOTICE,
      contractComplianceNotice: COMPLIANCE_DISCLOSURES.CONTRACT_COMPLIANCE_NOTICE
    };
  }

  public static async calculate(
    assessmentId: string,
    options?: ProcurementComplianceOptions
  ): Promise<ProcurementComplianceResult> {
    return this.calculateProcurementCompliance(assessmentId, options);
  }
}
