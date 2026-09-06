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
  total_spend_evaluated_inr: z.number().positive().optional(),
  target_savings_rate_pct: z.number().nonnegative().optional(),
  erp_source: z.string().optional(),
  refresh_cycle: z.string().optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field to update must be provided'
});

// Ingestion Add File Body Schema
export const addIngestionFileSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.string().min(1, 'File type is required'),
  file_size_mb: z.number().positive('File size must be positive'),
  records_count: z.number().int().nonnegative('Records count must be non-negative').optional().default(0)
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
  year: z.string().or(z.number()).optional()
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
