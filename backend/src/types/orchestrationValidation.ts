/**
 * Types inferred from the Analysis Orchestration validation schemas.
 */
import type { z } from 'zod';
import type {
  acknowledgeReportSchema,
  correctionRequestSchema,
  jobsQuerySchema,
  qualityGateChecklistSchema,
  reportReferenceSchema,
  supersedeReportSchema
} from '../constants/orchestrationValidation';

export type JobsQuery = z.output<typeof jobsQuerySchema>;
export type ReportReferenceBody = z.output<typeof reportReferenceSchema>;
export type SupersedeReportBody = z.output<typeof supersedeReportSchema>;
export type AcknowledgeReportBody = z.output<typeof acknowledgeReportSchema>;
export type CorrectionRequestBody = z.output<typeof correctionRequestSchema>;
export type QualityGateChecklistBody = z.output<typeof qualityGateChecklistSchema>;
