# Kiro AI Instructions

## Unit Test Coverage Benchmark (>= 90% Per-File)

1. Maintain >= 90% coverage on statements, branches, functions, and lines for each file.
2. Per-file failure is enabled; tests will error if any file does not meet the benchmark.
3. Global timeout of 10000ms is strictly enforced.
4. Always execute `npm run test:coverage` on code modifications to verify compliance.

## Structured Logging & Storage Compliance

1. Use centralized structured logger (`backend/src/utils/logger.ts` / `frontend/src/utils/logger.ts`). Avoid raw console logging.
2. Ensure log records contain timestamp, level, message, context, requestId, and error details.
3. Store logs locally in the file system (`logs/`) when running in local environments.
4. Enforce automatic log purging based on `LOG_RETENTION_DAYS` (default 14 days) to maintain compliance and avoid disk exhaustion.

