const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const devVarsPath = path.join(backendRoot, '.dev.vars');
const devVarsDevPath = path.join(backendRoot, '.dev.vars.dev');

const DEFAULT_DEV_VARS = `NODE_ENV=development
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:3001
APP_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
AUTH_SECRET=a1b2c3d4e5f60718293a4b5c6d7e8f90_procucev_secret_key_2026
R2_BUCKET=consulting-doc-dev
D1_DATABASE_NAME=consulting_dev
ADMIN_EMAIL=admin@procucev.com
ADMIN_MOBILE=+919876543210
GEMINI_API_KEY=AQ.Ab8RN6J9nGFqiaLfwux7vVNQekjTkyCvoRLz1kGBWGfHmNPbgg
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_PRIMARY_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODELS=gemini-flash-latest,gemini-3.5-flash-lite
GEMINI_REQUEST_TIMEOUT_MS=20000
GEMINI_TOTAL_BUDGET_MS=45000
GEMINI_MIN_ATTEMPT_MS=3000
GEMINI_MAX_DOCUMENT_BYTES=10485760
GEMINI_MAX_DOCUMENT_TEXT_CHARS=120000
`;

const ensureDevVars = () => {
  if (!fs.existsSync(devVarsPath)) {
    fs.writeFileSync(devVarsPath, DEFAULT_DEV_VARS, 'utf8');
    process.stdout.write('Created backend/.dev.vars with local development configuration.\n');
  }
  if (!fs.existsSync(devVarsDevPath)) {
    fs.writeFileSync(devVarsDevPath, DEFAULT_DEV_VARS, 'utf8');
  }
};

ensureDevVars();

module.exports = { ensureDevVars, DEFAULT_DEV_VARS };
