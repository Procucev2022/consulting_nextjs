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
including original currencies, FX rates, sources, statuses and source checksums. They are not fabricated
into weekly indices. This preserves the data; the retired forensic PCBI analytical workflow still needs
an explicit Worker implementation before those historical records can drive its former analyses.

From the repository root:

```powershell
npm --prefix backend run db:seed:d1
```

To import into the configured Cloudflare database, set `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` in `backend/.env`, then run the remote command. The script loads that ignored local
environment file before invoking Wrangler; do not commit or paste the token into source files:

```powershell
npm --prefix backend run db:seed:d1:remote
```

`D1_ENV` selects the Wrangler environment (default `dev`); `D1_DATABASE_NAME` selects the database.
The base and `dev` bindings target `consulting_dev`; `prod` and `production` remain bound to the existing
`consulting-db` until a production D1 database is configured. Override `D1_DATABASE_NAME` when targeting
a different database.

Development and production deployment workflows apply the idempotent schema before deploying the Worker.
They do not import customer/reference seed data automatically. Import the canonical seed into each target
database explicitly before exposing its data-dependent features; seeding development does not seed production.
The local `npm run quality` and pre-commit hook synchronize only the local D1 schema.

The importer validates the manifest before changing the database and splits SQL at complete statement
boundaries. Inserts preserve existing rows. Guarded corrections replace known, unchanged legacy fixtures;
they do not replace records whose source values have been edited. A failed import can be rerun.

Transactions retain their assessment and source-row identifiers. Legacy rows without verified assessment
lineage have a null assessment ID; they are never attached to an unrelated assessment. Runtime caches isolate
database bindings and assessment scopes. Assessment snapshots preserve fields and composite version/run IDs
that the legacy scalar schema could not represent.

The checked-in SQL files are the canonical migration and recovery inputs. The JSON source copies used to generate
those rows are not runtime dependencies and have been removed. Verify the remote table counts and representative
lookups after importing the SQL files. Preserve active assessment stores and uploaded customer documents until
their migration to D1 or R2 has been verified.

Backend tests use `D1_LOCAL_SQLITE_PATH` to select an isolated database. Vitest creates and seeds it from the
same canonical SQL before running tests, then removes the test database. Missing explicit paths fail rather
than falling back to a developer's Wrangler database.
