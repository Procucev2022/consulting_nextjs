/**
 * Enterprise Data Security Panel & Trust Center Constants (Prompt 252)
 */

import type { SecurityStatusPanelItem } from '../types/dataSecurityTypes';

export const ENTERPRISE_SECURITY_PANEL_ITEMS: SecurityStatusPanelItem[] = [
  {
    id: 'SEC-DIM-01',
    dimensionName: 'Transport Security',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'Enforced TLS 1.3/HTTPS transport only; plain HTTP requests rejected with 301/HSTS'
  },
  {
    id: 'SEC-DIM-02',
    dimensionName: 'Storage Encryption',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'AES-256-GCM authenticated encryption at rest for customer raw files and ledgers'
  },
  {
    id: 'SEC-DIM-03',
    dimensionName: 'Tenant Isolation',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'Server-side REQUEST_TENANT_ID === DATASET_TENANT_ID invariant enforced on all queries'
  },
  {
    id: 'SEC-DIM-04',
    dimensionName: 'Role-Based Access',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'Encrypted JWT session tokens verifying user role, tenant scope, and authorization'
  },
  {
    id: 'SEC-DIM-05',
    dimensionName: 'Audit Logging',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'Immutable structured JSON audit trail with sanitized identifiers for all sensitive operations'
  },
  {
    id: 'SEC-DIM-06',
    dimensionName: 'Data Classification',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'CUSTOMER_CONFIDENTIAL classification tags immutable through Modules 1 -> 2 -> 3 -> 4'
  },
  {
    id: 'SEC-DIM-07',
    dimensionName: 'PCBI Data Isolation',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'Strict separation of PCBI Master/Data Library; customer transactions blocked from PCBI series'
  },
  {
    id: 'SEC-DIM-08',
    dimensionName: 'Cross-Customer Reuse Protection',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'CUSTOMER_DATA_REUSE_POLICY = PROHIBITED; zero training/benchmark reuse across tenants'
  },
  {
    id: 'SEC-DIM-09',
    dimensionName: 'Export Controls',
    status: 'ACTIVE',
    verificationTier: 'VERIFIED',
    technicalProof: 'Multi-factor authorization gate (User + Tenant + Dataset + Role) and mandatory export audit'
  },
  {
    id: 'SEC-DIM-10',
    dimensionName: 'Retention Policy',
    status: 'CONFIGURATION_REQUIRED',
    verificationTier: 'CONFIGURATION_REQUIRED',
    technicalProof: 'RETENTION_POLICY_STATUS = CONFIGURATION_REQUIRED pending enterprise contractual agreement'
  }
];

export const CUSTOMER_TRUST_CENTER_STRINGS = {
  TITLE: 'Data Security, Confidentiality & Isolation',
  SUBTITLE: 'Enterprise Trust & Customer Data Protection Architecture',
  CORE_NOTICE:
    'Your procurement data is Customer Confidential. It is processed within your authorized environment and is not used as another customer\'s benchmark, reference dataset, or analytical input.',
  ISOLATION_PROMISE:
    'Customer transaction data is logically isolated from other customers and does not automatically become part of the PCBI reference library.',
  ACCESS_PROMISE:
    'Data access is strictly controlled through authentication, role-based authorization, and server-side tenant isolation.',
  ENCRYPTION_PROMISE:
    'Sensitive customer data is protected using TLS encryption in transit and AES-256-GCM encryption at rest.'
};
