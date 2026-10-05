/**
 * Admin Input Validation Schemas (Backend)
 */

import { z } from 'zod';

export const createAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').default('System Administrator'),
  email: z.string().email('Invalid email address').default('admin@procucev.com'),
  mobile_number: z.string().min(5, 'Mobile number is required').default('+91 98765 43210'),
  company_name: z.string().min(1, 'Company name is required').default('aiCEV Procucev Enterprise Inc.'),
  company_address: z
    .string()
    .min(1, 'Company address is required')
    .default('Floor 14, Brigade Gateway, Malleshwaram, Bengaluru, Karnataka 560055, India'),
  password: z.string().min(6, 'Password must be at least 6 characters').default('Procucev@123'),
  role: z.enum(['ADMIN']).default('ADMIN'),
  subscription_tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).default('GOLD')
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
