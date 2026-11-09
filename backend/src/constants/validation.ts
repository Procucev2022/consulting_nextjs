/**
 * Centralized Validation Schemas (Backend)
 * 
 * Single source of truth for all runtime input schema validation across API routes,
 * controller bodies, query parameters, and request headers.
 */

import { z } from 'zod';
import { D1_REPORTING, D1_TAXONOMY_DEFAULT_LIMIT, D1_TAXONOMY_MAX_LIMIT } from './d1';
import { MODULE2_D1_EAUCTION } from './module2D1Scoped';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from './module2VendorConsolidationD1';
import {
  CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH,
  CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH,
  CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH,
  CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH,
  CLIENT_ERROR_REPORT_MAX_STACK_LENGTH
} from './clientErrorTelemetry';
import { PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT, PCBI_HISTORICAL_QUERY_MAX_LIMIT } from './pcbiHistorical';

export const WORKER_JSON_BODY_MAX_BYTES = 1024 * 1024;
export const REQUEST_ID_HEADER = 'x-request-id';

export const clientErrorReportSchema = z.object({
  level: z.enum(['warn', 'error']),
  source: z.enum(['logger', 'window', 'unhandledrejection', 'react-boundary']),
  errorName: z.string().trim().min(1).max(CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH),
  message: z.string().trim().min(1).max(CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH),
  stack: z.string().max(CLIENT_ERROR_REPORT_MAX_STACK_LENGTH).optional(),
  route: z.string().regex(/^\/(?!\/)[^?#]*$/).max(CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH),
  occurredAt: z.string().datetime(),
  clientRequestId: z.string().min(1).max(CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH).optional()
}).strict();
export { alternateSourcingQuerySchema } from './module2AlternateSourcingD1';
export {
  eAuctionPlanningAssumptionSchema,
  materialMappingBulkUpdateSchema,
  materialMappingRecordSchema,
  materialMappingUpdateSchema,
  procurementComplianceReviewSchema,
  specificationReviewSchema
} from './module2ReviewValidation';
export { pcbiResearchPdfExtractionSchema } from './pcbiResearchPdfValidation';
export { assignPcbiResearchSchema } from './pcbiDataLabValidation';
export { directPriceQuerySchema } from './module2D1Validation';
export * from './commercialValidation';
export { pcbiAdminImportSchema, pcbiAdminPublishSchema, pcbiReferenceQuerySchema } from './pcbiAdminValidation';
export const pcbiHistoricalObservationsQuerySchema = z.object({
  pcbiId: z.string().trim().min(1).max(120).optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(PCBI_HISTORICAL_QUERY_MAX_LIMIT)
    .default(PCBI_HISTORICAL_QUERY_DEFAULT_LIMIT)
}).superRefine((input, context) => {
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must not be earlier than start date.' });
  }
});

export const d1DatasetScopeSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120).optional(),
  tenantId: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(D1_REPORTING.maxDatasetLimit).default(D1_REPORTING.datasetLimit)
});

export const tenantScopeSelectionSchema = z.object({
  tenantId: z.string().trim().min(1).max(120).optional(),
  tenant_id: z.string().trim().min(1).max(120).optional(),
  buyerId: z.string().trim().min(1).max(120).optional(),
  buyer_id: z.string().trim().min(1).max(120).optional()
});

export const industryProfileQuerySchema = z.object({
  majorSector: z.string().trim().min(1).max(120).optional()
});

export const module2LogisticsPackagingQuerySchema = z.object({
  assessmentId: z.string().trim().min(1).max(120)
});

export const eAuctionQuerySchema = z.object({
  financialYear: z.string().trim().regex(/^(?:ALL|UNKNOWN|FY\d{4}-\d{2})$/).optional(),
  category: z.string().trim().min(1).max(200).optional(),
  suitability: z.enum([
    MODULE2_D1_EAUCTION.FILTER_ALL,
    MODULE2_D1_EAUCTION.SUITABILITY.CANDIDATE,
    MODULE2_D1_EAUCTION.SUITABILITY.MORE_DATA,
    MODULE2_D1_EAUCTION.SUITABILITY.NOT_SUITABLE
  ]).optional(),
  materialCode: z.string().trim().min(1).max(120).optional()
});

