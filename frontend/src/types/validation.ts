/**
 * Frontend Validation Types Module
 * 
 * Inferred TypeScript types derived from centralized validation schemas.
 */

import type { z } from 'zod';
import type {
  clientErrorReportSchema,
  apiRequestIdSchema,
  assessmentIdQuerySchema,
  paymentTermsResponseSchema,
  taxonomyPageRequestSchema,
  taxonomyPageResponseSchema,
  conversionStagesResponseSchema,
  apiDataEnvelopeResponseSchema,
  executiveOpportunityBriefResponseSchema,
  executiveBriefEmailRequestSchema,
  provisionSubscriptionDetailsSchema,
  provisionSubscriptionOtpSchema,
  provisionSubscriptionOtpRequestSchema,
  provisionSubscriptionRequestSchema,
  provisionSubscriptionOtpResponseSchema,
  provisionSubscriptionResponseSchema,
  databaseSchemaResponseSchema,
  procurementCategoryMappingsResponseSchema,
  pcbiBenchmarkResponseSchema,
  pcbiWeeklyIndexResponseSchema,
  pcbiHistoricalObservationsQuerySchema,
  pcbiHistoricalObservationsResponseSchema,
  headerTenantSchema,
  headerCurrencySchema,
  d1CurrencyRatesResponseSchema,
  d1CurrencyConversionResponseSchema,
  clientIngestionSetupFormSchema,
  fixCurrencyFormSchema,
  mergeVendorFormSchema,
  reassignTaxonomyFormSchema,
  proCPXFormSchema,
  dpsnxtFormSchema,
  executiveReportFormSchema,
  conversionInputsSchema,
  apiUpdateTenantPayloadSchema,
  apiAddIngestionFilePayloadSchema,
  apiUpdateValidationRecordPayloadSchema,
  apiMergeVendorPayloadSchema,
  apiDeployOpportunityPayloadSchema,
  apiUpdateModule2MaterialMappingPayloadSchema,
  apiBulkUpdateModule2MaterialMappingsPayloadSchema,
  apiCalculateConversionPayloadSchema
} from '../constants/validation';
import type { pcbiGapResolutionRequestSchema } from '../constants/orchestrationValidation';

export type TaxonomyPageRequest = z.infer<typeof taxonomyPageRequestSchema>;
export type ClientErrorReport = z.infer<typeof clientErrorReportSchema>;
export type ApiRequestId = z.infer<typeof apiRequestIdSchema>;
export type AssessmentIdQuery = z.infer<typeof assessmentIdQuerySchema>;
export type PaymentTermsResponse = z.infer<typeof paymentTermsResponseSchema>;
export type TaxonomyPageResponse = z.infer<typeof taxonomyPageResponseSchema>;
export type ConversionStagesResponse = z.infer<typeof conversionStagesResponseSchema>;
export type ApiDataEnvelopeResponse = z.infer<typeof apiDataEnvelopeResponseSchema>;
export type ExecutiveOpportunityBriefResponse = z.infer<typeof executiveOpportunityBriefResponseSchema>;
export type ExecutiveOpportunityBriefReportData = ExecutiveOpportunityBriefResponse['data'];
export type ExecutiveBriefEmailRequest = z.infer<typeof executiveBriefEmailRequestSchema>;
export type ProvisionSubscriptionDetails = z.infer<typeof provisionSubscriptionDetailsSchema>;
export type ProvisionSubscriptionOtp = z.infer<typeof provisionSubscriptionOtpSchema>;
export type ProvisionSubscriptionOtpRequest = z.infer<typeof provisionSubscriptionOtpRequestSchema>;
export type ProvisionSubscriptionRequest = z.infer<typeof provisionSubscriptionRequestSchema>;
export type ProvisionSubscriptionOtpResponse = z.infer<typeof provisionSubscriptionOtpResponseSchema>;
export type ProvisionSubscriptionResponse = z.infer<typeof provisionSubscriptionResponseSchema>;
export type DatabaseSchemaResponse = z.infer<typeof databaseSchemaResponseSchema>;
export type ProcurementCategoryMappingsResponse = z.infer<typeof procurementCategoryMappingsResponseSchema>;
export type PcbiBenchmarkResponse = z.infer<typeof pcbiBenchmarkResponseSchema>;
export type PcbiWeeklyIndexResponse = z.infer<typeof pcbiWeeklyIndexResponseSchema>;
export type PcbiHistoricalObservationsQuery = z.input<typeof pcbiHistoricalObservationsQuerySchema>;
export type PcbiHistoricalObservationsParsedQuery = z.output<typeof pcbiHistoricalObservationsQuerySchema>;
export type PcbiHistoricalObservationsResponse = z.infer<typeof pcbiHistoricalObservationsResponseSchema>;
export type PCBIGapResolutionRequest = z.infer<typeof pcbiGapResolutionRequestSchema>;

export type HeaderTenantInput = z.infer<typeof headerTenantSchema>;
export type HeaderCurrencyInput = z.infer<typeof headerCurrencySchema>;
export type D1CurrencyRatesResponse = z.infer<typeof d1CurrencyRatesResponseSchema>;
export type D1CurrencyRate = D1CurrencyRatesResponse['data'][string];
export type D1CurrencyConversionResponse = z.infer<typeof d1CurrencyConversionResponseSchema>;
export type ClientIngestionSetupFormInput = z.infer<typeof clientIngestionSetupFormSchema>;
export type FixCurrencyFormInput = z.infer<typeof fixCurrencyFormSchema>;
export type MergeVendorFormInput = z.infer<typeof mergeVendorFormSchema>;
export type ReassignTaxonomyFormInput = z.infer<typeof reassignTaxonomyFormSchema>;
export type ProCPXFormInput = z.infer<typeof proCPXFormSchema>;
export type DPSNXTFormInput = z.infer<typeof dpsnxtFormSchema>;
export type ExecutiveReportFormInput = z.infer<typeof executiveReportFormSchema>;
export type ConversionInputsInput = z.infer<typeof conversionInputsSchema>;

export type ApiUpdateTenantPayload = z.infer<typeof apiUpdateTenantPayloadSchema>;
export type ApiAddIngestionFilePayload = z.infer<typeof apiAddIngestionFilePayloadSchema>;
export type ApiUpdateValidationRecordPayload = z.infer<typeof apiUpdateValidationRecordPayloadSchema>;
export type ApiMergeVendorPayload = z.infer<typeof apiMergeVendorPayloadSchema>;
export type ApiDeployOpportunityPayload = z.infer<typeof apiDeployOpportunityPayloadSchema>;
export type ApiUpdateModule2MaterialMappingPayload = z.infer<typeof apiUpdateModule2MaterialMappingPayloadSchema>;
export type ApiBulkUpdateModule2MaterialMappingsPayload = z.infer<typeof apiBulkUpdateModule2MaterialMappingsPayloadSchema>;
export type ApiCalculateConversionPayload = z.infer<typeof apiCalculateConversionPayloadSchema>;

export type ValidationErrorsMap = Record<string, string>;

export interface ValidationSuccessResult<T> {
  success: true;
  data: T;
  errors?: undefined;
  message?: undefined;
}


export interface ValidationFailureResult {
  success: false;
  errors: ValidationErrorsMap;
  message: string;
}

export type ValidationResult<T> = ValidationSuccessResult<T> | ValidationFailureResult;

export type { AdminLoginFormInput, CreateAdminDetailsInput } from '../constants/adminValidation';
