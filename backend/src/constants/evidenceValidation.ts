/**
 * Input schemas for evidence route parameters and query strings.
 * Route params come from the URL path; the query string is parsed by parityQuery.
 */

import { z } from 'zod';
import { EVIDENCE_JOB_ID_PATTERN } from './evidenceRoutes';
import { EVIDENCE_SAVINGS_TYPES, EVIDENCE_WORKBOOK_TYPES } from './evidenceWorkbook';

const jobIdSchema = z
  .string()
  .regex(EVIDENCE_JOB_ID_PATTERN, 'jobId must be 1-128 characters: letters, digits, dot, underscore, or hyphen');

export const evidenceJobParamsSchema = z.object({
  jobId: jobIdSchema
});

export const evidenceWorkbookParamsSchema = z.object({
  jobId: jobIdSchema,
  workbookType: z.enum(EVIDENCE_WORKBOOK_TYPES)
});

export const evidenceSavingsParamsSchema = z.object({
  jobId: jobIdSchema,
  savingsType: z.enum(EVIDENCE_SAVINGS_TYPES)
});

export const evidenceParityQuerySchema = z.object({
  workbookType: z.enum(EVIDENCE_WORKBOOK_TYPES).optional()
});
