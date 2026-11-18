/**
 * Types inferred from the Executive Brief request schemas.
 */
import type { z } from 'zod';
import type {
  executiveBriefEmailBodySchema,
  executiveBriefRegenerateBodySchema,
  executiveBriefScopeQuerySchema
} from '../constants/executiveBriefValidation';

export type ExecutiveBriefRegenerateBody = z.infer<typeof executiveBriefRegenerateBodySchema>;
export type ExecutiveBriefEmailBody = z.infer<typeof executiveBriefEmailBodySchema>;
export type ExecutiveBriefScopeQuery = z.infer<typeof executiveBriefScopeQuerySchema>;
