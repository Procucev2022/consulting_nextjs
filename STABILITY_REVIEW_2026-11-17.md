# Stability Review, 17 November 2026

This review covers the database, Cloudflare D1 cost, logging, intermittent failures, feature completeness, latency, and authorization. Section 2 lists each fix with its commit on `origin/anshul3`. Section 3 ranks the open items by impact. Each open item names the file or string to change. Items closed in a commit are marked "Closed" with that commit, and the numbers stay fixed so the references in sections 5 and 6 still resolve.

## 1. Method and baseline

- Six read-only analyses ran in parallel, plus an authorization audit and a reconciliation of the feature requests in `prompts.md` against the code. Key claims were then checked by reading the code.
- Baseline before changes: backend 119 test files and 1,929 tests, frontend 295 files and 3,414 tests, typecheck, lint, and the performance budget all passed. Every commit below passed the pre-commit gate (`npm run quality`).
- Gate gap: on this Windows host, local workerd cannot start, so `db:push` and `db:drift` print a warning and exit 0 without checking anything. The gate reports success for steps it skipped. Run both on a host where workerd starts, and make the skip fail in CI.
- Branch and deploy: changes are pushed to `origin/anshul3`. A push to `main` runs the dev deploy workflow, and a push to `prod` runs the production deploy. Neither was run.

## 2. Fixed

| Commit | Problem | Change |
|---|---|---|
| `cadc095` | `DELETE /api/ingestion` and `/api/ingestion/document` with no id deleted every document of the tenant, with its transactions and validation rows. | The Worker accepts only `DELETE /api/ingestion/document/{id}` and returns 400 otherwise. The client requires an id. |
| `384ac29` | A circular context, a BigInt field, or a throwing getter made `logger.error()` throw into the request handler, which dropped the record. | Every log sink encodes through `logSerialization.ts`. Core fields survive when a field cannot be encoded. |
| `96ee454` | Unhandled exceptions returned their raw text to clients. Error bodies had no stable code. | Every Worker error has `errorCode`, `errorCategory` and `requestId`. Clients get fixed text. Curated D1 messages stay (`ClientFacingError`). A missing Module 1 dataset is a 404 with `DATASET_NOT_FOUND`. |
| `0768e10` | While no admin exists, `POST /api/admin/create-admin` updated any existing account matching the email: password and role. | Existing accounts are never modified during first-admin setup (409). With `AUTH_BOOTSTRAP_TOKEN` set, setup also requires the `X-Admin-Bootstrap-Token` header. Set this secret in each environment. |
| `d9ce9c9` | `GET /api/graphql?query=` executed mutations. | A mutation sent by GET returns 405 before any resolver runs. |
| `5680289` | The executive brief named "UltraTech Cement Limited" for any tenant without a name, and downloads were named after that customer. | Neutral fallback label; the filename no longer names a customer. |
| `302b7af` | Five paths selected validation rows with `record_id LIKE 'REC-{id}-ROW-%'`, which cannot use the primary-key index. Each analysis run, delivery package, version rollback and document delete read every validation row in the database. | Half-open key range, verified by `EXPLAIN QUERY PLAN` in a test. |
| `73213cf` | An expired session left pages empty with no message (item 2). | On a 401 for a request that carried the stored token, the app clears the session keys and opens login with a notice. Auth, upgrade, telemetry, and create-admin routes are exempt. |
| `1c7971d` | The PCBI publisher was the literal "Sriman Admin", and the admin login text showed the default password. | The publisher is the signed-in administrator's email, then name, then a neutral label. The password is no longer in the login text. The form prefill still fills it (decision 6). |
| `0a69ead` | Self-registration accepted any `subscription_tier` (item 32). A supplier merge that matched no supplier was not reported as an error. | Registration starts on BRONZE. Metadata-only ingestion rows start as Pending with progress 0, in REST and GraphQL. A merge with no matching supplier returns 404. |
| `e7211c0` | A render failure showed Next.js's default error page, with no reference for support. | `app/error.tsx` and `app/global-error.tsx` show the error category and a support reference. The error is logged. |
| `2eb752a` | A currency conversion with no stored exchange rate fell back to zero without a message (item 15). | The conversion is refused with 400 and the latest stored date, instead of returning a value. Only the currency route is covered; see item 15. |
| `c5dcd54` | Lifecycle actions took the actor from the `x-user-email` and `x-user-role` headers, so any caller could claim to be an analyst or administrator (item 12). `deliver` and `close` had no role check. `accept` recorded an `acceptedBy` value from the body. | The actor is the bearer-token account: administrators act as `INTERNAL_ADMIN`, others as `CUSTOMER`. `deliver` and `close` require an internal administrator or analyst, as `approve` already did. `accept` records the signed-in account and rejects an `acceptedBy` that names another account. |
| `8f2677b` | Module 2 sign-offs and mapping changes accepted any signed-in account, including customers, and parsed the body before checking authentication (item 28). | The routes require the ADMIN role and authenticate first. A customer receives 403 before the body is read. Lever 9 was not reviewed. |
| `df06ca6` | GraphQL introspection listed the whole schema to any caller, and 500 responses returned raw exception text (item 20). | Introspection is rejected unless `GRAPHQL_INTROSPECTION_ENABLED` is `true`. Only the dev environment sets it. Unexpected failures return a fixed message with the request ID. Resolver error text still reaches clients (item 20). |
| `8a424a5` | Each deliverable link was a plain anchor. Browsers send no Authorization header on anchor navigation, so every download returned 401. | Downloads use the authenticated download hook (the one used for evidence files). A failed download shows the server reason. |
| `fbceec7` | `dbApiClient.getDBTableData` called `/api/db/tables`, which has no route (item 19). Nothing called it. | Removed with its delegation and tests. |
| `2271bd2` | Frontend logs were formatted strings with loose objects, and `requestId` was not a top-level field (item 17). | Each console call receives one JSON record. A `requestId` in the context is also written at the top level. |
| `2ca6ef0` | `pcbiPlatformIntegration.ts` held readiness claims (Prisma and Postgres schema sync, "AEAD verified") that no component read (item 27). | Removed with its types, barrel exports, and the test that only checked those values. |