export const vendorConsolidationQuerySchema = z.object({
  category: z.string().trim().min(1).max(200).optional(),
  status: z.enum(Object.values(MODULE2_D1_VENDOR_CONSOLIDATION.STATUS)).optional(),
  materialCode: z.string().trim().min(1).max(120).optional(),
  supplierCode: z.string().trim().min(1).max(120).optional()
});

export const requestHeadersSchema = z.object({
  [REQUEST_ID_HEADER]: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/u).optional(),
  'content-type': z.string().optional(),
  authorization: z.string().optional()
}).passthrough();

// Tenant Update Body Schema
export const tenantUpdateSchema = z.object({
  enterprise_name: z.string().trim().min(1).nullable().optional(),
  region: z.string().trim().min(1).nullable().optional(),
  base_currency: z.string().trim().regex(/^[A-Z]{3}$/u).nullable().optional(),
  total_spend_evaluated: z.number().finite().nonnegative().nullable().optional(),
  total_spend_evaluated_inr: z.number().finite().nonnegative().nullable().optional(),
  major_sector: z.string().trim().min(1).nullable().optional(),
  minor_sector: z.string().trim().min(1).nullable().optional(),
  status: z.string().trim().min(1).nullable().optional()
}).strict().refine((data) => Object.values(data).some((value) => value !== undefined && value !== null), {
  message: 'At least one field to update must be provided'
});

// Ingestion Update Validation Record Body Schema
export const updateValidationRecordSchema = z.object({
  record_id: z.string().trim().min(1, 'record_id is required').max(120),
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
}).refine((value) => Object.keys(value).some((key) => key !== 'record_id'), {
  message: 'At least one validation field must be updated'
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
  annualSpendCr: z.number().positive('annualSpendCr must be positive'),
  savingsRate: z.number().nonnegative('savingsRate must be non-negative').max(100),
  saasFeeRate: z.number().nonnegative('saasFeeRate must be non-negative').max(100)
});

// Categories Query Schema
export const categoryQuerySchema = z.object({
  id: z.string().min(1).optional()
});

// Currency Query Schema
export const currencyQuerySchema = z.object({
  from: z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase()).optional(),
  amount: z.union([
    z.string().regex(/^\d+(?:\.\d+)?$/),
    z.number().finite().nonnegative()
  ]).optional(),
  year: z.union([z.string().regex(/^\d{4}$/), z.number().int().min(1900).max(2200)]).optional(),
  date: z.string().trim().regex(/^\d{4}(?:[-/]\d{2}(?:[-/]\d{2})?)?(?:T.*)?$/).optional()
});

// Taxonomy Query Schema
export const taxonomyQuerySchema = z.object({
  q: z.string().max(200).default(''),
  category: z.enum(['', 'ALL', 'Direct Materials', 'Packaging Materials', 'Indirect & MRO', 'Logistics & Freight']).default(''),
  lookup: z.string().max(200).default(''),
  limit: z.coerce.number().int().min(1).max(D1_TAXONOMY_MAX_LIMIT).default(D1_TAXONOMY_DEFAULT_LIMIT),
  offset: z.coerce.number().int().nonnegative().default(0)
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
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  subscription_tier: z.enum(['BRONZE', 'SILVER', 'GOLD']).optional()
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
  status: z.enum(['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING']).optional(),
  tier: z.enum(['ALL', 'BRONZE', 'SILVER', 'GOLD']).optional()
});

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});

export const adminAssignUserTenantSchema = z.object({
  tenant_id: z.string().trim().min(1).max(120)
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

export * from './validationWorkflow';
export * from './ingestionValidation';
