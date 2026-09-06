# Mandatory Automated Tech Stack, Runtime & Dependency Upgrade Policy

## 1. Proactive LTS & Stable Version Maintenance
- **Continuous Lifecycle Auditing**: Automatically identify, audit, upgrade, and maintain all core tech stack components, runtime environments, framework dependencies, and third-party libraries to their latest Long-Term Support (LTS) or active stable releases.
- **Target Runtimes & Core Frameworks**:
  - Runtime: Node.js active LTS releases (e.g. Node 20/22 LTS).
  - Frameworks: Next.js (App Router), React, Express.
  - Database & ORM: PostgreSQL, Prisma ORM.
  - Test Harnesses: Vitest, @testing-library/react, @vitest/coverage-v8.
- **Dependency Audits**: Regularly run `npm outdated` and `npm audit` to detect outdated packages, abandoned dependencies, and security advisories. Keep lockfiles (`package-lock.json`) consistent and reproducible.

## 2. Systematic Refactoring of Breaking Changes & Deprecations
- **Zero Ignored Deprecations**: Whenever a dependency, runtime, or framework is upgraded, systematically inspect, address, and refactor all breaking changes, updated library APIs, and deprecation notices across the codebase.
- **Modern Syntax & Best Practices**:
  - Migrate legacy configuration files and options (e.g., Next.js configurations, ESLint flat config migrations).
  - Adopt modern framework patterns (React concurrent mode, modern hook guidelines, server/client component boundaries).
  - Update ORM queries and connection pool APIs to latest stable patterns.
  - Refactor deprecated third-party helper functions to current, supported APIs.
- **Prohibit Workaround Suppressions**: Never suppress deprecation warnings with hacky workarounds, ignore compiler diagnostics, or disable lint rules arbitrarily. Call sites must be refactored cleanly.

## 3. Mandatory Quality Gate Validation Pipeline
Every dependency upgrade or tech stack modification must pass the complete end-to-end quality validation pipeline before approval:
1. **Production Build**: Clean execution of `npm run build` (`build:frontend` and `build:backend`) with zero fatal bundling or compilation errors.
2. **Typechecking**: Strict TypeScript verification (`npm run typecheck` / `tsc --noEmit`) with 0 errors across all workspaces.
3. **Linting**: Clean ESLint execution (`npm run lint`) with 0 errors.
4. **Unit Tests & 90% Per-File Code Coverage**: Full test suite execution (`npm run test:coverage`) with 100% test pass rate and >= 90% code coverage across statements, branches, functions, and lines individually (`perFile: true`).

## 4. Zero Regression Principle
- Any library upgrade that introduces breaking runtime behavior, peer dependency conflicts, performance degradation, or drops code coverage below the 90% threshold must be systematically diagnosed and fixed.
- Upgrades must never be merged until all quality checks, regression tests, and coverage benchmarks succeed.
