/**
 * Enterprise Customer Data Confidentiality, Isolation & Security Types
 * Version: PROCUCEV_DATA_SECURITY_HARDENING_V1.0 (Prompt 252)
 */

export type DataClassification =
  | 'CUSTOMER_CONFIDENTIAL'
  | 'PCBI_REFERENCE_DATA'
  | 'SYSTEM_CONFIGURATION'
  | 'ANALYTICAL_DERIVED_DATA'
  | 'AUDIT_METADATA'
  | 'PUBLIC_REFERENCE_DATA';

export type SecurityAuditAction =
  | 'DATA_UPLOAD'
  | 'DATA_ACCESS'
  | 'DATA_PROCESSING'
  | 'DATA_EXPORT'
  | 'DATA_APPROVAL'
  | 'DATA_DELETION'
  | 'DATASET_SCOPE_CHANGE'
  | 'SECURITY_DENIAL'
  | 'PCBI_REFERENCE_ACCESS';

export type SecurityCapabilityStatus = 'ACTIVE' | 'CONFIGURATION_REQUIRED' | 'REQUIRES_ADMIN_ACTION';

export type CapabilityVerificationTier =
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'CONFIGURATION_REQUIRED'
  | 'NOT_IMPLEMENTED'
  | 'NOT_CLAIMED';

export interface CustomerDatasetScope {
  tenantId: string;
  customerId: string;
  datasetId: string;
  dataClassification: DataClassification;
  isEncryptedAtRest: boolean;
  encryptionAlgorithm: string;
  sourceFileChecksum: string;
  ingestionTimestamp: string;
  retentionPolicyStatus: 'ACTIVE' | 'CONFIGURATION_REQUIRED';
}

export interface SecurityAuditRecord {
  auditId: string;
  timestamp: string;
  action: SecurityAuditAction;
  userId: string;
  tenantId: string;
  datasetId?: string;
  resourceType: string;
  result: 'ALLOWED' | 'BLOCKED';
  denialReason?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityStatusPanelItem {
  id: string;
  dimensionName: string;
  status: SecurityCapabilityStatus;
  verificationTier: CapabilityVerificationTier;
  technicalProof: string;
}

export interface SecurityNegativeTestCase {
  testId: string;
  testName: string;
  targetCategory: string;
  description: string;
  attackVector: string;
  expectedOutcome: 'BLOCKED' | 'PASS';
  actualOutcome: 'BLOCKED' | 'PASS';
  httpStatusExpected: number;
  status: 'PASS' | 'FAIL';
}

export interface DataSecurityValidationManifest {
  manifestVersion: string;
  timestamp: string;
  finalSecurityStatus: 'SECURITY_HARDENED_VERIFIED' | 'SECURITY_HARDENED_WITH_CONFIGURATION_REQUIRED' | 'SECURITY_HARDENING_BLOCKED';
  authoritativeDatasetScope: CustomerDatasetScope;
  customerDataReusePolicy: 'PROHIBITED';
  pcbiIsolationStatus: 'VERIFIED_ISOLATED';
  panelItems: SecurityStatusPanelItem[];
  totalSecurityTests: number;
  passedSecurityTests: number;
  failedSecurityTests: number;
}
