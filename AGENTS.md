# AI Coding Agents Instructions & Quality Standards

This document applies to all AI coding assistants (including Antigravity, Cursor, Claude Code, GitHub Copilot / OpenAI Codex, Kiro, and others) working in this repository.

## 1. 90% Unit Test Code Coverage Benchmark (Strict, Per-File)

- **Threshold**: Every single source file MUST maintain at least **90% unit test code coverage** individually across:
  - **Statements**: >= 90%
  - **Branches**: >= 90%
  - **Functions**: >= 90%
  - **Lines**: >= 90%
- **Error on Failure**: The test runner is explicitly configured with `perFile: true` and strict 90% thresholds. If any file drops below 90% in any category, it will throw an error and abort.
- **Do Not Skip Any File**: You may not skip or exclude any production code file.

## 2. Mandatory Workflow Whenever Modifying Code

Whenever you make any change to the codebase (feature, fix, refactor, or optimization):
1. **Write or Update Corresponding Unit Tests**: Ensure all execution branches, happy paths, and edge/error cases are exercised.
2. **Execute Coverage Check**:
   ```bash
   npm run test:coverage
   ```
   Or for specific services:
   ```bash
   npm --prefix backend run test:coverage
   npm --prefix frontend run test:coverage
   ```
3. **Verify the Per-File Output**: Confirm that every file satisfies the >= 90% requirement. Do not terminate your response until all tests pass and coverage benchmarks are satisfied.

## 3. Global Test Timeout

- A global timeout of **10,000 ms** (`10s`) is enforced across all unit test configurations (`testTimeout: 10000`).
- Ensure all mocks, timers, and async calls complete quickly and clean up properly in teardown hooks (`afterEach`, `afterAll`).

## 4. Mandatory Structured & Centralized Logging System

- **Zero Raw Console Calls**: Never use `console.log`, `console.warn`, or `console.error` in production code. Always use the centralized logger (`backend/src/utils/logger.ts` or `frontend/src/utils/logger.ts`).
- **Structured JSON Schema**: All log records must follow a structured schema:
  - `timestamp`: ISO-8601 UTC timestamp.
  - `level`: `debug`, `info`, `warn`, `error`.
  - `service`: Identifies the originating service (`consulting-backend`, `consulting-frontend`).
  - `message`: Concise human-readable message.
  - `context`: Structured key-value object containing contextual details (e.g., `tenantId`, `action`, `method`, `path`, `statusCode`, `durationMs`).
  - `requestId`: Correlation ID propagated from `x-request-id` header to track requests end-to-end.
  - `error`: Serialized error object (`name`, `message`, `stack`) for any caught or uncaught exceptions.
- **Log Levels**:
  - `DEBUG`: Fine-grained diagnostic information for troubleshooting.
  - `INFO`: State changes, lifecycle events, successful operations, transactions.
  - `WARN`: Recoverable degradation, fallback activations, deprecated usage.
  - `ERROR`: Unhandled exceptions, failed requests, database connection failures, critical issues with full stack trace.
- **Local File System Persistence**:
  - In local environments (`NODE_ENV !== 'production'` or when local storage is configured), all logs must be persisted to the local file system (`logs/app.log`, `logs/error.log`, and daily rotated `logs/app-YYYY-MM-DD.log`).
- **Storage Management & Automatic Purging (Compliance)**:
  - An automated purging engine must run at startup and periodic intervals to delete log files older than the retention threshold (`LOG_RETENTION_DAYS`, default 14 days) to prevent disk exhaustion and ensure compliance.
- **Application-Wide Application**:
  - Every new or modified API route, controller, service, database transaction, and error handler MUST include detailed structured logging with appropriate context.

## 5. CI/CD Pipeline & Pull Request Quality Standards

- **Pull Request Automation**: A dedicated CI/CD workflow (`.github/workflows/ci.yml`) must run on every pull request against `main`, `master`, and `develop` branches.
- **Mandatory Quality Gates**: The PR pipeline must strictly validate:
  1. **Linting**: No ESLint or code style violations across frontend or backend.
  2. **Typechecking**: Strict TypeScript compilation (`tsc --noEmit`) with 0 type errors.
  3. **Building**: Clean production builds for both services (`backend` and `frontend`).
  4. **Unit Tests & 90% Per-File Coverage**: All unit tests must pass with >= 90% coverage across statements, branches, functions, and lines individually.
