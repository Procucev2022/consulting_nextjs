/**
 * Executive Brief request schemas. Every query and body accepted by the executive brief routes is parsed here
 * before any certified-data lookup or rendering happens.
 */
import { z } from 'zod';
import { EXECUTIVE_BRIEF_CLIENT_NAME_MAX_LENGTH } from './executiveBriefRouteConstants';

const clientNameSchema = z.string().trim().min(1).max(EXECUTIVE_BRIEF_CLIENT_NAME_MAX_LENGTH);

export const executiveBriefRegenerateBodySchema = z.object({
  client: clientNameSchema.optional()
});

export const executiveBriefEmailBodySchema = z.object({
  buyerEmail: z.string().trim().email().max(254)
}).strict();
