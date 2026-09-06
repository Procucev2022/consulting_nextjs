# Gemini / Antigravity Instructions

## Mandatory 90% Unit Test Code Coverage

- **Rule**: Every modified or created file must have unit tests with >= 90% coverage for statements, branches, functions, and lines individually.
- **Enforcement**: Vitest throws an error if any single file is below 90%.
- **Global Timeout**: 10000ms global timeout for all unit tests.
- **Workflow**: Whenever any change is made, run `npm run test:coverage` to verify. Do not stop until all tests pass with >= 90% per-file coverage.

## Mandatory Structured & Centralized Logging System

- **Rule**: All application logging must use the centralized structured logger (`backend/src/utils/logger.ts` or `frontend/src/utils/logger.ts`). Raw `console.log`, `console.warn`, and `console.error` are strictly forbidden.
- **Detailed Logs**: Log events must include structured metadata: `timestamp`, `level` (`debug`, `info`, `warn`, `error`), `service`, `message`, `requestId`, `context`, `error` (with stack), and `durationMs` for performance metrics.
- **Local Persistence**: When running locally, all logs must be persisted to the local file system (`logs/app.log`, `logs/error.log`, and daily-rotated `logs/app-YYYY-MM-DD.log`).
- **Automatic Purging**: Automatic log retention engine must purge log files older than the retention window (`LOG_RETENTION_DAYS`, default 14 days) to manage storage and ensure compliance.
- **Full Coverage**: Apply detailed structured logging across all routes, controllers, services, database queries, and middleware.

