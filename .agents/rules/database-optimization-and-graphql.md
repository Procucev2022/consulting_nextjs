# Mandatory Database Optimization & GraphQL Integration Policy

## 1. Database Query Auditing
- **Execution Efficiency**: Audit all database queries and ORM operations for execution duration (`durationMs`), operation type, model name, cache hit/miss status, and affected row counts.
- **Slow Query Alerts**: Trigger structured warning logs for queries exceeding `SLOW_QUERY_THRESHOLD_MS` (100ms) with execution context and parameters.
- **Observability Metrics**: Maintain aggregate runtime metrics (total queries, cache hit ratio, slow queries count, average latency).

## 2. Minimizing Database Compute Hours & Resource Usage
- **Query Caching**: Implement in-memory TTL caching (`DEFAULT_CACHE_TTL_MS`) for read-heavy, low-churn datasets (tenants, taxonomy trees, spend categories, benchmark profiles) to eliminate redundant round-trips and drastically minimize cloud database compute hours.
- **Cache Invalidation**: Enforce automated invalidation on write mutations (updates, file ingestions, record overrides, supplier merges, opportunity deployments).
- **Prisma Schema Indexing**: Add database indexes to high-frequency filter and relation columns (`tenant_id`, `resolved`, `category`, `vendor_name`, `status`) to eliminate full-table scans.
- **Projection Selection**: Use selective field projection (`select`) rather than fetching entire wide tables.
- **Connection Management**: Reuse connections and manage idle timeouts to reduce connection handshake compute overhead.

## 3. GraphQL Integration for Streamlined Data Fetching
- **Unified GraphQL API**: Mount `/api/graphql` to provide query and mutation capabilities.
- **Composite Queries**: Provide single round-trip data fetching (e.g. `dashboardOverview`) to retrieve all initial dashboard datasets in one network call, eliminating HTTP request waterfalls.
- **Validation & Error Handling**: Enforce strict query schema validation, structured error logging, and execution performance tracking.

## 4. Constants & Types Isolation
- Schemas and query strings MUST reside in dedicated constants files (`constants/graphql.ts`, `constants/db.ts`).
- Contexts, resolver types, and payload models MUST reside in dedicated type files (`types/graphql.ts`, `types/db.ts`).

## 5. Strict 90% Unit Test Code Coverage
- Maintain >= 90% unit test coverage individually across statements, branches, functions, and lines (`perFile: true`) on all database and GraphQL utilities.
