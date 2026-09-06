# Mandatory Automated Performance Optimization Policy

## 1. Continuous Performance Auditing & Latency Profiling
- Continuously audit, identify, and apply automated performance optimizations across the entire codebase.
- Monitor critical rendering paths, API execution latency, and database query durations.
- Automatically flag and resolve operations exceeding configured latency thresholds (`SLOW_QUERY_THRESHOLD_MS` = 100ms, API response thresholds).

## 2. Critical Paths, Code-Splitting & Lazy Loading
- **Dynamic Imports**: Employ Next.js dynamic imports (`next/dynamic`) or `React.lazy` with lightweight fallbacks for all large modals, charting engines, and non-critical UI surfaces.
- **Rendering Efficiency**: Proactively memoize intensive transformations and derived state (`useMemo`, `useCallback`) to avoid redundant re-renders.
- **Micro-tasks & Deferred Execution**: Defer heavy computation outside critical initial render cycles.

## 3. Resource Caching & Data Layer Efficiency
- **Multi-tier Caching**: Implement in-memory TTL caching (`DEFAULT_CACHE_TTL_MS`) for read-heavy and computationally expensive operations.
- **Automated Cache Invalidation**: Enforce automatic write-mutation invalidation to prevent stale data.
- **Projection & Network Optimization**: Use selective field projection (`select`) rather than full entity scans; leverage composite GraphQL queries (`dashboardOverview`) to eliminate request waterfalls.

## 4. Benchmark Validation via Quality Pipeline
- Validate all performance improvements against established bundle size and latency benchmarks via the quality check pipeline:
  - First Load JS shared chunks must remain lean (<120 kB).
  - Page routes must maintain minimal initial bundles.
  - Full production builds (`npm run build`) must complete without warnings or bloating.

## 5. Strict 90% Unit Test Code Coverage
- Every performance optimization utility, cache manager, dynamic loader, and profiling helper must maintain at least **90% unit test code coverage** individually across statements, branches, functions, and lines (`perFile: true`).
