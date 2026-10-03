const fs = require('fs');

const prompt290 = `\n\n## Prompt 290\n\nPROMPT 290 — REDESIGN aiCEV LOGIN / REGISTRATION PAGE FOR CUSTOMER CONVERSION

OBJECTIVE

Redesign the current aiCEV login / registration landing page so that it becomes the FIRST CUSTOMER CONVERSION EXPERIENCE for aiCEV.

The current design concept is fundamentally good and MUST NOT be discarded.

KEEP:

- dark premium enterprise theme
- split-screen concept
- aiCEV branding
- left-side value proposition
- right-side authentication panel
- blue/orange aiCEV brand language
- premium enterprise SaaS feel
- strong visual hierarchy
- clean rounded cards
- subtle technology aesthetic

BUT FINETUNE THE PAGE TO ACHIEVE THREE OBJECTIVES:

1. Make a procurement leader immediately understand WHAT aiCEV does.
2. Make the customer understand HOW aiCEV creates procurement value.
3. Make a new visitor want to CREATE AN ACCOUNT and start with the FREE BRONZE / DISCOVER experience.

This page should feel like:

"Let me see what aiCEV can find in my procurement data."

NOT:

"Here is another enterprise software login page."

==================================================
1. CORE CUSTOMER MESSAGE
==================================================

The primary message should be built around:

"Turn Procurement Data Into Measurable Savings."

Supporting message:

"Upload your procurement spend. aiCEV identifies where value is hiding, what can be improved, and where deeper procurement intelligence can unlock additional savings."

Do not make exaggerated or guaranteed savings claims.

Avoid:

- Guaranteed savings
- Guaranteed ROI
- 100% EBITDA conversion
- Autonomous procurement
- Zero hallucination
- 98.7% AI accuracy
- 8–18% guaranteed spend reduction
- any unsupported percentage claims

The page should communicate VALUE without overpromising.

==================================================
2. CUSTOMER CONVERSION STORY
==================================================

The left side should tell a very simple story:

YOUR DATA
↓
DISCOVER
↓
ASSESS
↓
OPTIMIZE

Use the following conceptual framework:

DISCOVER
"See where your procurement value is hiding."

ASSESS
"Understand the opportunity, categories and sourcing levers."

OPTIMIZE
"Execute with benchmarks, detailed opportunities and action tracking."

This directly connects to the product's Bronze / Silver / Gold commercial model.

Do not make this look like a pricing page.

It is a PRODUCT JOURNEY.

==================================================
3. HERO SECTION
==================================================

At the top-left retain the aiCEV logo.

Below it, replace the current large headline:

"Every Penny Saved in Procurement is a Direct Increase in Profit"

with a more customer-centric headline:

"Turn Procurement Data Into Measurable Savings."

Use a strong second line:

"From spend visibility to sourcing intelligence — aiCEV helps procurement teams find, assess and act on value."

Keep the typography large but reduce unnecessary text.

The customer should understand the product within approximately 5 seconds.

==================================================
4. EXPLAIN THE aiCEV MODEL
==================================================

Introduce a compact visual section titled:

"How aiCEV Creates Procurement Value"

Show three connected stages:

01 — DISCOVER
Bronze

"Upload your spend and uncover where value may be hiding."

02 — ASSESS
Silver

"Understand savings opportunities, categories and sourcing levers."

03 — OPTIMIZE
Gold

"Go deeper with benchmarks, detailed opportunities and execution tracking."

Use subtle progression arrows or connected nodes.

Do not create three large pricing cards.

This is about understanding the model, not selling price.

==================================================
5. CONVERSION MESSAGE
==================================================

Add a small high-impact statement near the authentication area:

"Start with your data. Upgrade when you need deeper intelligence."

Supporting line:

"Explore the opportunity first. Move to deeper analytics and execution when you're ready."

This is critical.

The user should feel that there is LOW FRICTION to starting.

Do not ask them to buy anything on this page.

==================================================
6. RIGHT-SIDE AUTHENTICATION PANEL
==================================================

Keep the current right-side authentication card.

However, make the tabs:

SIGN IN
CREATE ACCOUNT

more prominent and modern.

For CREATE ACCOUNT, make the primary CTA:

"Start Free with aiCEV"

instead of generic:

"Create Account"

For SIGN IN:

"Sign In to Workspace"

Retain enterprise-style wording.

==================================================
7. CREATE ACCOUNT EXPERIENCE
==================================================

The Create Account tab should communicate the Bronze entry point.

Heading:

"Start Your Procurement Discovery"

Supporting text:

"Create your free workspace and upload your procurement data to begin."

Show a small reassurance row:

✓ No online payment
✓ Start with Discover
✓ Upgrade when you need more

Do NOT say:

"Free forever"

unless that is commercially guaranteed.

Use:

"Start Free"

or:

"Begin with Bronze"

==================================================
8. BRONZE / SILVER / GOLD VISUALIZATION
==================================================

Near the bottom of the left panel, introduce a very compact visual:

aiCEV PROCUREMENT INTELLIGENCE MODEL

DISCOVER
Bronze
Spend visibility + opportunity indicator

↓

ASSESS
Silver
Savings intelligence + sourcing insights

↓

OPTIMIZE
Gold
Full intelligence + benchmarks + execution

Keep this compact.

Do not overload the login page with detailed feature lists.

The detailed entitlement matrix belongs inside the application.

==================================================
9. BENEFITS SECTION
==================================================

Replace the current "AUTONOMOUS TECHNOLOGY ADVANTAGES" section with:

"WHAT YOU CAN DO WITH aiCEV"

Use 3 or 4 concise benefit cards.

CARD 1
"Find Procurement Leakage"

"Identify pricing gaps, duplicate spend, fragmented suppliers and other value leakage across procurement data."

CARD 2
"See Where Savings Are"

"Translate spend patterns into category, supplier and sourcing opportunities."

CARD 3
"Benchmark & Compare"

"Use procurement benchmarks and market intelligence to support better commercial decisions."

CARD 4
"Move From Insight to Action"

"Turn identified opportunities into sourcing waves, savings actions and execution tracking."

Keep each card to approximately 2 lines of supporting copy.

Avoid excessive technical terminology.

==================================================
10. CUSTOMER LANGUAGE
==================================================

The page should speak to:

CFO
CPO
Procurement Head
Sourcing Head
Procurement Manager
Business Owner

Use business language.

Avoid making the page sound like it is selling AI technology.

Do NOT overuse:

AI
autonomous
algorithm
machine learning
taxonomy
neural
automation

The customer buys PROCUREMENT VALUE.

AI is the technology underneath.

==================================================
11. IMPORTANT — REMOVE DEVELOPMENT ACCESS
==================================================

The current screenshot contains:

"TEMPORARY DEVELOPMENT ACCESS"

and visible development accounts:

- Sriman (Admin)
- System Administrator
- Enterprise Buyer
- admin credentials / direct admin portal access

THIS MUST NOT APPEAR ON THE CUSTOMER-FACING PRODUCTION LOGIN PAGE.

Remove it entirely from production UI.

Do not simply hide it with CSS.

Ensure it is conditionally available only in an explicit development/test environment.

Production build MUST NOT expose:

- development credentials
- admin shortcuts
- test accounts
- auto-fill credentials
- "Open Admin Portal Directly"
- development mode indicators

If a development-only login shortcut is retained for local development, isolate it using a secure environment flag such as:

NODE_ENV === "development"

and verify production build excludes it.

==================================================
12. SECURITY / AUTHENTICATION
==================================================

Do not weaken any existing authentication or subscription security.

Preserve:

- server-side authentication
- tenant isolation
- Bronze/Silver/Gold entitlement enforcement
- admin authorization
- OTP architecture
- activation code architecture
- subscription state machine
- audit trail

The login page is only a presentation-layer improvement.

Do not modify backend authorization logic unless required to remove development-only exposure.

==================================================
13. REMOVE UNSUPPORTED CLAIMS
==================================================

The current screenshot contains:

"100% Direct EBITDA Conversion"
"₹120+ Cr Savings Potential Identified"
"98.7% AI Taxonomy Accuracy"
"8% – 18% Typical Spend Reduction"
"SOC2 Type II / AES-256"

Do NOT retain these automatically.

Replace them with factual, defensible product statements.

Recommended replacement metrics/cards:

"Spend Visibility"
"Opportunity Identification"
"Category Intelligence"
"Execution Tracking"

If certified customer-specific numbers are intentionally displayed, use only the approved certified presentation data contract.

Do not put the customer's ₹78.72 Cr / ₹93.60 Cr numbers on a generic login page unless this is explicitly a customer-specific authenticated experience.

==================================================
14. TRUST SECTION
==================================================

At the bottom, add a restrained trust statement:

"Built for procurement teams that want evidence before action."

Supporting line:

"Start with your data. Validate the opportunity. Expand when the value is clear."

Do not claim:

SOC 2
ISO 27001
FIPS
Air-gapped
Zero Hallucination
Guaranteed Savings

unless formally verified and approved.

==================================================
15. VISUAL DESIGN
==================================================

Keep the current dark theme but make it more refined.

Use:

- deep navy background
- subtle blue/cyan accents
- aiCEV blue
- aiCEV orange
- restrained green only for positive/value indicators
- high contrast white typography
- soft borders
- subtle gradients
- generous whitespace

Avoid:

- excessive glowing effects
- excessive neon
- too many cards
- excessive animations
- crowded text
- oversized marketing statements
- unnecessary icons

The page should feel like:

McKinsey-level enterprise software
+
modern AI product
+
premium procurement intelligence platform

NOT like a crypto/AI startup landing page.

==================================================
16. LAYOUT
==================================================

Desktop:

LEFT ~55%
RIGHT ~45%

LEFT:

Logo
↓
Hero headline
↓
One-sentence explanation
↓
Discover → Assess → Optimize visual
↓
3–4 benefit cards
↓
Trust statement

RIGHT:

Sign In / Create Account tabs
↓
Authentication form
↓
Primary CTA
↓
Small Bronze entry reassurance
↓
Privacy/security reassurance

Maintain excellent alignment and spacing.

==================================================
17. MOBILE RESPONSIVENESS
==================================================

On mobile:

1. aiCEV logo
2. Hero message
3. Discover → Assess → Optimize
4. Authentication
5. Benefits
6. Trust statement

Do not force the desktop two-column layout onto mobile.

Avoid excessive scrolling before the authentication CTA.

==================================================
18. MICROCOPY
==================================================

Use concise customer-focused language.

Recommended primary CTA:

CREATE ACCOUNT:
"Start Free with aiCEV"

SIGN IN:
"Sign In to Workspace"

Secondary link:

"Already have an account? Sign in"

For Bronze explanation:

"Begin with Discover. Upgrade when you need deeper intelligence."

For commercial conversion:

"Need deeper procurement intelligence?"
"Talk to Procucev"

Do NOT use:

"Buy Now"
"Subscribe Now"
"Checkout"

The commercial process remains offline.

==================================================
19. DO NOT DISTURB EXISTING PRODUCT
==================================================

This is a LOGIN/PRE-AUTH EXPERIENCE redesign only.

Do not modify:

Module 1
Module 2
Module 3
Module 4
PCBI
Savings Engine
Management Quick Summary
Boardroom & Evidence
Subscription backend
Entitlement middleware
Tenant isolation
Financial calculations

Only modify the login/registration presentation and any required development-only visibility logic.

==================================================
20. ACCEPTANCE CRITERIA
==================================================

After implementation verify:

[ ] Existing login functionality works
[ ] Create Account works
[ ] Bronze registration flow works
[ ] Sign In works
[ ] aiCEV logo unchanged
[ ] Existing authentication security preserved
[ ] Development credentials completely absent from production UI
[ ] Admin shortcut completely absent from production UI
[ ] No unsupported financial claims remain
[ ] No unsupported security certifications remain
[ ] Discover → Assess → Optimize clearly communicated
[ ] Bronze → Silver → Gold relationship understandable
[ ] Customer understands value within 5 seconds
[ ] Primary CTA is visually dominant
[ ] Page does not look like a pricing page
[ ] Page does not look like a generic login screen
[ ] Mobile layout validated
[ ] Desktop layout validated
[ ] No horizontal overflow
[ ] No clipped text
[ ] No excessive scrolling
[ ] No overlap
[ ] Existing modules unaffected
[ ] Typecheck passes
[ ] Lint passes
[ ] Existing tests pass

==================================================
21. FINAL DESIGN PRINCIPLE
==================================================

The final page must communicate this idea without necessarily displaying it as a quotation:

"Don't ask the customer to believe aiCEV.

Let them start with their own procurement data.

Let aiCEV show them the opportunity.

Then let the value naturally lead them from Bronze → Silver → Gold."

This is the central conversion philosophy of the redesign.

==================================================
22. FINAL OUTPUT
==================================================

After implementation provide:

1. Files modified
2. Exact UI changes
3. Claims removed/replaced
4. Confirmation that development credentials are not exposed in production
5. Confirmation that authentication/security was preserved
6. Desktop validation result
7. Mobile validation result
8. Typecheck result
9. Lint result
10. Test result
11. Confirmation that Modules 1–4 were not modified
12. Screenshot or browser inspection of the final login page

Do not redesign the application beyond this scope.

END PROMPT 290\n`;

fs.appendFileSync('prompts.md', prompt290, 'utf8');
console.log('Successfully appended Prompt 290 to prompts.md');
