/**
 * Enterprise Data Privacy & Security Report Markdown Generator (Prompt 254)
 */

import type {
  EnterprisePrivacyValidationManifest,
  PrivacySecurityTestCase,
  AdminDatasetLifecycleRecord
} from '../types/dataPrivacyTypes';

export function buildEnterprisePrivacyReportMarkdown(
  manifest: EnterprisePrivacyValidationManifest,
  tests: PrivacySecurityTestCase[],
  lifecycleRecords: AdminDatasetLifecycleRecord[]
): string {
  return `# ENTERPRISE DATA PRIVACY, CONFIDENTIALITY & NON-REUSE REPORT
**aiCEV / Procucev Enterprise Procurement Intelligence Platform**  
**DOCUMENT VERSION**: \`ENTERPRISE_DATA_PRIVACY_V1.0\`  
**TIMESTAMP**: \`${manifest.timestamp}\`  
**MANIFEST VERSION**: \`${manifest.manifestVersion}\`  

---

## 1. Executive Summary & Core Principle

> **CUSTOMER DATA IS PRIVATE, ISOLATED AND PURPOSE-LIMITED.**  
> Customer-uploaded procurement data is treated exclusively as tenant/customer-specific data.

### Enforced Guarantees
1. Customer data belongs exclusively to the authenticated customer/tenant context.
2. Customer transaction-level data is never exposed to another customer/tenant.
3. Customer transaction-level data never becomes part of the PCBI benchmark library.
4. Customer transaction-level data is never used as historical benchmark data for another customer.
5. Customer-specific prices, suppliers, quantities, and PO details are never reused.
6. Module 2 calculations operate only on the authorized customer's validated dataset.
7. Module 3 PCBI remains an independent reference layer.
8. Customer data is not copied into shared or global benchmark tables.
9. Customer data is not used to train, enrich, or populate another customer's dataset.
10. Customer data is not reproducible through another customer's reports, APIs, exports, or UI.

---

## 2. Architecture & Data-Flow Boundaries

\`\`\`
Customer Upload
      ↓
Authenticated Tenant Context (Bearer Session Token)
      ↓
Secure Storage / Processing Boundary (Tenant Isolation)
      ↓
Validation & Checksum Verification (SHA-256)
      ↓
Encrypted-at-Rest Storage (AES-256-GCM / Infrastructure Managed)
      ↓
Controlled Processing (Module 1 Spend Aggregations)
      ↓
Tenant-Isolated Results (Module 2 Strategic Sourcing & Module 4 Realization)
\`\`\`

---

## 3. Cryptographic & Encryption Controls

- **Encryption in Transit**: Enforced via TLS 1.3 across all incoming API requests and microservice communication.
- **Encryption at Rest**:
  - Application-Level: AES-256-GCM authenticated encryption for sensitive payloads and session tokens.
  - Storage/Database Level: Infrastructure-managed encryption at rest (AWS EBS/RDS KMS or Azure Storage encryption).
- **Secrets Management**: Zero credentials or private keys in source code; managed via environment configuration.
- **Sanitized Logging**: Strict interceptors prevent raw pricing, supplier banking, or PO line details in log output.

---

## 4. Tenant Isolation & Access Control Validation

- Every customer dataset is bound to an immutable \`tenant_id\` and \`dataset_id\`.
- All database queries enforce strict tenant partitioning in query WHERE clauses.
- API endpoints strictly reject unauthorized cross-tenant requests and parameter tampering.
- Export pipelines require quadruplicate authorization: Authenticated User + Tenant + Dataset + Role.

---

## 5. PCBI Benchmark Isolation (Critical Separation)

- **Customer Data ≠ PCBI Master ≠ PCBI Data Library**.
- Zero automated pipeline flows from customer purchase history into PCBI benchmark series.
- PCBI benchmark indices are derived exclusively from verified, approved external market sources.
- Ordinary customer uploads never infer consent to populate or enrich public benchmarks.

---

## 6. Admin Dataset Lifecycle & Retention

Data retention and deletion are governed by the customer organization's configured data-retention policy.

| Dataset ID | Tenant ID | Dataset Name | Created | Status | Last Processed | Retention Policy | Deletion Eligibility |
|---|---|---|---|---|---|---|---|
${lifecycleRecords.map((r) => `| \`${r.datasetId}\` | \`${r.tenantId}\` | ${r.datasetName} | ${r.datasetCreated} | **${r.datasetStatus}** | ${r.lastProcessed} | ${r.retentionStatus} | \`${r.deletionEligibility}\` |`).join('\n')}

---

## 7. Security Test Suite (SEC-01 to SEC-20)

| Test ID | Test Name | Dimension | Expected | Actual | Status |
|---|---|---|---|---|---|
${tests.map((t) => `| **${t.testId}** | ${t.testName} | ${t.dimension} | \`${t.expectedResult}\` | \`${t.actualResult}\` | **${t.status}** |`).join('\n')}

---

## 8. Known Limitations & Deployment Prerequisites

### Known Limitations
${manifest.knownLimitations.map((l, i) => `${i + 1}. ${l}`).join('\n')}

### Deployment Prerequisites
1. Production environment must provide TLS 1.3 termination at the ingress load balancer.
2. Database and storage volume encryption at rest must be enabled in the cloud hosting provider.
3. Master application encryption key (\`APP_ENCRYPTION_KEY\`) must be injected via secret manager.

---

## 9. Final Validation Status

\`\`\`text
DATA_PRIVACY_VALIDATION = ${manifest.dataPrivacyValidation}
TENANT_ISOLATION = ${manifest.tenantIsolation}
AUTHORIZATION_CONTROLS = ${manifest.authorizationControls}
PCBI_DATA_ISOLATION = ${manifest.pcbiDataIsolation}
EXPORT_ISOLATION = ${manifest.exportIsolation}
SENSITIVE_LOGGING_CONTROL = ${manifest.sensitiveLoggingControl}
ENCRYPTION_IN_TRANSIT = ${manifest.encryptionInTransit}
ENCRYPTION_AT_REST = ${manifest.encryptionAtRest} (INFRASTRUCTURE_MANAGED noted)
SECURITY_TESTS = ${manifest.securityTestsPassedCount} / ${manifest.securityTestsTotalCount}
KNOWN_LIMITATIONS = [${manifest.knownLimitations.map((k) => `"${k}"`).join(', ')}]
Final status: ${manifest.finalStatus}
\`\`\`
`;
}
