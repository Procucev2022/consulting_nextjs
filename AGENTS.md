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
