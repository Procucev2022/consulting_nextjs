# Mandatory Comprehensive & Descriptive UI Error Messaging Policy

## 1. Actionable Context & Specific Failure Details
- **No Generic Error Messages**: Vague, opaque error messages (e.g. "An error occurred", "Something went wrong", "Request failed", "Operation error") are strictly prohibited in user interfaces, forms, modals, banners, and toast notifications.
- **Three Essential Pillars**:
  1. **Clear Problem Description**: State exactly what user action or system operation failed.
  2. **Specific Failure Cause**: Specify why the operation failed, including violated rules, rejected fields, invalid values, status codes, or subsystem unavailability.
  3. **Actionable Resolution / Next Steps**: Provide concrete next steps for the user or administrator to resolve the issue (e.g., check network connectivity, adjust field formats, refresh data, or provide Request ID for support).

## 2. Standardized Error Categories
- Classify all errors into explicit categories:
  - `VALIDATION_ERROR`: Field-level or form-level schema violations with specific accepted formats and correction advice.
  - `NETWORK_ERROR`: Connection drops, unreachable servers, or timeouts with automated or manual retry guidance.
  - `AUTH_ERROR`: Expired sessions, insufficient roles, or tenant boundary violations with re-authentication prompts.
  - `NOT_FOUND_ERROR`: Missing or deleted entities with navigation or refresh actions.
  - `CONFLICT_ERROR`: Duplicate entities, concurrency lock issues, or state conflicts with resolution workflows.
  - `SERVER_ERROR`: Internal server/database failures with customer support correlation IDs (`x-request-id`).
  - `RATE_LIMIT_ERROR`: API rate throttling or request quota exhaustion with backoff duration or retry timing.

## 3. Centralized in `UI_STRINGS` & Constants Isolation
- In accordance with internationalization (i18n) and constants policies, ZERO user-facing error strings may be hardcoded inline.
- All error titles, messages, templates, and actionable next steps must be defined in `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`).
- Dynamic runtime parameters must use parameterized formatter functions (e.g., `(field: string, reason: string) => ...`, `(status: number, requestId: string) => ...`).
- Error categories, codes, and default severity levels must reside in dedicated constants files (`constants/errors.ts` or `constants/app.ts`) and re-exported via `constants/index.ts`.

## 4. Structured Error Logging & Correlation
- Log all UI errors through the centralized logger (`frontend/src/utils/logger.ts`) with severity, context, error stacks, and `requestId`.

## 5. Dedicated Types & Interfaces
- Error models, error state interfaces, category types, and UI error component props must reside in dedicated type definition files under `types/` (`types/errors.ts` or `types/components.ts`) and re-exported via `types/index.ts`.

## 6. Strict 90% Unit Test Code Coverage
- Every error formatter, utility function, error constant mapping, and UI error banner/toast component must maintain >= 90% unit test code coverage individually across statements, branches, functions, and lines (`perFile: true`).
