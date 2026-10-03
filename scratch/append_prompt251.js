const fs = require('fs');

const promptText = `
## Prompt 251
FINAL ENTERPRISE PRODUCTION HARDENING COMMAND
==============================================

SYSTEM: aiCEV / Procucev Enterprise Procurement Intelligence Platform

OBJECTIVE
---------
Perform one final end-to-end production hardening, validation, UX improvement and integration
exercise across MODULE 1 → MODULE 2 → MODULE 3 → MODULE 4.

This is NOT a request to redesign the business architecture.

This is a FINAL PRODUCTION HARDENING command.

Preserve all already-certified business logic unless a genuine defect, inconsistency,
calculation error, traceability failure, security issue, usability issue, or integration
defect is discovered.

Do NOT introduce synthetic data.
Do NOT introduce assumed savings percentages.
Do NOT fabricate historical benchmark values.
Do NOT silently interpolate benchmark frequencies.
Do NOT modify Module 2 classification authority.
Do NOT allow Module 3 PCBI data to leak into Module 2.
Do NOT allow Module 4 savings realization to alter Module 2 opportunity calculations.
Do NOT alter the certified customer transaction data.

============================================================
PART 1 — GLOBAL ARCHITECTURAL LOCK
============================================================

Establish and verify the following permanent boundaries:

MODULE 1
---------
Customer purchase data ingestion, validation, normalization and transaction truth.

MODULE 2
---------
Strategic sourcing intelligence only:
- spend analysis
- supplier analysis
- price dispersion
- price improvement opportunity
- e-auction opportunity
- vendor consolidation
- category specialization
- volume bundling
- supplier fragmentation
- sourcing strategy
- opportunity ranges
- opportunity waterfall
- transaction-level evidence

MODULE 3
---------
PCBI / external benchmark intelligence only.

MODULE 4
---------
Execution / realization / approved savings tracking only.

Dependency direction must remain:

MODULE 1
   ↓
MODULE 2
   ↓
MODULE 3 (reference/benchmark intelligence where explicitly applicable)
   ↓
MODULE 4

No circular dependency.

No Module 4 result may rewrite Module 1 or Module 2 historical truth.

No PCBI benchmark may silently become a Module 2 historical price.

============================================================
PART 2 — MODULE 1 FINAL DATA-INTEGRITY HARDENING
============================================================

Perform a complete forensic audit of Module 1.

Validate:

A. FILE INGESTION
-----------------
- XLSX
- XLS
- CSV
- PDF where supported
- multi-sheet files
- large files
- duplicate uploads
- repeated uploads
- malformed files
- empty files
- missing headers
- inconsistent headers
- mixed data types

B. TRANSACTION IDENTITY
-----------------------
Every transaction must have a deterministic unique identity.

Validate:
- transaction ID
- source file
- source sheet
- source row
- upload batch
- ingestion timestamp
- original raw values
- normalized values

A transaction must never be duplicated silently.

C. MONEY VALIDATION
-------------------
For every transaction verify:

Quantity × Unit Price = Gross Transaction Value

where applicable.

Validate:
- INR
- USD
- EUR
- GBP
- other supported currencies
- currency conversion rules
- exchange rate provenance
- conversion date
- original amount
- converted amount

Never display a converted value as if it were the original transaction value.

Customer transaction currency and PCBI currency must remain explicitly separated.

D. UOM VALIDATION
-----------------
Strictly distinguish:

KG
MT
LITRE
PIECE
ROLL
BOX
SET
METER
etc.

Never allow:
MT → KG without explicit governed conversion.
PIECE → LITRE.
ROLL → PIECE.
Customer UOM → PCBI UOM.

Every conversion must contain:
- source UOM
- target UOM
- conversion factor
- methodology
- approval/reference

E. DATE VALIDATION
------------------
Validate:
- PO date
- delivery date where available
- invoice date where available
- contract date where available
- duplicate dates
- impossible dates
- future dates
- date parsing differences

F. NEGATIVE VALUE / ZERO VALUE CONTROL
--------------------------------------
Explicitly classify:
- zero quantity
- zero price
- zero value
- negative quantity
- negative price
- credit/debit transactions
- cancellations
- returns

Do not silently remove these records.

Every exclusion must have a reason code.

G. TOTAL RECONCILIATION
-----------------------
For every upload establish:

RAW FILE TOTAL
= VALID TRANSACTION TOTAL
+ EXCLUDED TRANSACTION TOTAL
+ TRANSFORMATION DIFFERENCE

Transformation difference must be ₹0 unless a documented conversion/reconciliation rule
explicitly explains it.

Final customer spend must reconcile exactly.

H. CATEGORY / ITEM / SUPPLIER HIERARCHY
---------------------------------------
Validate:

Supplier
→ Category
→ Subcategory
→ Item
→ Specification
→ UOM
→ Currency
→ Transaction

No transaction may disappear between hierarchy levels.

I. DISPLAY-LEVEL PROTECTION
----------------------------
The UI must never show:
- wrong currency symbol
- wrong UOM
- wrong quantity
- wrong supplier
- wrong category
- wrong transaction count

Every executive KPI must be drillable to the underlying transaction records.

============================================================
PART 3 — MODULE 2 FINAL BUSINESS LOGIC HARDENING
============================================================

Preserve the certified MODULE_2_FINAL_E2E_VALIDATION_V1.0 logic.

Strengthen the following:

1. PRICE OPPORTUNITY
--------------------
Show:

MIN
P10
P25
MEDIAN
WEIGHTED AVERAGE
P75
P90
MAX
IQR
CV
PRICE SPREAD

Every number must be drillable to the transactions supporting it.

2. LOWEST CREDIBLE HISTORICAL PRICE
------------------------------------
Never simply use MIN.

A credible reference price must satisfy the existing approved qualification rules.

Show exactly which transactions qualified and which were excluded.

3. PRICE OPPORTUNITY RANGE
---------------------------
Continue to show:

LOW CASE
BASE CASE
HIGH CASE

But explicitly label:

ILLUSTRATIVE / HISTORICAL EVIDENCE-BASED OPPORTUNITY

Never call it guaranteed savings.

4. E-AUCTION
------------
For every e-auction recommendation show:

- eligible suppliers
- eligible spend
- eligible volume
- comparable specifications
- supplier count
- historical price dispersion
- current supplier prices
- reference price
- potential opportunity range
- auction suitability
- recommended auction format
- reserve-price logic
- opening-ceiling logic
- exclusions
- operational risks

The system must distinguish:

HISTORICAL DEMONSTRATED OPPORTUNITY
from
COMPETITIVE EVENT POTENTIAL.

Never guarantee an auction outcome.

5. VENDOR CONSOLIDATION
-----------------------
This must be calculated at:

CATEGORY
→ SUBCATEGORY
→ ITEM
→ SPECIFICATION
→ SUPPLIER

level.

Do NOT simply say:

"10 suppliers → 2 suppliers = savings."

Instead calculate:

Eligible spend
Eligible volume
Supplier fragmentation
Comparable specifications
Current supplier prices
Historical best credible prices
Volume that can realistically be bundled
Supplier capacity
Single-source risk
Dual-source risk
Switching cost
Dependency risk
Concentration risk

Show:

CURRENT STATE
PROPOSED STATE
ELIGIBLE SPEND
ELIGIBLE VOLUME
POTENTIAL BENEFIT RANGE
RISK
EXCLUSIONS
EVIDENCE

6. MULTI-CATEGORY SUPPLIERS
---------------------------
Where one supplier supplies multiple unrelated categories:

analyse each category separately.

Example:

Supplier A
├── Fasteners
├── Electrical
├── MRO
└── Packaging

Do not assume consolidation benefit simply because one supplier supplies many categories.

Identify:

CORE CATEGORY
NON-CORE CATEGORY
SPECIALIST CATEGORY
TRADER / DISTRIBUTOR POSSIBILITY
CATEGORY-SPECIALIST ALTERNATIVE

Then calculate the opportunity at category/item level.

7. SMALL SUPPLIER CONSOLIDATION
-------------------------------
If multiple small suppliers supply the SAME:

- item
- specification
- UOM
- geography
- comparable quality

evaluate volume bundling.

Do not assume price reduction.

Use historical transaction evidence.

8. DOUBLE COUNTING
-------------------
Every opportunity must have:

OPPORTUNITY_ID
LEVER_ID
TRANSACTION_ID
CATEGORY_ID
ITEM_ID
SUPPLIER_ID
CALCULATION_METHOD
ELIGIBLE_SPEND
OPPORTUNITY_VALUE

Every transaction must belong to one mutually exclusive opportunity allocation unless
explicitly allowed by the approved waterfall methodology.

Final:

SUM(OPPORTUNITY LEDGER)
must reconcile with:

NET DEFENSIBLE OPPORTUNITY.

9. NO-OPPORTUNITY OUTPUT
------------------------
Never say:

"Procurement is perfect."

Instead say:

"NO QUANTIFIABLE OPPORTUNITY IDENTIFIED FROM AVAILABLE HISTORICAL DATA."

Then show:

- sample size
- supplier count
- price dispersion
- data confidence
- excluded transactions
- reasons
- additional data required
- potential areas requiring further investigation

This prevents a false conclusion of procurement perfection.

============================================================
PART 4 — MINUTE-LEVEL EVIDENCE / FORENSIC DRILL-DOWN
============================================================

This is mandatory.

Every important output must be explainable down to the smallest available data level.

For every KPI provide:

EXECUTIVE KPI
   ↓
CATEGORY
   ↓
ITEM
   ↓
SUPPLIER
   ↓
TRANSACTION
   ↓
ORIGINAL CUSTOMER RECORD

For each calculation show:

INPUT VALUE
INPUT SOURCE
FILTER
EXCLUSION
FORMULA
INTERMEDIATE VALUE
FINAL VALUE

Provide a "Show Calculation" / "View Evidence" expandable panel.

Example:

Potential E-Auction Opportunity
₹X

EXPAND

Eligible Spend:
₹X

Eligible Suppliers:
4

Eligible Transactions:
27

Reference Price:
₹X / MT

Current Weighted Price:
₹X / MT

Price Difference:
₹X / MT

Eligible Volume:
X MT

Calculated Opportunity:
₹X

Formula:
(Current Weighted Price - Reference Price) × Eligible Volume

Supporting Transactions:
PO-001
PO-002
PO-003
...

This evidence must be generated from actual data.

============================================================
PART 5 — MODULE 3 PROTECTION
============================================================

Do not redesign Module 3.

Verify:

- PCBI Master remains immutable where required.
- PCBI Data Library remains separate.
- Commodity research remains separate from customer data.
- No fabricated historical values.
- No silent frequency interpolation.
- Source provenance remains intact.
- PCBI versioning remains intact.
- Admin approval remains mandatory.
- Module 3 benchmark values are never mistaken for customer purchase prices.

Verify the new commodity upload architecture remains isolated from Module 1 uploads.

============================================================
PART 6 — MODULE 4 CONTINUITY VALIDATION
============================================================

Validate only the integration contract.

Module 4 must receive only approved Module 2 opportunities.

Each handoff must contain:

OPPORTUNITY_ID
CATEGORY
ITEM
SUPPLIER
CURRENT BASELINE
ELIGIBLE SPEND
ELIGIBLE VOLUME
REFERENCE BASIS
OPPORTUNITY RANGE
CONFIDENCE
ASSUMPTIONS
EXCLUSIONS
SOURCE TRANSACTIONS
APPROVAL STATUS

Module 4 must NOT invent:

- savings %
- benchmark prices
- supplier rankings
- auction results
- realized savings

before actual execution evidence exists.

Clearly distinguish:

IDENTIFIED OPPORTUNITY
TARGET
NEGOTIATED BENEFIT
REALIZED SAVING
REALIZED COST AVOIDANCE

============================================================
PART 7 — COMPLETE END-TO-END TEST
============================================================

Create a certified test dataset containing:

- multiple currencies
- multiple UOMs
- multiple suppliers
- multiple categories
- multi-category suppliers
- small suppliers
- duplicate transactions
- specification mismatches
- missing values
- zero values
- negative/credit transactions
- different price levels
- contract and spot transactions
- recurrent and non-recurrent spend
- auction-suitable category
- consolidation-suitable category
- category with no quantifiable opportunity

Execute:

MODULE 1
→ MODULE 2
→ MODULE 3 isolation check
→ MODULE 4 handoff

Verify:

1. Transaction counts
2. Spend totals
3. Category totals
4. Supplier totals
5. Currency totals
6. UOM totals
7. Opportunity totals
8. Exclusion totals
9. Double-counting
10. Evidence lineage
11. UI display
12. API response
13. Database persistence
14. Module handoff

Any discrepancy must fail the test.

============================================================
PART 8 — UI/UX ENTERPRISE FINAL PASS
============================================================

Improve the UI across ALL FOUR MODULES without changing business calculations.

Design objective:

"Executive-grade enterprise procurement intelligence platform."

Use the existing Procucev design language and brand palette.

Ensure:

- consistent navigation
- consistent page hierarchy
- consistent cards
- consistent typography
- consistent badges
- consistent tables
- consistent filters
- consistent empty states
- consistent warnings
- consistent success/error states
- consistent drill-down behaviour
- consistent breadcrumbs
- consistent action buttons

The user journey should be obvious:

UPLOAD
→ VALIDATE
→ ANALYSE
→ IDENTIFY
→ DEEP DIVE
→ APPROVE
→ EXECUTE
→ REALIZE

Each module must clearly communicate:

WHERE AM I?
WHAT AM I LOOKING AT?
WHAT DOES THIS NUMBER MEAN?
WHAT CAN I DO NEXT?

============================================================
PART 9 — LONG ANALYSIS / INFORMATION DENSITY
============================================================

Do NOT show extremely long analysis blocks by default.

Implement enterprise-friendly progressive disclosure.

Default view:

KEY INSIGHT
KEY NUMBERS
STATUS
RECOMMENDED ACTION

Then:

[+ View Calculation]
[+ View Evidence]
[+ View Transactions]
[+ View Methodology]
[+ View Exclusions]
[+ View Audit Trail]

Use accordions / expanders for:

- long explanations
- calculation details
- transaction lists
- methodology
- audit trails
- source details
- exclusions
- historical observations

Important:

Never hide a critical warning, status, approval requirement or material exception.

Use progressive disclosure, not information removal.

============================================================
PART 10 — UI DATA INTEGRITY RULE
============================================================

The UI must never independently calculate business numbers differently from backend services.

Backend = calculation authority.

Frontend = presentation authority.

Any number displayed in the UI must originate from the governed backend response.

No duplicate business formulas in frontend components.

============================================================
PART 11 — FINAL AUDIT ARTIFACTS
============================================================

Generate:

1.
FINAL_ENTERPRISE_E2E_VALIDATION.md

2.
FINAL_ENTERPRISE_CALCULATION_AUDIT.xlsx

3.
FINAL_ENTERPRISE_TRANSACTION_TRACEABILITY.xlsx

4.
FINAL_ENTERPRISE_OPPORTUNITY_LEDGER.xlsx

5.
FINAL_ENTERPRISE_INTEGRATION_AUDIT.json

6.
FINAL_ENTERPRISE_UI_UX_AUDIT.md

7.
FINAL_ENTERPRISE_TEST_RESULTS.json

Include:

- all tests
- pass/fail
- calculations
- reconciliation
- transaction lineage
- exclusions
- opportunity ledger
- UI validation
- module boundaries
- integration validation
- defects
- remediation
- final release decision

============================================================
PART 12 — FINAL QUALITY GATES
============================================================

Run:

- typecheck
- lint
- build
- unit tests
- integration tests
- end-to-end tests
- negative tests
- calculation reconciliation
- transaction traceability
- UI regression tests
- API tests
- database persistence tests
- module boundary tests

Require:

ZERO calculation discrepancies
ZERO unexplained reconciliation variance
ZERO duplicate opportunity allocation
ZERO synthetic savings
ZERO fabricated benchmark data
ZERO silent interpolation
ZERO currency/UOM display errors
ZERO broken transaction lineage
ZERO critical UI defects
ZERO Module 1 → Module 2 data loss
ZERO Module 2 → Module 4 handoff corruption

============================================================
PART 13 — FROZEN LOGIC PROTECTION
============================================================

Do not modify certified business logic simply to make tests pass.

If a test exposes a genuine defect:

1. Identify the defect.
2. Explain the business impact.
3. Correct only the affected component.
4. Add regression coverage.
5. Re-run the complete relevant test suite.
6. Record the change.

If no defect exists:

DO NOT refactor stable business logic unnecessarily.

============================================================
PART 14 — FINAL RELEASE GATE
============================================================

At the end provide exactly:

FINAL_ENTERPRISE_STATUS =
    PRODUCTION_READY
OR
    PRODUCTION_READY_WITH_NON_BLOCKING_ITEMS
OR
    BLOCKED

Also provide:

MODULE_1_STATUS =
MODULE_2_STATUS =
MODULE_3_STATUS =
MODULE_4_STATUS =

CALCULATION_INTEGRITY =
DATA_RECONCILIATION =
TRANSACTION_TRACEABILITY =
OPPORTUNITY_TRACEABILITY =
DOUBLE_COUNTING_CONTROL =
MODULE_CONTINUITY =
UI_UX_STATUS =
SECURITY / GOVERNANCE STATUS =

If anything is BLOCKED, clearly identify:

BLOCKER
BUSINESS IMPACT
ROOT CAUSE
REQUIRED ACTION
OWNER
RETEST REQUIRED = YES/NO

Do not declare production readiness merely because tests pass.

Production readiness requires both:

TECHNICAL PASS
AND
BUSINESS LOGIC PASS.

Finally append this prompt to prompts.md with the next sequential prompt number.

DO NOT START PCBI COMMODITY RESEARCH IN THIS COMMAND.

PCBI commodity research remains a separate continuous parallel business activity.

The purpose of this command is to make the existing platform production-safe,
calculation-safe, traceable, integrated and professionally usable before deployment.
`;

fs.appendFileSync('prompts.md', promptText, 'utf8');
console.log('Appended Prompt 251 successfully');
