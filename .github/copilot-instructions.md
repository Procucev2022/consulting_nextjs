# GitHub Copilot & Codex Instructions

- Code coverage must stay at or above 90% per-file for statements, branches, functions, and lines.
- Always generate unit tests for new or edited functions, components, routes, and controllers.
- Ensure all tests complete within the 10000ms global timeout.
- Run `npm run test:coverage` to confirm all coverage thresholds are satisfied.
- Always use the centralized structured logger (`backend/src/utils/logger.ts` or `frontend/src/utils/logger.ts`). No raw `console.log`/`console.error`.
- In local mode, persist logs to `logs/` on the file system and ensure automatic purging of expired logs for compliance.
- Include structured context (timestamp, level, service, message, context, requestId, durationMs, error details) in all log calls.
- PR CI/CD workflow `.github/workflows/ci.yml` validates linting, typechecking, building, and 90% per-file code coverage.
- All CI/CD jobs must have an explicit timeout (`timeout-minutes: 15`).
- The CI/CD workflow must post and update an executive summary PR comment detailing test success/failure counts and coverage metrics.
- Maintain a workspace file `prompts.md` storing ONLY user-provided prompts. Never save AI-generated conversations or responses in `prompts.md`.
- Move all user-facing literal strings into constants and access via `UI_STRINGS` (`frontend/src/constants/uiStrings.ts`). No hardcoded UI strings.
- Use template placeholders for dynamic substitution and assert against `UI_STRINGS` constants in all unit tests.
- All constants (defaults, rates, thresholds, palettes, lookups) must reside in dedicated constants files under `constants/` (`frontend/src/constants/` and `backend/src/constants/`). No inline constants or magic numbers.
- All TypeScript types, interfaces, enums, and component prop definitions must reside in dedicated files under `types/` (`frontend/src/types/` and `backend/src/types/`). No inline `interface` or `type` declarations in components, services, or controllers.

