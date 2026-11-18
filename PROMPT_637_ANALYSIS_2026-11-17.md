# Prompt 637 analysis and status (2026-11-17)

This document records what was analysed for Prompt 637, what was fixed and committed on branch `anshul3`, and what is still open. Each fix was committed separately after the full pre-commit gate passed (`npm run pre-commit` = build, coverage, typecheck, lint, db sync, budget).

## 1. Fixed and committed

| Commit | Change | Evidence |
|---|---|---|
| `40bb10d` | Test files run in parallel (backend `maxWorkers: '50%'`, frontend `fileParallelism: true`). | Frontend tests 842 s to 103 s; backend about 72 s to 20 s; full gate about 8 to 9 minutes instead of 15 to 20. Thresholds and timeouts unchanged. |
| `38d5e55` | `jsonResponse` logs a warning when a body reports `success: false` with an HTTP success status. | `backend/src/workerHttp.ts`, `API_RESPONSE_LOG_MESSAGES.failureWithSuccessStatus`. |
| `592f1b6` | `/api/db/status` reuses its seven `COUNT(*)` results for 30 seconds and returns `statusCacheStatus`. | Previously every poll scanned the ledger and validation tables. Counts can lag writes by up to 30 seconds. |
| `15c4ea0` | Route contract test: 43 parameterless frontend calls reach a handler as an administrator, plus a negative case. | `backend/tests/frontendRouteContract.test.ts`. Result: every route exists. |
| `a5a7e57` | Mock data removal (see section 6). | Frontend lint, typecheck, and 299 test files pass. |
| `b8a0b58` | Assessment sync drops responses from a previously selected assessment, and logs failed line-item requests. | `frontend/src/app/page.tsx`; three tests cover the stale paths (section 7). |
| `178b978`, `3c261a9`, `1a67851` | Earlier in this prompt: currency conversion reports records with no stored FX rate; client error reports retry with backoff; review docs updated. | See `STABILITY_REVIEW_2026-11-17.md`. |

## 2. Architecture

- The Worker dispatches through `backend/src/worker.ts` (181 lines), `workerApiRoutes.ts`, and several large route modules (`workerD1.ts`, `workerD1Database.ts`, `workerD1Pcbi*.ts`).
- `frontend/src/app/page.tsx` is about 2,640 lines and holds most application state, the upload parser, the mock-free mapping logic, and tab routing. It is the largest maintainability risk.
- Backend lint runs on `src` only (`eslint src --ext .ts`), so tests are not linted.
- The frontend still contains explicit `any` in `page.tsx` (for example `(canonicalRes as any)` and `catch (err: any)`), which AGENTS.md section 22 prohibits. The frontend ESLint run does not report them.
- Two role vocabularies exist: `ADMIN`/`USER` in `backend/src/constants/auth.ts`, and `INTERNAL_ADMIN`/`ANALYST` in lifecycle code.
- Two rate-limit policies exist. Client error reports fail closed with HTTP 503 when `CLIENT_ERROR_RATE_LIMITER` is missing. Auth requests fail open with a warning when `AUTH_RATE_LIMITER` is missing. All `wrangler.jsonc` environments bind both limiters, so production is not affected.
- `frontend/src/utils/module2StrategicSourcingApi.ts` (`Module2StrategicSourcingApi`) is dead code. Its only caller is its own test.

## 3. Database

- `backend/d1-schema.sql` defines 73 tables and 50 triggers. Two of the triggers stop an active `USER` account from losing its tenant assignment.
- Summary tables with no runtime writer: `CategoryYearDetail`, `ConversionFunnelPhase`, `DatasetMetricSummary`, `Module1CurrencyBreakdown`, `Module1MonthlySpend`, `SpendCategorySummary`, `VendorPriceRank`, `VendorYearDetail`, `SavingsOpportunity`. The dashboards `/api/categories`, `/api/vendors`, and `/api/savings` read them, so uploaded data does not reach those dashboards. Only seeded data appears.
- Seed-only reference tables: `FxCurrencyMaster`, `FxReferenceRate`, `UNSPSCCommodity`, `PCBIBenchmarkMaster`, `PCBIHistoricalObservation`, `ProcurementCategoryMapping`, `SavingsOpportunityTenantScope`, `IndustryMaterialProfile`, `IndustrySectorPreset`.
- Never read and never written: `AnalysisJob`, `FxRateRule`, `PCBIWeeklyIndex`, `PCBIBenchmarkComponent`.
- Written but never read: `Module2ComplianceReview`.
- Duplicate or overlapping tables:
  - `AlternateVendorCompany` and `AlternateVendorIndex`
  - `PCBIWeeklyIndex` and `PCBIWeeklyReference`
  - `ProcurementCategoryMapping`, `MaterialMappingRegister`, and `AssessmentMaterialMapping`
  - `AssessmentAuditLog`, `OrchestrationAuditEvent`, and `SubscriptionAuditEvent`
  - `ObjectMetadata` and `RawDocumentIngestion`
  - `AssessmentDataVersion` and `AssessmentStoreEntry`
