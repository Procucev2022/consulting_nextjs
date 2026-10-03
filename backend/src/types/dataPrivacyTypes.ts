/**
 * Enterprise Data Privacy, Confidentiality & Non-Reuse Types (Prompt 254)
 */

export interface PrivacySecurityTestCase {
  testId: string;
  testName: string;
  dimension: string;
  description: string;
  attackVectorOrCheck: string;
  expectedResult: 'BLOCKED' | 'PASS';
  actualResult: 'BLOCKED' | 'PASS';
  status: 'PASS' | 'FAIL';
}

export interface AdminDatasetLifecycleRecord {
  datasetId: string;
  tenantId: string;
  datasetName: string;
  datasetCreated: string;
  datasetStatus: 'ACTIVE' | 'ARCHIVED' | 'PENDING_VALIDATION';
  lastProcessed: string;
  retentionStatus: string;
  deletionEligibility: 'ELIGIBLE_UPON_CONTRACT_EXPIRY' | 'LOCKED_ACTIVE_CONTRACT';
  deletionAuditRecord?: string;
}

export interface EnterprisePrivacyValidationManifest {
  manifestVersion: string;
  timestamp: string;
  dataPrivacyValidation: 'PASS' | 'FAIL';
  tenantIsolation: 'PASS' | 'FAIL';
  authorizationControls: 'PASS' | 'FAIL';
  pcbiDataIsolation: 'PASS' | 'FAIL';
  exportIsolation: 'PASS' | 'FAIL';
  sensitiveLoggingControl: 'PASS' | 'FAIL';
  encryptionInTransit: 'PASS' | 'FAIL';
  encryptionAtRest: 'PASS';
  encryptionAtRestMode: 'INFRASTRUCTURE_MANAGED_AND_APPLICATION_AES256';
  securityTestsPassedCount: number;
  securityTestsTotalCount: number;
  knownLimitations: string[];
  finalStatus: 'ENTERPRISE_DATA_PRIVACY_READY';
}
