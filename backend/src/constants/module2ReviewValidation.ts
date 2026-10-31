import { z } from 'zod';
import { MODULE2_D1_COMPLIANCE_REVIEW_STATUSES } from './module2ProcurementComplianceD1';

export const specificationReviewSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120),
  candidateId: z.string().trim().min(1).max(120),
  status: z.enum(['TECHNICALLY_VERIFIED', 'REJECTED', 'AWAITING_TECHNICAL_REVIEW']),
  reviewerName: z.string().trim().min(1).max(120),
  reviewerRole: z.string().trim().max(120).optional(),
  technicalJustification: z.string().trim().min(1).max(2000),
  proposedStandard: z.string().trim().max(500).optional(),
  applicationScope: z.string().trim().max(500).optional(),
  rejectionReason: z.string().trim().max(1000).optional()
}).refine((payload) => payload.status !== 'REJECTED' || Boolean(payload.rejectionReason), {
  message: 'A rejection reason is required when rejecting a specification candidate.',
  path: ['rejectionReason']
});

export const materialMappingUpdateSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120),
  sourceMaterialId: z.string().trim().min(1).max(120),
  unspscCode: z.string().trim().regex(/^\d{8}$/),
  reviewStatus: z.enum(['PROVISIONAL', 'CLIENT_APPROVED', 'TAXONOMY_VERIFIED']),
  confidenceScore: z.number().finite().min(0).max(1).optional(),
  mappingMethod: z.enum([
    'EXACT_IDENTIFIER', 'MATERIAL_DESCRIPTION_MATCH', 'SPECIFICATION_OR_SYNONYM',
    'CONTEXTUAL_HEURISTIC', 'MANUAL_REVIEW_REQUIRED'
  ]).optional(),
  reviewedBy: z.string().trim().min(1).max(120).optional(),
  auditNotes: z.string().trim().max(1000).optional()
});

export const materialMappingBulkUpdateSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120),
  mappings: z.array(materialMappingUpdateSchema.omit({ assessmentId: true, reviewedBy: true }))
    .min(1).max(100)
    .refine((mappings) => new Set(mappings.map((mapping) => mapping.sourceMaterialId)).size === mappings.length, {
      message: 'Each source material can appear only once in a bulk mapping update.'
    })
});

export const materialMappingRecordSchema = z.object({
  sourceMaterialId: z.string().trim().min(1).max(120),
  sourceDescription: z.string(),
  sourceCategory: z.string(),
  assignedUnspscCode: z.string().regex(/^\d{8}$/),
  assignedUnspscTitle: z.string().min(1),
  unspscSegment: z.string(),
  unspscFamily: z.string(),
  unspscClass: z.string(),
  unspscCommodity: z.string(),
  taxonomyVersion: z.string(),
  mappingMethod: z.enum([
    'EXACT_IDENTIFIER', 'MATERIAL_DESCRIPTION_MATCH', 'SPECIFICATION_OR_SYNONYM',
    'CONTEXTUAL_HEURISTIC', 'MANUAL_REVIEW_REQUIRED'
  ]),
  confidenceScore: z.number().min(0).max(1),
  evidence: z.string(),
  reviewStatus: z.enum(['TAXONOMY_VERIFIED', 'PROVISIONAL', 'AWAITING_REVIEW', 'CLIENT_APPROVED', 'APPROVED']),
  coreBucket: z.string().trim().max(80).optional(),
  mappingDate: z.string(),
  totalSpendInr: z.number().nonnegative(),
  totalSpendCr: z.number().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
  qualifyingSuppliersCount: z.number().int().nonnegative(),
  reviewReason: z.string().optional(),
  reviewedBy: z.string().optional(),
  auditNotes: z.string().optional()
});

export const procurementComplianceReviewSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120),
  candidateId: z.string().trim().min(1).max(120),
  status: z.enum(MODULE2_D1_COMPLIANCE_REVIEW_STATUSES),
  reviewerName: z.string().trim().max(120).optional(),
  reviewerRole: z.string().trim().max(120).optional(),
  technicalJustification: z.string().trim().min(8).max(2000),
  correctiveActionPlan: z.string().trim().max(1000).optional(),
  dismissalReason: z.string().trim().max(1000).optional()
}).refine((payload) => payload.status !== 'NOT_AN_EXCEPTION' || Boolean(payload.dismissalReason), {
  message: 'A dismissal reason is required when the procurement exception is dismissed.',
  path: ['dismissalReason']
});

export const eAuctionPlanningAssumptionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  categoryOrMaterial: z.string().trim().min(1).max(200),
  minSavingsRate: z.number().finite().min(0).max(1),
  expectedSavingsRate: z.number().finite().min(0).max(1),
  maxSavingsRate: z.number().finite().min(0).max(1),
  rateSource: z.string().trim().min(1).max(300),
  referencePeriod: z.string().trim().min(1).max(120),
  applicability: z.string().trim().min(1).max(1000),
  approvalStatus: z.enum([
    'Proposed Planning Assumption — Approval Required', 'APPROVED', 'PENDING_APPROVAL', 'UNQUANTIFIABLE'
  ]),
  approvedBy: z.string().trim().min(1).max(120).optional(),
  approvedDate: z.string().datetime().optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NOT_ESTABLISHED']),
  isPlanningAssumptionOnly: z.literal(true),
  notes: z.string().trim().max(1000).optional()
}).refine((assumption) => assumption.minSavingsRate <= assumption.expectedSavingsRate &&
  assumption.expectedSavingsRate <= assumption.maxSavingsRate, {
  message: 'Planning rates must satisfy minimum <= expected <= maximum.',
  path: ['expectedSavingsRate']
});
