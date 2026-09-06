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

## Mandatory CI/CD Pipeline & Quality Standards

- **PR Workflow**: Automated CI/CD workflow (`.github/workflows/ci.yml`) runs on all pull requests to validate linting, typechecking, building, and 90% per-file unit test coverage.
- **Pipeline Timeouts**: Every GitHub Actions CI/CD job must specify an explicit timeout (e.g., `timeout-minutes: 15`).
- **PR Comments**: The workflow must automatically publish an executive summary PR comment detailing test success/failure counts, execution duration, and overall code coverage.

## Mandatory User Prompt History (`prompts.md`)

- **Rule**: Maintain `prompts.md` in the workspace root for saving user-provided prompts.
- **Strict Scope**: Save ONLY user-provided prompts in `prompts.md`. Do NOT save AI-generated conversations, responses, or commentary.
- **Workflow**: When a new prompt is provided by the user, append it to `prompts.md` in chronological sequence.

## Mandatory Internationalization (i18n) & `UI_STRINGS` Policy

- **Rule**: All user-facing strings and literals must be extracted from components into dedicated constants modules and exposed via a centralized `UI_STRINGS` object (`frontend/src/constants/uiStrings.ts`).
- **No Hardcoded Literals**: Hardcoding user-facing strings or embedding literal text in components/JSX is strictly prohibited.
- **Dynamic Placeholders**: Use template placeholders / parameterized functions for runtime variable substitutions to ensure full i18n readiness.
- **Test Assertions**: All tests must assert against `UI_STRINGS` constants instead of hardcoded strings to ensure resilience against UI and translation changes.
- **Strict 90% Coverage**: Every file created or updated must achieve >= 90% unit test coverage individually.
