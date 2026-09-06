# Mandatory Git Pre-Commit Quality Checks & Hook Enforcement Policy

## 1. Mandatory Pre-Commit Hook Execution
- All AI assistants and contributors MUST enforce git pre-commit hook execution prior to allowing any `git commit`.
- Bypassing pre-commit hooks (e.g., `--no-verify`) or committing without verification is strictly prohibited.

## 2. Quality Pipeline Verification Sequence
The pre-commit hook (`npm run pre-commit`) must execute and pass all quality checks in sequence:
1. **Strict Linting**: `npm run lint` (0 ESLint errors and 0 warnings across frontend and backend).
2. **Strict Typechecking**: `npm run typecheck` (0 TypeScript compilation errors across all workspaces).
3. **Unit Tests & 90% Per-File Code Coverage**: `npm run test:coverage` (100% test pass rate with >= 90% per-file code coverage across statements, branches, functions, and lines individually).
4. **Production Build Execution**: `npm run build` (Clean production builds for both backend and frontend).

## 3. Automated Failure Blocking & Remediation
- Any failure in linting, typechecking, tests, code coverage, or build must immediately abort the commit process.
- The assistant must diagnose the failure, implement verified fixes, and re-run all quality checks to completion before attempting the commit again.
