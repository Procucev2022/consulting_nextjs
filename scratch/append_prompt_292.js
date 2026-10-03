const fs = require('fs');
const path = require('path');

const promptPath = path.join(__dirname, '..', 'prompts.md');
const contentToAppend = `\n## Prompt 292

PROMPT 292 — aiCEV LOGIN PAGE VISUAL REFINEMENT, LIGHT THEME & DEVELOPMENT ACCESS

OBJECTIVE

Refine the CURRENT Prompt 290 aiCEV login/registration design based on actual rendered UI review.

IMPORTANT:

The PRODUCT JOURNEY concept is approved and MUST remain:

YOUR DATA
→ DISCOVER
→ ASSESS
→ OPTIMIZE

Bronze → Silver → Gold

Do NOT redesign the concept.

This prompt is primarily for:

1. visual refinement
2. alignment correction
3. better space utilization
4. light premium enterprise theme
5. improved right-side authentication composition
6. improved desktop balance
7. temporary development login restoration for local development/testing

DO NOT modify:

- Modules 1–4
- subscription architecture
- entitlement logic
- financial calculations
- PCBI
- savings engine
- authentication backend
- tenant isolation
- production security architecture

==================================================
1. CHANGE THE OVERALL VISUAL DIRECTION
==================================================

The current dark navy interface is visually heavy.

Move the LOGIN / REGISTRATION PAGE to a:

LIGHT PREMIUM ENTERPRISE THEME

Primary background:

Very light sky blue / blue-white.

Target visual feeling:

- premium enterprise SaaS
- modern procurement platform
- clean
- trustworthy
- approachable
- sophisticated
- less "developer / AI laboratory"
- more "executive procurement intelligence"

Suggested background family:

#EEF7FF
#F5FAFF
#EAF4FC

Do not use saturated blue as the page background.

Use white for primary content cards.

Use very light blue-grey borders.

Use dark navy text for headings.

Use aiCEV blue for primary actions and accents.

Use aiCEV orange selectively for:

- Gold
- important highlights
- secondary visual emphasis

Use green only for:

- positive reassurance
- verified/status indicators

==================================================
2. PRESERVE THE aiCEV BRAND
==================================================

Keep the existing aiCEV logo exactly as supplied.

Do not redesign the logo.

Do not alter the logo proportions.

Place it consistently at:

desktop:
top-left with approximately 32–40px margin

mobile:
top-left with approximately 20px margin

Remove unnecessary dark containers behind the logo.

The logo should sit naturally on the light background.

==================================================
3. PAGE STRUCTURE
==================================================

Desktop layout:

LEFT: approximately 52%
RIGHT: approximately 48%

Use a centered maximum-width container:

max-width approximately 1500–1600px

with balanced horizontal margins.

Do not let the left side become excessively wide.

Do not let the right side become narrow.

The two columns should feel like equal partners:

LEFT = VALUE STORY

RIGHT = ACTION / CONVERSION

==================================================
4. LEFT SIDE — SIMPLIFY THE VISUAL HIERARCHY
==================================================

The left side should have:

1. Logo / brand
2. Small "Procurement Intelligence" badge
3. Hero
4. Capability ribbon
5. Product Journey
6. Benefits
7. Compact trust statement

But reduce visual clutter.

Do NOT make every section look like a separate heavy dark card.

On the light theme:

- Hero can sit directly on the background or inside a very subtle white card
- Capability cards should be white
- Product Journey should be a single cohesive white panel
- Benefits should be lightweight white cards
- Borders should be subtle
- Shadows should be extremely soft

Avoid excessive rounded containers.

Use visual hierarchy rather than boxes everywhere.

==================================================
5. HERO
==================================================

Keep the approved headline:

"Turn Procurement Data Into Measurable Savings."

Keep:

"From spend visibility to sourcing intelligence — aiCEV helps procurement teams find, assess and act on value."

Keep the supporting message:

"Upload your procurement spend. aiCEV identifies where value is hiding, what can be improved, and where deeper procurement intelligence can unlock additional savings."

However:

Improve typography and spacing.

Hero heading should be approximately:

40–48px desktop

with strong line height.

Supporting text:

17–19px

Maximum width approximately 680px.

Do not allow awkward line breaks.

==================================================
6. CAPABILITY RIBBON
==================================================

Current:

Spend Visibility
Opportunity Identification
Category Intelligence
Execution Tracking

KEEP these four concepts.

Change their presentation from dark cards to:

four clean white cards / tiles.

Use subtle icons.

Use a very light blue background or white.

Keep equal width.

Ensure:

- same height
- same internal padding
- same title alignment
- same description alignment
- no text clipping
- no uneven wrapping

Titles can use the aiCEV blue / teal / orange accent system.

==================================================
7. PRODUCT JOURNEY — MAKE THIS THE VISUAL ANCHOR
==================================================

Keep:

HOW aiCEV CREATES PROCUREMENT VALUE

YOUR DATA → DISCOVER → ASSESS → OPTIMIZE

Use one large white premium panel.

Inside it:

01
BRONZE
DISCOVER

"Upload your spend and uncover where value may be hiding."

↓

02
SILVER
ASSESS

"Understand savings opportunities, categories and sourcing levers."

↓

03
GOLD
OPTIMIZE

"Go deeper with benchmarks, detailed opportunities and execution tracking."

The three stages should be:

- equal width
- same height
- aligned vertically
- consistent spacing

Use subtle connector arrows.

Bronze:
warm amber accent

Silver:
neutral/slate/blue accent

Gold:
orange/gold accent

Do not make Gold look like a hard sales push.

The visual message is:

"Start here → discover value → go deeper when required."

==================================================
8. RIGHT SIDE — MAJOR SPACE UTILIZATION IMPROVEMENT
==================================================

This is the most important visual correction.

The current authentication card occupies only part of the available right-side area and leaves too much empty space.

Change the right side into a deliberate:

"CONVERSION PANEL"

The panel should be vertically centered in the available viewport.

Width:

approximately 520–580px

Do not make it excessively narrow.

The authentication card should use the available vertical space intelligently without becoming unnecessarily tall.

Suggested structure:

------------------------------------------------

START WITH YOUR DATA

"Upgrade when you need deeper intelligence."

Short supporting line.

------------------------------------------------

SIGN IN | CREATE ACCOUNT

------------------------------------------------

Authentication form

------------------------------------------------

Primary CTA

------------------------------------------------

For Sign In:

"New visitor? Start Free with Bronze Discover"

For Create Account:

"Already have an account? Sign In"

------------------------------------------------

Three small reassurance items:

✓ Start with Discover
✓ No online payment
✓ Upgrade when you need more

------------------------------------------------

"Built for procurement teams that want evidence before action."

------------------------------------------------

This creates a complete visual conversion block instead of an isolated login form.

==================================================
9. RIGHT PANEL — SIGN IN
==================================================

Heading:

"Sign In to Workspace"

Subheading:

"Access your procurement intelligence dashboard and savings opportunities."

Fields:

Organization Email
Password

CTA:

"Sign In to Workspace"

Make CTA width 100%.

Use a strong aiCEV blue.

Do not use gradients unless extremely subtle.

Password visibility control should remain.

Inputs should be:

- white
- clear border
- dark text
- strong focus state
- 52–56px height
- consistent radius

==================================================
10. RIGHT PANEL — CREATE ACCOUNT
==================================================

Heading:

"Start Your Procurement Discovery"

Subheading:

"Create your free workspace and upload your procurement data to begin."

CTA:

"Start Free with aiCEV"

Under the CTA:

✓ Start with Discover
✓ No online payment
✓ Upgrade when you need more

Do not mention pricing.

Do not ask for payment.

Do not make the customer feel they are committing to a paid subscription.

==================================================
11. ADD A SMALL CONVERSION REASSURANCE AREA
==================================================

Below the authentication CTA create a subtle white/light-blue information strip:

"Start with your data. Upgrade when you need deeper intelligence."

Then:

"Explore the opportunity first. Move to deeper analytics and execution when you're ready."

Keep it visually compact.

Do not duplicate the same message multiple times.

==================================================
12. REMOVE VISUAL DUPLICATION
==================================================

The current page repeats similar messaging in multiple places.

Avoid repeating:

"Start with your data"

more than necessary.

Avoid repeating:

"Upgrade when you need deeper intelligence"

multiple times.

Each major message should appear once.

The page should feel edited and intentional.

==================================================
13. RIGHT-SIDE VERTICAL ALIGNMENT
==================================================

On desktop:

The right authentication panel should be vertically centered relative to the visible viewport.

Use:

display:flex
align-items:center

or equivalent layout.

Do NOT simply add arbitrary top margins.

The right card should remain centered even if the left side becomes taller.

If the page requires vertical scrolling because of content, the authentication panel can remain naturally positioned but should not appear stuck at the top.

==================================================
14. DESKTOP SCREEN TARGET
==================================================

Optimize specifically for:

1440 × 900
1920 × 1080
1366 × 768

At 1440 × 900:

The user should immediately see:

Logo
Hero
Capability ribbon
Top of Product Journey

and the right side should show:

Conversion message
Sign In/Create Account
Entire form
CTA
reassurance

without awkward empty space.

At 1920 × 1080:

Do not stretch cards excessively.

Use max-width.

At 1366 × 768:

Reduce spacing intelligently rather than causing overlap.

==================================================
15. MOBILE
==================================================

On mobile:

Do NOT preserve the desktop two-column proportions.

Order:

1. Logo
2. Hero
3. Capability summary
4. Authentication card
5. Discover → Assess → Optimize
6. Benefits
7. Trust

Most importantly:

The authentication CTA should appear early.

Do not force the customer to scroll through the entire marketing story before reaching Create Account.

==================================================
16. BENEFITS SECTION
==================================================

Keep the four approved benefits:

Find Procurement Leakage
See Where Savings Are
Benchmark & Compare
Move From Insight to Action

Change them into a clean 2×2 white-card grid on desktop.

All cards:

- same height
- same width
- aligned
- equal padding

No card should have significantly more text than another.

Use concise descriptions.

==================================================
17. TRUST FOOTER
==================================================

Keep:

"Built for procurement teams that want evidence before action."

And:

"Start with your data. Validate the opportunity. Expand when the value is clear."

Place this as a clean footer statement.

Do not use unsupported certification claims.

Do not display:

SOC2
ISO 27001
FIPS
AES-256 certification claims
Air-gapped
Zero hallucination

unless formally verified.

==================================================
18. TEMPORARY DEVELOPMENT LOGIN — ENABLE FOR NOW
==================================================

IMPORTANT:

For the current development/testing phase ONLY, restore the development login panel.

The user explicitly wants the temporary development accounts available while finalizing the UI.

The development panel should work.

Use the EXISTING development credentials already defined in the application.

DO NOT invent new credentials.

DO NOT change production authentication.

DO NOT bypass backend authentication.

DO NOT create fake authentication.

The development panel should support:

- Sriman (Admin)
- System Administrator
- Enterprise Buyer
- existing "Open Admin Portal Directly" development shortcut

If the current development credentials are failing:

1. trace the existing credential definitions
2. trace the login handler
3. trace the backend auth endpoint
4. identify why the current quick-fill credentials do not authenticate
5. repair only the development/test flow
6. verify each existing test account actually logs in

The development panel must be visually integrated into the light theme.

Use a clearly visible but professional development-only panel:

"Temporary Development Access"
"Dev & Test Mode"

Do not make it look like a customer feature.

Use a subtle amber border/background.

==================================================
19. DEVELOPMENT SECURITY
==================================================

The development login MUST remain:

NODE_ENV === "development"

only.

Do NOT restore:

NEXT_PUBLIC_ENABLE_DEV_LOGIN

Do NOT use any client-controlled public environment variable to enable it.

Production must remain clean.

This is temporary for local development/testing only.

We will issue a separate final cleanup command after visual approval to remove it.

==================================================
20. ALIGNMENT REQUIREMENTS
==================================================

Perform a complete visual alignment audit.

Check:

- logo alignment
- badge alignment
- hero left edge
- capability cards
- product journey
- benefit cards
- right authentication panel
- tabs
- labels
- inputs
- buttons
- conversion message
- development panel
- footer

All major vertical edges should align to a consistent grid.

Use consistent:

horizontal padding
vertical rhythm
card radius
border thickness
font hierarchy

Do not use arbitrary margins to solve individual alignment problems.

Use the layout grid.

==================================================
21. TYPOGRAPHY
==================================================

Use one consistent typography system.

Heading hierarchy:

H1
40–48px desktop

H2
20–26px

Card heading
16–18px

Body
15–17px

Small labels
12–14px

Do not overuse monospace typography.

Monospace can remain only for:

- small technical/product labels
- "YOUR DATA → DISCOVER → ASSESS → OPTIMIZE"

The customer-facing copy should primarily use the existing premium sans-serif typography.

==================================================
22. COLORS
==================================================

Suggested palette:

Page background:
#EEF7FF

Primary white:
#FFFFFF

Soft blue:
#E6F2FF

Primary navy:
#0B1B33

Secondary navy:
#203553

aiCEV Blue:
use existing brand blue

aiCEV Orange:
use existing brand orange

Bronze:
warm amber

Silver:
slate / cool grey

Gold:
orange/gold

Do not introduce unrelated colors.

==================================================
23. NO FUNCTIONAL REGRESSION
==================================================

After changes verify:

- Sign In works
- Create Account works
- password visibility works
- tab switching works
- Bronze registration works
- development login works
- admin development login works
- enterprise buyer development login works
- Open Admin Portal development shortcut works
- production DevLoginBypass remains unavailable
- subscription architecture unchanged
- tenant isolation unchanged
- backend auth unchanged
- Modules 1–4 unchanged

==================================================
24. ACTUAL BROWSER VISUAL VALIDATION
==================================================

This time DO NOT rely only on static inspection or unit tests.

Open the actual login page in the browser.

Inspect at:

1440 × 900
1920 × 1080
1366 × 768
mobile width approximately 390px

Check visually for:

- alignment
- spacing
- clipping
- empty space
- card proportions
- typography
- contrast
- scrolling
- button placement
- authentication usability

If browser tooling is available, capture screenshots.

Do not report "visual validation PASS" without actual browser inspection.

==================================================
25. TESTING
==================================================

Run:

npm run typecheck
npm run lint
npm run test
npm run quality:fast

Also run targeted login tests.

Confirm:

0 failures.

==================================================
26. FINAL REPORT
==================================================

Return:

# PROMPT 292 — LOGIN VISUAL REFINEMENT REPORT

1. Visual redesign status
2. Light theme status
3. Desktop 1440×900 status
4. Desktop 1920×1080 status
5. Desktop 1366×768 status
6. Mobile status
7. Right-side space utilization status
8. Alignment audit status
9. Discover → Assess → Optimize status
10. Bronze/Silver/Gold presentation status
11. Development login status
12. Sriman login status
13. System Administrator login status
14. Enterprise Buyer login status
15. Admin portal shortcut status
16. Production development-login isolation status
17. Authentication regression status
18. Typecheck
19. Lint
20. Tests
21. quality:fast
22. Files modified
23. Screenshot/browser inspection evidence

IMPORTANT:

Do not remove the development login in this prompt.

It is intentionally enabled for DEVELOPMENT ONLY so that we can finalize the visual experience.

We will issue a separate final cleanup command after visual approval.

END PROMPT 292
\n`;

fs.appendFileSync(promptPath, contentToAppend, 'utf8');
console.log('Appended Prompt 292 to prompts.md');
