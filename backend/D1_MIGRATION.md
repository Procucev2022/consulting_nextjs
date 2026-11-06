# D1 data migration

Application reference data and procurement records are imported from the versioned SQL files listed in
`d1-seed-manifest.json`. The manifest records file hashes, source hashes, and expected database populations.
Seeding does not regenerate data from workbooks or application fixtures.

Material-group category mappings are stored in `ProcurementCategoryMapping`. The frontend resolver endpoint and
assessment-scoped Module 2 calculations both read this table from D1. Its 262 rows are included in
`d1-category-mapping-seed.sql` and verified by the seed manifest.

The VGT baseline (`AIC-2026-0001`) is recovered in `d1-transactions-aic-2026-0001-seed.sql` from its
versioned original workbook, verified by SHA-256. It contains all 20,505 source rows, the original validation
metadata (20,241 valid, 252 excluded, 12 anomalies), and a canonical Module 1 snapshot generated with the
original forensic/FX engine. The snapshot reproduces the historical certified INR total of 40,738,306,838.0198
and records the source/evidence checksums and source Git commit. No workbook is restored as a runtime input.
The complete seed now contains 95,416 transactions and 39 assessment store entries; the unassigned legacy
31,671-row dataset remains separate from the three assessment-scoped datasets.

`d1-pcbi-historical-seed.sql` preserves the 13 original forensic PCBI catalog IDs and their complete
source metadata/checksums in benchmark notes. These metadata-only rows remain inactive with unknown
applicability and null benchmarkability weights; the existing 10 operational benchmarks remain active.
The 40 original monthly price observations are retained losslessly in `PCBIHistoricalObservation`,
including original currencies, FX rates, sources, statuses and source checksums. A bounded, validated
archive-only Worker endpoint and PCBI admin panel expose these monthly records with their provenance.
They are not fabricated into weekly indices or promoted as active benchmarks. The retired calculation,
opportunity, base-purchase, and material-trend workflows still need an explicit transaction input model,
comparability/reset rules, and a versioned calculation definition before they can be implemented safely.

From the repository root:

```powershell
npm --prefix backend run db:seed:d1
```

The default seed command imports every SQL file in `d1-seed-manifest.json`. Use
`db:seed:d1:base` only when the small base seed is intentionally required.

To import into the configured Cloudflare database, set `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` in `backend/.env`, then run the remote command. The script loads that ignored local
environment file before invoking Wrangler; do not commit or paste the token into source files:

```powershell
npm --prefix backend run db:seed:d1:remote
```

Run the read-only database drift report locally or against the configured remote D1 when checking data sync:

```bash
npm --prefix backend run db:drift
npm --prefix backend run db:drift:remote
```

The report compares physical tables and application row counts with `d1-seed-manifest.json`, checks the seed
checksum ledger, duplicate transaction source keys, case-insensitive user email duplicates, the exact normalized
email unique-index definition, the expected tenant-scoped composite primary keys, selected
tenant/assessment/customer references, and `PRAGMA foreign_key_check`. It prints counts and table names only. A
remote run reads table contents to calculate counts and may consume D1 row-read quota, so run it deliberately
during an audit rather than on every deploy. The command exits non-zero when it finds drift.

`D1_ENV` selects the Wrangler environment (default `dev`); `D1_DATABASE_NAME` selects the database.
The `dev` binding targets `consulting_dev`; the base, `prod`, and `production` bindings target
`consulting-db`. Override `D1_DATABASE_NAME` when targeting a different database. The local
`cloudflare:dev` command explicitly selects the `dev` Worker and its D1 binding. Local `db:push`, `db:drift`, and
`cloudflare:dev` pin Wrangler persistence to `backend/.wrangler/state`; do not run the application against a
second working-directory-specific Wrangler database snapshot.

The dev Worker binds the isolated `consulting-doc-dev` R2 bucket. Production uses `consulting-doc`. Do not copy
dev uploads into production or switch the dev binding back to the production bucket.

Development and production deployment workflows apply the idempotent schema before deploying the Worker.
They do not import customer/reference seed data automatically. Import the canonical seed into each target
database explicitly before exposing its data-dependent features; seeding development does not seed production.
The local `npm run quality` and pre-commit hook synchronize only the local D1 schema, then run the read-only drift
check against that local database. Remote drift checks are manual audit commands and are not part of deployment
or the routine quality gate.

