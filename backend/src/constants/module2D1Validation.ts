import { z } from 'zod';

export const directPriceQuerySchema = z.object({
  financialYear: z.string().trim().regex(/^(?:ALL|UNKNOWN|FY\d{4}-\d{2})$/).optional(),
  category: z.string().trim().min(1).max(200).optional(),
  materialCode: z.string().trim().min(1).max(120).optional()
});
