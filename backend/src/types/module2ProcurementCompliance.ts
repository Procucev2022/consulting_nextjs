/**
 * Module 2 — Lever 9: Procurement Compliance & Control
 * Data Types & Interfaces
 * Compliant with Rule 8, 9, max 300 lines, line length <= 120 chars
 */

import type { StrategicInputTransaction } from './strategicSourcing';

export type ProcurementComplianceStatus =
  | 'POTENTIAL_EXCEPTION'
  | 'AWAITING_REVIEW'
  | 'VERIFIED_EXCEPTION'
  | 'NOT_AN_EXCEPTION'
  | 'DATA_INSUFFICIENT';

export type ProcurementComplianceCheckType =
  | 'PRICE_INCONSISTENCY'
  | 'PURCHASE_PATTERN_EXCEPTION'
  | 'PO_TRANSACTION_EXCEPTION'
  | 'SOURCING_APPROVAL_GAP'
  | 'PAYMENT_COMMERCIAL_EXCEPTION'
  | 'CONTRACT_COMPLIANCE_DISCLOSURE';

export type FinancialExposureClassification =
  | 'PRICE_VARIANCE_INVESTIGATION_SIGNAL'
  | 'POTENTIAL_PO_SCHEDULE_DUPLICATE'
  | 'POTENTIAL_DUPLICATE_TRANSACTION'
  | 'POTENTIAL_EXPOSURE_REQUIRES_VALIDATION'
  | 'NOT_YET_QUANTIFIABLE_ADDITIONAL_DATA_REQUIRED'
  | 'VERIFIED_EXCEPTION_IMPACT_NOT_YET_ESTABLISHED';

export interface ComplianceReviewRecord {
  reviewId: string;
  exceptionId?: string;
  reviewerName: string;
  reviewerRole?: string;
  reviewDate: string;
  timestamp?: string;
  previousStatus?: ProcurementComplianceStatus;
  status: ProcurementComplianceStatus;
  decision?: string;
  technicalJustification: string;
  correctiveActionPlan?: string;
  dismissalReason?: string;
  supportingReferences?: string[];
}

export interface ComplianceSupportingTransaction {
  transactionId?: string;
  poNumber: string;
  invoiceNumber?: string;
  poDate: string;
  vendorCode: string;
  vendorName: string;
  materialCode: string;
  materialDesc: string;
  plant?: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalSpendInr: number;
  currency: string;
  paymentTerms?: string;
}

export interface ProcurementComplianceExceptionItem {
  exceptionId: string;
  checkType: ProcurementComplianceCheckType;
  checkTitle: string;
  spendCategory: string;
  vendorName: string;
  vendorCode?: string;
  materialCode?: string;
  materialDesc: string;
  plant?: string;
  supportingTransactionsCount: number;
  expenditureUnderReviewInr: number;
  expenditureUnderReviewCr: number;
  potentialFinancialExposureInr: number;
  potentialFinancialExposureCr: number;
  financialExposureStatus: FinancialExposureClassification;
  financialExposureStatusLabel: string;
  methodologyDescription: string;
  evidenceDetails: string[];
  dataGapsDisclosed: string[];
  reviewStatus: ProcurementComplianceStatus;
  reviewHistory: ComplianceReviewRecord[];
  potentialRelatedLevers: string[];
  nextActionRequired: string;
  supportingTransactions: ComplianceSupportingTransaction[];
}

export interface ComplianceControlCheckSummary {
  checkType: ProcurementComplianceCheckType;
  checkTitle: string;
  eligibleTransactionsCount: number;
  exceptionsIdentifiedCount: number;
  expenditureUnderReviewInr: number;
  expenditureUnderReviewCr: number;
  potentialFinancialExposureInr: number;
  potentialFinancialExposureCr: number;
  dataCoveragePct: number;
  primaryDataGapNotice?: string;
}

export interface ProcurementComplianceSummary {
  tenantId: string;
  customerName: string;
  totalTransactionsReviewedCount: number;
  totalExceptionsIdentifiedCount: number;
  awaitingReviewCount: number;
  verifiedExceptionsCount: number;
  dismissedCount: number;
  potentialExceptionsCount: number;
  dataInsufficientCount: number;
  totalExpenditureUnderReviewInr: number;
  totalExpenditureUnderReviewCr: number;
  totalPotentialFinancialExposureInr: number;
  totalPotentialFinancialExposureCr: number;
  uniqueExpenditureUnderReviewInr: number;
  uniqueExpenditureUnderReviewCr: number;
  priceVarianceInvestigationInr: number;
  priceVarianceInvestigationCr: number;
  samePoScheduleDuplicateInr: number;
  samePoScheduleDuplicateCr: number;
  crossPoDuplicateInr: number;
  crossPoDuplicateCr: number;
  totalAwaitingApVerificationInr: number;
  totalAwaitingApVerificationCr: number;
  otherGovernanceExceptionsCount: number;
  quantifiedDefensibleExposureInr: number;
  quantifiedDefensibleExposureCr: number;
  verifiedFinancialImpactInr: number;
  verifiedFinancialImpactCr: number;
  crossCheckOverlapAmountInr: number;
  crossCheckOverlapAmountCr: number;
  nonQuantifiableExceptionsCount: number;
  totalDisclosedDataGapsCount: number;
  contractComplianceStatus: string;
  financialDisclaimer: string;
}

export interface ProcurementComplianceReviewPayload {
  candidateId: string;
  status: 'VERIFIED_EXCEPTION' | 'NOT_AN_EXCEPTION' | 'AWAITING_REVIEW';
  reviewerName: string;
  reviewerRole?: string;
  technicalJustification: string;
  correctiveActionPlan?: string;
  dismissalReason?: string;
}

export interface ProcurementComplianceOptions {
  reviews?: Record<string, ComplianceReviewRecord | ComplianceReviewRecord[]>;
}

export interface ProcurementComplianceResult {
  assessmentId: string;
  customerName: string;
  calculatedAt: string;
  summary: ProcurementComplianceSummary;
  controlChecks: ComplianceControlCheckSummary[];
  exceptions: ProcurementComplianceExceptionItem[];
  methodologySafeguards: string[];
  financialDisclaimer: string;
  contractComplianceNotice: string;
}

export interface ComplianceReviewStatusCounts {
  awaiting: number;
  verified: number;
  dismissed: number;
  potential: number;
  insufficient: number;
}

export interface ComplianceFinancialAggregation {
  totalExposureInr: number;
  priceVarianceInr: number;
  samePoScheduleDuplicateInr: number;
  crossPoDuplicateInr: number;
  otherGovernanceExceptionsCount: number;
  nonQuantifiable: number;
}

export interface CategorySpendAggregation {
  totalSpend: number;
  supplierSpend: Map<string, { spend: number; txs: StrategicInputTransaction[] }>;
}

export interface ComplianceAuthUser {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}

export interface ComplianceAuthCheckResult {
  authorized: boolean;
  statusCode?: number;
  message?: string;
  user?: ComplianceAuthUser;
}
