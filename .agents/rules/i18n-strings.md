# Internationalization (i18n) & UI_STRINGS Standards

## 1. Zero Hardcoded User-Facing Literals
- No user-facing strings, button labels, modal titles, error/alert messages, table headers, or static descriptions may be hardcoded or embedded directly in components or JSX/TSX.
- All user-facing text must be imported and referenced from `UI_STRINGS` in `frontend/src/constants/uiStrings.ts`.

## 2. Centralized Structure
- Organize strings logically by module:
  - `common`: Reusable action labels (`save`, `cancel`, `close`, `loading`, `export`).
  - `header`: Header titles, document references, author info, SLAs, theme toggles, currency codes.
  - `pipeline`: Navigation stages, tabs, pipeline progression statuses.
  - `schema`: Database schema viewer labels, entity DDL tabs, preview controls.
  - `module1`: Ingestion queue, upload cards, validation error tables, blanket fixes, breakdown tabs.
  - `module2`: Taxonomy trees, AI categorization confidence, reassign workflows, core buckets.
  - `module3`: Volatility indices, vendor rankings, price creep analytics.
  - `module4`: Savings engine, opportunity deployments (ProCPX / DPS NXT), ROI metrics.
  - `module5`: Conversion matrix, lock-in simulator, executive export actions.
  - `modals`: All modal dialogs and interactive popups.

## 3. Template Placeholders for Dynamic Runtime Substitution
- Whenever a string includes runtime variables (e.g. record counts, IDs, amounts, percentages, currencies, dates):
  - Implement a parameterized formatter function inside `UI_STRINGS` (e.g., `recordsProcessed: (count: number) => \`\${count} records processed\``).
  - Never concatenate hardcoded string fragments with runtime variables inside component JSX.

## 4. Test Assertions Against Constants
- All unit tests (`tests/**/*.test.tsx`, `tests/**/*.test.ts`) MUST assert against `UI_STRINGS` constants (e.g. `expect(screen.getByText(UI_STRINGS.header.brand)).toBeInTheDocument()`).
- This guarantees tests remain robust, resilient, and non-brittle during UI redesigns and translations.

## 5. Strict 90% Code Coverage
- All constants files, formatter helpers, and modified components must maintain >= 90% unit test code coverage individually across statements, branches, functions, and lines.
