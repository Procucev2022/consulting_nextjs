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
