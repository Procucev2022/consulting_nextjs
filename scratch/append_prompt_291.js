const fs = require('fs');
const path = require('path');

const promptPath = path.join(__dirname, '..', 'prompts.md');
const content = fs.readFileSync(promptPath, 'utf8');

const prompt291Text = `

## Prompt 291

PROMPT 291 — FINAL PRODUCTION LOGIN SECURITY HARDENING

This is a very small security-only correction to Prompt 290.

DO NOT redesign the login page.
DO NOT change the UI.
DO NOT change the customer messaging.
DO NOT change authentication logic.
DO NOT modify Modules 1–4.
DO NOT modify subscription architecture.

OBJECTIVE:

Ensure development login credentials and admin shortcuts can NEVER be enabled through a client/public environment variable in a production build.

CURRENT IMPLEMENTATION:

The current DevLoginBypass logic reportedly uses:

const isDev =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

CHANGE THIS.

REQUIRED IMPLEMENTATION:

Development login UI must ONLY render when:

process.env.NODE_ENV === 'development'

Remove all support for:

NEXT_PUBLIC_ENABLE_DEV_LOGIN

or any other client-controlled/public environment variable that can enable development credentials in production.

REQUIREMENTS:

1. Development credentials render only in local development.

2. Production build MUST return null for DevLoginBypass.

3. Production build MUST NOT contain:
   - Sriman
   - System Administrator
   - Enterprise Buyer
   - development passwords
   - auto-fill credentials
   - Open Admin Portal Directly
   - Temporary Development Access

4. Search the production frontend source/build output for these development identifiers and confirm they are not included in the production client bundle where technically possible.

5. Add/modify tests proving:

NODE_ENV=development
→ DevLoginBypass available.

NODE_ENV=production
→ DevLoginBypass unavailable.

6. Confirm that no public NEXT_PUBLIC_* variable can enable the development login.

7. Run:

npm run typecheck
npm run lint
npm run test
npm run quality:fast

8. Confirm the existing Prompt 290 login UI remains unchanged.

FINAL REPORT:

- Production dev-login exposure: PASS/FAIL
- Development-only rendering: PASS/FAIL
- Public environment override removed: PASS/FAIL
- Production bundle credential scan: PASS/FAIL
- Typecheck: PASS/FAIL
- Lint: PASS/FAIL
- Tests: PASS/FAIL
- quality:fast: PASS/FAIL

Do not make any other changes.

END PROMPT 291
`;

fs.writeFileSync(promptPath, content.trimEnd() + prompt291Text, 'utf8');
console.log('Appended Prompt 291 successfully');
