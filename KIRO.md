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

## Internationalization (i18n) & `UI_STRINGS` Standards
1. Move all user-facing strings out of components into constants modules exposed through `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`).
2. Avoid hardcoding literal strings and embedded text in JSX/TSX.
3. Use template placeholders / parameterized functions for dynamic runtime values.
4. Update unit tests to assert against `UI_STRINGS` constants instead of literal strings.
5. Ensure >= 90% per-file unit test code coverage across all files.

## Separate Constants File Configuration
- Maintain all application constants, defaults, lookup tables, and palettes in separate files under `constants/`.
- Prohibit inline magic numbers or hardcoded configuration dictionaries in components, services, or controllers.
- Group constants logically by domain (`app.ts`, `currency.ts`, `pipeline.ts`, `logger.ts`) and export via `constants/index.ts`.
- Maintain >= 90% unit test coverage for all constants files.

## Separate Data Types & Interfaces Configuration
- Store all TypeScript types, interfaces, enums, and type aliases in separate files under `types/`.
- Prohibit declaring `interface` or `type` definitions directly within component files (`.tsx`), controller files, or services.
- Extract all component and modal prop interfaces into dedicated type files (e.g., `types/components.ts`) and import them.
- Re-export all types via `types/index.ts`.

## Input Schema Validation Architecture
- Enforce strict input validation across all user and system inputs (forms, modals, API routes, controller bodies, query parameters, headers).
- Define all validation schemas in dedicated constants modules under `constants/` (`frontend/src/constants/validation.ts` and `backend/src/constants/validation.ts`).
- Never declare validation schemas inline.
- Maintain derived types in `types/validation.ts` re-exported via `types/index.ts`.
- Reject invalid inputs immediately with HTTP 400 Bad Request.
- Maintain >= 90% unit test coverage for all validation schemas and utilities.

## Comprehensive & Descriptive UI Error Messaging
- Implement user-facing error messages with actionable context and specific failure details across error categories (`VALIDATION_ERROR`, `NETWORK_ERROR`, `AUTH_ERROR`, `NOT_FOUND_ERROR`, `CONFLICT_ERROR`, `SERVER_ERROR`, `RATE_LIMIT_ERROR`).
- Prohibit generic error messages.
- Centralize all error strings in `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`).
- Keep error constants in `constants/` and error types in `types/`.
- Log all UI errors with context and `requestId` via `frontend/src/utils/logger.ts`.
- Ensure >= 90% per-file unit test coverage across all error components and utilities.

## Database Optimization & GraphQL Integration
- Audit database queries for execution duration and row count. Trigger warning logs for queries exceeding `SLOW_QUERY_THRESHOLD_MS` (100ms).
- Minimize database compute hours by implementing query caching with TTL for stable reads with mutation-driven cache invalidation.
- Optimize Prisma schema with database indexes to prevent full-table scans.
- Integrate GraphQL (`/api/graphql`) to streamline data fetching, enabling single round-trip dashboard queries.
- Isolate GraphQL schema SDL and queries in `constants/graphql.ts` and `constants/db.ts`, and types in `types/graphql.ts` and `types/db.ts`.
- Ensure >= 90% per-file unit test coverage across all database and GraphQL modules.

## AES Encryption & Data Protection
- Protect sensitive data at rest and in transit using authenticated AES-256-GCM.
- Generate cryptographically secure 12-byte IVs per operation and strictly verify 16-byte authentication tags on decryption.
- Manage 256-bit keys via secure environment variables or PBKDF2/SHA-256 key derivation.
- Isolate constants in `constants/crypto.ts` and types in `types/crypto.ts`. Never log plaintext keys.
- Enforce >= 90% per-file unit test code coverage across all cryptographic modules.

## Automated Tech Stack & Libraries Upgrade Policy
- Automatically identify, audit, upgrade, and maintain core tech stack components, runtime environments, framework dependencies, and third-party libraries to latest LTS or stable versions.
- Systematically refactor breaking changes, deprecation notices, and updated library APIs across the codebase.
- Validate all upgrades through the complete quality check pipeline:
  1. Production build (`npm run build`).
  2. Typechecking with 0 errors (`npm run typecheck`).
  3. Linting with 0 errors (`npm run lint`).
  4. Unit tests and >= 90% per-file code coverage (`npm run test:coverage`).
- Prevent regressions by ensuring all quality gates and test suites pass completely.

