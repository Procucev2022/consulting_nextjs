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

## Separate Constants File Configuration

1. **Dedicated Constants Modules**: Keep all application constants, configuration parameters, default financial values, thresholds, palettes, and static lookup tables in separate files under `constants/` (`frontend/src/constants/` and `backend/src/constants/`).
2. **Zero Inline Constants**: Never inline magic numbers, configuration objects, or constant lookup tables directly in components, services, or controllers.
3. **Domain Grouping & Exports**: Group constants logically by domain (`app.ts`, `currency.ts`, `pipeline.ts`, `logger.ts`) and export them through `constants/index.ts`.
4. **Strict Coverage**: Maintain >= 90% unit test coverage for all constants files.

## Separate Data Types & Interfaces Configuration

1. **Dedicated Type Modules**: Keep all TypeScript data types, interfaces, enums, and type aliases in separate files under `types/` (`frontend/src/types/` and `backend/src/types/`).
2. **Zero Inline Types**: Never declare `interface` or `type` definitions directly within component files (`.tsx`), controller files, route definitions, or utility files.
3. **Component Props Separation**: Extract all component and modal prop interfaces into dedicated type files (e.g., `types/components.ts`) and import them into components.
4. **Barrel Exports**: Re-export all types via `types/index.ts` for clean, modular imports.

## Input Schema Validation Standards

1. **Mandatory Schema Validation**: Whenever modifying or adding code that touches user or system inputs (frontend forms, modals, API routes, controller bodies, query parameters, headers), input schema validation is strictly required.
2. **Dedicated Constants Modules**: All validation schemas must be defined in dedicated constants files under `constants/` (`frontend/src/constants/validation.ts` and `backend/src/constants/validation.ts`) and re-exported via `constants/index.ts`. Never declare validation schemas inline.
3. **Dedicated Types**: Inferred types (`z.infer<typeof schema>`) must be defined in `types/validation.ts` and re-exported via `types/index.ts`.
4. **Fail-Fast Error Handling**: Backend endpoints must validate inputs immediately and return HTTP 400 Bad Request with structured error messages before executing any business logic.
5. **Strict 90% Coverage**: All validation schemas, middleware, and helper utilities must achieve >= 90% unit test coverage individually.

## Comprehensive & Descriptive UI Error Messaging Standards

1. **Actionable Context & Specificity**: Always present user-facing error messages with clear problem context, specific failure causes, and actionable resolution steps. Vague, generic messages (e.g. "Something went wrong") are prohibited.
2. **Error Categorization**: Classify errors into explicit categories: `VALIDATION_ERROR`, `NETWORK_ERROR`, `AUTH_ERROR`, `NOT_FOUND_ERROR`, `CONFLICT_ERROR`, `SERVER_ERROR`, and `RATE_LIMIT_ERROR`.
3. **Centralized UI Strings**: All error text and templates must be defined in `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`). Zero hardcoded literals in JSX.
4. **Separate Constants & Types**: Error categories and codes belong in `constants/` (`constants/errors.ts` or `constants/app.ts`), and error payload/state interfaces belong in `types/` (`types/errors.ts`).
5. **Structured Logging**: Log all UI errors with severity, user message, stack, context, and correlation `requestId` via `frontend/src/utils/logger.ts`.
6. **Strict 90% Per-File Coverage**: All error formatters, banner components, and utilities must maintain >= 90% unit test coverage individually.

## Database Optimization & GraphQL Integration Standards

1. **Mandatory Query Auditing**: Track all database queries for execution time (`durationMs`), operation, and row count. Trigger structured warning logs for queries exceeding `SLOW_QUERY_THRESHOLD_MS` (100ms).
2. **Compute Hour Reduction**: Implement query caching with TTL for stable reads (tenants, taxonomy, categories, rankings) with automatic write invalidation. Enforce projection selection and database indexing in Prisma schema to eliminate full-table scans and minimize database compute hours.
3. **GraphQL Integration**: Provide `/api/graphql` endpoint exposing application queries and mutations. Support composite queries (such as `dashboardOverview`) to fetch multiple domain models in a single network round-trip.
4. **Constants & Types Isolation**: Schema definitions and query strings must live in `constants/graphql.ts` and `constants/db.ts`; models and contexts in `types/graphql.ts` and `types/db.ts`.
5. **Strict 90% Coverage**: All database auditors, cache helpers, GraphQL resolvers, and route handlers must maintain >= 90% unit test coverage individually.




