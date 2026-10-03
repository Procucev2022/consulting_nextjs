const fs = require('fs');

const promptText = `
## Prompt 253
FINAL CROSS-MODULE CUSTOMER DATA SECURITY, CONFIDENTIALITY & NON-REUSE HARDENING

Context:
The current Module 1–4 validation and enterprise UI hardening work is already in progress/completed. DO NOT redesign or alter any business calculation logic, formulas, classification logic, PCBI methodology, sourcing logic, savings logic, or Module 4 execution logic.

This task is ONLY to add a strong, truthful, enterprise-grade CUSTOMER DATA SECURITY, CONFIDENTIALITY & NON-REUSE layer across the application.

============================================================
1. CORE CUSTOMER PROMISE
============================================================

The platform must clearly communicate to customers:

"Your procurement data is used only to perform the analysis requested by your organization. Customer data is not used to train AI models, is not reused for another customer, and is not used to reproduce another customer's analysis."

Use precise language. DO NOT make unsupported claims such as:
- "100% impossible to breach"
- "military-grade encryption"
- "data can never be accessed by anyone"
- "automatically deleted forever"
unless the actual implementation and infrastructure prove those claims.

The UI must distinguish between:
A. Customer transaction data
B. Derived analytical results
C. PCBI reference/benchmark data
D. System configuration and metadata

Customer transaction data must NEVER be represented as PCBI data or reusable benchmark data.

============================================================
2. DATA LIFECYCLE
============================================================

Implement and document the following conceptual lifecycle:

CUSTOMER FILE UPLOAD
        ↓
SECURE INGESTION
        ↓
ENCRYPTED / PROTECTED STORAGE
        ↓
CONTROLLED PROCESSING
        ↓
MODULE 1 ANALYSIS
        ↓
MODULE 2 ANALYSIS
        ↓
MODULE 3 MATCHING / PCBI COMPARISON
        ↓
MODULE 4 OUTPUT
        ↓
CUSTOMER-SPECIFIC RESULTS

Customer source records must retain tenant/customer ownership throughout the entire lifecycle.

Every record or analytical object derived from customer data must carry appropriate tenant/customer isolation.

============================================================
3. TENANT ISOLATION — CRITICAL
============================================================

Perform a complete audit to ensure:

customer A data cannot be:
- queried by customer B
- displayed to customer B
- included in customer B calculations
- included in customer B exports
- included in customer B dashboards
- included in PCBI Master
- included in another customer's benchmark
- used as historical supplier pricing for another customer
- used as a training dataset
- used to generate another customer's opportunity calculation

Add automated negative tests attempting cross-tenant access.

Expected result:

CROSS_TENANT_ACCESS = BLOCKED

============================================================
4. AI / MODEL NON-TRAINING GUARANTEE
============================================================

Wherever AI/LLM functionality exists, audit the complete implementation.

Customer procurement data must NOT automatically become:
- model training data
- global prompt history
- reusable knowledge-base content
- another customer's context
- global vector-store content
- global embeddings
- shared retrieval data

If embeddings/vector storage exists, enforce tenant/customer namespace isolation.

If external AI APIs are used, document the configured data-handling mode and ensure customer data is not intentionally persisted for model training through application configuration.

Do not claim a provider-level guarantee unless supported by the actual provider configuration/contract.

============================================================
5. CUSTOMER DATA vs PCBI DATA
============================================================

Enforce a permanent architectural boundary:

CUSTOMER DATA
= private customer-owned analytical input

PCBI MASTER
= Procucev system reference definition/catalog

PCBI DATA LIBRARY
= approved external/public/commercial benchmark source evidence

Customer transaction prices must NEVER automatically become PCBI source data.

A customer's historical purchase price may be used for that customer's Module 2 historical analysis, but it must not become a PCBI benchmark series or another customer's reference price unless an explicit, separately governed business process exists.

============================================================
6. ENCRYPTION / PROTECTION
============================================================

Audit the actual implementation for:

- encryption in transit
- encryption at rest where supported
- secure file storage
- secure database access
- credential/secret handling
- signed/authenticated API requests
- session/authentication controls
- authorization checks
- secure download/export controls

DO NOT simply add UI language claiming encryption.

Only display:

"Protected in transit and at rest"

if the actual deployment architecture supports it.

Otherwise display the precise protection that is actually implemented.

Create a SECURITY_IMPLEMENTATION_STATUS report showing:

CONTROL
CURRENT IMPLEMENTATION
VERIFIED / NOT VERIFIED
REMAINING ACTION
OWNER

============================================================
7. NO REPRODUCTION / NO REUSE
============================================================

Add customer-facing messaging at appropriate points:

UPLOAD SCREEN:

"Your procurement data is processed within your organization's secure analysis environment. It is not used to train AI models or reused for analysis of other customers."

ANALYSIS SCREEN:

"Your results are generated from your organization's data and approved reference data. Customer transaction data remains isolated to your organization."

EXPORT / RESULTS SCREEN:

"These insights are customer-specific and are not shared with or reused for other customers."

Avoid excessive repetition. Use an information icon / expandable "How your data is protected" section for detailed explanation.

============================================================
8. DATA PRIVACY INFORMATION PANEL
============================================================

Create a reusable enterprise component:

CustomerDataProtectionNotice

It should provide:

1. Data Isolation
2. Encryption / Secure Transfer
3. No AI Training
4. No Cross-Customer Reuse
5. Customer-Specific Analysis
6. Controlled Access
7. Auditability
8. Data Retention / Deletion policy

The component must be reusable across:

Module 1
Module 2
Module 3
Module 4
Admin upload workflows
Customer exports

Do not clutter the main UI.

Use an expandable panel/modal.

============================================================
9. DATA RETENTION & DELETION
============================================================

Do NOT invent a retention period.

If the application already has a retention/deletion policy, display the actual policy.

If no policy exists, display:

"Data retention and deletion are governed by the organization's configured retention policy."

Add an administrative capability/design placeholder for:

DATA RETENTION POLICY
DATA DELETION REQUEST
DATA EXPORT REQUEST
AUDIT LOG

Do not implement destructive deletion without the appropriate authorization and audit controls.

============================================================
10. LOGGING & AUDIT
============================================================

Ensure audit logs record security-sensitive events such as:

- customer data upload
- processing initiation
- analysis completion
- export generation
- administrative access
- approval actions
- deletion actions
- configuration changes

Logs must NOT expose complete sensitive customer transaction records.

Use identifiers/hashes where appropriate.

============================================================
11. EXPORT SECURITY
============================================================

Audit every export generated by Modules 1–4.

Ensure:

- export belongs to the correct customer
- export cannot accidentally contain another customer's records
- customer data is not mixed with another tenant
- PCBI reference data is correctly distinguished
- exported files contain appropriate confidentiality classification

Add a configurable footer/header:

"CONFIDENTIAL — CUSTOMER-SPECIFIC PROCUREMENT ANALYSIS"

Do not expose internal secrets, credentials, database identifiers, or security metadata.

============================================================
12. UI / UX
============================================================

Apply the Procucev enterprise design language already established.

Do not create large warning banners everywhere.

Use:

🔒 Secure Data Processing
"Your procurement data remains isolated to your organization and is not used to train AI models or analyze other customers."

with an expandable:

"How is my data protected?"

Detailed content appears only when expanded.

Place it strategically:

Module 1 upload
Customer dashboard
Module 1 analysis
Module 2 analysis
Module 3 customer-facing benchmark comparison
Module 4 results/export

============================================================
13. SECURITY TEST SUITE
============================================================

Create a dedicated security validation suite.

Minimum tests:

SEC-01 Tenant A cannot access Tenant B data
SEC-02 Tenant B cannot access Tenant A data
SEC-03 Customer data cannot enter PCBI Master
SEC-04 Customer data cannot enter PCBI Data Library automatically
SEC-05 Customer transaction prices cannot become global benchmark data
SEC-06 Customer data cannot enter another customer's analysis
SEC-07 Customer data cannot enter global AI context
SEC-08 Customer data cannot enter global vector namespace
SEC-09 Export cannot cross tenant boundaries
SEC-10 Dashboard cannot cross tenant boundaries
SEC-11 Logs do not expose sensitive transaction payloads
SEC-12 Unauthorized user cannot download customer files
SEC-13 Unauthorized admin action is blocked
SEC-14 Audit trail records security-sensitive actions
SEC-15 PCBI reference data remains distinguishable from customer data
SEC-16 Delete/retention controls respect authorization
SEC-17 Customer-specific derived analytics retain tenant ownership
SEC-18 No hidden global cache contains customer-specific analytical data

All tests must PASS.

============================================================
14. SECURITY DATA FLOW AUDIT
============================================================

Generate:

CUSTOMER_DATA_SECURITY_ARCHITECTURE.md

Include:

1. Upload
2. Storage
3. Processing
4. Module 1
5. Module 2
6. Module 3
7. Module 4
8. AI/LLM interaction
9. Database
10. File storage
11. Cache
12. Logs
13. Exports
14. Retention
15. Deletion
16. Tenant isolation

For every stage identify:

DATA ENTERS
DATA TRANSFORMATION
DATA STORED?
DATA SHARED?
DATA EXPORTED?
TENANT BOUNDARY
SECURITY CONTROL

============================================================
15. DO NOT CHANGE BUSINESS LOGIC
============================================================

ABSOLUTE LOCK:

DO NOT modify:

Module 1 calculation logic
Module 2 classification logic
Module 2 sourcing calculations
Module 2 savings/opportunity formulas
Module 3 PCBI formulas
Module 3 PCBI Master
Module 3 PCBI Data Library business logic
Module 4 savings realization logic
Customer transaction values
Supplier values
Historical prices
Benchmark values

This is a security/privacy hardening task only.

============================================================
16. QUALITY GATES
============================================================

Run:

typecheck
lint
build
quality:fast
all security tests
all existing Module 1 tests
all existing Module 2 tests
all existing Module 3 tests
all existing Module 4 tests

Compare pre-change and post-change business outputs.

Expected:

Business calculation variance = ₹0.00
Unexpected transaction-count variance = 0
Unexpected customer-spend variance = ₹0.00
Cross-tenant leakage = 0
Security test failures = 0

============================================================
17. FINAL SECURITY CERTIFICATION
============================================================

Generate:

CUSTOMER_DATA_SECURITY_VALIDATION_REPORT.md

Include:

FINAL_SECURITY_STATUS

TENANT_ISOLATION_STATUS

ENCRYPTION_STATUS

AI_TRAINING_DATA_STATUS

CROSS_CUSTOMER_REUSE_STATUS

PCBI_DATA_ISOLATION_STATUS

EXPORT_ISOLATION_STATUS

AUDIT_LOG_STATUS

RETENTION_STATUS

DELETION_STATUS

SECURITY_TESTS_PASSED

SECURITY_TESTS_FAILED

OPEN_SECURITY_GAPS

IMPORTANT:
Do not declare a control "PASS" merely because the UI says it exists.

Every PASS must be backed by implementation evidence and automated testing where technically possible.

If any security capability is not actually implemented, clearly mark it:

NOT_IMPLEMENTED
or
NOT_VERIFIED

Do not fabricate security guarantees.

============================================================
FINAL ACCEPTANCE CONDITION
============================================================

The software must provide customers with a credible enterprise-level explanation of how their procurement data is isolated, protected, processed and prevented from being reused across customers.

The final customer experience should communicate confidence without making unsupported absolute promises.

FINAL STATUS should be one of:

SECURITY_HARDENED_AND_VERIFIED

or

SECURITY_HARDENING_COMPLETE_WITH_OPEN_GAPS

depending strictly on actual implementation evidence.

Append this request to prompts.md chronologically.
Do not modify previously frozen business logic.
`;

fs.appendFileSync('prompts.md', promptText, 'utf8');
console.log('Appended Prompt 253 successfully');
