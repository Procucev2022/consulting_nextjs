/**
 * Admin Input Validation Schemas (Frontend)
 */

import { z } from 'zod';

export const adminLoginFormSchema = z.object({
  email: z.string().email('Valid administrator email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const createAdminDetailsSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(100).default('System Administrator'),
    email: z.string().email('Valid administrator email is required').toLowerCase().default('admin@procucev.com'),
    mobile_number: z.string().min(8, 'Mobile number must be at least 8 digits').max(20).default('+91 98765 43210'),
    company_name: z.string().min(2, 'Company name is required').max(150).default('aiCEV Procucev Enterprise Inc.'),
    company_address: z
      .string()
      .min(5, 'Company address is required')
      .max(300)
      .default('Floor 14, Brigade Gateway, Malleshwaram, Bengaluru 560055, Karnataka, India'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100).default('Procucev@123'),
    confirm_password: z.string().optional(),
    role: z.enum(['ADMIN']).default('ADMIN'),
    subscription_tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).default('GOLD')
  })
  .refine((data) => !data.confirm_password || data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password']
  });

export type AdminLoginFormInput = z.infer<typeof adminLoginFormSchema>;
export type CreateAdminDetailsInput = z.infer<typeof createAdminDetailsSchema>;
