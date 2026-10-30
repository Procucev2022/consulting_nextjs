/**
 * Centralized Validation Schemas (Frontend)
 * 
 * Single source of truth for all runtime input schema validation across frontend
 * modals, forms, user input controls, and outgoing API requests.
 */

import { z } from 'zod';
import { TAXONOMY_PAGE_SIZE } from './taxonomy';

export const taxonomyPageRequestSchema = z.object({
  limit: z.number().int().min(1).max(TAXONOMY_PAGE_SIZE),
  offset: z.number().int().nonnegative()
});

export const taxonomyPageResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    commodityCode: z.string().min(1),
    commodityTitle: z.string().min(1),
    classCode: z.string().min(1),
    classTitle: z.string().min(1),
    familyCode: z.string().min(1),
    familyTitle: z.string().min(1),
    segmentCode: z.string().min(1),
    segmentTitle: z.string().min(1),
    coreBucket: z.enum(['Direct Materials', 'Packaging Materials', 'Indirect & MRO', 'Logistics & Freight']).optional()
  }))
});

export const conversionStagesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    phase_num: z.number().int().positive(),
    phase_name: z.string().min(1),
    platform_actionable_focus: z.string(),
    value_outcome_delivered: z.string(),
    commercial_lock_in_metric: z.string(),
    completion_pct: z.number().min(0).max(100),
    status: z.string(),
    spend_evaluated_cr: z.number().optional(),
    count_elements: z.number().optional(),
    percentage_leakage_identified: z.number().optional()
  }))
});

export const databaseSchemaResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(z.object({
    entity_name: z.string().min(1),
    primary_attributes: z.string(),
    system_usage: z.string(),
    sample_records: z.array(z.record(z.string(), z.unknown())),
    ddl: z.string()
  }))
});

export const procurementCategoryMappingsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    mappings: z.record(z.string(), z.string()).refine((value) => Object.keys(value).length > 0),
    categories: z.array(z.string().min(1)).min(1)
  })
});

export const pcbiBenchmarkResponseSchema = z.array(z.object({
  pcbi_id: z.string().min(1),
  benchmark_name: z.string().min(1),
  benchmark_unit: z.string().min(1),
  currency: z.string().min(1)
}).passthrough());

export const pcbiWeeklyIndexResponseSchema = z.array(z.object({
  pcbi_id: z.string().min(1),
  week_start: z.string().min(1),
  index_value: z.number().finite(),
  unit: z.string().optional(),
  currency: z.string().optional()
}).passthrough());

// Header Selection Schemas
export const headerTenantSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required')
});

export const headerCurrencySchema = z.object({
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP'])
});

// Client Ingestion Setup Form Schema
export const clientIngestionSetupFormSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  datasetType: z.enum(['Purchase History', 'Invoice Data', 'Trial Balance']),
  spendPeriod: z.string().min(1, 'Spend period is required'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']),
  region: z.enum(['NA', 'EU', 'APAC', 'GLOBAL']),
  estimatedSpend: z.number().min(0, 'Estimated spend cannot be negative'),
  majorSector: z.string().min(1, 'Major sector is required').optional().default('Chemical & Petrochemicals'),
  minorSector: z.string().min(1, 'Minor sector is required').optional().default('Specialty Chemicals')
});


// Fix Currency Form Schema
export const fixCurrencyFormSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  selectedCurrency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD']),
  convertedAmountINR: z.number().positive('Converted amount must be positive')
});

// Merge Vendor Form Schema
export const mergeVendorFormSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  masterVendorId: z.string().min(1, 'Master supplier ID is required'),
  masterVendorName: z.string().min(1, 'Master supplier name is required')
});

// Merge Item Form Schema
export const mergeItemFormSchema = z.object({
  recordId: z.string().min(1, 'Record ID is required'),
  masterItemCode: z.string().min(1, 'Master item code is required'),
  masterItemName: z.string().min(1, 'Master item name is required')
});

// Reassign Taxonomy Form Schema
export const reassignTaxonomyFormSchema = z.object({
  mappingId: z.string().min(1, 'Mapping ID is required'),
  newCode: z.string().min(1, 'New taxonomy code is required'),
  newName: z.string().min(1, 'New commodity name is required'),
  bucket: z.string().min(1, 'Core bucket is required')
});

// ProCPX Modal Form Schema
export const proCPXFormSchema = z.object({
  oppId: z.string().min(1, 'Opportunity ID is required'),
  eventType: z.enum(['Reverse Auction', 'Multi-Stage RFP', 'Sealed Bid']),
  baselineSpendCr: z.number().positive('Baseline spend must be positive'),
  targetSavingsPct: z.number().min(0, 'Target savings cannot be negative').max(100, 'Target savings cannot exceed 100%').optional().default(10),
  invitedSuppliers: z.array(z.string()).min(1, 'At least one supplier must be invited'),
  auctionEndDate: z.string().min(1, 'Auction end date is required')
});

// DPS NXT Modal Form Schema
export const dpsnxtFormSchema = z.object({
  oppId: z.string().min(1, 'Opportunity ID is required'),
  indexPegging: z.string().min(1, 'Index pegging is required'),
  contractTermMonths: z.number().int().positive('Contract term must be positive'),
  maxPriceCreepCapPct: z.number().min(0, 'Cap cannot be negative').max(100, 'Cap cannot exceed 100%'),
  rateCardCurrency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'])
});

