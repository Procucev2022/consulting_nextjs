# Claude Code Instructions

## Mandatory Unit Test Policy (90% Per-File Coverage)

1. **Strict 90% Benchmark**: Every file in this project must maintain at least 90% coverage across lines, statements, branches, and functions.
2. **Per-File Failure**: The test runner throws an error if any single file falls below 90%.
3. **No File Exclusions**: Every logic file must be tested without skipping.
4. **Global Timeout**: 10,000ms global timeout applies to all tests.
5. **Continuous Verification**: Run `npm run test:coverage` whenever modifying any file and verify all thresholds pass before completing work.