## 3. Open items, ranked by impact

Items marked "Partly closed" still have the remaining work listed.

### Critical and high

1. **Intermittent stale data across Worker isolates.** Module 2 analyses, tenant datasets, and reference data are cached per isolate (`services/workerD1Module2Cache.ts`, `services/d1ReferenceDataCache.ts`, `services/d1TenantDataCache.ts`). Writes clear only the local copy (for example `workerD1IngestionRoutes.ts` and `services/ingestionWorkbookImporter.ts`). A request served by another isolate can show pre-upload data for up to 60 seconds. Fix: a per-tenant generation counter in D1, read on each request and included in every cache key.
2. Closed in `73213cf`.
3. **Assessment switches can show the previous assessment's data.** The sync effect in `frontend/src/app/page.tsx` (about lines 947–1022) has no cancel flag, and it leaves old line items in place when the new response is empty.
4. **Static figures presented as analysis.** `frontend/src/constants/uiStrings.ts` contains `₹732.41 Cr` in the funnel subtitle, the scorecard subtitle and the scorecard baseline value (about lines 1994, 2584 and 2586). The KPI tiles show fixed values ("3 Yrs", "Apr 2024 – Jan 2025", "15%+", "3x"). The upload analysis in `page.tsx` uses a fixed confidence of 99.4 (about line 1474), a target reduction taken from the array index (about line 1886), and a synthesized Column L code (about line 1889). Replace each with a value computed from the data, or show "not calculated".
5. **New assessments inherit sample financials.** `backend/d1-schema.sql` defaults `total_spend_cr` to 556.5347, `gross_spend_cr` to 585.3049 and `potential_savings_cr` to 42.45. `workerD1Assessment.ts` inserts none of those columns, so new rows read back as sample figures. Fix: insert NULL explicitly and make the mapping handle NULL.
6. **Analysis runs store zeros in typed savings columns.** `services/assessmentAnalysisD1.ts` (about lines 231–244) writes literal 0 to gross, overlap, net, proven, delivery range, PCBI signal and potential savings. The computed values go to `metrics_json`. Evidence reads the zeros.
7. **Summary tables are never rebuilt from the ledger.** `SpendCategorySummary`, `CategoryYearDetail`, `ConversionFunnelPhase`, `DatasetMetricSummary`, `Module1MonthlySpend` and `Module1CurrencyBreakdown` have no writer. Dashboards still read some of them (`workerD1.ts` around line 214).
8. **Uploads append instead of replacing.** Prompt 43 asks that a new file erase the old data. `uploadIngestion` assigns a random document id and never checks for a duplicate, and `ObjectMetadata.sha256` is written blank. Decision needed (section 5).
9. **Module 2 reloads the full ledger on every request for large assessments.** The cache drops any analysis above 30,000 rows (`constants/db.ts`). A 95,000-row assessment reads about 95,000 rows per tab switch.
10. **Upload write cost.** `services/ingestionWorkbookImporter.ts` writes one transaction row and one validation row per source row. A 10,000-row upload writes about 20,000 rows plus index entries against the 100,000 writes per day free limit. The import also runs 125 or more serial batches.
11. **Repeated full-table reads.** Job detail reads the ledger twice (`workerD1OrchestrationJobs.ts` around lines 96–108). Initial ingestion sums the whole validation table on each load (`workerD1.ts` around lines 133–153). `/api/db/status` runs seven `COUNT(*)` queries.
12. Closed in `c5dcd54`. The role gate in `services/assessmentLifecycleD1.ts` was reviewed. It covers `approve` and package generation, and now also `deliver` and `close`.
13. **Data-clearing routes need a role decision.** `POST /api/ingestion/reset` and `DELETE /api/ingestion/validation-records` clear a tenant's data for any tenant user. The validation-record clear now logs (commit `cadc095`), but it still has no role gate. Decision needed (section 5).
14. **Unauthenticated write and no login limits.** `POST /api/upgrade/request` accepts any email with no rate limit. Login has no rate limit or lockout, and registration returns 409 for an existing email (enumeration). The Worker already binds a Cloudflare rate limiter (`CLIENT_ERROR_RATE_LIMITER` in `wrangler.jsonc`), which the same approach could use.
15. **Partly closed.** The currency conversion route refuses a missing rate (`2eb752a`). Still open: `constants/d1.ts` (about lines 274–281) sets the remediation rate to 0 when no rate exists, and `workerD1.ts` (about lines 360–370) uses `|| 0`. Both should return an error and log the currency and date.
16. **Partly closed.** Route and root error pages exist (`e7211c0`). Still open: 24 user-visible error paths do not log (listed in the logging audit: `app/admin/dashboard/page.tsx`, `components/assessment/AssessmentDetailWorkflow.tsx`, and others). Ten `.catch()` calls swallow errors silently.
17. **Partly closed.** Frontend records are JSON with a top-level `requestId` (`2271bd2`). Still open: telemetry drops `warn` entries without an `Error`, and failed telemetry POSTs are not retried.
18. **Slow first screens with no loading state.** The dashboard hydration chain in `page.tsx` (about lines 607–945) runs serially and shows empty panels until it finishes. The UNSPSC taxonomy is fetched on every home load in 1,000-row pages, one after another (`hooks/useUNSPSCTaxonomy.ts`, `data/unspscTaxonomy.ts`). The workbook is parsed on the main thread.
19. **Partly closed.** The `/api/db/tables` client call is removed (`fbceec7`). Still open:
    - Savings evidence downloads return 409 for every savings type. `savingsUnavailableReason` in `services/evidenceInventoryService.ts` reports each type as unavailable. This is a feature that is not built, not a routing bug. See decision 8.
    - Logistics demo rows (`is_demo = 1`) are returned to every user as live candidates, labelled `isDemo`. See decision 7.
    - `/api/module2/sourcing/handoff` returns 409 and has no caller.

