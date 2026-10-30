/**
 * Backend Validation Types Module
 * 
 * Inferred TypeScript types derived from centralized validation schemas.
 */

import type { z } from 'zod';
import type {
  pcbiReferenceQuerySchema,
  d1DatasetScopeSchema,
  alternateSourcingQuerySchema,
  vendorConsolidationQuerySchema,
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
  decryptRequestSchema,
  detectUploadDomainSchema,
  uploadCommoditySourceSchema,
  approveCommodityDataSchema,
  specificationReviewSchema,
  materialMappingUpdateSchema,
  materialMappingRecordSchema,
  procurementComplianceReviewSchema,
  eAuctionPlanningAssumptionSchema,
  upgradeRequestSchema,
  upgradeRequestQuerySchema,
  commercialOtpRequestSchema,
  commercialOtpVerifySchema,
  upgradeCodeLoginSchema,
  subscriptionProvisionSchema,
  subscriptionStatusSchema,
  adminProvisionSchema
} from '../constants/validation';

export type RequestHeadersInput = z.infer<typeof requestHeadersSchema>;
export type PcbiReferenceQueryInput = z.infer<typeof pcbiReferenceQuerySchema>;
export type D1DatasetScopeInput = z.infer<typeof d1DatasetScopeSchema>;
export type AlternateSourcingQueryInput = z.infer<typeof alternateSourcingQuerySchema>;
export type VendorConsolidationQueryInput = z.infer<typeof vendorConsolidationQuerySchema>;
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
export type DetectUploadDomainInput = z.infer<typeof detectUploadDomainSchema>;
export type UploadCommoditySourceInput = z.infer<typeof uploadCommoditySourceSchema>;
export type ApproveCommodityDataInput = z.infer<typeof approveCommodityDataSchema>;
export type SpecificationReviewInput = z.infer<typeof specificationReviewSchema>;
export type MaterialMappingUpdateInput = z.infer<typeof materialMappingUpdateSchema>;
export type MaterialMappingRecordInput = z.infer<typeof materialMappingRecordSchema>;
export type ProcurementComplianceReviewInput = z.infer<typeof procurementComplianceReviewSchema>;
export type EAuctionPlanningAssumptionInput = z.infer<typeof eAuctionPlanningAssumptionSchema>;
export type UpgradeRequestInput = z.infer<typeof upgradeRequestSchema>;
export type UpgradeRequestQueryInput = z.infer<typeof upgradeRequestQuerySchema>;
export type CommercialOtpRequestInput = z.infer<typeof commercialOtpRequestSchema>;
export type CommercialOtpVerifyInput = z.infer<typeof commercialOtpVerifySchema>;
export type UpgradeCodeLoginInput = z.infer<typeof upgradeCodeLoginSchema>;
export type SubscriptionProvisionInput = z.infer<typeof subscriptionProvisionSchema>;
export type SubscriptionStatusInput = z.infer<typeof subscriptionStatusSchema>;
export type AdminProvisionInput = z.infer<typeof adminProvisionSchema>;

export interface ValidationErrorDetail {
  path: string;
  message: string;
}

export interface ValidationResponse {
  success: false;
  message: string;
  errors: ValidationErrorDetail[];
}
