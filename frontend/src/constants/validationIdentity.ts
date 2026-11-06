import { z } from 'zod';

export const registerFormSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  mobile_number: z.string().min(8, 'Mobile number must be at least 8 digits').max(20),
  email: z.string().email('Valid organization email is required').toLowerCase(),
  company_name: z.string().min(2, 'Company name is required').max(150),
  company_address: z.string().min(5, 'Company address is required').max(300),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
});

export const loginFormSchema = z.object({
  email: z.string().email('Valid organization email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(6, 'Confirm password is required').max(100)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword']
});

export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ALL', 'USER', 'ADMIN']).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  tier: z.enum(['ALL', 'BRONZE', 'SILVER', 'GOLD']).optional()
});

export const adminUpdateUserTierSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD'])
});

export const adminAssignUserTenantSchema = z.object({
  tenant_id: z.string().trim().min(1).max(120)
}).strict();

export const adminTenantSchema = z.object({
  tenant_id: z.string().trim().min(1).max(120),
  enterprise_name: z.string().trim().min(1).max(160),
  status: z.string().trim().min(1).max(40)
});

export const adminTenantsResponseSchema = z.object({
  success: z.boolean(),
  tenants: z.array(adminTenantSchema)
});

export const updateActionPlanSchema = z.object({
  actionId: z.string().min(1, 'actionId is required'),
  status: z.enum(['Open', 'In Progress', 'Completed', 'Deferred']).optional(),
  owner: z.enum(['Procurement', 'SCM', 'Plant', 'Finance', 'Technical', 'Management', 'Other']).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  comments: z.string().optional()
});

export const updateOpportunityStatusSchema = z.object({
  opp_id: z.string().min(1, 'opp_id is required'),
  status: z.enum([
    'IDENTIFIED',
    'UNDER_VALIDATION',
    'VALIDATED',
    'APPROVED',
    'IMPLEMENTING',
    'REALIZED',
    'REJECTED',
    'DEFERRED'
  ])
});

export const createCustomerFormSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry is required'),
  businessUnit: z.string().optional(),
  region: z.string().optional(),
  baseCurrency: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  notes: z.string().optional()
});

export const updateCustomerFormSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').optional(),
  industry: z.string().min(2, 'Industry is required').optional(),
  businessUnit: z.string().optional(),
  region: z.string().optional(),
  baseCurrency: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPerson: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'ONBOARDING']).optional(),
  notes: z.string().optional()
});

export const newAssessmentFormSchema = z.object({
  customerId: z.string().optional(), customerName: z.string().min(2, 'Customer name is required'),
  businessUnit: z.string().optional(), industry: z.string().min(2, 'Industry is required'),
  assessmentPeriodStart: z.string().min(3, 'Period start is required'), assessmentPeriodEnd: z.string().min(3, 'Period end is required'),
  assignedAnalyst: z.string().email('Valid analyst email is required'), assessmentOwner: z.string().optional(),
  currency: z.string().optional(), ndaStatus: z.enum(['NOT_REQUESTED', 'SENT', 'SIGNED', 'EXPIRED']).optional(),
  dataReceivedDate: z.string().optional(), notes: z.string().optional()
});
