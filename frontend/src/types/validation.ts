/**
 * Frontend Validation Types Module
 * 
 * Inferred TypeScript types derived from centralized validation schemas.
 */

import type { z } from 'zod';
import type {
  taxonomyPageRequestSchema,
  taxonomyPageResponseSchema,
  conversionStagesResponseSchema,
  databaseSchemaResponseSchema,
  procurementCategoryMappingsResponseSchema,
  pcbiBenchmarkResponseSchema,
  pcbiWeeklyIndexResponseSchema,
  headerTenantSchema,
  headerCurrencySchema,
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
  apiCalculateConversionPayloadSchema
} from '../constants/validation';

export type TaxonomyPageRequest = z.infer<typeof taxonomyPageRequestSchema>;
export type TaxonomyPageResponse = z.infer<typeof taxonomyPageResponseSchema>;
export type ConversionStagesResponse = z.infer<typeof conversionStagesResponseSchema>;
export type DatabaseSchemaResponse = z.infer<typeof databaseSchemaResponseSchema>;
export type ProcurementCategoryMappingsResponse = z.infer<typeof procurementCategoryMappingsResponseSchema>;
export type PcbiBenchmarkResponse = z.infer<typeof pcbiBenchmarkResponseSchema>;
export type PcbiWeeklyIndexResponse = z.infer<typeof pcbiWeeklyIndexResponseSchema>;

export type HeaderTenantInput = z.infer<typeof headerTenantSchema>;
export type HeaderCurrencyInput = z.infer<typeof headerCurrencySchema>;
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