- **Mandatory Pipeline Timeout**: Every GitHub Actions CI/CD job must enforce an explicit timeout (e.g., `timeout-minutes: 15`) to prevent runaway resource consumption.
- **Automated PR Summary Comments**: The pipeline must generate and post/update an executive summary comment on the PR detailing test passes/failures, execution duration, and per-file/overall code coverage metrics.

## 6. User Prompt History Maintenance (`prompts.md`)

- **Requirement**: Maintain a file in the workspace root named `prompts.md` dedicated to recording user-provided prompts.
- **Strict Scope**: Save ONLY user-provided prompts in `prompts.md`. Do NOT include AI-generated conversations, responses, explanations, reasoning, or model output.
- **Workflow**: Whenever the user submits a new prompt, append the user's prompt text to `prompts.md` under chronological headers (e.g., `## Prompt <N>`). Preserve the exact text provided by the user.

## 7. Mandatory Internationalization (i18n) & Centralized `UI_STRINGS` Policy

- **Zero Hardcoded User-Facing Literals**: No user-facing strings, button labels, modal titles, error/alert messages, table headers, or static descriptions may be hardcoded or embedded directly in components or JSX/TSX.
- **Centralized `UI_STRINGS` Object**: All user-facing strings must reside in dedicated constants modules and be exposed through a unified, strongly typed `UI_STRINGS` object (`frontend/src/constants/uiStrings.ts`).
- **Template Placeholders for Runtime Substitution**: For dynamic strings containing runtime variables (e.g., counts, IDs, amounts, currencies, user names), use template placeholders / parameterized formatter functions within `UI_STRINGS` (e.g., `(count: number) => \`\${count} items\``) to ensure the application is fully i18n-ready.
- **Test Assertions Against Constants**: All unit tests MUST assert against `UI_STRINGS` constants instead of hardcoded literal strings. This prevents brittle test failures when UI text or localization translations change.
- **Strict 90% Code Coverage**: Any new constants, helper functions, and components created for i18n must maintain >= 90% unit test code coverage individually.

## 8. Separate Constants File Configuration

- **Mandatory Isolation**: All application constants (including configuration defaults, numerical thresholds, KPI metrics, conversion rates, palettes, lookup tables, and environment fallbacks) MUST be stored in dedicated constants files within `constants/` (e.g., `frontend/src/constants/` or `backend/src/constants/`).
- **No Inline Constants or Magic Numbers**: No constant objects, configuration arrays, or magic values may be declared directly inside components, services, controllers, or route handlers.
- **Organization & Barrel Exports**: Group constants logically by domain (e.g., `app.ts`, `currency.ts`, `pipeline.ts`, `logger.ts`) and expose them via a unified barrel export (`constants/index.ts`).
- **Strict 90% Code Coverage**: Any new constant definitions or helper utility functions created for constants must achieve >= 90% unit test code coverage individually.

## 9. Separate Data Types & Interfaces Configuration

- **Mandatory Isolation**: All TypeScript data types, interfaces, enums, and type aliases (including domain models, component and modal prop types, API request/response payloads, and service options) MUST be kept in dedicated files within `types/` (e.g., `frontend/src/types/` or `backend/src/types/`).
- **No Inline Type or Interface Declarations**: Declaring `interface` or `type` definitions directly within component files (`.tsx`), controller files, route definitions, or utility files is strictly prohibited.
- **Component & Modal Props Separation**: Component and modal prop interfaces (e.g., `HeaderProps`, `PipelineBarProps`, `ClientIngestionSetupModalProps`) must reside in dedicated type definition files (e.g., `types/components.ts` or `types/modals.ts`) and be imported where needed.
- **Unified Barrel Exports**: Centralize and re-export all types via `types/index.ts` so imports remain clean and maintainable.

## 10. Mandatory Input Schema Validation Architecture

- **Strict Input Validation Across All Boundaries**: Whenever any code change touches user or system inputs, comprehensive input schema validation is MANDATORY. This applies without exception to:
  - Frontend forms, modals, inputs, and state manipulation triggers.
  - Outgoing frontend API requests.
  - Backend API routes and controllers: `req.body`, `req.query`, `req.params`, and `req.headers`.
