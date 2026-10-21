/**
 * Module 2 — Cross-Lever Savings Deduplication Validation Types
 * Version: MODULE_2_SAVINGS_DEDUPLICATION_V1.0
 * Compliant with Rule 9, 10: Derived types from validation schemas
 */

import type { z } from 'zod';
import type {
  consolidatedSavingsQuerySchema,
  updateOpportunityCommercialApprovalSchema
} from '../constants/module2SavingsDeduplicationValidation';

export type ConsolidatedSavingsQueryInput = z.infer<typeof consolidatedSavingsQuerySchema>;
export type UpdateOpportunityCommercialApprovalInput = z.infer<typeof updateOpportunityCommercialApprovalSchema>;
