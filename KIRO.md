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

## CI/CD Pipeline & Pull Request Standards
1. Pull request workflow (`.github/workflows/ci.yml`) validates linting, typechecking, building, and unit tests with 90% per-file code coverage.
2. All CI/CD pipelines must configure explicit job timeouts (`timeout-minutes: 15`).
3. PR summary comments must be posted/updated on pull requests detailing test pass/fail counts and coverage metrics.

## User Prompt History (`prompts.md`)
1. Maintain `prompts.md` in the workspace root to log user-provided prompts.
2. Log ONLY user-provided prompts in `prompts.md`. Do NOT include AI-generated conversation or answers.
3. Append user prompts chronologically under designated headers.
