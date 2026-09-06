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

## Mandatory Separate Constants File Configuration

- **Rule**: All application constants (configuration defaults, mathematical constants, static rates, fallback values, KPI thresholds, palettes, lookup tables) MUST reside in dedicated constants files within `constants/` (`frontend/src/constants/` and `backend/src/constants/`).
- **No Inline Constants**: Hardcoding or embedding constant configuration dictionaries, arrays, or magic numbers directly in components, services, controllers, or route handlers is strictly prohibited.
- **Barrel Exports**: Group constants logically by domain and export them through `constants/index.ts`.
- **Strict 90% Coverage**: All constant files and helper functions must maintain >= 90% unit test coverage.

## Mandatory Separate Data Types & Interfaces Configuration

- **Rule**: All TypeScript types, interfaces, enums, and type aliases (including domain models, component & modal props, API payloads, and service signatures) MUST reside in dedicated type definition files within `types/` (`frontend/src/types/` and `backend/src/types/`).
- **No Inline Types/Interfaces**: Declaring `interface` or `type` definitions directly within component files (`.tsx`), controller files, route definitions, or utility files is strictly prohibited.
- **Component Props Separation**: Component and modal prop interfaces must be extracted into dedicated type files (e.g., `types/components.ts`) and imported.
- **Barrel Exports**: Re-export all types via `types/index.ts` for clean, modular imports.

## Mandatory Input Schema Validation

- **Rule**: Whenever any code change touches user or system inputs, comprehensive input schema validation is MANDATORY. This covers frontend forms, modals, API routes, controller bodies (`req.body`), query parameters (`req.query`), and headers (`req.headers`).
- **Constants Isolation**: All validation schemas MUST be defined in dedicated constants modules under `constants/` (`frontend/src/constants/validation.ts` and `backend/src/constants/validation.ts`) and re-exported via `constants/index.ts`. Inline schemas are strictly prohibited.
- **Dedicated Types**: Types derived from schemas (`z.infer<typeof schema>`) must be defined in `types/validation.ts` and re-exported via `types/index.ts`.
- **Fail-Fast Error Handling**: Invalid requests must be rejected immediately with HTTP 400 and structured error details before running business logic.
- **Strict 90% Coverage**: Every validation schema and utility must maintain >= 90% unit test coverage individually.

## Mandatory Comprehensive & Descriptive UI Error Messaging

- **Rule**: All user-facing error messages must present actionable context and specific failure details across different error categories. Generic, vague messages (e.g. "Something went wrong", "Error occurred") are strictly prohibited.
- **Three Pillars of Error Messaging**:
  1. *Clear Problem Description*: Exactly what action failed.
  2. *Specific Failure Cause*: Violated validation rule, rejected field, HTTP status, or subsystem failure.
  3. *Actionable Resolution*: Clear next steps for the user to resolve the issue (e.g. check connection, correct field format, contact support with request ID).
- **Error Categories**: Classify errors into `VALIDATION_ERROR`, `NETWORK_ERROR`, `AUTH_ERROR`, `NOT_FOUND_ERROR`, `CONFLICT_ERROR`, `SERVER_ERROR`, and `RATE_LIMIT_ERROR`.
- **Constants & i18n Centralization**: All error messages and templates must reside in `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`). Zero hardcoded error literals. Error codes and categories must reside in dedicated constants files (`constants/errors.ts` or `constants/app.ts`).
- **Structured Error Logging**: Log all UI errors through the centralized logger (`frontend/src/utils/logger.ts`) with severity, context, error stacks, and `requestId`.
- **Dedicated Types**: All error models, category types, and banner/modal error props must reside in `types/` and be re-exported via `types/index.ts`.
- **Strict 90% Coverage**: All error helpers, formatters, and UI error components must maintain >= 90% unit test coverage individually.

## Mandatory Database Query Optimization & GraphQL Integration

- **Rule**: Audit all database queries for execution efficiency and integrate GraphQL to streamline application-wide data fetching.
- **Query Auditing & Slow Query Warnings**: Record query duration (`durationMs`), operation, and row count. Trigger structured warning logs for queries exceeding `SLOW_QUERY_THRESHOLD_MS` (100ms).
- **Minimizing Compute Hours**: Implement query caching with TTL for stable reads (tenants, taxonomy, categories, rankings) with automatic write invalidation. Enforce projection selection and database indexing in Prisma schema to eliminate full-table scans and minimize database CPU/memory costs.
- **GraphQL Integration**: Provide `/api/graphql` endpoint exposing application queries and mutations. Support composite queries (such as `dashboardOverview`) to fetch multiple domain models in a single network round-trip.
- **Constants & Types Isolation**: Schema definitions and query strings must live in `constants/graphql.ts` and `constants/db.ts`; models and contexts in `types/graphql.ts` and `types/db.ts`.
- **Strict 90% Coverage**: All database auditors, cache helpers, GraphQL resolvers, and route handlers must maintain >= 90% unit test coverage individually.

