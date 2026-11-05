import { z } from 'zod';
import {
  NDA_STATUSES,
  DATA_STATUSES,
  ASSESSMENT_STATUSES
} from './assessment';
import { ASSESSMENT_REVIEW_GATE_KEYS, ASSESSMENT_REVIEW_GATE_STATUSES } from './assessmentD1';

export const createCustomerSchema = z.object({
  customerId: z.string().trim().min(1).optional(),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry is required'),
  businessUnit: z.string().optional(),
  region: z.string().optional(),
  baseCurrency: z.string().optional(),
  companyWebsite: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  notes: z.string().optional()
});

export const updateCustomerSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').optional(),
  industry: z.string().min(2, 'Industry is required').optional(),
  businessUnit: z.string().optional(),
  region: z.string().optional(),
  baseCurrency: z.string().optional(),
  companyWebsite: z.string().optional().or(z.literal('')),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'ONBOARDING']).optional(),
  notes: z.string().optional()
});

export const createAssessmentSchema = z.object({
  assessmentId: z.string().trim().min(1).optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry is required'),
  businessUnit: z.string().optional(),
  assessmentOwner: z.string().optional(),
  companyWebsite: z.string().optional().or(z.literal('')),
  assessmentPeriodStart: z.string().min(4, 'Assessment period start is required'),
  assessmentPeriodEnd: z.string().min(4, 'Assessment period end is required'),
  assignedAnalyst: z.string().email('Assigned analyst must be a valid email').default('analyst@procucev.com'),
  currency: z.string().default('INR'),
  dataReceivedDate: z.string().optional(),
  ndaStatus: z.enum([
    NDA_STATUSES.PENDING,
    NDA_STATUSES.SIGNED,
    NDA_STATUSES.NOT_REQUIRED
  ]).default(NDA_STATUSES.PENDING),
  notes: z.string().optional(),
  initialNotes: z.string().optional(),
  isTestData: z.boolean().optional().default(false)
});

export const updateNdaStatusSchema = z.object({
  ndaStatus: z.enum([
    NDA_STATUSES.PENDING,
    NDA_STATUSES.SIGNED,
    NDA_STATUSES.NOT_REQUIRED
  ]),
  notes: z.string().optional()
});

export const updateDataStatusSchema = z.object({
  dataStatus: z.enum([
    DATA_STATUSES.NOT_RECEIVED,
    DATA_STATUSES.RECEIVED,
    DATA_STATUSES.VALIDATION_IN_PROGRESS,
    DATA_STATUSES.VALIDATED,
    DATA_STATUSES.REQUIRES_CLARIFICATION
  ]),
  notes: z.string().optional()
});

export const updateAssessmentStatusSchema = z.object({
  status: z.enum([
    ASSESSMENT_STATUSES.CREATED,
    ASSESSMENT_STATUSES.NDA_PENDING,
    ASSESSMENT_STATUSES.DATA_PENDING,
    ASSESSMENT_STATUSES.DATA_RECEIVED,
    ASSESSMENT_STATUSES.MODULE_1_READY,
    ASSESSMENT_STATUSES.ANALYSIS_IN_PROGRESS,
    ASSESSMENT_STATUSES.PCBI_REVIEW,
    ASSESSMENT_STATUSES.REPORT_GENERATION,
    ASSESSMENT_STATUSES.ANALYST_REVIEW,
    ASSESSMENT_STATUSES.APPROVED,
    ASSESSMENT_STATUSES.DELIVERED,
    ASSESSMENT_STATUSES.CLOSED,
    ASSESSMENT_STATUSES.BLOCKED
  ]),
  reason: z.string().optional()
});

export const ASSESSMENT_DATA_VERSION_MAX_BYTES = 100 * 1024 * 1024;
export const ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH = Math.ceil(ASSESSMENT_DATA_VERSION_MAX_BYTES / 3) * 4;
export const ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES = ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH + 64 * 1024;

export const uploadDataVersionSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive'),
  checksum: z.string().min(8, 'Valid checksum is required'),
  expectedChecksum: z.string().optional(),
  recordCount: z.number().int().nonnegative().optional().default(0),
  filePath: z.string().optional().default(''),
  notes: z.string().optional(),
  fileBase64: z.string().max(ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH).optional(),
  runAnalysisImmediately: z.boolean().optional().default(false)
});

export const validateAssessmentDatasetSchema = z.object({
  dataVersionId: z.string().min(1).optional()
});

export const ASSESSMENT_DATA_VERSION_ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'] as const;

export const analystApprovalSchema = z.object({
  approvalComment: z.string().min(5, 'Approval comment must be at least 5 characters'),
  analysisRunId: z.string().optional(),
  dataVersionId: z.string().optional()
});

export const deliverPackageSchema = z.object({
  deliveredToEmail: z.string().email('Valid recipient email required'),
  deliveryNotes: z.string().optional(),
  isTestDelivery: z.boolean().optional().default(false)
});

export const assessmentDeliverySchema = z.object({
  recipientEmail: z.string().email('Valid recipient email required').optional(),
  deliveredToEmail: z.string().email('Valid recipient email required').optional(),
  deliveryChannel: z.enum(['EMAIL', 'PORTAL', 'SECURE_LINK', 'MANUAL']).optional(),
  notes: z.string().optional(),
  deliveryNotes: z.string().optional(),
  isTestDelivery: z.boolean().optional().default(false)
}).refine((input) => Boolean(input.recipientEmail || input.deliveredToEmail), {
  path: ['recipientEmail'],
  message: 'A valid delivery recipient email is required'
});

export const assessmentAcceptanceSchema = z.object({
  acceptanceComment: z.string().max(2000).optional(),
  acceptedBy: z.string().email().optional()
});

export const assessmentReviewGateUpdateSchema = z.object({
  gateKey: z.string().refine((key) => ASSESSMENT_REVIEW_GATE_KEYS.includes(key as (typeof ASSESSMENT_REVIEW_GATE_KEYS)[number]), 'Select a supported assessment review gate'),
  status: z.enum(ASSESSMENT_REVIEW_GATE_STATUSES),
  evidenceReference: z.string().trim().max(512).optional().default(''),
  reviewNote: z.string().trim().max(2000).optional().default('')
}).superRefine((input, context) => {
  if (input.status === 'PASSED' && input.evidenceReference.length === 0) {
    context.addIssue({ code: 'custom', path: ['evidenceReference'], message: 'Evidence reference is required to pass a gate' });
  }
  if (input.status === 'BLOCKED' && input.reviewNote.length === 0) {
    context.addIssue({ code: 'custom', path: ['reviewNote'], message: 'A review note is required to block a gate' });
  }
});
