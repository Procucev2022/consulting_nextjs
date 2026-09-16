/**
 * Centralized Validation Schemas (Backend)
 * 
 * Single source of truth for all runtime input schema validation across API routes,
 * controller bodies, query parameters, and request headers.
 */

import { z } from 'zod';

// Request Headers Validation Schema
export const requestHeadersSchema = z.object({
  'x-request-id': z.string().optional(),
  'content-type': z.string().optional(),
  authorization: z.string().optional()
}).passthrough();

// Tenant Update Body Schema
export const tenantUpdateSchema = z.object({
  enterprise_name: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  base_currency: z.string().min(1).optional(),
  financial_year: z.string().min(1).optional(),
  total_spend_evaluated: z.number().nonnegative().optional(),
  total_spend_evaluated_inr: z.number().nonnegative().optional(),
  target_savings_rate_pct: z.number().nonnegative().optional(),
  erp_source: z.string().optional(),
  refresh_cycle: z.string().optional(),
  major_sector: z.string().min(1).optional(),
  minor_sector: z.string().min(1).optional(),
  status: z.string().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field to update must be provided'
});

// Ingestion Add File Body Schema
export const addIngestionFileSchema = z.object({
  doc_id: z.string().optional(),
  tenant_id: z.string().optional(),
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.string().min(1, 'File type is required'),
  file_size_mb: z.number().positive('File size must be positive'),
  ocr_status: z.enum(['Completed', 'Parsing OCR', 'Pending', 'Error']).optional().default('Completed'),
  progress: z.number().min(0).max(100).optional().default(100),
  uploaded_at: z.string().optional(),
  records_count: z.number().int().nonnegative('Records count must be non-negative').optional().default(0),
  detected_currencies: z.array(z.string()).optional().default(['INR']),
  converted_inr_crores: z.number().nonnegative().optional().default(0),
  unique_items_count: z.number().int().nonnegative().optional(),
  unique_vendors_count: z.number().int().nonnegative().optional(),
  material_groups_count: z.number().int().nonnegative().optional(),
  plants_count: z.number().int().nonnegative().optional()
});


// Ingestion Update Validation Record Body Schema
export const updateValidationRecordSchema = z.object({
  record_id: z.string().min(1, 'record_id is required'),
  vendor_raw: z.string().optional(),
  vendor_normalized: z.string().optional(),
  currency_original: z.string().optional(),
  currency_normalized: z.string().optional(),
  resolved: z.boolean().optional(),
  issue_flag: z.string().optional(),
  notes: z.string().optional()
});

// Vendor Merge Body Schema
export const mergeVendorSchema = z.object({
  targetName: z.string().min(1, 'targetName is required'),
  masterId: z.string().min(1, 'masterId is required'),
  canonicalName: z.string().min(1, 'canonicalName is required')
});

// Savings Opportunity Deploy Body Schema
export const deployOpportunitySchema = z.object({
  opp_id: z.string().min(1, 'opp_id is required'),
  targetModule: z.enum(['proCPX', 'DPS NXT'])
});

// Conversion Metrics Calculation Body Schema
export const calculateConversionMetricsSchema = z.object({
  annualSpendCr: z.number().positive('annualSpendCr must be positive').optional().default(428.5),
  savingsRate: z.number().nonnegative('savingsRate must be non-negative').optional().default(9.4),
  saasFeeRate: z.number().nonnegative('saasFeeRate must be non-negative').optional().default(0.85)
});

// Categories Query Schema
export const categoryQuerySchema = z.object({
  id: z.string().min(1).optional()
});

// Currency Query Schema
export const currencyQuerySchema = z.object({
  from: z.string().optional(),
  amount: z.string().or(z.number()).optional(),
  year: z.string().or(z.number()).optional(),
  date: z.string().optional()
});

// Taxonomy Query Schema
export const taxonomyQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  lookup: z.string().optional()
});

// Logs Search Query Schema
export const logsSearchQuerySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  keyword: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  requestId: z.string().optional(),
  limit: z.string().or(z.number()).optional()
});

// Logs Purge Body/Query Schema
export const logsPurgeSchema = z.object({
  retentionDays: z.number().int().positive('retentionDays must be a positive integer').optional()
});

// GraphQL Request Schema
export const graphQLRequestSchema = z.object({
  query: z.string().min(1, 'GraphQL query or mutation string is required'),
  variables: z.record(z.string(), z.any()).optional().nullable(),
  operationName: z.string().optional().nullable()
});

// Crypto Encrypt Request Schema
export const encryptRequestSchema = z.object({
  data: z.string().min(1, 'Data string to encrypt is required'),
  passphrase: z.string().min(1).optional(),
  associatedData: z.string().optional()
});

// Crypto Decrypt Request Schema
export const decryptRequestSchema = z.object({
  payload: z.union([
    z.string().min(1, 'Encrypted payload string is required'),
    z.object({
      algorithm: z.string().min(1),
      iv: z.string().min(1),
      tag: z.string().min(1),
      ciphertext: z.string().min(1),
      salt: z.string().optional()
    })
  ]),
  passphrase: z.string().min(1).optional(),
  associatedData: z.string().optional()
});

// Authentication Validation Schemas
export const registerUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  mobile_number: z.string().min(8, 'Mobile number must be at least 8 digits').max(20),
  email: z.string().email('Valid organization email is required').toLowerCase(),
  company_name: z.string().min(2, 'Company name is required').max(150),
  company_address: z.string().min(5, 'Company address is required').max(300),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100)
});

export const loginUserSchema = z.object({
  email: z.string().min(1, 'Valid organization email or Buyer ID is required'),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100)
});

export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['ALL', 'USER', 'ADMIN']).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING']).optional()
});

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'PENDING'])
});

// AI Service Validation Schemas
export const aiExtractSchema = z.object({
  documentText: z.string().optional(),
  inlineData: z.string().optional(),
  mimeType: z.string().optional(),
  fileName: z.string().optional()
}).refine((data) => Boolean(data.documentText || data.inlineData), {
  message: 'Either documentText or inlineData must be provided'
});

export const aiCategorizeSchema = z.object({
  items: z.array(
    z.object({
      rawLineText: z.string().min(1, 'rawLineText is required'),
      vendorIdentified: z.string().optional(),
      amount: z.number().optional()
    })
  ).min(1, 'At least one item must be provided for categorization')
});

export const aiExecutiveSummarySchema = z.object({
  tenantName: z.string().optional(),
  totalSpendInrCr: z.number().nonnegative(),
  categories: z.array(
    z.object({
      name: z.string(),
      spendInrCr: z.number(),
      targetReductionPct: z.number()
    })
  ).default([]),
  vendors: z.array(
    z.object({
      vendorName: z.string(),
      totalSpendInrCr: z.number(),
      priceCreepPct: z.number().optional()
    })
  ).default([]),
  currency: z.string().optional()
});

export const aiAnalyzeAnomaliesSchema = z.object({
  records: z.array(
    z.object({
      recordId: z.string().min(1),
      poNumber: z.string(),
      vendorName: z.string(),
      rawCurrency: z.string().optional().nullable(),
      amount: z.number(),
      amountInr: z.number().optional().nullable(),
      issueFlag: z.string().optional()
    })
  ).min(1, 'At least one record is required for anomaly analysis')
});


