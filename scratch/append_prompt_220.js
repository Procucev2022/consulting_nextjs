const fs = require('fs');
const path = require('path');

const promptText = `## Prompt 220

ANTIGRAVITY MASTER COMMAND
PCBI V1.7 — FINAL ENTERPRISE UI/UX HARDENING + PCBI DATA LIBRARY SEPARATION + PRODUCTION READINESS

OPERATING MODE:
FINAL PRE-PRODUCTION HARDENING

OBJECTIVE:
Complete the final enterprise UI/UX and information-architecture hardening of aiCEV Enterprise before production deployment.

This is NOT a new business-logic development cycle.

The objective is to:
1. Clearly separate PCBI Master from commodity-level PCBI historical data.
2. Create a dedicated Commodity PCBI Data Library / Source Library workflow.
3. Make PCBI research-to-upload-to-approval a clean operational workflow.
4. Give the entire application a consistent, premium enterprise-software UI using the existing Procucev brand identity and colour palette.
5. Preserve all existing Module 1–4 business logic and governance controls.
6. Run complete regression testing.
7. Prepare the application for final production deployment.

============================================================
PART A — NON-NEGOTIABLE ARCHITECTURE LOCK
============================================================

DO NOT MODIFY:

- Module 1 customer-data architecture
- Module 2 classification logic
- Module 2 as the SOLE classification authority
- PCBI Master V1.0 business meaning
- PCBI calculation mathematics
- Base period methodology
- Approved methodologies
- PCBI provenance requirements
- PCBI versioning rules
- Customer-to-PCBI mismatch logic
- Frequency governance
- Specification validation
- Currency validation
- Unit validation
- Geography validation
- Admin approval gates
- Targeted customer reprocessing logic
- Module 4 business logic
- Existing savings controls
- Existing audit controls

DO NOT generate synthetic historical data.

DO NOT automatically interpolate or extrapolate historical observations.

DO NOT silently transform frequency.

DO NOT automatically approve a source.

DO NOT change customer spend.

DO NOT change Module 2 classifications.

DO NOT change benchmark methodology merely to make a commodity eligible.

This task is primarily:

UI/UX + navigation + information architecture + upload workflow + enterprise design consistency.

============================================================
PART B — CRITICAL PCBI MASTER / PCBI DATA SEPARATION
============================================================

The current "PCBI Master Upload" screen must remain dedicated to the SYSTEM-LEVEL PCBI MASTER.

PCBI MASTER means:

"WHAT THE PCBI IS"

It contains things such as:

- PCBI definitions
- PCBI IDs
- Commodity definitions
- Series definitions
- Technical metadata
- Classification references
- Governance metadata
- Version information
- Master catalogue information

It must NOT become the normal location for uploading commodity historical source datasets.

------------------------------------------------------------

CREATE A SEPARATE MODULE:

PCBI DATA LIBRARY

PCBI DATA LIBRARY means:

"THE HISTORICAL SOURCE DATA USED TO BUILD / MAINTAIN THE PCBI"

This is where administrators will upload:

- Government historical data
- Exchange historical data
- Industry association data
- Producer publications
- Commercial publisher data
- PDF historical reports
- XLS/XLSX datasets
- CSV datasets
- JSON datasets
- TXT datasets

The two workflows must be visually and operationally distinct.

============================================================
PART C — REQUIRED NAVIGATION
============================================================

Create/restructure the PCBI administration navigation as follows:

PCBI

├── PCBI Dashboard
│
├── PCBI Master
│   ├── Master Catalogue
│   ├── Upload / Update Master
│   ├── Validate
│   ├── Preview
│   ├── Import
│   ├── Version History
│   └── Published Versions
│
└── PCBI Data Library
    ├── Coverage Dashboard
    ├── Research Queue
    ├── Commodity PCBI
    ├── Source Library
    ├── Upload PCBI Data
    ├── Validation Queue
    ├── Pending Approval
    ├── Active PCBI Series
    └── Version History

Use terminology consistently throughout the application.

============================================================
PART D — CLEAR USER WARNING
============================================================

On PCBI Master screen show:

"PCBI MASTER — SYSTEM REFERENCE DATA"

"Use this area for PCBI definitions, series metadata and system-level reference information. Commodity historical benchmark source data must be uploaded through PCBI Data Library."

On PCBI Data Library show:

"PCBI DATA LIBRARY — COMMODITY SOURCE DATA"

"Upload and manage historical market/reference data used to construct and maintain PCBI series."

On Module 1 show:

"CUSTOMER PURCHASE DATA"

"Customer purchase-history data must be uploaded and managed through Module 1."

These distinctions must be immediately understandable to a non-technical administrator.

============================================================
PART E — COMMODITY PCBI UPLOAD WORKFLOW
============================================================

Create:

"Upload Commodity PCBI Data"

The workflow must begin with:

STEP 1 — SELECT COMMODITY

Display:

- Commodity Name
- Commodity ID
- Module 2 Classification
- UNSPSC
- Customer Spend
- Transaction Count
- Existing PCBI ID
- PCBI Definition Status
- PCBI Data Status
- Required History
- Available History
- Required Frequency
- Required Unit
- Required Currency
- Required Geography
- Research Priority
- Current Gap Status

Then:

STEP 2 — SELECT / CREATE PCBI SERIES

If existing:
show the existing PCBI.

If missing:
allow the administrator to initiate the governed "Create PCBI Definition" workflow.

Do not bypass governance.

STEP 3 — UPLOAD SOURCE

Support:

- XLSX
- XLS
- CSV
- PDF
- JSON
- TXT

Also support drag-and-drop.

STEP 4 — SOURCE IDENTIFICATION

Capture:

- Source ID
- Source Name
- Publisher
- URL
- Document
- Publication Date
- Frequency
- Unit
- Currency
- Geography
- Grade/specification
- Source checksum
- Source status

STEP 5 — DATA EXTRACTION

Auto-detect where possible:

- Date
- Effective Date
- Price/value
- Unit
- Currency
- Frequency
- Geography
- Grade
- Specification

Allow administrator mapping if automatic detection is uncertain.

STEP 6 — DATA QUALITY

Validate:

- Missing dates
- Duplicate dates
- Missing values
- Invalid values
- Unit consistency
- Currency consistency
- Frequency consistency
- Historical continuity
- Specification consistency

STEP 7 — PCBI STANDARDIZATION PREVIEW

Show exactly what the system intends to ingest.

NO production write at this stage.

STEP 8 — GOVERNANCE VALIDATION

Validate:

- Specification
- Currency
- Unit
- Frequency
- Geography
- Source
- Historical coverage
- Methodology
- Provenance

STEP 9 — ADMIN APPROVAL

Actions:

APPROVE

REJECT

REQUEST CORRECTION

STEP 10 — ACTIVATE

Only after approval:

- Create/update PCBI version
- Record audit trail
- Update coverage
- Trigger targeted customer reprocessing where applicable

============================================================
PART F — RESEARCH QUEUE INTEGRATION
============================================================

Research Queue must become the natural starting point for new commodity expansion.

Example:

P1 | Ferro Molybdenum 65% | NO_HISTORY | Research
P1 | Heavy Duty Slurry Pumps | NO_HISTORY | Research
P2 | Tungsten Carbide Inserts | PARTIAL_HISTORY | Upload
P3 | HDPE Granules | PARTIAL_HISTORY | Upload
P3 | Stainless Steel 304 Scrap | SOURCE_UNVERIFIED | Verify
P4 | Hydraulic Oil ISO 68 | SPECIFICATION_MISMATCH | Review

Every row should have an appropriate action:

- Research
- Upload
- Verify
- Review
- Create Definition

Clicking the action must open the correct PCBI Data Library workflow.

It must NEVER redirect to the PCBI Master upload screen unless the administrator is explicitly performing a Master operation.

============================================================
PART G — MULTI-SOURCE PCBI ARCHITECTURE
============================================================

Multiple sources for the same commodity must coexist.

Example:

FERRO MOLYBDENUM 65%

PCBI:
PCBI-IND-FEA-FEMO-001

Sources:

Source A — Government
Source B — Industry Association
Source C — Commercial Publisher

Each source retains independently:

- SOURCE_ID
- SOURCE_NAME
- PUBLISHER
- URL
- DOCUMENT
- PUBLICATION_DATE
- FREQUENCY
- UNIT
- CURRENCY
- GEOGRAPHY
- GRADE
- SPECIFICATION
- CHECKSUM
- SOURCE_STATUS
- VALIDATION_STATUS
- VERSION

Never overwrite an existing source automatically.

============================================================
PART H — SOURCE COMPARISON VIEW
============================================================

Create a professional comparison screen:

"Source Comparison"

For a selected commodity show:

Source
Publisher
Coverage Start
Coverage End
Frequency
Unit
Currency
Geography
Specification
Status
Methodology
Variance
Validation Result

The administrator must be able to compare multiple candidate sources before selecting/approving a production source.

============================================================
PART I — PCBI DATA LIBRARY
============================================================

Create a searchable PCBI Data Library.

Filters:

- Commodity
- PCBI ID
- Source
- Publisher
- Frequency
- Geography
- Unit
- Currency
- Status
- History Coverage
- Version
- Validation Status

Example detail view:

FERRO MOLYBDENUM 65%

PCBI ID:
PCBI-IND-FEA-FEMO-001

Coverage:
2020-04 → Present

Sources:
3

Source 1:
Government
Monthly
India
Validated

Source 2:
Industry Association
Weekly
India
Under Validation

Source 3:
Commercial
Weekly
India
Source Unverified

The library must clearly distinguish:

SOURCE DATA

STANDARDIZED DATA

ACTIVE PCBI SERIES

============================================================
PART J — ENTERPRISE UI/UX REDESIGN
============================================================

Perform a system-wide visual consistency pass across the entire aiCEV Enterprise application.

Use the existing Procucev branding and colour palette.

The visual language should communicate:

- Enterprise
- Professional
- Premium
- Modern
- Trustworthy
- Procurement intelligence
- Data quality
- Governance
- Operational clarity

Avoid:

- Gaming-style visuals
- Excessive neon/glow effects
- Excessive gradients
- Excessive rounded cards
- Excessive decorative elements
- Oversized typography
- Too many colours
- Inconsistent button styles
- Inconsistent icon styles
- Unnecessary visual clutter

The application should look like one enterprise platform rather than independently designed screens.

============================================================
PART K — COMMON DESIGN SYSTEM
============================================================

Create/reuse common design components.

Standardize:

TYPOGRAPHY
- Page title
- Section title
- Subheading
- Body
- Metadata
- Table text
- KPI
- Helper text

COMPONENTS
- Buttons
- Inputs
- Dropdowns
- Search
- Filters
- Tables
- Cards
- Tabs
- Modals
- Upload areas
- Progress indicators
- Alerts
- Status badges
- Empty states
- Error states
- Confirmation dialogs

Do not create separate visual implementations of the same component in different modules.

============================================================
PART L — STATUS DESIGN SYSTEM
============================================================

Create one reusable status component for:

PRODUCTION_READY
PARTIAL_HISTORY
NO_HISTORY
MISSING
SOURCE_UNVERIFIED
METHODOLOGY_PENDING
SPECIFICATION_MISMATCH
FREQUENCY_MISMATCH
NOT_BENCHMARKABLE
VALIDATION_PENDING
APPROVED
REJECTED

Status colours must remain consistent everywhere.

============================================================
PART M — ENTERPRISE TABLES
============================================================

All major tables should support where applicable:

- Search
- Sort
- Filter
- Pagination
- Column visibility
- Sticky headers
- Export
- Row actions
- Status badges
- Tooltips
- Detail view

Do not force highly technical datasets into unreadable tables.

Use:

SUMMARY COLUMNS + VIEW DETAILS

for complex records.

============================================================
PART N — DASHBOARD DESIGN
============================================================

Use a consistent enterprise dashboard pattern:

PAGE TITLE
Context / Description

KPI SUMMARY

PRIMARY ANALYTICS

FILTERS

DATA TABLE

ACTION / DETAIL PANEL

Avoid excessive KPI cards.

Prioritize information that supports operational decisions.

============================================================
PART O — UPLOAD UI
============================================================

All upload workflows should follow a consistent visual pattern:

1. WHAT ARE YOU UPLOADING?
2. WHERE DOES IT BELONG?
3. UPLOAD SOURCE
4. SYSTEM INTERPRETATION
5. VALIDATION
6. PREVIEW
7. APPROVAL
8. ACTIVATION

Display progress throughout the workflow.

The administrator should always know:

- What they are uploading
- Which commodity it belongs to
- Which PCBI series it belongs to
- Which source is being added
- Whether it is production or preview
- What action is currently required

============================================================
PART P — BREADCRUMBS
============================================================

Add breadcrumbs to all deep workflows.

Example:

Admin
/
PCBI Data Library
/
Research Queue
/
Ferro Molybdenum 65%
/
Upload Source

This is especially important because PCBI Master and PCBI Data Library are separate workflows.

============================================================
PART Q — CUSTOMER DATA / PCBI DATA ISOLATION
============================================================

The UI must make an absolute distinction between:

CUSTOMER DATA

and

PCBI DATA.

Customer Data:

Module 1
Customer purchase history
Customer transactions

PCBI Data:

External market/reference/index data
Historical source observations
Publisher data
Government data
Exchange data
Industry data

Never use ambiguous terms such as simply "Upload Data" where the destination is unclear.

Use explicit labels:

"Upload Customer Purchase Data"

"Upload Commodity PCBI Source Data"

============================================================
PART R — RESPONSIVE ENTERPRISE DESKTOP
============================================================

Primary target:

1366×768
1440×900
1920×1080

Ensure:

- No broken layouts
- No overlapping elements
- No accidental page-level horizontal scrolling
- Tables use controlled horizontal scrolling only where necessary
- Navigation remains usable
- Upload workflows remain readable
- Dialogs fit the viewport

============================================================
PART S — ACCESSIBILITY & USABILITY
============================================================

Ensure:

- Clear labels
- Keyboard navigation
- Visible focus states
- Adequate contrast
- Tooltips where technical terms are unavoidable
- Clear error messages
- Clear success messages
- Confirmation before destructive actions
- No ambiguous primary buttons

============================================================
PART T — DO NOT CREATE ANOTHER SOFTWARE DEVELOPMENT LOOP
============================================================

This is intended to be the FINAL UI/UX hardening pass before production.

Do not introduce unnecessary architectural refactoring.

Do not rewrite stable business logic.

Do not modify the calculation engine unless a genuine defect is discovered.

If a defect is discovered:

1. Document it.
2. Fix only the defect.
3. Run regression tests.
4. Record the change.

Otherwise keep the existing production-ready architecture frozen.

============================================================
PART U — REQUIRED ACCEPTANCE TESTS
============================================================

Execute at least:

UI-01
PCBI Master upload remains dedicated to PCBI Master.

UI-02
Commodity PCBI upload is completely separate.

UI-03
Research Queue → Commodity → Upload opens PCBI Data Library.

UI-04
Commodity upload requires commodity/PCBI context.

UI-05
Multiple sources coexist without overwrite.

UI-06
Customer purchase data cannot be uploaded into PCBI Data Library.

UI-07
PCBI source data cannot accidentally enter Module 1.

UI-08
All PCBI status badges use the same design system.

UI-09
All major modules use consistent enterprise components.

UI-10
1366×768 layout passes.

UI-11
1440×900 layout passes.

UI-12
1920×1080 layout passes.

UI-13
Existing Module 1 functionality unchanged.

UI-14
Existing Module 2 functionality unchanged.

UI-15
Existing Module 3 functionality unchanged.

UI-16
Existing Module 4 functionality unchanged.

UI-17
PCBI calculation tests pass.

UI-18
API tests pass.

UI-19
Typecheck passes.

UI-20
Lint passes.

UI-21
Build passes.

UI-22
Full regression suite passes.

============================================================
PART V — REGRESSION LOCK
============================================================

Before declaring completion, verify:

Module 1 = FROZEN
Module 2 = FROZEN / SOLE CLASSIFICATION AUTHORITY
PCBI Master V1.0 = IMMUTABLE
Module 3 calculation engine = FROZEN
Module 4 = FUNCTIONALLY UNCHANGED
Savings logic = unchanged
Governance = unchanged
Provenance = unchanged

No regression is acceptable.

============================================================
PART W — DOCUMENTATION
============================================================

Generate:

PCBI_V1_7_ENTERPRISE_UI_AND_UPLOAD_ARCHITECTURE.md

Include:

1. Existing UI assessment
2. PCBI Master vs PCBI Data separation
3. New navigation
4. Commodity upload architecture
5. Research Queue integration
6. Multi-source architecture
7. Source comparison
8. Enterprise design system
9. Procucev colour implementation
10. Component standardization
11. Customer/PCBI data separation
12. Responsive validation
13. Accessibility validation
14. Acceptance tests
15. Regression results
16. Files/components changed
17. Files/components intentionally untouched
18. Final production-readiness conclusion

============================================================
PART X — FINAL ACCEPTANCE CRITERIA
============================================================

The work is COMPLETE only if an administrator can immediately understand:

PCBI MASTER
=
WHAT THE PCBI IS

PCBI DATA LIBRARY
=
THE HISTORICAL SOURCE DATA USED TO BUILD / MAINTAIN THE PCBI

MODULE 1
=
CUSTOMER PURCHASE DATA

And the administrator can execute:

RESEARCH QUEUE
→
SELECT COMMODITY
→
RESEARCH SOURCE
→
UPLOAD SOURCE
→
AUTO-EXTRACT
→
STANDARDIZE
→
VALIDATE
→
ADMIN APPROVE
→
CREATE PCBI VERSION
→
TARGETED CUSTOMER REPROCESSING
→
COVERAGE UPDATED

without confusing the workflow with PCBI Master.

============================================================
PART Y — IMPORTANT: DO NOT START COMMODITY RESEARCH YET
============================================================

Do NOT start Ferro Molybdenum research as part of this command.

First complete:

1. UI/UX hardening
2. PCBI Master / PCBI Data separation
3. Commodity upload workflow
4. Research Queue integration
5. Enterprise design system
6. Regression testing
7. Build validation

Then STOP and provide the completion report.

After this command passes, the next activity will be BUSINESS/DATA RESEARCH only.

The first target will be:

FERRO MOLYBDENUM 65%

We will research its historical data separately and populate it through:

PCBI DATA LIBRARY

NOT:

PCBI MASTER UPLOAD.

============================================================
FINAL OUTPUT REQUIRED
============================================================

Return a concise completion report containing:

1. UI/UX changes completed
2. PCBI Master vs PCBI Data separation completed
3. New navigation completed
4. Commodity upload workflow completed
5. Research Queue integration completed
6. Enterprise design system completed
7. Procucev branding applied
8. Acceptance tests passed/failed
9. Regression tests passed/failed
10. Typecheck result
11. Lint result
12. Build result
13. Any defects discovered
14. Exact files changed
15. Confirmation that no business logic was changed
16. Confirmation that the code is ready for Git commit/push

FINAL STATUS SHOULD BE ONE OF:

READY_FOR_GIT_PUSH

or

BLOCKED — DEFECTS REQUIRE ATTENTION`;

const promptsFile = path.resolve('c:/Users/srini/Desktop/Antigravity Consulting Files/consulting_nextjs/prompts.md');
fs.appendFileSync(promptsFile, '\n\n' + promptText + '\n');
console.log('Appended Prompt 220 successfully.');