### Medium

20. **Partly closed.** Introspection is off unless `GRAPHQL_INTROSPECTION_ENABLED` is `true` (`df06ca6`), and 500s return fixed text. Still open: resolver errors that throw still send their message to the client (`workerGraphql.ts` returns `result.errors` as is). Curated messages, such as the administrator-only tenant update message that a test asserts, reach the client this way, so masking needs a `ClientFacingError` path. The data-query resolvers (`resolvers/d1GraphqlDataResolvers.ts`) were not audited for tenant predicates.
21. `POST /api/crypto/encrypt` and the AI endpoints are open to every tenant user, with no quota.
22. Migration tooling (`scripts/d1-migration-tools.js`, around lines 233–239) runs CREATE, INSERT SELECT, DROP and RENAME as one command with no count check, so an interruption can leave rows in a temporary table.
23. The drift gate checks table counts and seed checksums only. It ignores columns and row values. Seeds use `INSERT OR IGNORE`, so a corrected reference row never updates.
24. PCBI benchmark rows: 27 tuples across 15 statements, against 23 manifest rows. Duplicate ids are the likely cause and are not yet confirmed.
25. Nine natural keys lack UNIQUE constraints. Nineteen tables carry `assessment_id` without a foreign key, and no trigger ties an assessment's tenant to its customer's tenant.
26. Copies do not propagate: `AssessmentRecord` keeps its own customer name, and `SubscriptionRecord` copies email, name, tier and tenant from `User`.
27. **Partly closed.** The "Sriman Admin" publisher and the static AES readiness claim are removed (`1c7971d`, `2ca6ef0`). Still open: `constants/auth.ts` keeps `DEFAULT_ADMIN_DETAILS`, which prefills the admin login form with the default password (decision 6).
28. **Partly closed.** The sign-off and mapping review routes require ADMIN (`8f2677b`). Lever 9 in Module 2 was not reviewed.
29. Latency items: the Module 1 workbook upload has no progress state. The executive brief download has no in-progress state, and its formats render in sequence. `services/evidenceD1Repository.ts` runs group-bys with no matching index. The assessment line-items route runs three serial queries and truncates at 100 rows silently.

