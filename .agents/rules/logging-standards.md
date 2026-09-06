# Structured & Centralized Logging Standards

## 1. Zero Raw Console Rule
Never invoke raw `console.log`, `console.info`, `console.warn`, or `console.error` directly in production or service code. All log calls must go through the centralized logger:
- Backend: `backend/src/utils/logger.ts` (`logger.debug`, `logger.info`, `logger.warn`, `logger.error`)
- Frontend: `frontend/src/utils/logger.ts` (`frontendLogger.debug`, `frontendLogger.info`, `frontendLogger.warn`, `frontendLogger.error`)

## 2. Structured JSON Entry Schema
Every log entry emitted by the logger follows a structured, searchable schema:
```json
{
  "timestamp": "2026-09-06T15:00:00.000Z",
  "level": "info",
  "service": "consulting-backend",
  "environment": "development",
  "message": "Tenant settings updated",
  "requestId": "req-1725625200000-abcd",
  "context": {
    "tenantId": "TNT_ENTERPRISE_001",
    "region": "India"
  },
  "durationMs": 12.4,
  "error": {
    "name": "Error",
    "message": "...",
    "stack": "..."
  }
}
```

## 3. Log Levels & Usage
- **DEBUG**: Verbose diagnostic traces, query parameters, granular flow checkpoints.
- **INFO**: Lifecycle events, startup/shutdown, incoming HTTP requests, state updates, successful transactions.
- **WARN**: Degraded state fallbacks, non-fatal deprecation, retry attempts, recoverable validation anomalies.
- **ERROR**: Exceptions, unhandled server errors, database connectivity errors with full error stack.

## 4. Local Persistence & Searchability
- When running locally, all logs are written to the local file system under `logs/`:
  - `logs/app.log`: Combined log stream for all levels >= configured threshold.
  - `logs/error.log`: Errors only.
  - `logs/app-YYYY-MM-DD.log`: Daily partitioned log files.
- Logs are indexed/searchable via the `logger.searchLogs()` API and HTTP endpoint `/api/logs`.

## 5. Storage Management & Compliance (Automatic Purging)
- Log storage must be pruned automatically to avoid disk exhaustion and maintain compliance.
- The purging routine evaluates log files against `LOG_RETENTION_DAYS` (default: 14 days) and removes expired dated files.
- The purge routine runs at initialization, on scheduled intervals, and can be triggered via `POST /api/logs/purge`.
