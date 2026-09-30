const fs = require('fs');

const promptText = `
## Prompt 252
PROCUCEV / aiCEV — ENTERPRISE CUSTOMER DATA CONFIDENTIALITY,
ENCRYPTION, ISOLATION & NON-REUSE CONTROL
FINAL CROSS-MODULE SECURITY HARDENING — MODULES 1 TO 4

IMPORTANT:
This is a CROSS-MODULE SECURITY / TRUST / DATA-GOVERNANCE enhancement.

DO NOT modify or weaken any certified business calculation logic in:
- Module 1
- Module 2
- Module 3 / PCBI
- Module 4

DO NOT change any mathematical formulas, savings logic, benchmark logic,
classification logic, opportunity logic, or customer-data processing logic.

Do not fabricate security capabilities that are not actually implemented.

============================================================
1. BUSINESS OBJECTIVE
============================================================

Procucev / aiCEV must provide enterprise customers with a clear,
technically enforceable data-confidentiality model.

Customer procurement data is highly sensitive.

The platform must clearly communicate and enforce:

1. Customer data is customer-specific.
2. Customer data is logically isolated from other customers.
3. Uploaded customer files are encrypted at rest.
4. Data transmission must use encrypted transport.
5. Customer data is used only for the authorized analysis/workflow.
6. Customer data must NOT become a benchmark, training dataset, reference
   dataset, sample dataset, or source for another customer's analysis.
7. One customer's raw transactions must never appear in another customer's
   environment.
8. PCBI reference data must remain distinct from customer transactional data.
9. Module 2 analytical calculations must use only the authorized customer's
   data and approved internal logic.
10. Module 3 PCBI data must not silently absorb customer transaction data.
11. Module 4 outputs must contain only the authorized data required for
    execution / savings realization.
12. All sensitive-data access must be auditable.

============================================================
2. DATA CLASSIFICATION
============================================================

Introduce explicit data classifications:

CUSTOMER_CONFIDENTIAL
PCBI_REFERENCE_DATA
SYSTEM_CONFIGURATION
ANALYTICAL_DERIVED_DATA
AUDIT_METADATA
PUBLIC_REFERENCE_DATA

Customer uploaded purchase history, supplier information, prices,
quantities, PO information and transaction-level records must be classified:

DATA_CLASSIFICATION = CUSTOMER_CONFIDENTIAL

The classification must follow the data through Modules 1 → 2 → 3 → 4
without changing ownership or confidentiality.

============================================================
3. MODULE 1 — CUSTOMER DATA PROTECTION
============================================================

Module 1 is the primary customer-data ingestion boundary.

On upload:

CUSTOMER FILE
    ↓
Encrypted Transport
    ↓
Secure Ingestion
    ↓
Customer/Tenant Isolation
    ↓
Encrypted Storage
    ↓
Controlled Processing
    ↓
Module 1 Analysis

Implement / verify:

- HTTPS/TLS-only transport in production.
- Encryption at rest for uploaded customer files and sensitive records.
- Tenant/customer identifier attached to every customer dataset.
- Dataset ID generated for every upload.
- Immutable ingestion timestamp.
- File checksum/hash.
- Source filename metadata.
- Access audit record.
- Processing status.
- Retention status.

Never expose raw storage paths to the frontend.

Never place customer raw files in publicly accessible static directories.

============================================================
4. STRICT TENANT / CUSTOMER ISOLATION
============================================================

Every customer dataset must carry:

TENANT_ID
CUSTOMER_ID
DATASET_ID
DATA_CLASSIFICATION

Every database query, API request and analytical operation involving
customer data must enforce tenant/customer scope.

Required invariant:

REQUEST_TENANT_ID === DATASET_TENANT_ID

If mismatch:

BLOCK_REQUEST
STATUS = TENANT_ACCESS_DENIED

Do not rely only on frontend filtering.

Tenant isolation must be enforced server-side.

Add negative tests proving:

- Customer A cannot retrieve Customer B data.
- Customer A cannot download Customer B file.
- Customer A cannot see Customer B suppliers.
- Customer A cannot see Customer B transaction values.
- Customer A cannot see Customer B Module 2 opportunities.
- Customer A cannot see Customer B Module 4 outputs.
- Customer A cannot use another customer's dataset ID.

============================================================
5. NO CROSS-CUSTOMER LEARNING / REUSE
============================================================

Introduce an explicit architectural rule:

CUSTOMER_DATA_REUSE_POLICY = PROHIBITED

Customer transaction data must NOT be used to:

- populate another customer's benchmark;
- create another customer's price reference;
- improve another customer's sourcing calculation;
- populate PCBI historical observations;
- create shared supplier-price datasets;
- create training datasets;
- create demonstration datasets;
- create sample customer data;
- expose comparative customer statistics;
- generate cross-customer recommendations.

If aggregated analytics are ever introduced in the future, they must
require a separate, explicit governance and contractual mechanism.

Do not implement cross-customer aggregation now.

============================================================
6. PCBI ISOLATION
============================================================

Maintain the existing architectural distinction:

PCBI MASTER
=
SYSTEM REFERENCE / DEFINITION

PCBI DATA LIBRARY
=
APPROVED MARKET / REFERENCE SOURCE DATA

CUSTOMER DATA
=
CUSTOMER_CONFIDENTIAL

A customer transaction must NEVER automatically become a PCBI source
observation.

A customer price must NEVER silently enter the PCBI historical series.

Any future process that proposes customer-derived reference data must be
explicitly governed and separately approved.

Add negative test:

CUSTOMER_TRANSACTION → PCBI_OBSERVATION

Expected:

BLOCKED_CUSTOMER_DATA_TO_PCBI

============================================================
7. MODULE 2 CONFIDENTIALITY
============================================================

Module 2 must calculate strategic sourcing intelligence only from the
authorized customer's Module 1 dataset.

All outputs must retain:

TENANT_ID
CUSTOMER_ID
DATASET_ID
DATA_CLASSIFICATION

Opportunity ledgers, supplier analysis, price distributions, e-auction
analysis, vendor consolidation analysis and sourcing recommendations
must remain customer-scoped.

No Module 2 result may be exposed outside the authorized tenant.

Maintain existing rule:

NO EXTERNAL PCBI DATA IN MODULE 2 CALCULATIONS

unless explicitly governed by the existing architecture.

Do not modify existing Module 2 mathematical logic.

============================================================
8. MODULE 3 CONFIDENTIALITY
============================================================

PCBI remains independent of customer transactional data.

Maintain:

PCBI_MASTER = IMMUTABLE REFERENCE CATALOG
PCBI_DATA_LIBRARY = GOVERNED REFERENCE DATA
CUSTOMER_DATA = CUSTOMER_CONFIDENTIAL

Customer-specific transaction records must not be written into the
PCBI Data Library.

PCBI source documents and observations must have their own provenance,
publisher, source ID and checksum.

============================================================
9. MODULE 4 CONFIDENTIALITY
============================================================

Module 4 receives only the authorized handoff package.

Ensure:

MODULE_2_CUSTOMER_SCOPE
        ↓
MODULE_4_CUSTOMER_SCOPE

No opportunity package may be retrieved outside its originating tenant.

Add negative tests for cross-tenant Module 4 access.

============================================================
10. RAW DATA EXPOSURE CONTROL
============================================================

Review all APIs, logs and frontend responses.

Customer-sensitive fields must NOT accidentally appear in:

- application logs;
- console logs;
- error messages;
- stack traces;
- API debug responses;
- browser localStorage;
- browser sessionStorage;
- URL query strings;
- public static files;
- telemetry;
- analytics payloads.

Sensitive fields include at minimum:

supplier name
supplier code
purchase price
quantity
transaction value
PO number
invoice number
customer item code
customer material description
contract information
commercial terms

Use redacted identifiers in logs.

Example:

SUPPLIER_ID = SUP-XXXX

rather than exposing unnecessary commercial information.

============================================================
11. DOWNLOAD / EXPORT GOVERNANCE
============================================================

Any customer-data export must be explicitly authenticated and
tenant-authorized.

Before download:

AUTHENTICATED_USER
+
AUTHORIZED_TENANT
+
AUTHORIZED_DATASET
+
AUTHORIZED_ROLE

All downloads must be auditable.

Record:

USER_ID
TENANT_ID
DATASET_ID
EXPORT_TYPE
TIMESTAMP
REASON / ACTION
RESULT

Do not create unrestricted "download all customer data" endpoints.

============================================================
12. DATA RETENTION / DELETION MODEL
============================================================

Create explicit configuration for:

DATA_RETENTION_POLICY
DATA_RETENTION_PERIOD
DATA_DELETION_STATUS

Do not invent a retention period if the product/business policy has not
yet been formally decided.

Instead expose:

RETENTION_POLICY_STATUS = CONFIGURATION_REQUIRED

where no policy exists.

Implement deletion capability only if it is consistent with the
existing architecture and audit requirements.

Never claim data is permanently deleted unless storage, backups,
replicas and derived records are actually covered by the deletion policy.

============================================================
13. CUSTOMER-FACING TRUST CENTER
============================================================

Add an enterprise-facing "Data Security & Confidentiality" section to
the product.

Keep the wording factual and technically defensible.

Suggested customer-facing language:

"Your procurement data is treated as Customer Confidential Data."

"Your uploaded procurement data is processed within your authorized
customer environment and is logically isolated from other customers."

"Customer transaction data is not used as another customer's benchmark,
reference dataset, or analytical input."

"Customer transaction data does not automatically become part of the
PCBI reference library."

"Data access is controlled through authentication, authorization and
customer-level isolation."

"Sensitive customer data is protected using encryption in transit and,
where implemented, encryption at rest."

Do NOT use absolute claims such as:
"Nobody can ever access your data."
"Your data can never be reproduced."
"Your data can never exist in backups."
"100% impossible to breach."

unless technically and contractually proven.

============================================================
14. DATA FLOW VISUALIZATION
============================================================

Create a clean enterprise UI visual:

CUSTOMER DATA
      ↓
ENCRYPTED INGESTION
      ↓
CUSTOMER-ISOLATED STORAGE
      ↓
MODULE 1
      ↓
MODULE 2
      ↓
MODULE 3 / PCBI [REFERENCE DATA REMAINS SEPARATE]
      ↓
MODULE 4
      ↓
CUSTOMER-SCOPED OUTPUT

With a separate protected boundary around:

PCBI MASTER
PCBI DATA LIBRARY

Clearly show:

CUSTOMER DATA ≠ PCBI DATA

and

CUSTOMER A ≠ CUSTOMER B

============================================================
15. SECURITY STATUS PANEL
============================================================

Create an enterprise security status panel showing:

Transport Security
Storage Encryption
Tenant Isolation
Role-Based Access
Audit Logging
Data Classification
PCBI Data Isolation
Cross-Customer Reuse Protection
Export Controls
Retention Policy

Each should display:

ACTIVE
NOT_CONFIGURED
REQUIRES_ADMIN_ACTION

Do not display PASS unless an actual technical check confirms it.

============================================================
16. SECURITY NEGATIVE TEST SUITE
============================================================

Create comprehensive automated tests including:

SEC-01 Cross-tenant dataset access
SEC-02 Cross-tenant file download
SEC-03 Cross-tenant transaction retrieval
SEC-04 Cross-tenant supplier retrieval
SEC-05 Cross-tenant Module 2 opportunity access
SEC-06 Cross-tenant Module 4 handoff access
SEC-07 Customer transaction to PCBI injection
SEC-08 Unauthorized dataset export
SEC-09 Unauthenticated sensitive API access
SEC-10 Unauthorized role access
SEC-11 Sensitive data in logs
SEC-12 Sensitive data in URL parameters
SEC-13 Sensitive data in browser storage
SEC-14 Public/static file exposure
SEC-15 Dataset ID enumeration
SEC-16 Missing tenant scope
SEC-17 Invalid tenant scope
SEC-18 Unauthorized PCBI modification
SEC-19 Customer A data appearing in Customer B analytical output
SEC-20 Customer data entering shared/reference storage

Every test must produce explicit BLOCKED / PASS behavior.

============================================================
17. AUDIT TRAIL
============================================================

Create immutable/auditable events for:

DATA_UPLOAD
DATA_ACCESS
DATA_PROCESSING
DATA_EXPORT
DATA_APPROVAL
DATA_DELETION
DATASET_SCOPE_CHANGE
SECURITY_DENIAL
PCBI_REFERENCE_ACCESS

Every event should include appropriate identifiers without storing
unnecessary sensitive raw commercial data.

============================================================
18. UI LANGUAGE — IMPORTANT
============================================================

Do not overwhelm the customer with security jargon.

Use concise enterprise messaging.

Example Module 1 upload notice:

"Your procurement data is Customer Confidential.
It is processed within your authorized environment and is not used as
another customer's benchmark or reference data."

Add an expandable:

"How we protect your data"

containing the detailed explanation.

Use the same trust language consistently across Modules 1–4.

============================================================
19. ARCHITECTURAL NON-REGRESSION
============================================================

ABSOLUTE RULE:

DO NOT MODIFY:

Module 1 calculation semantics
Module 2 strategic sourcing formulas
Module 2 opportunity waterfall
Module 2 e-auction logic
Module 2 vendor consolidation logic
Module 3 PCBI formulas
Module 3 governance rules
Module 4 savings realization logic

This command is security, privacy, isolation and customer-trust
hardening only.

============================================================
20. REQUIRED FINAL VALIDATION REPORT
============================================================

Generate:

PROCUCEV_ENTERPRISE_DATA_SECURITY_VALIDATION.md

Also generate:

PROCUCEV_DATA_SECURITY_AUDIT.json

PROCUCEV_DATA_ISOLATION_TEST_RESULTS.json

The final report must clearly distinguish:

IMPLEMENTED
VERIFIED
CONFIGURATION_REQUIRED
NOT_IMPLEMENTED
NOT_CLAIMED

Do not mark a security capability as verified merely because the code
contains a placeholder or configuration setting.

============================================================
21. FINAL ACCEPTANCE CRITERIA
============================================================

The final result should demonstrate:

1. Customer data is classified.
2. Customer datasets are tenant-scoped.
3. Cross-tenant access is blocked.
4. Customer files are protected in transit.
5. Customer files are encrypted at rest where supported/configured.
6. Raw customer data is not exposed through UI/API/logs unnecessarily.
7. Customer data does not automatically enter PCBI.
8. Customer data is not reused for another customer.
9. Module 2 outputs remain customer-scoped.
10. Module 4 outputs remain customer-scoped.
11. Exports are authorized and auditable.
12. Security failures are logged without exposing sensitive data.
13. All security claims shown in the UI correspond to actual verified
    implementation.
14. Existing Modules 1–4 business calculations remain unchanged.

FINAL STATUS MUST BE ONE OF:

SECURITY_HARDENED_VERIFIED

SECURITY_HARDENED_WITH_CONFIGURATION_REQUIRED

SECURITY_HARDENING_BLOCKED

Do NOT claim full security certification unless the implementation and
tests actually prove it.

============================================================
22. GIT / CHANGE CONTROL
============================================================

Before completing:

- show exact files changed;
- show exact files created;
- show all tests executed;
- show test pass/fail counts;
- run typecheck;
- run lint;
- run build;
- run relevant regression suites;
- confirm Modules 1–4 business calculations are unchanged;
- confirm no PCBI data was contaminated by customer data;
- confirm no customer data was fabricated or copied into test fixtures.

Do not push to Git automatically.

Return a final implementation and validation report first.
`;

fs.appendFileSync('prompts.md', promptText, 'utf8');
console.log('Appended Prompt 252 successfully');
