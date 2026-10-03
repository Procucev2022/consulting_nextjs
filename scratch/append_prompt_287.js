const fs = require('fs');
const path = require('path');

const promptText = `## Prompt 287

PROMPT 287 — MANAGEMENT QUICK SUMMARY UI + FINAL 10-SLIDE CONTENT POLISH
aiCEV by Procucev

IMPORTANT:
The 10-slide CFO/CEO Executive Opportunity Brief has now been created successfully.

The 30-slide Boardroom & Evidence Edition remains frozen.

This prompt has TWO objectives:

1. Make the 10-slide Management Quick Summary clearly visible and accessible from the main application UI.
2. Apply the final small content corrections identified during review.

DO NOT redesign Modules 1–4.
DO NOT implement Bronze/Silver/Gold subscription logic yet.
That will be the NEXT major prompt after this one.

========================================================
PART A — MANAGEMENT QUICK SUMMARY BUTTON
========================================================

CURRENT PROBLEM:

The main application dashboard currently shows:

"Executive Brief — Pending"

but there is no clearly visible, customer-friendly access point to the newly created 10-slide Executive Opportunity Brief.

A customer should NOT have to search through menus to find the management presentation.

The 10-slide presentation must become a first-class product feature.

========================================================
REQUIRED CUSTOMER-FACING NAME
========================================================

Use:

MANAGEMENT QUICK SUMMARY

Primary subtitle:

10-Slide Executive Opportunity Brief

Optional small label:

CFO / CEO Discussion Edition

Do NOT call the customer-facing button simply:

"Executive Brief"

because that creates confusion with the 30-slide Boardroom & Evidence Edition.

========================================================
DASHBOARD UI
========================================================

Create a prominent dashboard/header action:

[ Management Quick Summary ]

with a suitable presentation/document icon.

Recommended visual treatment:

• White card/button
• aiCEV blue accent
• subtle border
• clear hover state
• presentation/document icon
• highly visible but NOT more prominent than the main application navigation

Recommended button structure:

┌──────────────────────────────────────────┐
│  ▣  Management Quick Summary             │
│     10-Slide Executive Opportunity Brief │
└──────────────────────────────────────────┘

The button must be visible without opening a menu.

Place it in the main application header/action area near the existing Executive Brief control.

========================================================
IMPORTANT — EXISTING EXECUTIVE BRIEF BUTTON
========================================================

The existing:

"Executive Brief — Pending"

button should NOT remain as the primary customer-facing label.

Replace or restructure it so that the user sees:

PRIMARY:

Management Quick Summary
10-Slide Executive Opportunity Brief

SECONDARY / ADVANCED:

Boardroom & Evidence
30-Slide Procurement Value Assessment

The second option may be placed behind a dropdown or secondary action.

Do NOT show two confusing buttons both called "Executive Brief".

========================================================
RECOMMENDED HEADER STRUCTURE
========================================================

Current header contains items similar to:

Customer / Dataset
Executive Brief
Admin Portal
User Profile

Change the executive presentation area to:

[ Management Quick Summary ]
       10-Slide Executive Brief

and, where appropriate:

[ More Reports ▼ ]

with:

• Boardroom & Evidence
• Detailed Procurement Value Assessment

The Management Quick Summary should be the obvious first choice for management users.

========================================================
BUTTON BEHAVIOUR
========================================================

When the customer clicks:

Management Quick Summary

open the newly created:

aiCEV_UltraTech_Executive_Opportunity_Brief

Do NOT open the 30-slide deck.

The Web presentation should open inside the application using the existing:

ExecutiveOpportunityBriefView.tsx

Do NOT create a second implementation of the 10-slide presentation.

Use the existing Web component.

========================================================
AVAILABLE ACTIONS
========================================================

Inside Management Quick Summary, provide:

[ Open Full Screen ]

[ Download PDF ]

[ Download PowerPoint ]

If appropriate:

[ Back to Procurement Workspace ]

Do not clutter the dashboard with these actions.

They belong inside the Management Quick Summary experience.

========================================================
VISUAL DESIGN
========================================================

The button must fit naturally into the current aiCEV dashboard.

Use the existing application design system.

Do NOT introduce a new color palette.

Use the existing:

aiCEV blue
Procucev orange
white cards
light enterprise background

Do not make the button look like an advertisement.

It should feel like a core enterprise reporting feature.

========================================================
RESPONSIVE / DESKTOP
========================================================

The application is primarily desktop enterprise software.

Ensure:

• button does not overlap other header controls
• text does not truncate
• icon and text align correctly
• tooltip exists if the label must be shortened at smaller widths
• no horizontal overflow
• dropdown does not cover critical controls

========================================================
PART B — 10-SLIDE CONTENT CORRECTIONS
========================================================

Apply ONLY these corrections to the new 10-slide Executive Opportunity Brief.

DO NOT modify the 30-slide Boardroom & Evidence Edition.

========================================================
CORRECTION 1 — REMOVE "100% EBITDA ACCRETIVE"
========================================================

If Slide 1 currently contains:

"₹78.72 Cr Direct Savings Opportunity
100% EBITDA Accretive"

REMOVE:

"100% EBITDA Accretive"

Keep:

₹78.72 Cr
Direct Savings Opportunity

Do not make an unsupported accounting conclusion.

========================================================
CORRECTION 2 — SLIDE 3 LANGUAGE
========================================================

Slide 3 should NOT say:

"10 sourcing levers totaling ₹173.12 Cr"

because that can imply the ten displayed levers are directly additive.

Use:

WHERE THE OPPORTUNITY IS CONCENTRATED

Primary callout:

₹173.12 Cr
GROSS IDENTIFIED OPPORTUNITY

Supporting statement:

"Individual opportunities are assessed independently and deduplicated before establishing the net defensible pipeline."

Do not imply direct additivity of the individual opportunity bars.

========================================================
CORRECTION 3 — SLIDE 10
========================================================

Change:

MANAGEMENT DECISION

to:

PROPOSED NEXT STEPS

Use:

01 — ALIGN
Confirm priority Wave 1 categories

02 — MOBILIZE
Establish joint procurement working group

03 — EXECUTE
Launch approved competitive sourcing initiatives

Hero:

₹78.72 Cr
Direct Savings Opportunity

Secondary:

₹93.60 Cr
Net Defensible Pipeline

Final statement:

"Move from diagnostic to execution."

Do NOT imply guaranteed savings or guaranteed 90-day realization.

========================================================
CORRECTION 4 — TRUST LANGUAGE
========================================================

Review Slide 9 of the 10-slide deck.

Do NOT include unsupported claims such as:

"Zero Hallucination"
"Guaranteed Savings"
"Fully Autonomous Procurement"
"SOC-2 Certified"
"ISO 27001 Certified"
"FIPS Grade"
"Air-Gapped"

unless separately verified and formally approved.

Use factual positioning:

"From transaction data to procurement decision to measurable execution."

========================================================
PART C — 30-SLIDE DECK PROTECTION
========================================================

The 30-slide deck is FROZEN.

DO NOT:

• change slide count
• change numbers
• change its design
• change its financial model
• rename the file
• modify its content

Files that must remain untouched:

EXECUTIVE_BRIEF.pdf
EXECUTIVE_BRIEF.pptx

The new 10-slide files remain:

aiCEV_UltraTech_Executive_Opportunity_Brief.pdf
aiCEV_UltraTech_Executive_Opportunity_Brief.pptx

========================================================
PART D — SINGLE SOURCE OF TRUTH
========================================================

The Management Quick Summary must continue consuming:

EXECUTIVE_BRIEF_PRESENTATION_CONTRACT

Do NOT duplicate financial constants.

The 10-slide Web/PDF/PPTX must remain synchronized.

========================================================
PART E — FUTURE SUBSCRIPTION ARCHITECTURE
========================================================

DO NOT implement Bronze/Silver/Gold in this prompt.

However, prepare the UI structure so the Management Quick Summary can later be controlled by the entitlement engine.

Future model:

BRONZE
→ Limited Management Snapshot

SILVER
→ Management Quick Summary

GOLD
→ Full Management Quick Summary + Detailed Boardroom & Evidence

For now, do NOT add fake subscription restrictions.

The current button should work using the existing application permissions.

The entitlement engine will be implemented in the NEXT prompt.

========================================================
PART F — ADMIN / CUSTOMER SEPARATION
========================================================

Do not expose:

"Simulate Subscription Tier"

to normal customer users.

If this control is currently visible in the customer profile menu:

move it to Admin-only functionality.

Customers should see their current access state, but should NOT be able to arbitrarily switch Bronze/Silver/Gold from the UI.

Do NOT implement the full subscription system yet.

Just ensure the simulation/control functionality is not exposed as a customer self-service subscription selector.

========================================================
PART G — QA
========================================================

Test the following:

UI:

MANAGEMENT_QUICK_SUMMARY_BUTTON = PASS

BUTTON_VISIBLE_ON_DASHBOARD = PASS

BUTTON_LABEL = PASS

BUTTON_ICON = PASS

BUTTON_ALIGNMENT = PASS

BUTTON_NO_OVERFLOW = PASS

BUTTON_ROUTE = PASS

10-SLIDE WEB OPENS = PASS

PDF DOWNLOAD = PASS

PPTX DOWNLOAD = PASS

30-SLIDE MASTER UNCHANGED = PASS

FINANCIAL_PARITY = PASS

NO_UNSUPPORTED_EBITDA_CLAIM = PASS

SLIDE_3_LANGUAGE = PASS

SLIDE_10_NEXT_STEPS = PASS

NO_UNSUPPORTED_SECURITY_CLAIMS = PASS

UNICODE = PASS

TYPECHECK = PASS

LINT = PASS

TESTS = PASS

QUALITY = PASS

========================================================
VISUAL QA
========================================================

Render/inspect:

1. Main dashboard
2. Header
3. Management Quick Summary button
4. Management Quick Summary opening view
5. Slide 1
6. Slide 3
7. Slide 4
8. Slide 9
9. Slide 10

Verify:

• button is immediately discoverable
• button doesn't look like a pending/error state
• no "Executive Brief — Pending" ambiguity remains
• 10-slide presentation opens correctly
• no layout changes to Modules 1–4
• no logo problems
• no mojibake
• no text overflow

========================================================
FINAL REPORT
========================================================

Return:

MANAGEMENT_QUICK_SUMMARY_BUTTON: PASS/FAIL

DASHBOARD_VISIBILITY: PASS/FAIL

EXECUTIVE_BRIEF_LABELING: PASS/FAIL

WEB_ROUTE: PASS/FAIL

PDF_DOWNLOAD: PASS/FAIL

PPTX_DOWNLOAD: PASS/FAIL

10_SLIDE_CONTENT_FIXES: PASS/FAIL

30_SLIDE_MASTER_UNCHANGED: PASS/FAIL

FINANCIAL_PARITY: PASS/FAIL

SUBSCRIPTION_SIMULATOR_HIDDEN_FROM_CUSTOMER: PASS/FAIL

UNICODE: PASS/FAIL

TYPECHECK: PASS/FAIL

LINT: PASS/FAIL

TESTS: PASS/FAIL

QUALITY: PASS/FAIL

OPEN_ISSUES: list

FINAL STATUS:

MANAGEMENT_QUICK_SUMMARY:
PASS

Do not begin the Bronze/Silver/Gold implementation in this prompt.

STOP after this prompt is complete.
`;

const promptsPath = path.resolve(__dirname, '../prompts.md');
fs.appendFileSync(promptsPath, '\n\n' + promptText.trim() + '\n', 'utf-8');
console.log('Appended Prompt 287 to prompts.md');