### Low

30. Dead tables: `AnalysisJob`, `FxRateRule` and `PCBIWeeklyIndex` have no code path. `LineItemMapping` is always empty.
31. 13 tables default `tenant_id` to `TNT-GLOBAL-8902`. No live insert relies on it, but any new insert that omits it would leak across tenants.
32. Closed in `0a69ead`. Registration ignores a requested `subscription_tier` and starts on BRONZE.
33. Token `exp` is milliseconds, not the seconds JWT convention. It is internally consistent, so it is not a fault, but external consumers would misread it. No action taken.

## 4. Feature reconciliation

Source: the prompts in `prompts.md`, checked against the code.

**Missing or partial**

- Rename the workflow labels ("AI Categorization and Strategic Sourcing", "data ingestion and deep dive analysis"). Missing.
- Remove "ENGINE 2.0" (`uiStrings.ts`). Still present.
- Erase old data on a new upload (prompt 43). Missing. See decision 2.
- Upload title and description wording (prompts 32, 33). Partial.
- Remove the Enterprise and Public QUA buttons (prompt 44). Partial, still present in `ValidationPreCheckSection.tsx`.
- Transaction-date FX from Yahoo Finance (prompts 29, 314–318). Partial. The FX master tables exist, but no Yahoo call exists; the only reference is a description string in `aiAnomalyService.ts`.
- AES-256-GCM for stored financial data (prompts 13, 252–254). Partial. A helper exists; stored financial columns are not encrypted.
- Bronze, Silver and Gold entitlements (prompts 67, 71–73, 287–289). Partial. UI masking only; the server does not enforce entitlements.
- Major and minor sectors including service sectors (prompts 48, 51). Partial. No service-sector entries.
- Savings evidence per type (prompts 305–309). Partial. Savings-type download returns 409 (item 19).
- Password reset. Missing; no route.
- Upgrade and subscription admin APIs. Backend complete; the six client methods in `utils/pcbiApi.ts` have no call sites.
- Executive brief "regenerate" and "audit" routes. No callers.
- PCBI benchmark calculation and gap engine (prompts 161, 186–202). Unverified. A calculation test was failing at prompt 214.
- Module 2 freight and logistics review (prompt 222). Not found.
- Architecture cleanup and error codes (prompts 605–607, 630). In progress. The Worker error envelope (`96ee454`), the Worker GraphQL 500 (`df06ca6`), and the frontend log records (`2271bd2`) are done. Resolver errors and the client-side error envelope are not.

