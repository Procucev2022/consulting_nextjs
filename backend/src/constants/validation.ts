/**
 * Centralized Validation Schemas (Backend)
 * 
 * Single source of truth for all runtime input schema validation across API routes,
 * controller bodies, query parameters, and request headers.
 */

import { z } from 'zod';
import { PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH } from './d1';
import { D1_REPORTING, D1_TAXONOMY_DEFAULT_LIMIT, D1_TAXONOMY_MAX_LIMIT } from './d1';
import { MODULE2_D1_EAUCTION } from './module2D1Scoped';
import { MODULE2_D1_VENDOR_CONSOLIDATION } from './module2VendorConsolidationD1';
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

export const d1DatasetScopeSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120).optional(),
  tenantId: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(D1_REPORTING.maxDatasetLimit).default(D1_REPORTING.datasetLimit)
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

export const detectUploadDomainSchema = z.object({
  fileName: z.string().min(1, 'fileName is required'),
  fileContentSnippet: z.string().optional(),
  targetArea: z.enum(['PCBI_MASTER', 'COMMODITY_DATA_LAB', 'MODULE_1_INGESTION']).default('COMMODITY_DATA_LAB')
});

export const uploadCommoditySourceSchema = z.object({
  commodityId: z.string().min(1, 'commodityId is required'),
  pcbiId: z.string().min(1, 'pcbiId is required'),
  seriesId: z.string().optional(),
  sourceName: z.string().min(1, 'sourceName is required'),
  publisher: z.string().min(1, 'publisher is required'),
  url: z.string().optional(),
  documentName: z.string().min(1, 'documentName is required'),
  fileBase64: z.string().max(PCBI_DATA_LAB_UPLOAD_MAX_BASE64_LENGTH).optional(),
  publicationDate: z.string().optional(),
  fileType: z.enum(['XLSX', 'XLS', 'CSV', 'PDF', 'JSON', 'TXT']),
  checksum: z.string().optional(),
  geography: z.string().optional(),
  gradeSpecification: z.string().optional(),
  unit: z.string().optional(),
  currency: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  deliveryBasis: z.string().optional(),
  historicalCoverage: z.string().optional()
});

export const approveCommodityDataSchema = z.object({
  commodityId: z.string().min(1, 'commodityId is required'),
  pcbiId: z.string().min(1, 'pcbiId is required'),
  approverName: z.string().min(1, 'approverName is required'),
  comments: z.string().optional()
});