- **Single Source of Truth in Dedicated Constants**:
  - All validation schemas MUST be defined in dedicated constants modules under `constants/` (`frontend/src/constants/validation.ts` and `backend/src/constants/validation.ts`).
  - Validation schemas must NEVER be declared inline within route handlers, controller bodies, components, or modals.
  - Re-export all validation schemas via the centralized barrel export (`constants/index.ts`).
- **Separation of Types Inferred from Schemas**:
  - TypeScript types derived from schemas (e.g., `z.infer<typeof schema>`) must reside in dedicated type files under `types/` (`types/validation.ts`) and re-exported via `types/index.ts`.
- **Fail-Fast Error Handling & Standardized Responses**:
  - Invalid backend inputs must immediately be rejected with HTTP 400 Bad Request containing structured validation errors (`{ success: false, message: 'Validation failed', errors }`) before reaching domain or database logic.
  - Detailed error logs must be recorded with structured metadata using the centralized logger.
- **Strict 90% Unit Test Code Coverage**:
  - Every validation schema, validation middleware, and utility function must achieve >= 90% unit test code coverage individually across statements, branches, functions, and lines.

## 11. Comprehensive and Descriptive UI Error Messaging Policy

- **Mandatory Actionable Context & Specific Failure Details**:
  - Generic, opaque, or unhelpful error messages (e.g., "An error occurred", "Something went wrong", "Request failed", "Operation error") are strictly prohibited in any user-facing interface, modal, alert banner, toast notification, or form helper.
  - Every user-facing error message MUST provide three essential components:
    1. **Clear Problem Description**: State precisely what user action or system operation failed.
    2. **Specific Failure Details & Cause**: Specify why the operation failed, including violated constraints, missing parameters, rejected fields, HTTP status codes, or subsystem unavailability.
    3. **Actionable Resolution / Next Steps**: Provide concrete, actionable instructions guiding the user or administrator on how to resolve the issue (e.g., verifying network connectivity, adjusting specific field inputs, checking file format, or quoting the Request Correlation ID for support).
- **Categorized Error Architecture**:
  - All errors must be classified into well-defined error categories with tailored user-facing messaging:
    - `VALIDATION_ERROR`: Specific invalid input field(s), accepted formats/ranges, and concrete correction guidance.
    - `NETWORK_ERROR`: Connection drops, offline state, or network timeouts, advising retry procedures.
    - `AUTH_ERROR`: Expired sessions, insufficient role permissions, or tenant access denials with re-authentication options.
    - `NOT_FOUND_ERROR`: Missing or deleted entities/records with navigation or refresh options.
    - `CONFLICT_ERROR`: Duplicate identifier conflicts, concurrency lock issues, or invalid state transitions with remediation guidance.
    - `SERVER_ERROR`: Upstream server/database failures with a customer-facing support reference (`x-request-id`) for traceability.
    - `RATE_LIMIT_ERROR`: API rate throttling or request quota exhaustion with backoff duration or retry timing.
- **Centralized in `UI_STRINGS` & Constants Isolation**:
  - In accordance with Section 7 (i18n) and Section 8 (Constants), ZERO user-facing error messages may be hardcoded as string literals in components or JSX.
  - All error titles, descriptive body messages, actionable next-step instructions, and field-level validation messages must be defined in the centralized `UI_STRINGS` object (`frontend/src/constants/uiStrings.ts`).
  - Use parameterized template functions within `UI_STRINGS` for dynamic error details (e.g., `(field: string, reason: string) => ...`, `(statusCode: number, requestId: string) => ...`).
  - Error category constants, error codes, and default severity levels must reside in dedicated constants files (`constants/errors.ts` or `constants/app.ts`) and re-exported via `constants/index.ts`.
- **Structured Error Logging & Correlation**:
  - Whenever an error is displayed to the user or handled in the UI, it must be recorded using the centralized logger (`frontend/src/utils/logger.ts`) with appropriate severity (`warn` or `error`), capturing the error category, human-readable user message, underlying error stack, and correlation `requestId`.
- **Strict Data Types Isolation**:
  - In accordance with Section 9 (Types & Interfaces), all error models, error state interfaces, category types, and UI error component props must reside in dedicated type definition files under `types/` (`types/errors.ts` or `types/components.ts`) and re-exported via `types/index.ts`.
