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

## AES Encryption & Data Protection Standards

1. **AES-256-GCM Primitive**: Protect all sensitive data at rest and in transit using authenticated AES-256-GCM.
2. **Nonce/IV & Tag Integrity**: Always generate a cryptographically fresh 96-bit (12-byte) initialization vector per encryption operation. Verify the 128-bit authentication tag on decryption.
3. **Key Derivation & Secrets Safety**: Use 256-bit keys from secure environment variables (`APP_ENCRYPTION_KEY`) or derived via PBKDF2 with SHA-256 (min 100,000 iterations). Never log plaintext keys or secrets.
4. **Constants & Types Isolation**: Store cryptographic constants in `constants/crypto.ts` and types in `types/crypto.ts`, exported via index barrels.
5. **Strict 90% Coverage**: All cryptographic helpers, serializers, and routes must maintain >= 90% unit test coverage individually.

## Automated Tech Stack & Libraries Upgrade Standards

1. **LTS & Stable Maintenance**: Automatically identify, upgrade, and maintain runtimes, frameworks, and third-party dependencies to current LTS or active stable releases.
2. **Systematic Breaking Change Refactoring**: Thoroughly inspect and refactor breaking API changes, compiler warnings, and deprecations across all call sites. Never suppress deprecation warnings.
3. **End-to-End Quality Validation**: Every upgrade must pass the full verification pipeline:
   - Production build (`npm run build`)
   - Strict typechecking (`npm run typecheck`) with 0 errors
   - Linting (`npm run lint`) with 0 errors
   - Unit tests & 90% per-file code coverage (`npm run test:coverage`) across all parameters.
4. **Zero Regressions**: Proactively resolve regressions, test failures, or coverage dips before committing upgrades.

## Automated Performance Optimization Standards

1. **Continuous Auditing**: Proactively audit critical paths, rendering bottlenecks, and API execution latencies.
2. **Code-Splitting & Lazy Loading**: Apply dynamic imports (`next/dynamic`) for non-critical surfaces and heavy modals.
3. **Resource Caching**: Enforce caching across data transformations, HTTP endpoints, and database queries.
4. **Benchmark Verification**: Validate improvements against bundle size and latency benchmarks via build and test pipelines.
5. **Strict 90% Coverage**: Keep >= 90% coverage across all performance and caching utilities.

## Automated Log Error Monitoring & Resolution Standards

1. **Log Ingestion**: Monitor and parse structured logs (`logs/app.log`, `logs/error.log`), extracting error codes, request IDs, and stack traces.
2. **Root Cause Diagnosis**: Diagnose root causes from runtime errors and implement permanent fixes.
3. **Validation Pipeline**: Verify every bug fix through linting (`npm run lint`), typechecking (`npm run typecheck`), and unit tests (`npm run test:coverage`) with >= 90% per-file coverage.

## Automated Warning Resolution Standards

1. **Zero Warning Mandate**: Proactively detect and resolve all compiler, linter, runtime, and dependency warnings without suppressing them.
2. **Safe Code Refactoring**: Fix deprecation warnings, unused imports, type mismatches, and component syntax warnings safely while preserving business logic.
3. **Full Pipeline Validation**: Validate all warning fixes with `npm run typecheck` (0 errors), `npm run lint` (0 errors), and unit tests (`npm run test:coverage`) with >= 90% per-file coverage.

## Git Pre-Commit Quality Checks & Hook Standards

1. **Pre-Commit Hook Execution**: Enforce running the full pre-commit check (`npm run pre-commit`) before allowing any commit to proceed. Bypassing hooks is strictly disallowed.
2. **Quality Gate Pipeline**: Ensure all 4 gates succeed:
   - Linting: `npm run lint` (0 errors/warnings)
   - Typechecking: `npm run typecheck` (0 errors)
   - Unit Tests: `npm run test:coverage` (100% pass rate, >= 90% per-file coverage)
   - Production Build: `npm run build`
3. **Commit Blocking**: Abort the commit immediately upon any check failure.

## Declarative UI & Zero Direct DOM Manipulation Standards

1. **Zero Direct DOM Manipulation**: Strictly prohibit low-level DOM manipulation (`document.getElementById`, `document.querySelector`, `document.createElement`, `element.appendChild`, `element.removeChild`, `element.innerHTML`, manual `classList.add/remove`, or jQuery) within the application framework.
2. **Declarative State Management**: Ensure the framework view engine is the sole source of truth. All UI updates, styling, conditional renders, and modal/download workflows must be handled via declarative state and hooks.
3. **Full Pipeline Validation**: Validate all declarative refactors with `npm run typecheck` (0 errors), `npm run lint` (0 errors), and unit tests (`npm run test:coverage`) maintaining >= 90% per-file coverage.

## Performance Budget Enforcement Standards

1. **Client-Side Bundle Budgets**: Strictly limit shared client JavaScript to <= 250 KB gzip and critical CSS to <= 50 KB gzip.
2. **Automated Budget Gate**: Execute `npm run check:budget` in build and pre-commit checks; terminate with error on any budget overrun.
3. **Continuous Splitting**: Dynamically import heavy libraries (e.g. `xlsx`) and off-screen components on demand.
4. **Coverage Mandate**: Maintain >= 90% unit test coverage individually across all performance budget modules.



