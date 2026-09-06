# Gemini / Antigravity Instructions

## Mandatory 90% Unit Test Code Coverage

- **Rule**: Every modified or created file must have unit tests with >= 90% coverage for statements, branches, functions, and lines individually.
- **Enforcement**: Vitest throws an error if any single file is below 90%.
- **Global Timeout**: 10000ms global timeout for all unit tests.
- **Workflow**: Whenever any change is made, run `npm run test:coverage` to verify. Do not stop until all tests pass with >= 90% per-file coverage.
