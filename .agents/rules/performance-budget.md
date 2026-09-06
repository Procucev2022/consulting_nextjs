# Mandatory Client-Side Performance Budget Enforcement Policy

## 1. Client-Side Bundle Budget Thresholds
- All client-side bundle assets MUST strictly adhere to the following performance budget limits:
  - **Shared Client JS Bundle**: Max **250 KB** gzip (`MAX_JS_BUNDLE_KB`) for the shared runtime, framework chunks, and entrypoint.
  - **Individual Shared Chunk**: Max **120 KB** gzip (`MAX_SHARED_JS_CHUNK_KB`).
  - **Critical CSS**: Max **50 KB** gzip (`MAX_CRITICAL_CSS_KB`) for critical stylesheets loaded on the initial page.
  - **Total Page JS**: Max **320 KB** gzip (`MAX_TOTAL_PAGE_JS_KB`) for the primary route client JavaScript.

## 2. Build Tool Configuration
- Webpack compiler options in `next.config.mjs` must enforce performance budget hints (`maxAssetSize` and `maxEntrypointSize`) to flag large assets during compilation.
- Continuous code-splitting and dynamic imports (`await import(...)` / `next/dynamic`) must be applied to heavy third-party dependencies (e.g. `xlsx`) and off-screen components.

## 3. Quality Check Integration & Automated Rejection
- The automated budget enforcement command (`npm run check:budget`) must be integrated into:
  1. Root build and pre-commit checks (`npm run pre-commit`).
  2. Pull request CI/CD workflows (`.github/workflows/ci.yml`).
- Any budget violation must immediately abort the pipeline with exit code 1, blocking commits and pull request merges until resolved.

## 4. Quality Standards & 90% Unit Test Coverage
- All performance budget evaluation utilities, metric analyzers, and formatters must maintain at least **90% unit test code coverage** individually across statements, branches, functions, and lines (`perFile: true`).
