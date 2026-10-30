import { MODULE2_D1_COMPLIANCE as CONFIG } from '../constants/module2ProcurementComplianceD1';
import type {
  ComplianceControlCheckSummary, ProcurementComplianceExceptionItem,
  ProcurementComplianceResult, ProcurementComplianceStatus
} from '../types/module2ProcurementCompliance';
import type { StrategicInputTransaction } from '../types/strategicSourcing';

const clean = (value: unknown): string => String(value ?? '').trim();
const positive = (value: number): number => Number.isFinite(value) && value > 0 ? value : 0;
const amount = (value: number): number => Number(positive(value).toFixed(CONFIG.DECIMAL_PLACES));
const crores = (value: number): number => amount(value / CONFIG.INR_PER_CRORE);
const supplierKey = (row: StrategicInputTransaction): string => clean(row.vendor_code) || clean(row.vendor_name);
const materialKey = (row: StrategicInputTransaction): string =>
  clean(row.material_code) || clean(row.material_desc).toLowerCase();

export const buildControlChecks = (
  transactions: StrategicInputTransaction[], exceptions: ProcurementComplianceExceptionItem[]
): ComplianceControlCheckSummary[] => CONFIG.CONTROL_CHECKS.map((check) => {
  const matching = exceptions.filter((item) => item.checkType === check.type);
  const eligible = check.type === 'PRICE_INCONSISTENCY'
    ? transactions.filter((row) => materialKey(row) && clean(row.uom) && positive(row.unit_price)).length
    : check.type === 'PO_TRANSACTION_EXCEPTION'
      ? transactions.filter((row) => clean(row.po_number)).length
      : check.type === 'PURCHASE_PATTERN_EXCEPTION'
        ? transactions.filter((row) => clean(row.po_date) && materialKey(row) && supplierKey(row)).length
        : 0;
  const unavailable = check.type === 'SOURCING_APPROVAL_GAP' || check.type === 'PAYMENT_COMMERCIAL_EXCEPTION' ||
    check.type === 'CONTRACT_COMPLIANCE_DISCLOSURE';
  const reviewed = matching.reduce((total, item) => total + item.expenditureUnderReviewInr, 0);
  const exposure = matching.reduce((total, item) => total + item.potentialFinancialExposureInr, 0);
  return {
    checkType: check.type,
    checkTitle: check.title,
    eligibleTransactionsCount: eligible,
    exceptionsIdentifiedCount: matching.length,
    expenditureUnderReviewInr: amount(reviewed),
    expenditureUnderReviewCr: crores(reviewed),
    potentialFinancialExposureInr: amount(exposure),
    potentialFinancialExposureCr: crores(exposure),
    dataCoveragePct: transactions.length ? amount(eligible / transactions.length * 100) : 0,
    ...(unavailable ? { primaryDataGapNotice: CONFIG.REQUIRED_SOURCE_FIELDS_GAP }
      : eligible === 0 ? { primaryDataGapNotice: CONFIG.NO_COMPLIANCE_EVIDENCE } : {})
  };
});

export const buildComplianceSummary = (
  tenantId: string, customerName: string,
  transactions: StrategicInputTransaction[], exceptions: ProcurementComplianceExceptionItem[]
): ProcurementComplianceResult['summary'] => {
  const totalReview = amount(exceptions.reduce((total, item) => total + item.expenditureUnderReviewInr, 0));
  const uniqueTransactions = new Map<string, number>();
  for (const item of exceptions) {
    for (const row of item.supportingTransactions) {
      if (row.transactionId && !uniqueTransactions.has(row.transactionId)) {
        uniqueTransactions.set(row.transactionId, positive(row.totalSpendInr));
      }
    }
  }
  const uniqueReview = amount([...uniqueTransactions.values()].reduce((total, value) => total + value, 0));
  const totalExposure = amount(exceptions.reduce((total, item) => total + item.potentialFinancialExposureInr, 0));
  const byExposure = (status: ProcurementComplianceExceptionItem['financialExposureStatus']): number =>
    amount(exceptions.filter((item) => item.financialExposureStatus === status)
      .reduce((total, item) => total + item.potentialFinancialExposureInr, 0));
  const count = (status: ProcurementComplianceStatus): number =>
    exceptions.filter((item) => item.reviewStatus === status).length;
  const nonQuantifiableExceptionsCount = exceptions.filter((item) =>
    item.financialExposureStatus === 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED' ||
    item.financialExposureStatus === 'VERIFIED_EXCEPTION_IMPACT_NOT_YET_ESTABLISHED'
  ).length;
  return {
    tenantId,
    customerName,
    totalTransactionsReviewedCount: transactions.length,
    totalExceptionsIdentifiedCount: exceptions.length,
    awaitingReviewCount: count('AWAITING_REVIEW'),
    verifiedExceptionsCount: count('VERIFIED_EXCEPTION'),
    dismissedCount: count('NOT_AN_EXCEPTION'),
    potentialExceptionsCount: count('POTENTIAL_EXCEPTION'),
    dataInsufficientCount: count('DATA_INSUFFICIENT'),
    totalExpenditureUnderReviewInr: totalReview,
    totalExpenditureUnderReviewCr: crores(totalReview),
    totalPotentialFinancialExposureInr: totalExposure,
    totalPotentialFinancialExposureCr: crores(totalExposure),
    uniqueExpenditureUnderReviewInr: uniqueReview,
    uniqueExpenditureUnderReviewCr: crores(uniqueReview),
    priceVarianceInvestigationInr: byExposure('PRICE_VARIANCE_INVESTIGATION_SIGNAL'),
    priceVarianceInvestigationCr: crores(byExposure('PRICE_VARIANCE_INVESTIGATION_SIGNAL')),
    samePoScheduleDuplicateInr: byExposure('POTENTIAL_PO_SCHEDULE_DUPLICATE'),
    samePoScheduleDuplicateCr: crores(byExposure('POTENTIAL_PO_SCHEDULE_DUPLICATE')),
    crossPoDuplicateInr: byExposure('POTENTIAL_DUPLICATE_TRANSACTION'),
    crossPoDuplicateCr: crores(byExposure('POTENTIAL_DUPLICATE_TRANSACTION')),
    totalAwaitingApVerificationInr: 0,
    totalAwaitingApVerificationCr: 0,
    otherGovernanceExceptionsCount: exceptions.filter((item) =>
      item.checkType !== 'PRICE_INCONSISTENCY' && item.checkType !== 'PO_TRANSACTION_EXCEPTION'
    ).length,
    quantifiedDefensibleExposureInr: 0,
    quantifiedDefensibleExposureCr: 0,
    verifiedFinancialImpactInr: 0,
    verifiedFinancialImpactCr: 0,
    crossCheckOverlapAmountInr: amount(Math.max(0, totalReview - uniqueReview)),
    crossCheckOverlapAmountCr: crores(Math.max(0, totalReview - uniqueReview)),
    nonQuantifiableExceptionsCount,
    totalDisclosedDataGapsCount: exceptions.reduce((total, item) => total + item.dataGapsDisclosed.length, 0),
    contractComplianceStatus: CONFIG.CONTRACT_STATUS,
    financialDisclaimer: CONFIG.FINANCIAL_DISCLAIMER
  };
};
