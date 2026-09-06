# Mandatory Input Schema Validation Standards

## 1. Strict Boundary Validation
- **Mandatory Everywhere**: Whenever modifying or introducing code that touches user or system inputs, comprehensive input schema validation is MANDATORY.
- **Scope**:
  - **Frontend User Inputs**: Forms, modals, selection triggers, sliders, and filters.
  - **Frontend API Client**: Outgoing payloads must validate against schemas prior to network transmission.
  - **Backend API Routes & Controllers**: `req.body`, `req.query`, `req.params`, and `req.headers`.

## 2. Dedicated Constants Modules
- **No Inline Schemas**: All validation schemas MUST be defined in dedicated constants modules under `constants/` (`frontend/src/constants/validation.ts` and `backend/src/constants/validation.ts`).
- **Single Source of Truth**: Schemas serve as the single source of truth for runtime data integrity.
- **Unified Barrel Exports**: Re-export all validation schemas via `constants/index.ts`.

## 3. Dedicated Data Types & Interfaces
- **No Inline Types**: Inferred types (`z.infer<typeof schema>`) must reside in dedicated type files under `types/` (`frontend/src/types/validation.ts` and `backend/src/types/validation.ts`).
- **Unified Barrel Exports**: Re-export all validation types via `types/index.ts`.

## 4. Fail-Fast Error Handling & Standardized Responses
- **Immediate Rejection**: Invalid backend requests must be rejected immediately with HTTP 400 Bad Request and structured error payloads (`{ success: false, message: 'Validation failed', errors }`) before running business or database logic.
- **Structured Logging**: Log validation errors using the centralized structured logger with appropriate context.

## 5. Strict 90% Unit Test Code Coverage
- Every validation schema, validation middleware, and utility function must achieve >= 90% unit test coverage individually across statements, branches, functions, and lines (`perFile: true`).
