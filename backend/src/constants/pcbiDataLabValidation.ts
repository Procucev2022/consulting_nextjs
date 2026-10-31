import { z } from 'zod';

export const assignPcbiResearchSchema = z.object({
  pcbiId: z.string().trim().min(1).max(120),
  assignee: z.string().trim().min(1).max(200).nullable(),
  status: z.enum(['QUEUED', 'RESEARCHING', 'BLOCKED', 'READY_FOR_REVIEW', 'COMPLETED']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).nullable().optional(),
  notes: z.string().trim().max(1000).optional()
});
