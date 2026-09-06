# Separate Constants & Separate Data Types/Interfaces Standards

## 1. Separate Constants Architecture
- **Mandatory Location**: All application constants (configuration defaults, mathematical constants, financial parameters, benchmark thresholds, FX rates, palettes, lookup tables) MUST reside in dedicated constants files within `constants/` (`frontend/src/constants/` and `backend/src/constants/`).
- **No Inline Constants**: Never inline magic numbers, configuration objects, or constant lookup tables directly in components, services, controllers, or route handlers.
- **Domain Grouping**: Group constants logically by domain (`app.ts`, `currency.ts`, `pipeline.ts`, `logger.ts`, `modals.ts`) and export them via a unified barrel export (`constants/index.ts`).
- **Test Assertions**: All tests should assert against exported constants instead of duplicating literal values.

## 2. Separate Data Types & Interfaces Architecture
- **Mandatory Location**: All TypeScript types, interfaces, enums, and type aliases (including domain models, component & modal props, API payloads, and service options) MUST reside in dedicated type definition files within `types/` (`frontend/src/types/` and `backend/src/types/`).
- **No Inline Types/Interfaces**: Declaring `interface` or `type` definitions directly within component files (`.tsx`), controller files, route definitions, or utility files is strictly prohibited.
- **Component Props Separation**: Component and modal prop interfaces (e.g., `HeaderProps`, `PipelineBarProps`, `ClientIngestionSetupModalProps`) must be extracted into dedicated type files (`types/components.ts`) and imported into component files.
- **Unified Barrel Exports**: Centralize and re-export all types via `types/index.ts` for clean, modular imports.

## 3. Strict 90% Unit Test Code Coverage
- Every constants module and utility function must maintain at least 90% unit test coverage individually across statements, branches, functions, and lines (`perFile: true`).
