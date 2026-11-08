import { z } from 'zod';

const paymentTermsStatusSchema = z.enum([
  'OPPORTUNITY_IDENTIFIED',
  'DATA_PARTIALLY_AVAILABLE',
  'DATA_UNAVAILABLE',
  'AWAITING_VALIDATION',
  'NOT_YET_QUANTIFIABLE'
]);

const paymentTermsOpportunitySchema = z.object({
  opportunityId: z.string().min(1),
  supplierCode: z.string(),
  supplierName: z.string(),
  spendCategory: z.string(),
  annualSpendInr: z.number().finite(),
  annualSpendCr: z.number().finite(),
  currentPaymentTerms: z.string(),
  currentCreditDays: z.number().finite(),
  targetPaymentTerms: z.string(),
  targetCreditDays: z.number().finite(),
  additionalCreditDays: z.number().finite(),
  financingRatePer30Days: z.number().finite(),
  indicativeAnnualFinancingBenefitInr: z.number().finite(),
  indicativeAnnualFinancingBenefitCr: z.number().finite(),
  indicativeWorkingCapitalReleasedInr: z.number().finite(),
  indicativeWorkingCapitalReleasedCr: z.number().finite(),
  earlyPaymentDiscountRate: z.number().finite().optional(),
  earlyPaymentAnnualSpendInr: z.number().finite().optional(),
  availabilityStatus: paymentTermsStatusSchema,
  statusLabel: z.string(),
  evidenceSource: z.string(),
  approvalStatus: z.enum(['PENDING_APPROVAL', 'APPROVED', 'REJECTED']),
  isScenario: z.boolean()
}).passthrough();

const paymentTermsSupplierProfileSchema = z.object({
  supplierCode: z.string(),
  supplierName: z.string(),
  spendCategory: z.string(),
  totalSpendInr: z.number().finite(),
  totalSpendCr: z.number().finite(),
  transactionCount: z.number().int().nonnegative(),
  observedPaymentTerms: z.array(z.string()),
  primaryPaymentTerms: z.string(),
  weightedAvgCreditDays: z.number().finite(),
  dataAvailability: paymentTermsStatusSchema,
  indicativeWorkingCapitalReleasedCr: z.number().finite(),
  indicativeFinancingBenefitCr: z.number().finite(),
  earlyPaymentDiscountOpportunityCr: z.number().finite(),
  requiresValidation: z.boolean()
}).passthrough();

const paymentTermsCoverageRecordSchema = z.object({
  recordId: z.string(),
  vendorCode: z.string(),
  vendorName: z.string(),
  poNumber: z.string(),
  poDate: z.string(),
  spendInr: z.number().finite(),
  rawPaymentTerms: z.string().optional(),
  parsedCreditDays: z.number().finite().optional(),
  hasDiscountTerms: z.boolean(),
  discountPercent: z.number().finite().optional(),
  discountDays: z.number().finite().optional(),
  coverageStatus: z.enum(['COMPLETE', 'PARTIAL', 'MISSING']),
  gapReason: z.enum([
    'FIELD_NOT_IN_SOURCE_ERP',
    'UNPARSEABLE_PAYMENT_TERM_FORMAT',
    'INCONSISTENT_HEADER_AND_LINE_TERMS',
    'ADVANCE_OR_NON_CREDIT_TERMS',
    'MISSING_INVOICE_OR_DUE_DATE'
  ]).optional(),
  gapDetails: z.string().optional(),
  requiresValidation: z.boolean()
}).passthrough();

const paymentTermsCoverageSummarySchema = z.object({
  assessmentId: z.string().trim().min(1),
  totalSpendAnalysedInr: z.number().finite(),
  totalSpendAnalysedCr: z.number().finite(),
  verifiedSpendInr: z.number().finite(),
  verifiedSpendCr: z.number().finite(),
  missingSpendInr: z.number().finite(),
  missingSpendCr: z.number().finite(),
  verifiedSpendPct: z.number().finite(),
  missingSpendPct: z.number().finite(),
  totalRecordsCount: z.number().int().nonnegative(),
  completeRecordsCount: z.number().int().nonnegative(),
  partialRecordsCount: z.number().int().nonnegative(),
  missingRecordsCount: z.number().int().nonnegative(),
  recordsRequiringValidationCount: z.number().int().nonnegative(),
  gapReasonCounts: z.record(z.string(), z.number().int().nonnegative()),
  overallDataAvailabilityStatus: paymentTermsStatusSchema,
  overallStatusDisplayText: z.string(),
  reconciliationDeltaInr: z.number().finite(),
  procucevModellingRatePctPer30Days: z.number().finite(),
  totalWorkingCapitalReleasedCr: z.number().finite(),
  totalFinancingBenefitCr: z.number().finite(),
  totalEarlyPaymentDiscountsCr: z.number().finite()
}).passthrough();

export const paymentTermsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    assessmentId: z.string().trim().min(1),
    coverageSummary: paymentTermsCoverageSummarySchema,
    opportunities: z.array(paymentTermsOpportunitySchema),
    supplierProfiles: z.array(paymentTermsSupplierProfileSchema),
    coverageRecords: z.array(paymentTermsCoverageRecordSchema),
    methodologyDisclosures: z.array(z.string())
  }).passthrough()
}).passthrough();
