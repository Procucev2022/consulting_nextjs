# GitHub Copilot & Codex Instructions

- Code coverage must stay at or above 90% per-file for statements, branches, functions, and lines.
- Always generate unit tests for new or edited functions, components, routes, and controllers.
- Ensure all tests complete within the 10000ms global timeout.
- Run `npm run test:coverage` to confirm all coverage thresholds are satisfied.
- Always use the centralized structured logger (`backend/src/utils/logger.ts` or `frontend/src/utils/logger.ts`). No raw `console.log`/`console.error`.
- In local mode, persist logs to `logs/` on the file system and ensure automatic purging of expired logs for compliance.
- Include structured context (timestamp, level, service, message, context, requestId, durationMs, error details) in all log calls.

