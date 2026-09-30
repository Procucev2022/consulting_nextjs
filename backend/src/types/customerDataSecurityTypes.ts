/**
 * Customer Data Security, Confidentiality & Non-Reuse Types (Prompt 253)
 */

export interface SecurityLifecycleStageAudit {
  stageId: number;
  stageName: string;
  dataEnters: string;
  dataTransformation: string;
  dataStored: string;
  dataShared: string;
  dataExported: string;
  tenantBoundary: string;
  securityControl: string;
}

export interface CustomerSecurityTestCase {
  testId: string;
  testName: string;
  category: string;
  description: string;
  expectedResult: 'BLOCKED' | 'PASS';
  actualResult: 'BLOCKED' | 'PASS';
  status: 'PASS' | 'FAIL';
}

export interface CustomerSecurityValidationManifest {
  manifestVersion: string;
  timestamp: string;
  finalSecurityStatus: 'SECURITY_HARDENED_AND_VERIFIED' | 'SECURITY_HARDENING_COMPLETE_WITH_OPEN_GAPS';
  tenantIsolationStatus: 'PASS' | 'FAIL';
  encryptionStatus: 'PASS' | 'FAIL';
  aiTrainingDataStatus: 'PASS' | 'FAIL';
  crossCustomerReuseStatus: 'PASS' | 'FAIL';
  pcbiDataIsolationStatus: 'PASS' | 'FAIL';
  exportIsolationStatus: 'PASS' | 'FAIL';
  auditLogStatus: 'PASS' | 'FAIL';
  retentionStatus: 'CONFIGURATION_REQUIRED' | 'ACTIVE';
  deletionStatus: 'CONFIGURATION_REQUIRED' | 'ACTIVE';
  securityTestsPassed: number;
  securityTestsFailed: number;
  openSecurityGaps: string[];
}