The importer validates the manifest before changing the database and splits SQL at complete statement
boundaries. Inserts preserve existing rows. Guarded corrections replace known, unchanged legacy fixtures;
they do not replace records whose source values have been edited. After each complete manifest seed file,
including the base seed, the importer records its checksum in `D1SeedFileLedger`. A repeat import skips files
with a matching checksum, while changed seed content is reapplied and its checksum updated only after every part
succeeds. Drift checks require a matching checksum for every manifest seed file. Interrupted files are not
marked complete and can be rerun.

Transactions retain their assessment and source-row identifiers. Legacy rows without verified assessment
lineage have a null assessment ID; they are never attached to an unrelated assessment. Runtime caches isolate
database bindings and assessment scopes. Assessment snapshots preserve fields and composite version/run IDs
that the legacy scalar schema could not represent.

`ProcurementTransaction` has a partial unique index on `(tenant_id, assessment_id, source_document_id,
source_row_number)` when all source-key fields are present. This makes complete-source retries idempotent while
allowing legacy rows with incomplete source identifiers to remain intact. The index was applied to local and
remote development D1 after confirming there were no duplicate complete keys. Audit production data before
applying this schema there.

Tenant-owned aggregate tables use tenant-scoped natural keys: `(tenant_id, master_id)` for `VendorPriceRank`,
`(tenant_id, phase_num)` for `ConversionFunnelPhase`, `(tenant_id, metric_key)` for `DatasetMetricSummary`,
`(tenant_id, month_key)` for `Module1MonthlySpend`, and `(tenant_id, currency)` for
`Module1CurrencyBreakdown`. The compatibility migration recognizes their former global-key layouts and rebuilds
each table while copying existing rows. Unexpected primary-key layouts fail closed; already-migrated tables are
left untouched. The regression suite checks preserved legacy ownership, cross-tenant reuse of the same natural
key, and a no-op second migration. The drift command verifies primary-key column order on the target database.

Twenty-one tables carry `tenant_id` without a native `TenantMaster` foreign key. The canonical schema adds
insert/update triggers that reject tenant IDs missing from `TenantMaster`; tenant IDs are immutable and
`TenantMaster` rows are soft-delete only. The schema regression test compares the trigger inventory to all
tenant-scoped tables that lack native foreign keys. Add any new tenant-scoped table to the drift and trigger
inventory in the same change. The deep drift command checks those tenant references by scanning the scoped
tables, so run it on remote D1 during planned audits rather than on request paths or every deployment.

User email identity is case-insensitive at login and provisioning. `d1-schema.sql` enforces this with a unique
functional index on `lower(User.email)`, and registration uses an insert conflict guard so simultaneous signups
for case variants resolve to one account. Fresh schemas no longer create a separate case-sensitive email unique
constraint or plain email index. The compatibility migration counts case-insensitive duplicates before creating
the functional index and removes the redundant plain `idx_user_email` index without rebuilding existing tables.
Existing tables may retain SQLite's internal index from the former inline `UNIQUE(email)` constraint; removing it
would require a table rebuild and is not part of this additive migration. Local and remote development D1 had
zero case-folded duplicates before the index was added. Run the duplicate preflight against the confirmed
production database before applying the schema there; resolve any identity conflicts through an
administrator-reviewed account decision rather than automatic merging.

The checked-in SQL files are the canonical migration and recovery inputs. The JSON source copies used to generate
those rows are not runtime dependencies and have been removed. Verify the remote table counts and representative
lookups after importing the SQL files. Preserve active assessment stores and uploaded customer documents until
their migration to D1 or R2 has been verified.

`d1-schema.sql` is the single canonical schema source. `d1-reference-schema.sql` remains as a comment-only
compatibility placeholder for older tooling; deployment applies only the canonical schema to avoid duplicate DDL
and an unnecessary D1 execution.

Backend tests use `D1_LOCAL_SQLITE_PATH` to select an isolated database. Vitest creates and seeds it from the
same canonical SQL before running tests, then removes the test database. Missing explicit paths fail rather
than falling back to a developer's Wrangler database.
