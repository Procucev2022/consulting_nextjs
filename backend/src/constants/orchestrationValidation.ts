/**
 * Input validation schemas for the Analysis Orchestration API (path, query and JSON body).
 */
import { z } from 'zod';
import {
  ANALYSIS_JOB_STATUS_VALUES,
  ORCHESTRATION_ID_PATTERN,
  ORCHESTRATION_LIMITS
} from './orchestration';

const CHECKLIST_NOT_BOOLEAN = 'Every quality gate item must be true or false';

const ID_FORMAT_MESSAGE =
  'Identifier must start with a letter or digit and contain only letters, digits, dots, underscores or hyphens';

export const orchestrationIdSchema = z.string().regex(ORCHESTRATION_ID_PATTERN, ID_FORMAT_MESSAGE);

export const jobsQuerySchema = z.object({
  status: z.enum([...ANALYSIS_JOB_STATUS_VALUES, 'ALL']).optional(),
  search: z.string().trim().max(ORCHESTRATION_LIMITS.searchMaxLength, 'Search text is too long').optional()
});

/** Generate-report takes no fields. Any JSON object is accepted; other JSON shapes are rejected. */
export const emptyBodySchema = z.looseObject({});

export const reportReferenceSchema = z.object({
  reportVersionId: z
    .string()
    .trim()
    .min(1, 'Report version ID is required')
    .max(ORCHESTRATION_LIMITS.reportIdMaxLength, 'Report version ID is too long')
});

const reportIdField = reportReferenceSchema.shape.reportVersionId;

export const supersedeReportSchema = z.object({
  reportVersionId: reportIdField,
  reason: z
    .string()
    .trim()
    .min(ORCHESTRATION_LIMITS.supersedeReasonMinLength, 'Detailed supersession reason is required')
    .max(ORCHESTRATION_LIMITS.supersedeReasonMaxLength, 'Supersession reason is too long')
});

export const acknowledgeReportSchema = z.object({
  reportVersionId: reportIdField,
  notes: z.string().trim().max(ORCHESTRATION_LIMITS.notesMaxLength, 'Notes are too long').optional()
});

export const correctionRequestSchema = z.object({
  category: z
    .string()
    .trim()
    .min(1, 'Correction category is required')
    .max(ORCHESTRATION_LIMITS.correctionCategoryMaxLength, 'Correction category is too long'),
  description: z
    .string()
    .trim()
    .min(ORCHESTRATION_LIMITS.correctionDescriptionMinLength, 'Detailed description is required')
    .max(ORCHESTRATION_LIMITS.correctionDescriptionMaxLength, 'Description is too long'),
  supportingFileName: z
    .string()
    .trim()
    .max(ORCHESTRATION_LIMITS.supportingFileNameMaxLength, 'Supporting file name is too long')
    .optional()
});

const checklistFlag = z.boolean({ error: CHECKLIST_NOT_BOOLEAN });

/** Quality gate checklist as submitted by the admin. Every boolean is kept as received. */
export const qualityGateChecklistSchema = z.object({
  dataQuality: z.object({
    sourceDataValidated: checklistFlag,
    spendReconciles: checklistFlag,
    duplicateChecksCompleted: checklistFlag,
    classificationReviewed: checklistFlag
  }),
  pcbi: z.object({
    requiredPcbiCategoriesResolved: checklistFlag,
    benchmarkSourcesValidated: checklistFlag,
    exclusionsDocumented: checklistFlag,
    pcbiCoverageAcceptable: checklistFlag
  }),
  financial: z.object({
    savingsCalculationsValidated: checklistFlag,
    noDoubleCounting: checklistFlag,
    overlapsHandled: checklistFlag,
    exclusionsApplied: checklistFlag,
    totalsReconcile: checklistFlag
  }),
  report: z.object({
    module1Reviewed: checklistFlag,
    module2Reviewed: checklistFlag,
    module3Reviewed: checklistFlag,
    module4Reviewed: checklistFlag,
    executiveSummaryReviewed: checklistFlag
  })
});
