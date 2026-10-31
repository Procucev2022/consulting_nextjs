import { z } from 'zod';

export const assignPcbiResearchSchema = z.object({
  pcbiId: z.string().trim().min(1).max(120),
  assignee: z.string().trim().min(1).max(200).nullable()
});