- Copied columns: `AssessmentRecord.customer_name` (from `CustomerRecord`), `SubscriptionRecord` (repeats `User` fields), and `ValidationPreCheckRecord` (mirrors `ProcurementTransaction`).
- Sync: the drift gate compares row counts only (stability review item 23). The seed manifest and the seed file disagree on PCBI row counts (27 versus 23, item 24).
- Local `db:push` and `db:drift` cannot prove the state of the remote D1 database. CI and deploy run `db:push -- --remote`.

## 4. D1 utilisation

- Fixed: `/api/db/status` (section 1).
- Open: 23 lines in `backend/src` contain `COUNT(*)`. Most are in `constants/` (`d1.ts`, `executiveOpportunityBriefConstants.ts`, `orchestrationSql.ts`, `pcbiDataLabSql.ts`, `evidenceSql.ts`). Not every one has been checked for whether it runs per request.
- Open: `SELECT *` without `LIMIT` in `workerD1.ts` (FX and taxonomy), `workerD1Pcbi.ts`, `workerD1PcbiAdmin.ts`, and `workerD1PcbiDataLabReadModel.ts`. The taxonomy query is bounded later in its function, so it is a false positive.
- Open: `buildJobDetail` (`workerD1OrchestrationJobs.ts`, about lines 90 to 110) runs six queries on every job view. They include `listProcurementStats`, `listVersionRows`, `listReportRows`, `listCorrectionRows`, `countOpenCorrections`, and `listPcbiGapRows`.
- Open: the initial ingestion view sums the validation table on every load (`workerD1.ts`, about lines 133 to 153).
- Open: Module 2 reloads up to 30,000 rows (item 9). Upload writes are costly (item 10). Repeated reads (item 11).

## 5. Logging and error capture

- Fixed: failures reported with HTTP 200 are logged (`38d5e55`). Client error reports retry with backoff (`3c261a9`). The assessment sync logs its failures (section 7).
- Open: 24 user-visible error paths do not log, and 7 silent `.catch()` handlers remain (stability review item 16).
- Open: the Worker runtime does not write `logs/app.log`, `logs/error.log`, or daily files, and no retention purge runs. Logs go to Cloudflare observability (`wrangler.jsonc`: `observability.enabled`, `logs.persist`). AGENTS.md section 4 requires local files and a purge engine. Those requirements need a decision for the Worker runtime.

## 6. Mock and invented data

