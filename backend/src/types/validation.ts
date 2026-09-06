/**
 * Backend Validation Types Module
 * 
 * Inferred TypeScript types derived from centralized validation schemas.
 */

import { z } from 'zod';
import {
  requestHeadersSchema,
  tenantUpdateSchema,
  addIngestionFileSchema,
  updateValidationRecordSchema,
  mergeVendorSchema,
  deployOpportunitySchema,
  calculateConversionMetricsSchema,
  categoryQuerySchema,
  currencyQuerySchema,
  taxonomyQuerySchema,
  logsSearchQuerySchema,
  logsPurgeSchema,
  graphQLRequestSchema,
  encryptRequestSchema,
  decryptRequestSchema
} from '../constants/validation';

export type RequestHeadersInput = z.infer<typeof requestHeadersSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
export type AddIngestionFileInput = z.infer<typeof addIngestionFileSchema>;
export type UpdateValidationRecordInput = z.infer<typeof updateValidationRecordSchema>;
export type MergeVendorInput = z.infer<typeof mergeVendorSchema>;
export type DeployOpportunityInput = z.infer<typeof deployOpportunitySchema>;
export type CalculateConversionMetricsInput = z.infer<typeof calculateConversionMetricsSchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type CurrencyQueryInput = z.infer<typeof currencyQuerySchema>;
export type TaxonomyQueryInput = z.infer<typeof taxonomyQuerySchema>;
export type LogsSearchQueryInput = z.infer<typeof logsSearchQuerySchema>;
export type LogsPurgeInput = z.infer<typeof logsPurgeSchema>;
export type GraphQLRequestInput = z.infer<typeof graphQLRequestSchema>;
export type EncryptRequestInput = z.infer<typeof encryptRequestSchema>;
export type DecryptRequestInput = z.infer<typeof decryptRequestSchema>;

export interface ValidationErrorDetail {
  path: string;
  message: string;
}

export interface ValidationResponse {
  success: false;
  message: string;
  errors: ValidationErrorDetail[];
}
