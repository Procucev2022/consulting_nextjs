import { z } from 'zod';

export const pcbiResearchPdfExtractionSchema = z.object({
  observations: z.array(z.object({
    observationDate: z.string().trim().min(1),
    value: z.number().finite().positive(),
    unit: z.string().trim().nullable().optional(),
    currency: z.string().trim().nullable().optional(),
    geography: z.string().trim().nullable().optional()
  })).min(1)
});