- **Strict 90% Unit Test Code Coverage**:
  - All error handling utilities, error formatters, error banner/toast components, and error constant mappings must achieve >= 90% unit test code coverage individually across statements, branches, functions, and lines.

## 12. Database Optimization, Compute Hour Reduction & GraphQL Integration Policy

- **Mandatory Database Query Auditing**:
  - Every database query, ORM operation, and data retrieval routine MUST be audited for execution efficiency.
  - Track query execution duration (`durationMs`), operation type, model name, cache status (hit/miss), and affected rows.
  - Queries exceeding the configured execution threshold (`SLOW_QUERY_THRESHOLD_MS`, default 100ms) MUST trigger structured warning logs through the centralized logger, including query context and duration for diagnosis.
  - Provide runtime query metrics aggregation (total queries, cache hit ratio, slow queries count, average duration) accessible for system observability.
- **Minimizing Database Compute Hours & Resource Usage**:
  - Implement query-level caching with TTL (`DEFAULT_CACHE_TTL_MS`) for read-heavy, low-churn datasets (e.g., tenant configurations, taxonomy trees, spend categories, benchmark profiles) to eliminate redundant database round trips and drastically minimize cloud database compute hours.
  - Enforce automated cache invalidation upon write mutations (e.g., updates, file ingestions, record fixes, supplier merges, opportunity deployments).
  - Use selective projection (`select`) rather than full entity scans, and ensure all high-frequency query filters, foreign keys, and status columns are backed by composite or single-column database indexes in Prisma schema to avoid costly table scans.
  - Implement connection pooling controls and connection reuse to minimize connection handshake compute overhead.
- **GraphQL Integration for Streamlined Data Fetching**:
  - Integrate a unified GraphQL API (`/api/graphql`) exposing queries and mutations for application datasets.
  - Provide composite queries (e.g., `dashboardOverview`) to fetch multiple domain datasets (tenants, ingestion queue, validation records, spend categories, supplier rankings, savings opportunities, conversion stages) in a SINGLE network round-trip, eliminating client-side HTTP request waterfalls and connection contention.
  - Enforce strict input and query schema validation, structured error reporting, and performance profiling on all GraphQL operations.
- **Dedicated Constants & Data Types Isolation**:
  - In accordance with Section 8 (Constants) and Section 9 (Types), all GraphQL schema SDL definitions, query strings, threshold constants, and cache keys MUST reside in dedicated constants files (`constants/graphql.ts`, `constants/db.ts`).
  - All GraphQL contexts, resolver types, audit log interfaces, and response types MUST reside in dedicated type files (`types/graphql.ts`, `types/db.ts`).
- **Strict 90% Unit Test Code Coverage**:
  - All database query auditors, cache managers, GraphQL resolvers, query constants, and GraphQL HTTP route handlers MUST maintain >= 90% unit test code coverage individually across statements, branches, functions, and lines.

## 13. Mandatory AES Encryption & Secure Data Processing Policy

- **Standard Cryptographic Primitive (AES-256-GCM)**:
  - All sensitive data at rest and in transit (including financial amounts, banking details, credentials, tax identifiers, and confidential procurement metadata) MUST be protected using the **AES-256-GCM** (Galois/Counter Mode) encryption algorithm.
  - AES-GCM provides Authenticated Encryption with Associated Data (AEAD), guaranteeing both high-grade confidentiality and cryptographically verifiable authenticity and integrity.
- **Cryptographic Parameter & Nonce/IV Mandates**:
  - **Key Length**: 256 bits (32 bytes). Keys must be sourced securely from environment configuration (`APP_ENCRYPTION_KEY`) or derived using standard key derivation functions (PBKDF2 with SHA-256 or Scrypt, min 100,000 iterations).
  - **Initialization Vector (IV)**: MUST be a cryptographically secure, randomly generated 96-bit (12-byte) nonce generated fresh for EVERY encryption operation (`crypto.randomBytes(12)` in Node.js or `crypto.getRandomValues` in browser). Nonce reuse with the same key is strictly prohibited.
  - **Authentication Tag**: MUST be a 128-bit (16-byte) authentication tag verified upon every decryption operation. Any modification or tampering with the ciphertext or tag must result in immediate decryption failure and security logging.
