/**
 * Orchestration Input Validation Schemas (Prompt 302, Section 10)
 */

import { z } from 'zod';

export const pcbiGapResolutionSchema = z.object({
  action: z.enum([
    'ADD_MAP_PCBI',
    'MAP_EXISTING',
    'EXCLUDE',
    'MARK_NOT_BENCHMARKABLE',
    'MARK_SERVICE',
    'REQUEST_RESEARCH'
  ]),
  targetPcbiSeries: z.string().optional(),
  exclusionReason: z.enum([
    'NOT_BENCHMARKABLE',
    'CUSTOM_ENGINEERED_ITEM',
    'SERVICE',
    'NO_RELIABLE_MARKET_BENCHMARK',
    'INSUFFICIENT_MARKET_DATA',
    'CUSTOMER_SPECIFIC_SPECIFICATION',
    'BELOW_MATERIALITY_THRESHOLD',
    'OTHER'
  ]).optional(),
  exclusionNotes: z.string().optional(),
  researchNotes: z.string().optional()
}).refine((data) => {
  if (data.action === 'EXCLUDE' && !data.exclusionReason) {
    return false;
  }
  if (data.exclusionReason === 'OTHER' && (!data.exclusionNotes || data.exclusionNotes.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Mandatory exclusion reason and notes required when excluding items'
});

export const reanalysisUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileBase64: z.string().optional(),
  fileType: z.string().default('XLSX'),
  fileSizeMb: z.number().nonnegative().optional(),
  reason: z.enum([
    'INCORRECT_CATEGORY_MAPPING',
    'MISSING_TRANSACTIONS',
    'DUPLICATE_TRANSACTIONS',
    'INCORRECT_SUPPLIER_MAPPING',
    'INCORRECT_PLANT_MAPPING',
    'INCORRECT_QUANTITY_VALUE',
    'INCORRECT_MATERIAL_DESCRIPTION',
    'CUSTOMER_CLARIFICATION',
    'PCBI_MAPPING_CORRECTION',
    'OTHER'
  ]),
  notes: z.string().optional()
}).refine((data) => {
  if (data.reason === 'OTHER' && (!data.notes || data.notes.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Explanatory notes are required when reason is OTHER'
});

export const qualityGateChecklistSchema = z.object({
  dataQuality: z.object({
    sourceDataValidated: z.boolean(),
    spendReconciles: z.boolean(),
    duplicateChecksCompleted: z.boolean(),
    classificationReviewed: z.boolean()
  }),
  pcbi: z.object({
    requiredPcbiCategoriesResolved: z.boolean(),
    benchmarkSourcesValidated: z.boolean(),
    exclusionsDocumented: z.boolean(),
    pcbiCoverageAcceptable: z.boolean()
  }),
  financial: z.object({
    savingsCalculationsValidated: z.boolean(),
    noDoubleCounting: z.boolean(),
    overlapsHandled: z.boolean(),
    exclusionsApplied: z.boolean(),
    totalsReconcile: z.boolean()
  }),
  report: z.object({
    module1Reviewed: z.boolean(),
    module2Reviewed: z.boolean(),
    module3Reviewed: z.boolean(),
    module4Reviewed: z.boolean(),
    executiveSummaryReviewed: z.boolean()
  })
});

export const customerAcknowledgementSchema = z.object({
  reportVersionId: z.string().min(1, 'Report version ID is required'),
  notes: z.string().optional()
});

export const customerCorrectionRequestSchema = z.object({
  category: z.string().min(1, 'Correction category is required'),
  description: z.string().min(5, 'Detailed description is required'),
  supportingFileName: z.string().optional()
});

export const supersedeReportSchema = z.object({
  reportVersionId: z.string().min(1, 'Report version ID is required'),
  reason: z.string().min(5, 'Detailed supersession reason is required')
});
