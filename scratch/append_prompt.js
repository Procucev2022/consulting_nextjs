const fs = require('fs');
const path = require('path');

const promptText = `## Prompt 244

MODULE 1 — FINAL FORENSIC END-TO-END VALIDATION, CALCULATION AUDIT & TRANSACTION-LEVEL PROOF

Perform a FINAL, DEEP, ADVERSARIAL validation of MODULE 1 only.

IMPORTANT:
This is a production-grade procurement analytics system. Do not accept a result merely because the UI looks correct or because existing tests pass.

The objective is to prove that every number displayed by Module 1 is mathematically correct, fully reconciled, transaction-level traceable, reproducible from the uploaded source file, and safe to hand over to Module 2.

Do NOT modify Module 3 / PCBI.
Do NOT introduce benchmark prices.
Do NOT introduce synthetic savings.
Do NOT use external benchmark data.
Do NOT change Module 2 business logic except where a Module 1 handoff contract requires correction.
Do NOT invent missing data.

========================================================
1. MODULE 1 BOUNDARY
========================================================

Freeze the Module 1 responsibility as:

UPLOAD
→ FILE PARSING
→ RECORD INGESTION
→ DATA VALIDATION
→ DATA CLEANSING / NORMALIZATION
→ MULTI-CURRENCY CONVERSION
→ LINE-LEVEL SPEND CALCULATION
→ RECONCILIATION
→ MATERIAL / CATEGORY / SUPPLIER / PLANT / MONTH AGGREGATION
→ PARETO
→ DATA QUALITY
→ AUDIT TRAIL
→ MODULE 2 HANDOFF

Module 1 must NOT calculate:
- procurement savings
- market benchmark savings
- PCBI benchmark values
- supplier negotiation savings
- e-auction savings
- vendor consolidation savings
- assumed price reductions

Module 1 supplies factual customer procurement data to Module 2.

========================================================
2. FULL-FILE RECONCILIATION — NO SAMPLING
========================================================

Validate the COMPLETE uploaded dataset.

The current UI shows:
- 31,671 records
- ₹5,920.35 Cr evaluated spend
- 1,932 unique items
- 969 unique vendors
- 256 material groups
- 26 facilities
- 24 billing months

Verify every one of these independently from the raw uploaded records.

DO NOT treat:
"30 Sample Records Evaluated"
as validation of the full dataset.

Create a distinction between:

A. FULL DATASET VALIDATION
B. SAMPLE / UI DISPLAY VALIDATION

The full dataset must be the authoritative reconciliation population.

If only a sample is currently being validated anywhere in the application, identify this as a defect.

========================================================
3. SOURCE FILE INTEGRITY
========================================================

Read the uploaded workbook at raw-record level.

Validate:

- workbook sheets
- sheet names
- header rows
- hidden rows
- hidden columns
- merged cells
- blank rows
- duplicate headers
- formulas
- cached formula values
- text-formatted numbers
- numeric-formatted numbers
- dates
- invalid dates
- blank cells
- whitespace
- special characters
- unexpected columns
- missing expected columns
- duplicate rows
- duplicate transaction identifiers

Never silently discard a row.

Every discarded/excluded row must receive:
- RECORD_ID
- source row number
- exclusion code
- exclusion reason
- original values
- exclusion impact in INR

========================================================
4. GOLDEN SOURCE RECORD
========================================================

For every source row create or verify a deterministic internal record identity.

Minimum lineage:

SOURCE FILE
→ SHEET
→ SOURCE ROW NUMBER
→ RECORD ID
→ PO NUMBER
→ LINE ITEM
→ MATERIAL CODE
→ VENDOR
→ QUANTITY
→ NET PRICE
→ ORIGINAL CURRENCY
→ FX RATE
→ INR VALUE
→ FINAL LINE SPEND

The original uploaded value must NEVER be overwritten.

Maintain:

original_value
normalized_value
calculated_value

where applicable.

A user must be able to inspect any displayed number and trace it back to the exact source row.

========================================================
5. LINE-SPEND MATHEMATICAL ENGINE
========================================================

For every transaction independently calculate:

BASE_LINE_VALUE =
ORDER_QUANTITY × NET_PRICE

If currency is INR:

INR_LINE_SPEND =
ORDER_QUANTITY × NET_PRICE

If currency is non-INR:

INR_LINE_SPEND =
ORDER_QUANTITY × NET_PRICE × APPROVED_HISTORICAL_FX_RATE

Do not round intermediate calculations.

Use sufficient decimal precision internally.

Only round for presentation.

Store:

quantity
unit_price
original_currency
fx_rate
fx_rate_source
fx_rate_date
base_value
INR_value
display_value

For every row independently verify:

EXPECTED_LINE_SPEND
=
QUANTITY × PRICE × FX

against the application's calculated line spend.

Tolerance must be defined explicitly and must distinguish:
- calculation precision tolerance
- display rounding tolerance

Never use display-rounded values for reconciliation.

========================================================
6. CRITICAL FX VALIDATION
========================================================

The UI currently shows:

"Live FX Benchmark Conversion Rates to INR"

This MUST NOT silently be used to recalculate historical procurement transactions.

Determine exactly how historical FX is calculated.

For every non-INR transaction verify:

- transaction date
- original currency
- FX rate used
- FX rate date
- FX rate source
- conversion methodology
- whether the rate is daily/monthly/customer-configured
- fallback methodology
- missing FX treatment

Historical transactions must NOT change merely because today's live FX rate changes.

If current live FX rates are displayed for reference, clearly separate:

LIVE MARKET REFERENCE RATE

from

HISTORICAL TRANSACTION CONVERSION RATE

They must never be conflated.

Add regression test:

Change today's FX rate.

Historical INR procurement spend MUST remain unchanged.

========================================================
7. CURRENCY VALIDATION
========================================================

Test:

INR
USD
EUR
GBP
AED
JPY
SGD

and any other currencies present.

For INR:

FX must equal 1 only where policy explicitly requires it.

For non-INR:

FX must exist or the record must be explicitly excluded.

Never silently assume:

missing FX = 1

unless the currency is INR.

Test:
- missing FX
- invalid FX
- zero FX
- negative FX
- extreme FX
- future FX date
- wrong-date FX
- unsupported currency

========================================================
8. QUANTITY / PRICE VALIDATION
========================================================

Test:

positive quantity
zero quantity
negative quantity
decimal quantity
very large quantity

positive price
zero price
negative price
decimal price
very large price

Do not automatically classify zero/negative transactions as errors.

Determine whether they represent:
- returns
- credit notes
- cancellations
- reversals
- corrections
- legitimate zero-value transactions

Every treatment must be explicit and auditable.

========================================================
9. TOTAL SPEND RECONCILIATION
========================================================

Prove:

SUM(valid transaction INR spend)
+
SUM(explicitly excluded transaction impact)
+
other mathematically justified adjustments
=
RAW SOURCE FINANCIAL TOTAL

Then prove:

SUM(all active line spend)
=
TOTAL EVALUATED SPEND

For the current dataset independently verify whether:

31,671 records
→ ₹5,920.35 Cr

is exact.

Do not rely on the UI's displayed total.

Produce:

RAW_SOURCE_TOTAL
VALIDATED_TOTAL
EXCLUDED_TOTAL
UNRESOLVED_TOTAL
RECONCILIATION_VARIANCE

Required:

RECONCILIATION_VARIANCE = ₹0.00

unless a documented source-data issue makes exact reconciliation impossible.

If not zero, FAIL the module.

========================================================
10. DIMENSIONAL RECONCILIATION
========================================================

Independently calculate totals by:

1. Material Group
2. Material Code
3. Item / SKU
4. Supplier
5. Plant / Facility
6. Billing Month
7. Financial Year
8. Currency
9. PO
10. PO Line
11. Category
12. Any other customer-facing aggregation

For every dimension:

SUM(children)
=
PARENT TOTAL

No aggregation may create or lose spend.

Verify the screenshot values such as:

₹3,200.44 Cr Ferro
₹1,571.90 Cr Scrap
₹107.18 Cr Scrap-RM
etc.

against raw transactions.

========================================================
11. UNIQUE ITEM / VENDOR COUNTS
========================================================

Recalculate independently:

unique items
unique vendors
material groups
plants
POs
transactions
line items

Define exactly what constitutes uniqueness.

For example:

Vendor uniqueness must not depend on inconsistent casing,
leading/trailing spaces,
punctuation,
legal suffixes,
or accidental whitespace.

BUT:

Do NOT merge two legal entities merely because names look similar.

Maintain:

RAW_VENDOR_NAME
NORMALIZED_VENDOR_NAME
VENDOR_ENTITY_ID

and provide evidence for any entity normalization.

========================================================
12. DUPLICATE DETECTION
========================================================

Detect:

Exact duplicate rows
PO + line duplicates
Same PO + material + quantity + price + date
Potential duplicate transactions
Legitimate repeated purchases

Never delete duplicates automatically.

Classify them.

Show:

DUPLICATE_STATUS
DUPLICATE_TYPE
MATCHING_FIELDS
SOURCE_ROWS
FINANCIAL_IMPACT

The total spend must remain mathematically explainable.

========================================================
13. DATE VALIDATION
========================================================

Validate every transaction date.

Check:

- valid date
- invalid date
- future date
- date outside evaluation window
- fiscal year mapping
- month mapping
- quarter mapping

Independently verify:

FY24
FY25
FY26

against actual dates.

Do NOT derive the evaluation period from the filename.

For example:

"2 years data.xlsx"

must not override actual transaction dates.

If the UI currently says:

36 Months / FY24-FY26

but the uploaded file contains only 24 months,

flag the discrepancy.

The system must clearly distinguish:

CONFIGURED EVALUATION WINDOW
from
ACTUAL DATA COVERAGE

========================================================
14. ZERO / ROUNDING VALIDATION
========================================================

The UI displays values in ₹ Crores.

Therefore:

₹2,800

may display as:

₹0.00 Cr

but it must NOT become mathematically zero.

Maintain:

RAW INR VALUE
FULL PRECISION INR VALUE
INR CRORE VALUE
DISPLAY VALUE

All calculations must use full precision.

Test small transactions specifically.

========================================================
15. PARETO / 80% SPEND VALIDATION
========================================================

Recalculate the 80% Pareto independently.

Required methodology:

1. Aggregate spend by selected entity.
2. Sort descending by spend.
3. Calculate cumulative spend.
4. Calculate cumulative percentage.
5. Identify first boundary crossing 80%.
6. Include/exclude boundary entity according to deterministic rule.
7. Record exact threshold.

For the current screenshot verify:

Total spend
Cumulative spend shown
Number of entities shown
Cumulative percentage

all reconcile.

The system must never claim:

"80% of spend"

without showing the exact mathematical boundary.

The Pareto list must be reproducible from the transaction ledger.

========================================================
16. MATERIAL GROUP / CATEGORY RECONCILIATION
========================================================

For each material group:

Group Spend
=
SUM(Transaction Spend belonging to group)

Test:
- blank material group
- malformed material group
- duplicate group names
- case differences
- special characters
- unmapped materials

No spend may disappear simply because categorization is missing.

Unmapped spend must remain visible under an explicit bucket such as:

UNMAPPED / UNCLASSIFIED

and must still reconcile financially.

========================================================
17. SUPPLIER RECONCILIATION
========================================================

For every supplier:

Supplier Spend
=
SUM(all valid transactions belonging to supplier)

Validate large suppliers individually.

Validate small suppliers.

Validate suppliers near the 80% Pareto boundary.

Validate long-tail suppliers.

No supplier may disappear because it is outside the displayed top-N view.

Top-N is a DISPLAY FILTER, never a DATA FILTER.

========================================================
18. PLANT / FACILITY RECONCILIATION
========================================================

Verify all 26 facilities.

For each:

facility spend
=
sum of underlying transactions

Check missing facility codes and names.

Never exclude facility spend merely because the plant mapping is unavailable.

========================================================
19. MONTHLY / FY TREND RECONCILIATION
========================================================

Recalculate monthly spend from transaction dates.

Then independently aggregate:

FY24
FY25
FY26

Verify every displayed trend value.

A trend chart must NEVER use synthetic or smoothed numbers.

If the data is flat because the uploaded source data is flat, display the actual flat trend.

========================================================
20. DATA QUALITY ENGINE
========================================================

Create a deterministic quality framework.

At minimum test:

Missing vendor
Missing material
Missing quantity
Missing price
Missing currency
Missing FX
Invalid date
Duplicate transaction
Negative value
Zero value
Invalid UOM
Invalid material code
Invalid PO
Unmapped category
Unmapped plant
Unsupported currency

Each issue requires:

RECORD_ID
RULE_ID
SEVERITY
ORIGINAL_VALUE
EXPECTED_VALUE
ACTION
FINANCIAL_IMPACT

Quality Index must be calculated from actual rule results.

Do NOT allow the application to simply return:

100%

because no exception was manually entered.

========================================================
21. "PASSED CLEAN" STATUS
========================================================

The status:

PASSED CLEAN

must only be assigned when ALL applicable validation rules pass for that transaction.

Create explicit status categories:

PASSED_CLEAN
PASSED_WITH_NORMALIZATION
PASSED_WITH_WARNING
EXCLUDED
FAILED
REQUIRES_REVIEW

Never hide warnings under PASSED CLEAN.

========================================================
22. "ACTIVE IN SPEND" VALIDATION
========================================================

The UI currently shows:

Active in Spend (₹0.00 Cr)

for very small transactions.

Verify whether this is:

actual zero spend
or
display rounding.

Do not use the rounded Crore value to determine active/inactive status.

Use the underlying INR amount.

========================================================
23. UI ↔ BACKEND CONSISTENCY
========================================================

Every major UI number must be compared against backend/database calculation.

Test:

UI Total Spend
Backend Total Spend
Raw Source Total

UI Unique Vendors
Backend Unique Vendors
Raw Source Unique Vendors

UI Unique Items
Backend Unique Items
Raw Source Unique Items

UI Material Groups
Backend Material Groups
Raw Source Material Groups

UI Facilities
Backend Facilities
Raw Source Facilities

Any discrepancy = FAIL.

========================================================
24. UI DISPLAY DOES NOT DEFINE THE DATA
========================================================

Verify that pagination, lazy loading, top-N filtering, Pareto filtering, collapsed rows and virtualized tables do NOT alter the underlying calculations.

Examples:

Showing 46 suppliers must not mean only 46 suppliers exist.

Showing Top 10 material groups must not mean only 10 groups are included in total spend.

Collapsed items must still remain included.

Hidden rows must remain included.

Search filters must only change presentation.

========================================================
25. TRANSACTION-LEVEL PROOF
========================================================

For EVERY KPI, create a proof chain.

Example:

TOTAL SPEND
↓
Supplier Spend
↓
Material Group Spend
↓
Material / SKU Spend
↓
PO
↓
PO Line
↓
Transaction
↓
Source Row
↓
Original uploaded value

The audit must allow a user to answer:

"Show me exactly which customer records created this ₹X Cr."

No KPI may be a black box.

========================================================
26. REPRODUCIBILITY TEST
========================================================

Take the uploaded source file.

Run Module 1 twice.

Expected:

RUN 1 TOTAL = RUN 2 TOTAL

All dimension totals must match.

All record counts must match.

All classifications must match.

All Pareto results must match.

All historical FX conversions must match.

If the result changes between runs without source-data change:

FAIL.

========================================================
27. ADVERSARIAL TESTING
========================================================

Create tests for:

A. Duplicate row
B. Missing price
C. Missing quantity
D. Missing vendor
E. Missing material
F. Missing currency
G. Missing FX
H. Unsupported currency
I. Zero quantity
J. Negative quantity
K. Zero price
L. Negative price
M. Extremely large price
N. Extremely large quantity
O. Invalid date
P. Future date
Q. Date outside window
R. Same vendor with whitespace differences
S. Same material with formatting differences
T. Duplicate PO line
U. Hidden spreadsheet row
V. Blank spreadsheet row
W. Formula cell
X. Text-number cell
Y. Currency changed after upload
Z. Current FX rate changed after upload
AA. UI filter applied
AB. Pagination changed
AC. Top-N changed
AD. Pareto threshold changed
AE. Missing category
AF. Missing plant
AG. Small-value transaction
AH. Large-value transaction

Every test must have:

INPUT
EXPECTED RESULT
ACTUAL RESULT
PASS/FAIL
FINANCIAL IMPACT

========================================================
28. DATA IMMUTABILITY TEST
========================================================

Once the file is ingested:

Original source values must remain immutable.

Normalization must create derived fields.

Never overwrite the customer's original:

Vendor
Material
Description
Quantity
Price
Currency
Date
PO
Line item

without preserving the original.

========================================================
29. MODULE 2 HANDOFF
========================================================

Verify that Module 1 hands Module 2 only:

- validated transactions
- validated spend
- transaction IDs
- supplier IDs
- material IDs
- category/material group
- quantity
- price
- currency
- approved historical FX
- INR spend
- source lineage
- quality status

Module 2 must receive NO:

- PCBI values
- market benchmark prices
- synthetic savings
- assumed savings percentages

========================================================
30. FINANCIAL INVARIANTS
========================================================

Create automated invariants.

At minimum:

SUM(transaction_spend) = total_spend

SUM(category_spend) = total_spend

SUM(supplier_spend) = total_spend

SUM(material_group_spend) = total_spend

SUM(plant_spend) = total_spend

SUM(month_spend) = total_spend

SUM(currency_converted_spend) = total_spend

No unexplained variance.

Required:

RECONCILIATION_VARIANCE = 0

========================================================
31. FINAL AUDIT ARTIFACTS
========================================================

Generate:

MODULE_1_FINAL_FORENSIC_VALIDATION.md

MODULE_1_FINAL_CALCULATION_AUDIT.xlsx

MODULE_1_TRANSACTION_PROOF_LEDGER.xlsx

MODULE_1_DATA_QUALITY_AUDIT.xlsx

MODULE_1_RECONCILIATION_AUDIT.json

MODULE_1_ADVERSARIAL_TEST_RESULTS.json

MODULE_1_SOURCE_TO_KPI_LINEAGE.xlsx

The calculation workbook must contain at minimum:

1. Raw Record Reconciliation
2. Transaction Calculation Audit
3. FX Audit
4. Supplier Reconciliation
5. Material Reconciliation
6. Category Reconciliation
7. Plant Reconciliation
8. Monthly Reconciliation
9. FY Reconciliation
10. Pareto Audit
11. Duplicate Audit
12. Data Quality Audit
13. Exclusion Ledger
14. KPI Lineage
15. Financial Invariants

========================================================
32. FINAL ACCEPTANCE GATES
========================================================

Module 1 can only be declared:

MODULE_1_E2E_VALIDATED

if ALL are true:

- Full dataset validated
- Source record count reconciled
- Total spend reconciled
- Transaction calculations reconciled
- Historical FX validated
- No live FX contamination
- Supplier totals reconciled
- Material totals reconciled
- Category totals reconciled
- Plant totals reconciled
- Monthly totals reconciled
- FY totals reconciled
- Pareto mathematically reproducible
- Duplicate treatment proven
- Data quality rules proven
- UI/backend numbers match
- Every KPI has transaction-level lineage
- No hidden financial exclusions
- No unexplained rounding loss
- No Module 3 leakage
- Module 2 handoff validated
- All adversarial tests pass
- Typecheck passes
- Lint passes
- Existing tests pass
- New Module 1 forensic tests pass
- RECONCILIATION_VARIANCE = ₹0.00

========================================================
33. CRITICAL FAILURE RULE
========================================================

If ANY financial number cannot be traced to source transactions:

FAIL.

If ANY aggregation does not reconcile:

FAIL.

If historical spend changes because current live FX changes:

FAIL.

If UI says 100% clean but full-file validation was not performed:

FAIL.

If any transaction is silently excluded:

FAIL.

If any KPI cannot be drilled down to source-row evidence:

FAIL.

Do not hide defects.

Do not downgrade a defect to a warning simply to achieve PASS.

========================================================
34. SAFE PATCHING RULE
========================================================

If defects are discovered:

1. Identify defect.
2. Explain root cause.
3. Create failing test.
4. Fix the smallest appropriate code path.
5. Re-run the failing test.
6. Re-run the complete Module 1 test suite.
7. Re-run Module 2 regression tests.
8. Run backend typecheck.
9. Run frontend typecheck.
10. Run backend lint.
11. Run frontend lint.
12. Re-run full reconciliation.
13. Regenerate audit artifacts.

Do not modify unrelated modules.

========================================================
35. FINAL REPORT
========================================================

At the end provide:

A. FINAL STATUS
B. DATASET SIZE
C. SOURCE TOTAL
D. VALIDATED TOTAL
E. EXCLUDED TOTAL
F. UNRESOLVED TOTAL
G. RECONCILIATION VARIANCE
H. TRANSACTION CALCULATION STATUS
I. FX STATUS
J. DUPLICATE STATUS
K. DATA QUALITY STATUS
L. PARETO STATUS
M. UI/BACKEND CONSISTENCY
N. TRANSACTION-LEVEL TRACEABILITY %
O. NUMBER OF TESTS
P. PASS COUNT
Q. FAIL COUNT
R. DEFECTS FOUND
S. DEFECTS FIXED
T. REMAINING RISKS
U. MODULE 2 HANDOFF STATUS

Most importantly:

DO NOT declare Module 1 "perfect".

The purpose of this validation is not to prove that procurement data is perfect.

The purpose is to prove that the SOFTWARE has correctly represented the customer's procurement data, that every calculation is defensible, and that any future savings/opportunity identified by Module 2 can be traced back to real customer transactions.

The final output must distinguish:

DATA IS CLEAN

from

PROCUREMENT IS OPTIMIZED.

These are NOT the same statement.
`;

const promptsFile = path.resolve(__dirname, '..', 'prompts.md');
const existing = fs.readFileSync(promptsFile, 'utf8');
if (!existing.includes('## Prompt 244')) {
  fs.appendFileSync(promptsFile, '\n\n' + promptText.trim() + '\n');
  console.log('Appended Prompt 244 to prompts.md');
} else {
  console.log('Prompt 244 already exists');
}
