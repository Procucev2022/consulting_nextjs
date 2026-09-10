/**
 * Centralized Validation Schemas (Frontend)
 * 
 * Single source of truth for all runtime input schema validation across frontend
 * modals, forms, user input controls, and outgoing API requests.
 */

import { z } from 'zod';

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
  estimatedSpend: z.number().positive('Estimated spend must be positive'),
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
  targetSavingsPct: z.number().min(0, 'Target savings cannot be negative').max(100, 'Target savings cannot exceed 100%'),
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
  total_spend_evaluated_inr: z.number().positive().optional(),
  target_savings_rate_pct: z.number().nonnegative().optional()
});

export const apiAddIngestionFilePayloadSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  file_type: z.string().optional(),
  file_size_mb: z.number().positive().optional(),
  records_count: z.number().int().nonnegative().optional()
}).passthrough();

export const apiUpdateValidationRecordPayloadSchema = z.object({
  record_id: z.string().min(1, 'Record ID is required'),
  vendor_raw: z.string().optional(),
  vendor_normalized: z.string().optional(),
  currency_original: z.string().optional(),
  currency_normalized: z.string().optional(),
  resolved: z.boolean().optional(),
  issue_flag: z.string().optional(),
  notes: z.string().optional()
}).passthrough();


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
