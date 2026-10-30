/**
 * Types inferred from the Executive Brief request schemas.
 */
import type { z } from 'zod';
import type {
  executiveBriefClientQuerySchema,
  executiveBriefRegenerateBodySchema
} from '../constants/executiveBriefValidation';

export type ExecutiveBriefClientQuery = z.infer<typeof executiveBriefClientQuerySchema>;
export type ExecutiveBriefRegenerateBody = z.infer<typeof executiveBriefRegenerateBodySchema>;
