const fs = require('fs');

const promptText = `## Prompt 295

PROMPT 295 — FINAL aiCEV DESIGN SYSTEM AUDIT & VISUAL CONSISTENCY HARDENING

PROMPT 294 DESIGN SYSTEM IMPLEMENTATION IS ACCEPTED AS THE BASELINE.

DO NOT REDESIGN THE APPLICATION.

DO NOT CHANGE THE CURRENT LIGHT ENTERPRISE CONCEPT.

DO NOT CHANGE BUSINESS LOGIC.

DO NOT CHANGE:

- Module 1
- Module 2
- Module 3
- PCBI
- Module 4
- Savings calculations
- Certified financial figures
- Subscription architecture
- Entitlement logic
- Authentication
- Tenant isolation
- API contracts
- Report methodology

This is the FINAL DESIGN SYSTEM AUDIT AND HARDENING PASS.

==================================================
1. OBJECTIVE
==================================================

Verify that the application-wide design system introduced in Prompt 294 is genuinely consistent across:

Login
Registration
Dashboard
Module 1
Module 2
Module 3
PCBI
Module 4
Savings
Benchmarking
Management Quick Summary
Executive Brief
Boardroom & Evidence
Reports
Admin
Subscriptions
Profile
Settings
All other major authenticated pages

The goal is NOT to create another visual redesign.

The goal is:

ONE aiCEV PRODUCT
ONE VISUAL LANGUAGE
ONE DESIGN SYSTEM

==================================================
2. DESIGN SYSTEM IS THE SINGLE SOURCE OF TRUTH
==================================================

Verify that the following are centralized:

- colors
- typography
- spacing
- border radius
- shadows
- buttons
- inputs
- badges
- tables
- navigation
- modals
- charts

Search for page-specific hard-coded styles that contradict the design system.

Identify remaining:

- dark backgrounds
- unrelated fonts
- unrelated colors
- inconsistent borders
- inconsistent radii
- inconsistent shadows
- inconsistent button styles
- inconsistent input styles
- inconsistent headers
- inconsistent navigation

Do NOT blindly replace legitimate semantic colors.

Produce an exception list before modifying anything.

==================================================
3. TYPOGRAPHY CORRECTION
==================================================

Use Inter as the primary application font.

Use the same font hierarchy everywhere.

IMPORTANT:

Do NOT use JetBrains Mono for all monetary or financial KPI values.

Use Inter for:

- ₹78.72 Cr
- ₹93.60 Cr
- ₹173.12 Cr
- ₹47.90 Cr
- ₹68.00 Cr
- percentages
- KPI values
- executive metrics

Monospace should be reserved for:

- PCBI IDs
- transaction IDs
- contract IDs
- activation codes
- technical identifiers
- audit references
- machine-readable codes

If tabular numerical alignment is needed, use appropriate font-variant/tabular-number styling with Inter rather than switching to monospace.

==================================================
4. COLOR DISCIPLINE
==================================================

Keep the centralized palette from Prompt 294.

However, treat the chart palette as a semantic maximum, NOT a requirement to use all colors.

Preferred chart hierarchy:

Primary:
aiCEV Blue

Secondary:
aiCEV Orange

Positive:
Green

Neutral:
Slate

Warning:
Amber

Risk:
Red

Purple / Indigo / Teal should only be used for genuine multi-category visualizations where additional colors are necessary.

Do not create rainbow charts.

==================================================
5. EXECUTIVE BRIEF
==================================================

Perform a detailed visual consistency audit of:

/executive-brief

and all:

frontend/src/components/executiveBrief/*

Verify:

- same page background
- same font
- same heading hierarchy
- same cards
- same buttons
- same tables
- same badges
- same spacing
- same modal system
- same navigation
- same logo treatment

The Executive Brief must feel like the executive layer of the same aiCEV application.

Do not change its content.

==================================================
6. MANAGEMENT QUICK SUMMARY
==================================================

Verify:

Management Quick Summary

10-slide executive experience.

It must visually connect to:

Login
Dashboard
Modules 1–4
Executive Brief

Use the same:

- logo
- typography
- color language
- KPI treatment
- buttons
- navigation
- spacing

Do not change the certified content.

==================================================
7. ACTUAL GENERATED PDF/PPTX
==================================================

IMPORTANT.

Do not limit validation to web preview cards.

Inspect the ACTUAL PDF/PPTX generation code.

Verify that the generated:

1. aiCEV Executive Opportunity Brief
2. Boardroom & Evidence report

use the approved aiCEV visual identity.

The generated documents should share:

- aiCEV logo treatment
- Inter / compatible professional sans-serif typography
- navy text
- aiCEV blue
- aiCEV orange
- consistent KPI hierarchy
- consistent table styling
- consistent spacing

BUT:

Do NOT turn the presentations into web pages.

The PPTX should remain a professional executive presentation.

The PDF should remain a professional executive report.

Preserve the existing slide/report architecture.

==================================================
8. CERTIFIED FINANCIAL CONTENT — ABSOLUTELY FROZEN
==================================================

Do not change any financial values.

Verify:

Gross Identified Opportunity:
₹173.12 Cr

Overlap:
₹62.80 Cr

Exclusions:
₹16.72 Cr

Net Defensible Pipeline:
₹93.60 Cr

Net Direct Savings Opportunity:
₹78.72 Cr

Strategic Market Value:
₹14.88 Cr

Validated Savings:
₹47.90 Cr

Realized Savings:
₹68.00 Cr

De-risked Spend:
₹420 Cr

Suppliers:
974

Material Groups:
256

Plants:
26

Transactions:
31,671

Low-value POs:
824

Do not alter classification or mathematical relationships.

==================================================
9. GLOBAL HEADER / NAVIGATION
==================================================

Verify every authenticated page uses the same application shell.

Standardize:

- logo
- navigation
- active state
- breadcrumbs
- user menu
- notifications
- page title
- page actions

No module should have an unrelated navigation/header style.

==================================================
10. PAGE GRID
==================================================

Standardize:

max content width
page margins
header height
horizontal padding
vertical rhythm

Verify desktop:

1366×768
1440×900
1920×1080

Do not allow pages to become excessively stretched on large monitors.

==================================================
11. DATA TABLES
==================================================

Verify all major tables use:

white surface
light header
subtle border
dark navy text
consistent row height
consistent hover
right-aligned financial numbers
consistent pagination/filter controls

PCBI tables and procurement tables should look like they belong to the same system.

==================================================
12. FORMS
==================================================

Verify:

Login
Registration
Filters
Admin forms
Subscription forms
Profile
Settings
PCBI controls

all use the same:

input height
radius
border
focus state
label
helper text
error state

==================================================
13. MODALS
==================================================

Verify all modals share:

white surface
same border
same radius
same shadow
same backdrop
same header
same footer
same button placement

==================================================
14. SUBSCRIPTION UI
==================================================

Verify:

Bronze
Silver
Gold

use consistent semantic accents.

Bronze:
Amber

Silver:
Slate / cool blue

Gold:
Orange / gold

Do not turn subscription cards into a separate visual system.

==================================================
15. ADMIN UI
==================================================

Admin can remain operationally denser.

However it must still use the same:

font
colors
buttons
tables
inputs
badges
modals
navigation

Do not allow a separate dark admin application.

==================================================
16. RESPONSIVE AUDIT
==================================================

Verify:

390px
430px
768px
1024px
1366px
1440px
1920px

Check:

- no horizontal page overflow
- no clipped text
- no overlapping cards
- no broken headers
- no inaccessible buttons
- no broken tables
- no excessive whitespace
- no accidental scroll traps

==================================================
17. ACCESSIBILITY
==================================================

Verify:

- contrast
- keyboard focus
- labels
- button states
- form errors
- interactive elements
- readable text

Do not use color as the only indicator of status.

==================================================
18. VISUAL VALIDATION — BE HONEST
==================================================

Attempt actual browser rendering.

If browser automation works:

inspect the major pages visually.

If browser automation fails because of Playwright/environment infrastructure:

DO NOT report visual PASS.

Instead report:

BROWSER VISUAL VALIDATION BLOCKED

and clearly identify the pages requiring manual inspection.

DOM tests are NOT equivalent to visual validation.

==================================================
19. FULL REGRESSION
==================================================

Run:

npm run typecheck
npm run lint
npm run test
npm run quality:fast

Also run the COMPLETE frontend/backend regression suite, not only the design-system tests.

Report:

test files
total tests
passed
failed
skipped

==================================================
20. SEARCH FOR REMAINING DARK-THEME EXCEPTIONS
==================================================

Search the entire frontend source tree for:

bg-slate-900
bg-slate-950
bg-[#0
text-white
text-slate-300
text-slate-400
border-slate-700
border-slate-800

Do NOT automatically remove legitimate:

- modal backdrops
- charts
- dark presentation elements where semantically required
- code blocks
- technical displays

Produce an exception report.

==================================================
21. FINAL CONSISTENCY SCORECARD
==================================================

Create:

PAGE | THEME | FONT | HEADER | CARDS | TABLES | BUTTONS | MODALS | STATUS

For:

Login
Dashboard
Module 1
Module 2
Module 3
PCBI
Module 4
Savings
Benchmarking
Management Quick Summary
Executive Brief
Boardroom & Evidence
Admin
Subscriptions
Profile
Settings

Every row should be consistent or have an documented intentional exception.

==================================================
22. DO NOT KEEP MODIFYING RANDOM PAGES
==================================================

If a page is already compliant:

DO NOT TOUCH IT.

Only modify actual inconsistencies.

This is a hardening pass, not a redesign.

==================================================
23. FINAL REPORT
==================================================

Return:

# PROMPT 295 — FINAL DESIGN SYSTEM AUDIT

1. Global design system status
2. Typography status
3. Color status
4. Spacing status
5. Component status
6. Navigation status
7. Login status
8. Dashboard status
9. Module 1 status
10. Module 2 status
11. Module 3 status
12. PCBI status
13. Module 4 status
14. Savings status
15. Management Quick Summary status
16. Executive Brief status
17. Boardroom & Evidence status
18. Admin status
19. Subscription status
20. Profile/settings status
21. PDF generation status
22. PPTX generation status
23. Remaining dark-theme exceptions
24. Remaining font exceptions
25. Remaining component inconsistencies
26. Full regression results
27. Browser visual validation result
28. Screens/pages requiring manual visual inspection
29. Files modified
30. Business logic untouched confirmation

FINAL PRINCIPLE:

DO NOT MAKE THE APPLICATION LOOK IDENTICAL.

MAKE IT FEEL CONSISTENT.

Each module can have its own information density and business-specific visualizations.

But the customer must always recognize:

"THIS IS aiCEV."

END PROMPT 295
`;

fs.appendFileSync('prompts.md', '\n\n' + promptText.trim() + '\n');
console.log('Appended Prompt 295 to prompts.md successfully.');