**Present in code** (file-level check; behaviour was not run): the document summary and unique-count views, the three-year month graph, conversion and duplicate merge modals, the 80% Pareto view, UNSPSC categorisation with the analyzing loader, the high-value single-vendor view, vendor and PO consolidation with e-auction, the PCBI admin workflow, Module 2 levers 1 to 10 (lever 7 shows "coming soon", as requested), orchestration, compliance review, and the PPTX and PDF brief formats.

**Unverified**: the reports in prompts 150–160, 243–249, 319–334, 382–402, 462–469 and 501–525 ask for audit documents, not features. The visual items (login redesign, theme, logo placement) need a visual check.

## 5. Decisions

### Needed from you

1. **Customer status.** The request says both "customers are already using the system" and "customers are not using it". I treated the data as live. No production data was changed or deleted. Confirm which applies before the next data-changing step.
2. **Upload semantics.** Prompt 43 says a new file replaces the old data, and the current code appends. Confirm replacement, and whether replacement should delete the prior data version or keep it as superseded.
3. **Role gate for resets.** Should `POST /api/ingestion/reset` and the validation-record clear be restricted to administrators?
4. **Bootstrap secret.** Set `AUTH_BOOTSTRAP_TOKEN` in each environment. Until it is set, first-admin setup still accepts new emails without a secret.
5. **Deploy target.** Changes are on `origin/anshul3`. Merge to `main` to deploy dev, or to `prod` to deploy production, when you approve.
6. **Default admin credential.** `DEFAULT_ADMIN_DETAILS` in `constants/auth.ts` still prefills the admin login form with the default password. Remove the prefill, and rotate any account that still uses that password?
7. **Logistics demo rows.** Keep them, labelled as demo (current behaviour, pinned by a test), or hide them from customer accounts?
8. **Savings evidence workbooks.** Build them, or keep the 409 with its reason until they are built?

### Policy choices made in this pass (confirm or reverse)

- `deliver` and `close` require an internal administrator or analyst, the same as `approve`. Customers can still accept (`c5dcd54`).
- `accept` records the signed-in account. A request that names another account in `acceptedBy` is rejected with 403 (`c5dcd54`).
- Module 2 sign-offs and mapping changes require the ADMIN role (`8f2677b`).
- Introspection is off in production and on in dev only (`df06ca6`).
- Registration starts on BRONZE and ignores the requested tier (`0a69ead`).

## 6. Recommended order for the next pass

1. Per-tenant cache generation (item 1). Largest effect on the "works once, fails next time" reports.
2. Assessment-switch guard (item 3), and removal of the static figures and the upload-analysis constants (item 4).
3. New-assessment financials and analysis savings columns (items 5 and 6). Item 4 depends on these.
4. Rate limits for login, registration and upgrade requests (item 14). The Cloudflare rate limiter binding is already in `wrangler.jsonc`.
5. Resolver error text in GraphQL (item 20), and the remaining unlogged error paths (item 16).
6. Summary-table rebuild and upload write reduction (items 7 and 10). Module 2 persistence (item 9).
7. Dashboard hydration parallelism with a loader, and lazy taxonomy (item 18).

## 7. How the verification was done

- Each commit ran the full pre-commit gate, which enforces the 90% per-file coverage threshold. The last gate run passed the backend suite (123 files, 1,964 tests) and the frontend suite (301 files, 3,434 tests).
- The query-plan regression test uses the same SQLite engine as the test database.
- Production D1 was not queried. The configured production database is not visible from the current Cloudflare account (see `ARCHITECTURE_AUDIT.md`), so production findings are inferred from code and the dev database.