Removed in `a5a7e57`:
- `frontend/src/constants/executiveBriefPresentationConstants.ts`, `customerBriefPresentationConstants.ts`, their types, two tests, and an unused fixture. They held fixed customer totals and had no UI consumer.
- Placeholder UNSPSC codes `'10000000'` and `'00000000'` literals in four utilities and one component. They now use `UNCLASSIFIED_COMMODITY_CODE`.
- The fixed `99.4` confidence shown in the upload loader. The loader now shows "not available".
- Upload parsing: missing quantity and price default to 0 (were 100 and 50). Synthetic UNSPSC codes, alternating statuses, and synthetic confidence values between 95.5 and 98.8 are gone. `total_spend` uses the INR value instead of dividing by a hardcoded 83.8.
- AI categorisation fallback: a line with no taxonomy match reports 0 confidence (was 99.4). A line matched by taxonomy reports 95 (`TAXONOMY_MATCH_CONFIDENCE_PCT`, the backend's deterministic score).
- Unused `uiStrings` keys containing fixed figures (`funnelSubtitle`, the `scorecard` block, and the price-creep and AI-confidence values).

Still open:
- `frontend/src/app/page.tsx` (upload parser) still invents `Vendor-N`, `MAT-N`, `Item-N`, `PO-<year>-<n>` identifiers, a 2024 fallback year, and `YYYY-06-15` invoice dates when columns are missing. Replacing them changes grouping keys, so this needs a design decision.
- `frontend/src/components/module2/VolumeAggregationPoConsolidationTab.tsx` sets `ai_confidence: 95` and `status: 'Confirmed'` on every row.
- `backend/src/services/aiCategorizationService.ts` fills a missing AI confidence with 85 and gives deterministic matches 95.0.
- `backend/src/workerD1Module2ReviewRoutes.ts` stores `confidenceScore ?? 1` when the client omits it, which records full confidence for a mapping nobody scored.
- `frontend/src/constants/evidenceWorkbook.ts` (`EVIDENCE_INVENTORY`) holds fixed amounts such as `grossAmountCr: 6.17`, rendered by `EvidenceWorkbooksPanel.tsx`.
- `frontend/src/constants/executiveBriefExportStrings.ts` and `frontend/src/components/executiveBrief/ExecutiveBriefSlidePreview.tsx` hard-code audit claims ("₹0.00 Variance Verified", "Reconciled with ₹0.00 Variance").
- Test fixtures keep sample numbers. They are test inputs, not production data, so they remain.

## 7. Intermittent behaviour

- Fixed: `frontend/src/app/page.tsx` assessment sync had no cancellation. A late Module 1 or line-item response for the previous assessment could overwrite the current assessment's data. The effect now drops each response after the assessment changes. Failed line-item requests are logged.
- Kept on purpose: an empty line-item response does not clear the current rows. Clearing would remove rows the user uploaded before the server persisted them.
- Open: no loading state is shown while the sync runs (see section 8).

## 8. Latency and loading

- Open: dashboard hydration in `page.tsx` (about lines 607 to 945) runs its requests one after another (stability review item 18). Independent requests should run in parallel.
- Open: no loading UI for the sync or for the dashboard hydration. This needs new `UI_STRINGS` entries.
- Open: Module 2 full reload (item 9).

## 9. Missing features

- Summary-table rebuild after ingest, delete, and reset. Nine summary tables are never written at runtime (section 3), so nothing fills them from `ProcurementTransaction`. This is stability review item 7 and is open. Item 6 is blocked on a table rebuild. Its patch is in `$env:TEMP\item6-analysis.patch`, which is not a durable location.
- Savings opportunity generation. `SavingsOpportunity` is seeded only.
- Dashboards for vendors, categories, and savings show nothing for uploaded data (section 3).
- Module 2 Lever 9 (item 28). `/api/module2/sourcing/handoff` returns 409 and has no caller (item 19).
- AI quota handling (item 21).

## 10. Routes

- The contract test (`backend/tests/frontendRouteContract.test.ts`) confirms that 43 parameterless frontend calls reach a handler: AI, auth, admin, dashboards, GraphQL, telemetry, executive brief, subscription admin, and Module 2 (including exports and reviews).
- Not covered by the contract test: parameterised routes under `/api/evidence/jobs/{id}/...` and `/api/orchestration/...`. Their existing suites cover them.
- Next.js has one route handler, `frontend/src/app/api/email/executive-brief/route.ts`, which forwards to the Worker's email endpoint covered by the contract.

## 11. Quality-check speed

- The full gate runs in about 8 to 9 minutes (from 15 to 20). `npm run quality:fast` remains available for iterative checks.

## 12. Pending list

Ordered by user impact:

1. Summary-table rebuild after ingest, delete, and reset (section 9). Requires seed manifest updates and `db:drift`.
2. Savings opportunity generation (section 9).
3. Parallel dashboard hydration and loading UI for the sync and hydration (section 8).
4. Upload parser invented identifiers and dates (section 6). Needs a decision on grouping keys.
5. Remaining invented values in AI, Module 2 review, volume aggregation, and the evidence inventory (section 6).
6. Hard-coded audit claims in executive brief strings and the slide preview (section 6).
7. Job detail repeated reads and ingestion validation sums (section 4).
8. `COUNT(*)` and unbounded `SELECT *` queries (section 4).
9. Module 2 full reload and upload write cost (section 4, items 9 and 10).
10. Unlogged user-visible error paths and silent catches (section 5).
11. Registration enumeration, 409 responses (stability review item 14, decision 9).
12. Single `batch()` from the Worker (item 22). Drift gate checks counts only (item 23). PCBI row mismatch (item 24). UNIQUE and FK constraints (item 25). Copied columns (item 26).
13. Dead and duplicate tables (section 3; item 30). Tenant default `TNT-GLOBAL-8902` (item 31). Timing-sensitive tests (item 34).
14. Item 6 blocked (table rebuild).
15. Architecture: split `page.tsx` and the large Worker route modules; remove the frontend `any` usages; decide the role vocabulary; delete `Module2StrategicSourcingApi`.
16. Decision needed: whether client error reports should fail closed (503) or open when the rate limiter is missing.
17. Decision needed: whether unknown AI confidence should show 0 or "not available" (the current value is 0 for unmatched lines).
18. Decision needed: logging persistence for the Worker runtime (section 5).
