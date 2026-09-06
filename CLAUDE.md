# Claude Code Instructions

## Mandatory Unit Test Policy (90% Per-File Coverage)

1. **Strict 90% Benchmark**: Every file in this project must maintain at least 90% coverage across lines, statements, branches, and functions.
2. **Per-File Failure**: The test runner throws an error if any single file falls below 90%.
3. **No File Exclusions**: Every logic file must be tested without skipping.
4. **Global Timeout**: 10,000ms global timeout applies to all tests.
5. **Continuous Verification**: Run `npm run test:coverage` whenever modifying any file and verify all thresholds pass before completing work.

## Detailed Structured Logging Guidelines

1. **Centralized Logging Only**: Use `backend/src/utils/logger.ts` or `frontend/src/utils/logger.ts`. Raw `console.log` / `console.error` are prohibited in production code.
2. **Structured Format**: Provide structured JSON logs including timestamp, level, message, context, error stacks, durationMs, and correlation ID (`requestId`).
3. **Local File System Persistence**: Logs must be persisted to the local file system (`logs/app.log`, `logs/error.log`, `logs/app-YYYY-MM-DD.log`) during local development.
4. **Automatic Purging**: Retain log files for storage compliance by automatically purging files older than `LOG_RETENTION_DAYS` (default: 14 days).
5. **Application-Wide Adoption**: Incorporate structured logs into all routes, controllers, services, database operations, and middlewares.

## CI/CD Pipeline & Pull Request Standards

1. **Pull Request Quality Gates**: Every PR runs automated checks for linting, typechecking, building, and unit tests with 90% per-file code coverage.
2. **Mandatory Pipeline Timeout**: Each CI/CD workflow job must have a specified timeout (e.g., `timeout-minutes: 15`).
3. **Automated PR Comments**: The workflow generates and posts/updates an executive summary comment on the PR detailing unit test results and coverage percentages.

## User Prompt History (`prompts.md`)

1. **Workspace Prompts File**: Maintain `prompts.md` in the workspace root to log user-provided prompts.
2. **Strict Filtering**: Record ONLY user-provided prompts in `prompts.md`. Never include AI-generated conversation, output, or assistant reasoning.
3. **Append Workflow**: Record each incoming user prompt in chronological sequence under descriptive headers.

## Internationalization (i18n) & `UI_STRINGS` Standards

1. **Centralized UI Strings**: Move all user-facing strings out of components into constants modules exposed through `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`).
2. **No Hardcoded Literals**: Forbid hardcoded literal strings and embedded text in JSX/TSX.
3. **Template Placeholders**: Use parameterized formatter functions for dynamic runtime variables (e.g. counts, amounts, codes) to ensure i18n capability.
4. **Test Resilience**: Tests must assert against `UI_STRINGS` constants instead of hardcoded strings to avoid fragile assertions.
5. **Coverage Benchmark**: All i18n modules must meet the strict 90% per-file unit test coverage benchmark.
