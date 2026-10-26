/**
 * Module 2 — Stage 2: Opportunity Register Validation Schemas
 * Compliant with Repository Rules: Section 10 (Input Schema Validation), max 300 lines, 120 chars
 */

import { z } from 'zod';

export const opportunityRegisterQuerySchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  type: z
    .enum([
      'DIRECT_PRICE_IMPROVEMENT',
      'SUPPLIER_CONSOLIDATION',
      'VOLUME_DEMAND_CONSOLIDATION',
      'SPECIFICATION_PROCESS_REVIEW'
    ])
    .optional(),
  status: z
    .enum(['IDENTIFIED', 'UNDER_REVIEW', 'VALIDATED', 'NEGOTIATION', 'AWARDED', 'REJECTED'])
    .optional(),
  category: z.string().optional(),
  search: z.string().optional()
});

export type OpportunityRegisterQueryInput = z.infer<typeof opportunityRegisterQuerySchema>;
