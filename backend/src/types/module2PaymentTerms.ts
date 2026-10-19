/**
 * Module 2 — Lever 5: Payment Terms Optimisation Types & Interfaces
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

export type PaymentTermsDataAvailabilityStatus =
  | 'OPPORTUNITY_IDENTIFIED'
  | 'DATA_PARTIALLY_AVAILABLE'
  | 'DATA_UNAVAILABLE'
  | 'AWAITING_VALIDATION'
  | 'NOT_YET_QUANTIFIABLE';

export type PaymentTermsDataGapReason =
  | 'FIELD_NOT_IN_SOURCE_ERP'
  | 'UNPARSEABLE_PAYMENT_TERM_FORMAT'
  | 'INCONSISTENT_HEADER_AND_LINE_TERMS'
  | 'ADVANCE_OR_NON_CREDIT_TERMS'
  | 'MISSING_INVOICE_OR_DUE_DATE';

export interface PaymentTermsRecordCoverage {
  recordId: string;
  vendorCode: string;
  vendorName: string;
  poNumber: string;
  poDate: string;
  spendInr: number;
  rawPaymentTerms?: string;
  parsedCreditDays?: number;
  hasDiscountTerms: boolean;
  discountPercent?: number;
  discountDays?: number;
  coverageStatus: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  gapReason?: PaymentTermsDataGapReason;
  gapDetails?: string;
  requiresValidation: boolean;
}

export interface PaymentTermsOpportunity {
  opportunityId: string;
  supplierCode: string;
  supplierName: string;
  spendCategory: string;
  annualSpendInr: number;
  annualSpendCr: number;
  currentPaymentTerms: string;
  currentCreditDays: number;
  targetPaymentTerms: string;
  targetCreditDays: number;
  additionalCreditDays: number;
  financingRatePer30Days: number;
  indicativeAnnualFinancingBenefitInr: number;
  indicativeAnnualFinancingBenefitCr: number;
  indicativeWorkingCapitalReleasedInr: number;
  indicativeWorkingCapitalReleasedCr: number;
  earlyPaymentDiscountRate?: number;
  earlyPaymentAnnualSpendInr?: number;
  availabilityStatus: PaymentTermsDataAvailabilityStatus;
  statusLabel: string;
  evidenceSource: string;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isScenario: boolean;
}

export interface SupplierPaymentTermsProfile {
  supplierCode: string;
  supplierName: string;
  spendCategory: string;
  totalSpendInr: number;
  totalSpendCr: number;
  transactionCount: number;
  observedPaymentTerms: string[];
  primaryPaymentTerms: string;
  weightedAvgCreditDays: number;
  dataAvailability: PaymentTermsDataAvailabilityStatus;
  indicativeWorkingCapitalReleasedCr: number;
  indicativeFinancingBenefitCr: number;
  earlyPaymentDiscountOpportunityCr: number;
  requiresValidation: boolean;
}

export interface PaymentTermsCoverageSummary {
  assessmentId: string;
  totalSpendAnalysedInr: number;
  totalSpendAnalysedCr: number;
  verifiedSpendInr: number;
  verifiedSpendCr: number;
  missingSpendInr: number;
  missingSpendCr: number;
  verifiedSpendPct: number;
  missingSpendPct: number;
  totalRecordsCount: number;
  completeRecordsCount: number;
  partialRecordsCount: number;
  missingRecordsCount: number;
  recordsRequiringValidationCount: number;
  gapReasonCounts: Record<string, number>;
  overallDataAvailabilityStatus: PaymentTermsDataAvailabilityStatus;
  overallStatusDisplayText: string;
  reconciliationDeltaInr: number;
  procucevModellingRatePctPer30Days: number;
  totalWorkingCapitalReleasedCr: number;
  totalFinancingBenefitCr: number;
  totalEarlyPaymentDiscountsCr: number;
}

export interface PaymentTermsCalculationOptions {
  customFinancingRatePer30Days?: number;
  targetCreditDaysScenario?: number;
  authorizedOverrideReason?: string;
  authorizedBy?: string;
}

export interface PaymentTermsResult {
  assessmentId: string;
  coverageSummary: PaymentTermsCoverageSummary;
  opportunities: PaymentTermsOpportunity[];
  supplierProfiles: SupplierPaymentTermsProfile[];
  coverageRecords: PaymentTermsRecordCoverage[];
  methodologyDisclosures: string[];
}
