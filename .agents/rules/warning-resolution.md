# Mandatory Automated Warning Resolution & Zero-Warning Policy

## 1. Zero-Warning Mandate & Proactive Auditing
- Continuously audit, identify, and resolve all compiler, linter, runtime, framework, and dependency warnings across frontend and backend services.
- Never treat warnings as benign or ignore diagnostics. All warnings must be proactively addressed and resolved at their root cause.

## 2. Safe Refactoring Protocols
- **Deprecation Notices**: Systematically refactor deprecated library APIs and framework patterns to current, stable standards. Never suppress deprecation warnings with arbitrary disable comments or ignore flags.
- **Unused Imports & Dead Code**: Automatically remove unused imports, dead variables, redundant type parameters, and orphaned functions.
- **Type Mismatches & Ambiguity**: Eliminate `any` types and loose type assertions by declaring explicit, strongly-typed interfaces in `types/`.
- **Syntax & Markup Warnings**: Resolve missing React `key` props, invalid HTML nesting, unescaped entities, and DOM attribute discrepancies in TSX/JSX.
- **Preserve Behavior**: Refactoring must never alter business logic, user experience, validation rules, or backward-compatible API contracts.

## 3. Mandatory Quality Check Pipeline Validation
Every warning fix must pass the complete end-to-end quality validation pipeline:
1. **Typechecking**: `npm run typecheck` with 0 type errors and 0 compiler warnings.
2. **Linting**: `npm run lint` with 0 ESLint errors and 0 warnings.
3. **Production Build**: `npm run build` with clean bundling and 0 build-time warnings.
4. **Unit Tests & 90% Per-File Coverage**: Full test execution via `npm run test:coverage` with 100% test pass rate, 0 runtime console warnings, and >= 90% individual per-file code coverage across statements, branches, functions, and lines (`perFile: true`).
