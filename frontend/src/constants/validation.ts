/**
 * Centralized Validation Schemas (Frontend)
 * 
 * Single source of truth for all runtime input schema validation across frontend
 * modals, forms, user input controls, and outgoing API requests.
 */

import { z } from 'zod';
import { VENDOR_CONSOLIDATION_UI_CONFIG } from './module2VendorConsolidation';
import { TAXONOMY_PAGE_SIZE } from './taxonomy';
import {
  CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH,
  CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH,
  CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH,
  CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH,
  CLIENT_ERROR_REPORT_MAX_STACK_LENGTH
} from './errors';
export * from './subscriptionValidation';

export const INGESTION_UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024;

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

export const apiRequestIdSchema = z.string()
  .min(1)
  .max(CLIENT_ERROR_REPORT_MAX_CLIENT_REQUEST_ID_LENGTH)
  .regex(/^[A-Za-z0-9._-]+$/u);

export const module2LogisticsPackagingQuerySchema = z.object({
  assessmentId: z.string().trim().min(1).max(120)
});

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

export const apiDataEnvelopeResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.string(), z.unknown())
}).passthrough();

const briefText = z.string().min(1);
const briefNumber = z.number().finite();
const briefCount = briefNumber.nonnegative();
const briefSummarySchema = z.object({ label: briefText, count: briefNumber, estimatedSavingsCr: briefNumber });
const briefMetricsSchema = z.object({
  transactionCount: briefCount, supplierCount: briefCount, materialCount: briefCount, plantCount: briefCount,
  purchaseOrderCount: briefCount, opportunityCount: briefCount, totalSpendCr: briefNumber,
  estimatedSavingsCr: briefNumber, averageConfidence: briefNumber,
  firstTransactionDate: z.string().nullable(), lastTransactionDate: z.string().nullable()
});
const briefOpportunitySchema = z.object({
  id: briefText, category: briefText, title: briefText, lever: briefText, recommendedAction: briefText,
  status: briefText, riskLevel: briefText, currentSpendCr: briefNumber, estimatedSavingsCr: briefNumber,
  confidence: briefNumber
});
export const executiveOpportunityBriefResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    tenant: z.object({ tenantId: briefText, enterpriseName: z.string() }),
    dataClassification: z.enum(['CUSTOMER_DATA', 'DEMO_ONLY', 'MIXED']),
    generatedAt: z.string().datetime(), scopeDescription: briefText, metrics: briefMetricsSchema,
    opportunities: z.array(briefOpportunitySchema), levers: z.array(briefSummarySchema),
    statuses: z.array(briefSummarySchema), risks: z.array(briefSummarySchema)
  })
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

export { pcbiHistoricalObservationsQuerySchema, pcbiHistoricalObservationsResponseSchema } from './pcbiHistoricalValidation';

// Header Selection Schemas
export const headerTenantSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required')
});

export const headerCurrencySchema = z.object({
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP'])
});

export const d1CurrencyRatesResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.string().regex(/^[A-Z]{3}$/u), z.object({
    ticker: z.string().optional(),
    currencyPair: z.string().optional(),
    currencyCode: z.string().regex(/^[A-Z]{3}$/u),
    name: z.string().min(1),
    currentRate: z.number().finite().nonnegative(),
    lastUpdated: z.string().nullable().optional(),
    coverageStatus: z.string().optional(),
    source: z.string().nullable().optional()
  }))
});

export const d1CurrencyConversionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    amount: z.number().finite(),
    fromCurrency: z.string().regex(/^[A-Z]{3}$/u),
    amountINR: z.number().finite(),
    exchangeRate: z.number().finite().positive(),
    rateDate: z.string().nullable()
  })
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
  selectedCurrency: z.string().regex(/^[A-Z]{3}$/u),
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

export const executiveBriefEmailRequestSchema = z.object({
  buyerEmail: z.string().trim().email().max(254)
}).strict();

// Outgoing API Request Validation Schemas (Frontend API Boundary)
export const apiUpdateTenantPayloadSchema = z.object({
  enterprise_name: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  base_currency: z.string().trim().regex(/^[A-Z]{3}$/u).optional(),
  total_spend_evaluated: z.number().nonnegative().optional(),
  total_spend_evaluated_inr: z.number().nonnegative().optional(),
  major_sector: z.string().trim().min(1).optional(),
  minor_sector: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional()
}).strict().refine((data) => Object.values(data).some((value) => value !== undefined));

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
  opp_id: z.string().min(1, 'Opportunity ID is required'), targetModule: z.enum(['proCPX', 'DPS NXT'])
});

export const apiUpdateModule2MaterialMappingPayloadSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120),
  sourceMaterialId: z.string().trim().min(1).max(120),
  unspscCode: z.string().trim().regex(/^\d{8}$/),
  reviewStatus: z.enum(['PROVISIONAL', 'CLIENT_APPROVED', 'TAXONOMY_VERIFIED']),
  confidenceScore: z.number().finite().min(0).max(1).optional(),
  mappingMethod: z.enum([
    'EXACT_IDENTIFIER', 'MATERIAL_DESCRIPTION_MATCH', 'SPECIFICATION_OR_SYNONYM',
    'CONTEXTUAL_HEURISTIC', 'MANUAL_REVIEW_REQUIRED'
  ]).optional(),
  auditNotes: z.string().trim().max(1000).optional()
});

export const apiBulkUpdateModule2MaterialMappingsPayloadSchema = z.object({
  assessmentId: z.string().trim().min(1).max(120),
  mappings: z.array(apiUpdateModule2MaterialMappingPayloadSchema.omit({ assessmentId: true }))
    .min(1).max(VENDOR_CONSOLIDATION_UI_CONFIG.MAPPING_BATCH_LIMIT)
    .refine((mappings) => new Set(mappings.map((mapping) => mapping.sourceMaterialId)).size === mappings.length)
});

export const apiCalculateConversionPayloadSchema = z.object({
  annualSpendCr: z.number().positive(),
  savingsRate: z.number().nonnegative().max(100),
  saasFeeRate: z.number().nonnegative().max(100)
});

export * from './validationIdentity';

