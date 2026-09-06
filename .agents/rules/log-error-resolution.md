# Mandatory Automated Log Error Monitoring & Resolution Policy

## 1. Continuous Runtime Log Monitoring & Parsing
- Continuously monitor, parse, and analyze application log files (`logs/app.log`, `logs/error.log`, `logs/app-YYYY-MM-DD.log`) and system outputs.
- Ingest structured JSON log records capturing timestamps, error severity levels (`WARN`, `ERROR`), services, request correlation IDs (`requestId`), context metadata, and full stack traces.

## 2. Automated Root Cause Diagnosis
- Parse error codes, HTTP status codes (e.g., 400 Bad Request, 404 Not Found, 500 Internal Server Error), and exception signatures.
- Differentiate between transient network/operational conditions and genuine application bugs.
- Perform automated root-cause diagnosis on unhandled promise rejections, schema validation failures, data type discrepancies, and uncaught exceptions.

## 3. Verified Bug Fixing & Failure Prevention
- Implement targeted, verified code fixes addressing root causes to eliminate repeat errors.
- Ensure fixes strictly adhere to repository architectural standards:
  - Input schema validation via Zod in `constants/validation.ts`.
  - Typed data definitions in `types/`.
  - Centralized user strings in `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`).
  - Centralized constants in `constants/`.
  - Zero raw console calls; all logs through structured loggers.

## 4. Mandatory Quality Check Pipeline Validation
- Validate every bug fix through the complete quality check pipeline:
  1. **Linting**: 0 ESLint errors (`npm run lint`).
  2. **Typechecking**: 0 TypeScript errors (`npm run typecheck`).
  3. **Unit Tests & 90% Per-File Coverage**: All existing tests plus new regression tests must pass with >= 90% individual per-file coverage across statements, branches, functions, and lines (`npm run test:coverage`).
  4. **Build Verification**: Clean production builds (`npm run build`).
