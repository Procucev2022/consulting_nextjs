# Mandatory Quality Check Configuration & Execution Policy

## 1. Post-Change Quality Verification Mandate
- After EVERY change to the codebase, all AI coding assistants (including Antigravity, Kiro, GitHub Copilot / Codex, Claude Code, Cursor, and others) MUST execute the appropriate quality check commands to verify:
  1. **Zero Build Errors**: Clean production builds across all workspace packages (`npm run build`).
  2. **Strict Unit Test Code Coverage**: 100% test pass rate with >= 90% per-file unit test code coverage individually across statements, branches, functions, and lines (`npm run test:coverage`).
  3. **Zero Typecheck Errors**: Strict TypeScript compilation with 0 compiler errors (`npm run typecheck`).
  4. **Zero Lint Violations**: Clean ESLint evaluation with 0 errors and 0 warnings (`npm run lint`).
  5. **Database Schema Synchronization**: Apply and verify any pending Prisma schema migrations (`npm run db:push`).
  6. **Performance Budget Compliance**: Client-side bundle size within limits (<=250 KB JS, <=50 KB CSS via `npm run check:budget`).

## 2. Strict Execution Priority: Build & Unit Test Coverage Checked FIRST
- The quality check pipeline must strictly evaluate **Build and Unit Test Code Coverage FIRST** before running typechecking, linting, database migrations, or performance checks:
  ```bash
  npm run build && npm run test:coverage && npm run typecheck && npm run lint && npm run db:push && npm run check:budget
  ```
- If a build fails or test coverage drops below 90% on any file, the pipeline must immediately fail-fast, preventing subsequent checks until core build and test integrity is restored.

## 3. Global Multi-Project Workspace Commands
- For workspaces with multiple projects (such as `backend` and `frontend`), coding assistants MUST use unified global commands in the root workspace to validate all projects simultaneously:
  - `npm run quality` (or alias `npm run check:all`): Full global quality check pipeline.
  - `npm run pre-commit`: Git pre-commit quality gate running `npm run quality`.

## 4. Fast Differential Checks for Rapid Iteration
- Coding assistants should use the fast differential check command during rapid development to inspect only modified or uncommitted changes:
  - `npm run quality:fast` (or alias `npm run check:fast`).
- The fast check command (`scripts/fast-check.js`) queries `git status --porcelain` to target affected packages:
  - Automatically synchronizes Prisma database schema if `backend/prisma/` is modified.
  - Executes targeted typechecks and fast unit tests (`vitest run --changed --passWithNoTests`) on affected packages.
  - Completes in seconds for rapid feedback.
