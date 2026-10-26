/**
 * Module 2 — Cross-Lever Savings Deduplication Validation Schemas
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 8, 10: Centralized validation schemas
 */

import { z } from 'zod';

export const consolidatedSavingsQuerySchema = z.object({
  assessmentId: z.string().min(1, 'Assessment identifier (assessmentId) is required'),
  refresh: z.string().optional().transform((val) => val === 'true'),
  allowUnverifiedIncremental: z.string().optional().transform((val) => val === 'true')
});

export const updateOpportunityCommercialApprovalSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment identifier is required'),
  opportunityId: z.string().min(1, 'Opportunity identifier is required'),
  approvalStatus: z.enum(['APPROVED', 'PENDING_REVIEW', 'EXCLUDED_FROM_NET']),
  approvedSavingsInr: z.number().nonnegative().optional(),
  approverComments: z.string().optional()
});
