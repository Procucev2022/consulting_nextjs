# Strict 90% Unit Test Code Coverage Rule

## Core Directives for all AI Coding Agents (Antigravity, Cursor, Claude, Codex, Kiro, etc.)

1. **Mandatory 90% Coverage Rule Each File Wise**:
   - Whenever you write, update, refactor, or add code to any file in this repository, you MUST write or update unit tests to achieve **at least 90% coverage on that file individually**.
   - The 90% benchmark applies to ALL FOUR parameters per file:
     - **Lines**: >= 90%
     - **Statements**: >= 90%
     - **Branches**: >= 90%
     - **Functions**: >= 90%
   - If ANY file falls below 90% across any of these metrics, the test runner is configured to throw an error and fail the build.

2. **No File Exclusions**:
   - Do NOT skip any file.
   - Every service, controller, route, utility, component, and data handler must be tested.

3. **Global Test Timeout**:
   - All unit tests must adhere to the configured global timeout (10,000 ms).
   - Never write unbounded asynchronous operations or tests without proper teardown.

4. **Verify on Every Code Change**:
   - Whenever making any change, you MUST run:
     ```bash
     npm run test:coverage
     ```
   - Inspect the printed per-file coverage table.
   - Do NOT finish your task until 100% of tests pass and every modified/created file satisfies the >= 90% threshold across all 4 parameters.