// Executive Report Modal Form Schema
export const executiveReportFormSchema = z.object({
  reportTitle: z.string().min(1, 'Report title is required'),
  audience: z.string().min(1, 'Audience is required'),
  dateRange: z.string().min(1, 'Date range is required'),
  format: z.enum(['pdf', 'csv', 'excel'])
});

// Conversion Realization Calculator Inputs Schema
export const conversionInputsSchema = z.object({
  annualSpendCr: z.number().positive('Annual spend must be positive'),
  savingsRate: z.number().min(0, 'Savings rate cannot be negative').max(100, 'Savings rate cannot exceed 100%'),
  saasFeeRate: z.number().min(0, 'SaaS fee rate cannot be negative').max(100, 'SaaS fee rate cannot exceed 100%')
});

// Outgoing API Request Validation Schemas (Frontend API Boundary)
export const apiUpdateTenantPayloadSchema = z.object({
  enterprise_name: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  base_currency: z.string().min(1).optional(),
  financial_year: z.string().min(1).optional(),
  total_spend_evaluated: z.number().nonnegative().optional(),
  total_spend_evaluated_inr: z.number().nonnegative().optional(),
  target_savings_rate_pct: z.number().nonnegative().optional(),
  major_sector: z.string().min(1).optional(),
  minor_sector: z.string().min(1).optional(),
  status: z.string().optional()
});

export const apiAddIngestionFilePayloadSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.string().optional(),
  file_size_mb: z.number().positive().optional(),
  records_count: z.number().int().nonnegative().optional()
}).passthrough();

export const apiUpdateValidationRecordPayloadSchema = z.object({
  record_id: z.string().trim().min(1, 'Record ID is required').max(120),
  po_number: z.string().trim().min(1).max(200).optional(),
  vendor_name: z.string().trim().min(1).max(300).optional(),
  raw_desc: z.string().trim().min(1).max(1000).optional(),
  order_quantity: z.number().finite().nonnegative().optional(),
  net_price: z.number().finite().nonnegative().optional(),
  subtotal_raw: z.number().finite().nonnegative().optional(),
  amount: z.number().finite().nonnegative().optional(),
  raw_currency: z.string().trim().regex(/^[A-Z]{3}$/).optional(),
  amount_inr: z.number().finite().nonnegative().optional(),
  inr_crores: z.number().finite().nonnegative().optional(),
  fx_rate_applied: z.number().finite().positive().optional(),
  spend_year: z.number().int().min(1900).max(2200).optional(),
  transaction_date: z.string().trim().max(40).optional(),
  column_l_code: z.string().trim().max(120).optional(),
  core_category: z.string().trim().max(120).optional(),
  resolved: z.boolean().optional(),
  issue_flag: z.string().trim().min(1).max(120).optional(),
  action_status: z.string().trim().min(1).max(120).optional()
}).passthrough().refine((value) => Object.keys(value).some((key) => key !== 'record_id'), {
  message: 'At least one validation field must be updated'
});


export const apiMergeVendorPayloadSchema = z.object({
  targetName: z.string().min(1, 'Target name is required'),
  masterId: z.string().min(1, 'Master ID is required'),
  canonicalName: z.string().min(1, 'Canonical name is required')
});

export const apiDeployOpportunityPayloadSchema = z.object({
  opp_id: z.string().min(1, 'Opportunity ID is required'),
  targetModule: z.enum(['proCPX', 'DPS NXT'])
});

export const apiCalculateConversionPayloadSchema = z.object({
  annualSpendCr: z.number().positive(),
  savingsRate: z.number().nonnegative(),
  saasFeeRate: z.number().nonnegative()
});

// User Registration Form Schema
export const registerFormSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  mobile_number: z.string().min(8, 'Mobile number must be at least 8 digits').max(20),
  email: z.string().email('Valid organization email is required').toLowerCase(),
  company_name: z.string().min(2, 'Company name is required').max(150),
  company_address: z.string().min(5, 'Company address is required').max(300),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
});

// User Login Form Schema
export const loginFormSchema = z.object({
  email: z.string().email('Valid organization email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

// Change Password Form Schema
export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(6, 'Confirm password is required').max(100)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New passwords do not match',
  path: ['confirmPassword']
});

// Admin User Query Schema
export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ALL', 'USER', 'ADMIN']).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  tier: z.enum(['ALL', 'BRONZE', 'SILVER', 'GOLD']).optional()
});

// Admin Update User Tier Schema
export const adminUpdateUserTierSchema = z.object({
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD'])
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

// Customer Management Form Schemas (Internal Command Centre)
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
  customerId: z.string().optional(),
  customerName: z.string().min(2, 'Customer name is required'),
  businessUnit: z.string().optional(),
  industry: z.string().min(2, 'Industry is required'),
  assessmentPeriodStart: z.string().min(3, 'Period start is required'),
  assessmentPeriodEnd: z.string().min(3, 'Period end is required'),
  assignedAnalyst: z.string().email('Valid analyst email is required'),
  assessmentOwner: z.string().optional(),
  currency: z.string().optional(),
  ndaStatus: z.enum(['NOT_REQUESTED', 'SENT', 'SIGNED', 'EXPIRED']).optional(),
  dataReceivedDate: z.string().optional(),
  notes: z.string().optional()
});

