/**
 * Input validation schemas for the Analysis Orchestration API (path, query and JSON body).
 */
import { z } from 'zod';
import {
  ANALYSIS_JOB_STATUS_VALUES,
  ORCHESTRATION_ID_PATTERN,
  ORCHESTRATION_LIMITS,
  PCBI_GAP_ACTION_VALUES,
  PCBI_GAP_EXCLUSION_REASON_VALUES,
  REANALYSIS_REASON_VALUES
} from './orchestration';
import {
  ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH,
  ASSESSMENT_DATA_VERSION_MAX_BYTES
} from './assessmentValidation';

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

export const uploadCorrectedDatasetSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(ASSESSMENT_DATA_VERSION_MAX_BYTES),
  checksum: z.string().regex(/^[a-f0-9]{64}$/iu),
  expectedChecksum: z.string().regex(/^[a-f0-9]{64}$/iu).optional(),
  fileBase64: z.string().min(1).max(ASSESSMENT_DATA_VERSION_MAX_BASE64_LENGTH),
  reason: z.enum(REANALYSIS_REASON_VALUES),
  notes: z.string().trim().max(ORCHESTRATION_LIMITS.notesMaxLength).optional()
});

export const pcbiGapResolutionSchema = z.object({
  action: z.enum(PCBI_GAP_ACTION_VALUES),
  targetPcbiSeries: z.string().trim().min(1).max(ORCHESTRATION_LIMITS.reportIdMaxLength).optional(),
  exclusionReason: z.enum(PCBI_GAP_EXCLUSION_REASON_VALUES).optional(),
  exclusionNotes: z.string().trim().max(ORCHESTRATION_LIMITS.notesMaxLength).optional(),
  researchNotes: z.string().trim().max(ORCHESTRATION_LIMITS.notesMaxLength).optional()
}).superRefine((value, context) => {
  if ((value.action === 'MAP_EXISTING' || value.action === 'ADD_MAP_PCBI') && !value.targetPcbiSeries) {
    context.addIssue({ code: 'custom', path: ['targetPcbiSeries'], message: 'Select an active PCBI series to map this category.' });
  }
  if (value.action === 'EXCLUDE' && !value.exclusionReason) {
    context.addIssue({ code: 'custom', path: ['exclusionReason'], message: 'Select a reason before excluding this category.' });
  }
  if (value.action === 'EXCLUDE' && value.exclusionReason === 'OTHER' && !value.exclusionNotes) {
    context.addIssue({ code: 'custom', path: ['exclusionNotes'], message: 'Explain the exclusion when the reason is Other.' });
  }
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