- **Structured Encrypted Payload Standard**:
  - Encrypted records must use a standardized payload representation containing:
    - `algorithm`: The encryption algorithm identifier (`aes-256-gcm`).
    - `iv`: Hex or Base64 encoded 12-byte initialization vector.
    - `tag`: Hex or Base64 encoded 16-byte authentication tag.
    - `ciphertext`: Hex or Base64 encoded encrypted payload.
    - `salt`: Optional hex or Base64 salt when key derivation is employed.
  - Compact serialization follows the format: `aes256gcm:<iv>:<tag>:<ciphertext>`.
- **Dedicated Constants & Data Types Isolation**:
  - In accordance with Section 8 (Constants) and Section 9 (Types), all cryptographic algorithm names, key/IV/tag lengths, iterations, and encoding defaults MUST reside in dedicated constants files (`constants/crypto.ts`) and re-exported via `constants/index.ts`. Inline cryptographic parameters or magic numbers are strictly forbidden.
  - All encrypted data interfaces, payload schemas, and crypto options MUST reside in dedicated type files (`types/crypto.ts`) and re-exported via `types/index.ts`.
- **Structured Logging & Key Safety**:
  - Plaintext encryption keys, passphrases, and raw secrets MUST NEVER be logged. Centralized logger records must capture operation duration, algorithm, and payload identifier without exposing sensitive plaintext data.
- **Strict 90% Unit Test Code Coverage**:
  - Every cryptographic utility function, encryption/decryption helper, serialization routine, constant definition, and controller endpoint MUST maintain at least **90% unit test code coverage** individually across statements, branches, functions, and lines.

## 14. Mandatory Automated Tech Stack, Runtime & Dependency Upgrade Policy

- **Proactive LTS & Stable Version Maintenance**:
  - Automatically identify, audit, upgrade, and maintain all core tech stack components, runtime environments, framework dependencies, and third-party libraries to their latest Long-Term Support (LTS) or active stable releases.
  - Target Node.js active LTS, modern framework versions (Next.js, Express, React), database tools (Prisma ORM), testing frameworks (Vitest, Testing Library), and cryptographic/utility dependencies.
  - Regularly execute dependency audits (`npm outdated`, `npm audit`, Dependabot/Renovate configurations) to eliminate unmaintained packages, outdated APIs, and security vulnerabilities.
- **Systematic Refactoring of Breaking Changes & Deprecations**:
  - Whenever dependencies, runtimes, or frameworks are upgraded, systematically inspect, address, and refactor all breaking changes, updated library APIs, and deprecation notices across the entire codebase:
    - Framework routing, data-fetching, and compiler configurations (e.g., Next.js App Router patterns, ESLint CLI migrations).
    - React component lifecycle, hook dependencies, and concurrent rendering paradigms.
    - Database ORM schema definitions, migration hooks, and connection management.
    - Upstream library interface updates and cryptographic algorithm standardizations.
  - Suppressing deprecation notices with ad-hoc workarounds or ignoring compiler diagnostics is strictly prohibited. All call sites must be modernized to adhere to current library standards.
- **Rigorous Quality Gate Validation Pipeline**:
  - Every upgrade—whether a major framework bump, runtime upgrade, or minor patch update—must be rigorously validated through the complete end-to-end quality check pipeline before acceptance:
    1. **Production Build**: Execute clean production builds (`npm run build`, `npm run build:frontend`, `npm run build:backend`) without fatal compiler or bundling errors.
    2. **Strict Typechecking**: Complete TypeScript compilation (`npm run typecheck` / `tsc --noEmit`) with 0 type errors across both backend and frontend services.
    3. **Linting & Code Style**: Zero ESLint or code style violations (`npm run lint`).
    4. **Unit Tests & 90% Per-File Code Coverage**: Execute the full test suite (`npm run test:coverage`) ensuring that 100% of test suites pass and every single source file maintains >= 90% code coverage individually across statements, branches, functions, and lines (`perFile: true`).
- **Zero Regression Principle**:
  - If any library upgrade introduces regressions, test failures, or coverage drops, the assistant must systematically resolve the discrepancies through code refactoring, test suite updates, and type adjustments until all automated quality gates pass.