## Mandatory AES Encryption & Data Protection Policy

- **Standard Cryptographic Primitive (AES-256-GCM)**: All sensitive data at rest and in transit (financial metrics, supplier identifiers, banking information, credentials) must be encrypted using AES-256-GCM.
- **Nonce/IV & Tag Mandates**: Each encryption operation must generate a fresh, cryptographically secure 96-bit (12-byte) initialization vector (`crypto.randomBytes(12)`). Decryption must strictly verify the 128-bit (16-byte) authentication tag. Nonce reuse is strictly forbidden.
- **Key Derivation & Management**: Keys must be 256 bits (32 bytes), sourced securely from environment (`APP_ENCRYPTION_KEY`) or derived via PBKDF2 with SHA-256 (min 100,000 iterations).
- **Constants & Types Isolation**: All cryptographic algorithm strings, key/IV/tag lengths, and encodings must reside in `constants/crypto.ts` and re-exported via `constants/index.ts`. All payload types and options must reside in `types/crypto.ts` and re-exported via `types/index.ts`.
- **Key Safety & Structured Logging**: Plaintext keys, passphrases, and raw secrets must NEVER be logged.
- **Strict 90% Coverage**: All cryptographic utilities, serialization helpers, and endpoints must achieve >= 90% unit test coverage individually.

## Mandatory Automated Tech Stack & Libraries Upgrade Policy

- **Active LTS & Stable Version Tracking**: Automatically identify, audit, upgrade, and maintain all core tech stack components, runtime environments, framework dependencies, and third-party libraries to their latest LTS or stable versions. Run regular dependency audits (`npm outdated`, `npm audit`).
- **Systematic Refactoring of Breaking Changes**: Actively refactor breaking changes, updated library interfaces, and runtime deprecation notices across the entire codebase. Never bypass or suppress deprecation notices.
- **End-to-End Quality Validation**: Validate all upgrades against the complete quality pipeline:
  1. *Production Build*: Successful builds (`npm run build`, `npm run build:frontend`, `npm run build:backend`).
  2. *Typecheck*: 0 TypeScript errors (`npm run typecheck`).
  3. *Linting*: 0 ESLint violations (`npm run lint`).
  4. *Unit Tests & 90% Per-File Coverage*: 100% test passes with >= 90% per-file coverage across statements, branches, functions, and lines (`npm run test:coverage`).
- **Zero Regressions**: Any regressions or coverage drops caused by dependency upgrades must be resolved immediately before finalizing.

## Mandatory Automated Performance Optimization Policy

- **Continuous Codebase Auditing**: Continuously audit and identify latency bottlenecks, redundant computations, and excessive memory usage across backend services and frontend UI.
- **Critical Paths & Code-Splitting**: Optimize critical rendering paths. Implement lazy loading (`next/dynamic`) for heavy components and modals. Optimize render cycles with memoization.
- **Resource Caching**: Enforce caching across data transformations, HTTP endpoints, and database queries with TTL and automated invalidation.
- **Quality Benchmark Validation**: Benchmark and validate bundle footprints and latency metrics against production thresholds (<120 kB shared JS chunks).
- **Strict 90% Coverage**: Maintain >= 90% unit test coverage individually on all performance and caching utilities.

## Mandatory Automated Log Error Monitoring & Resolution Policy

- **Continuous Runtime Log Ingestion**: Continuously monitor and parse structured application log records (`logs/app.log`, `logs/error.log`), extracting error codes, request IDs, and stack traces.
- **Automated Root Cause Diagnosis**: Analyze failure patterns, missing parameters, and runtime exceptions. Proactively implement verified code fixes preventing error recurrence.
- **Quality Check Validation Pipeline**: Validate all bug fixes through linting (`npm run lint`), typechecking (`npm run typecheck`), and full unit test execution (`npm run test:coverage`) with >= 90% per-file code coverage to guarantee zero regressions.

## Mandatory Automated Warning Resolution & Zero-Warning Policy

- **Zero-Warning Tolerance**: Proactively identify, analyze, and resolve all compiler, linter, runtime, and dependency warnings across the monorepo.
- **Safe Refactoring**: Systematically address deprecation notices, unused imports, type mismatches, and syntax warnings without suppressing with comments or breaking functionality.
- **Quality Check Pipeline**: Validate warning resolutions via `npm run typecheck` (0 errors/warnings), `npm run lint` (0 errors/warnings), clean builds, and unit tests (`npm run test:coverage`) maintaining >= 90% per-file code coverage.

