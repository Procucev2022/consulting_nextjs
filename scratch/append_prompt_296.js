const fs = require('fs');

const promptText = `## Prompt 296

PROMPT 296 — FINAL BRAND CONSISTENCY & LIGHT-THEME CLOSURE

PROMPT 295 HAS BEEN COMPLETED.

THIS IS NOT A REDESIGN.

THIS IS THE FINAL BRAND-CONSISTENCY CLOSURE PASS.

The objective is to make the entire aiCEV ecosystem feel like ONE PROFESSIONAL ENTERPRISE PRODUCT:

LOGIN
→ REGISTRATION
→ DASHBOARD
→ MODULE 1
→ MODULE 2
→ MODULE 3
→ PCBI
→ MODULE 4
→ SAVINGS
→ BENCHMARKING
→ MANAGEMENT QUICK SUMMARY
→ EXECUTIVE BRIEF
→ BOARDROOM & EVIDENCE
→ ADMIN
→ SUBSCRIPTIONS
→ PROFILE
→ SETTINGS
→ PDF
→ PPTX

==================================================
1. ABSOLUTE FREEZE
==================================================

DO NOT CHANGE:

- business logic
- financial calculations
- certified figures
- subscription logic
- entitlement logic
- authentication
- tenant isolation
- API contracts
- Module 1 functionality
- Module 2 functionality
- Module 3 functionality
- PCBI calculations
- Module 4 functionality
- savings methodology
- report methodology
- customer workflows

Do not redesign pages that are already compliant.

Only fix the specific inconsistencies identified below.

==================================================
2. LIGHT ENTERPRISE THEME IS THE PRODUCTION THEME
==================================================

aiCEV is currently a LIGHT ENTERPRISE application.

Treat this as the single production theme.

Do NOT introduce or preserve an independently switchable dark production theme.

Remove or isolate unused Tailwind dark: variants where they have no functional purpose.

Before removing anything:

- identify all 759 reported dark: variants
- classify them
- preserve only variants that are genuinely required by:
  - charts
  - technical displays
  - code blocks
  - intentional presentation artifacts

For normal application UI:

NO DARK MODE.

The following must remain light:

- Login
- Registration
- Dashboard
- Modules
- PCBI
- Savings
- Reports
- Executive Brief
- Management Quick Summary
- Admin
- Subscription
- Profile
- Settings

==================================================
3. PCBI DARK CARDS MUST BE REMOVED
==================================================

The Prompt 295 report identified:

5 dark cards in:

frontend/src/components/admin/pcbi/PCBICommodityDataLabView.tsx

These are NOT acceptable as permanent visual exceptions.

Convert these five cards to the same light enterprise design language.

==================================================
4. APPLICATION BRAND TOKENS
==================================================

Canvas: #EEF7FF
Canvas Subtle: #F8FBFE
Surface: #FFFFFF
Border: #DCE7F5
Primary Text: #0B1B33
Secondary Text: #475569
Muted: #64748B
Brand Blue: #0284C7
Brand Blue Hover: #0369A1
Brand Orange: #F97316
Success: #10B981
Warning: #F59E0B
Danger: #EF4444

==================================================
5. PDF BRAND ALIGNMENT
==================================================

Align PDF brand identity to canonical aiCEV tokens.

==================================================
6. PPTX BRAND ALIGNMENT
==================================================

Align PPTX brand identity to canonical aiCEV tokens.
Preferred presentation font: Inter. Fallback: Arial.

==================================================
7. LOGO CONSISTENCY
==================================================

Verify official aiCEV logo is used consistently.

==================================================
8. TYPOGRAPHY
==================================================

Primary: Inter
Use tabular-nums for aligned numbers.
Use monospace ONLY for technical identifiers.
Do not use monospace for financial KPIs.

==================================================
9. CHART DISCIPLINE
==================================================

Priority: aiCEV Blue > aiCEV Orange > Green > Slate > Amber > Red
Use Indigo/Violet/Teal only when categorical distinction requires it.
Do not create rainbow charts.

==================================================
10. COMPONENT CONSISTENCY
==================================================

All components must share the centralized design language.

==================================================
11. PAGE GRID CONSISTENCY
==================================================

max-width: 7xl, px-4 sm:px-6 lg:px-8, py-6, 4px/8px system

==================================================
12. EXECUTIVE EXPERIENCE
==================================================

Management Quick Summary, Executive Brief, and Boardroom & Evidence must feel like different views of the SAME PRODUCT.

==================================================
13. SUBSCRIPTION EXPERIENCE
==================================================

Bronze: Amber, Silver: Slate/cool blue, Gold: aiCEV Orange/Gold

==================================================
14. AUTHENTICATION EXPERIENCE
==================================================

Login and Registration remain the visual reference baseline.

==================================================
15. SECURITY / TECHNICAL UI
==================================================

Dark surfaces allowed only for code blocks, SQL, raw telemetry, cryptographic data, machine-readable diagnostics.

==================================================
16. FINANCIAL VALUES — FROZEN
==================================================

₹173.12 Cr, ₹62.80 Cr, ₹16.72 Cr, ₹93.60 Cr, ₹78.72 Cr, ₹14.88 Cr, ₹47.90 Cr, ₹68.00 Cr, ₹420 Cr, 974 Suppliers, 256 Material Groups, 26 Plants, 31,671 Transactions, 824 Low-value POs

==================================================
17. CODE QUALITY
==================================================

Run: npm run typecheck, npm run lint, npm run test, npm run quality:fast

==================================================
18. SOURCE AUDIT
==================================================

Search entire frontend/src for: bg-slate-950, bg-slate-900, bg-[#0, dark:bg-, dark:text-, font-mono, text-white
Classify every occurrence as LEGITIMATE or UNINTENTIONAL.
ZERO unintentional dark production UI.

==================================================
19. IMPORTANT — DO NOT CLAIM VISUAL PASS
==================================================

If browser automation does NOT work, report: BROWSER VISUAL VALIDATION BLOCKED

==================================================
20. MANUAL VISUAL CHECKLIST
==================================================

If browser validation is unavailable, provide concise manual checklist.

==================================================
21. DO NOT CLAIM ALL SOURCE FILES <=300 LINES
==================================================

All modified TS/TSX application components remain <=300 lines where the project component-size rule applies. CSS files may exceed 300 lines.

==================================================
22. FINAL REPORT
==================================================

Return: # PROMPT 296 — FINAL BRAND CONSISTENCY CLOSURE

FINAL ACCEPTANCE CRITERIA:
A. ZERO unintended dark application UI
B. ONE canonical aiCEV light theme
C. ONE canonical application font
D. ONE canonical brand palette
E. ONE canonical component language
F. Financial KPIs use Inter + tabular-nums
G. Monospace only for technical identifiers
H. PDF and PPTX visibly belong to the same aiCEV brand
I. Executive Brief and Management Quick Summary belong to the same product family
J. PCBI does not have unrelated dark cards
K. No business logic changed
L. No financial figures changed
M. No subscription/security behavior changed
N. Browser validation is reported honestly

FINAL PRINCIPLE:
ONE PRODUCT. ONE BRAND. ONE DESIGN SYSTEM.

END PROMPT 296`;

fs.appendFileSync('prompts.md', '\n\n' + promptText.trim() + '\n');
console.log('Appended Prompt 296 to prompts.md successfully.');
