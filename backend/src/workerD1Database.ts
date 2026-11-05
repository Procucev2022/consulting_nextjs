import { D1_DATABASE_STATUS_QUERY, D1_SCHEMA_QUERY } from './constants/d1';
import type { CloudflareEnvironment } from './types/cloudflare';
import type { D1SchemaQueryRow, D1SchemaTable } from './types/d1';
import { getD1ReferenceDataCacheSize } from './services/d1ReferenceDataCache';
import { getD1RuntimeMetrics } from './services/d1QueryTelemetry';
import logger from './utils/logger';
import { apiData, jsonResponse } from './workerHttp';
import { requireD1Binding } from './workerD1';

export const handleDatabaseRoute = async (
  request: Request,
  environment: CloudflareEnvironment
): Promise<Response> => {
  const path = new URL(request.url).pathname;
  if (path.endsWith('/schema')) {
    const database = requireD1Binding(environment.DB);
    const start = Date.now();
    const schemaRows = await database.prepare(D1_SCHEMA_QUERY).all<D1SchemaQueryRow>();
    const tables = new Map<string, D1SchemaTable>();
    for (const row of schemaRows.results) {
      const table = tables.get(row.table_name) || {
        entity_name: row.table_name,
        primary_attributes: '',
        system_usage: 'Cloudflare D1',
        sample_records: [],
        ddl: row.table_sql
      };
      table.primary_attributes = table.primary_attributes
        ? `${table.primary_attributes}, ${row.column_name}`
        : row.column_name;
      tables.set(row.table_name, table);
    }
    const data = [...tables.values()];
    logger.info('Read D1 database schema', {
      operation: 'SELECT', model: 'sqlite_master', affectedRows: data.length, cache: 'miss',
      durationMs: Date.now() - start, requestId: request.headers.get('x-request-id')
    });
    return apiData(data, request);
  }
  if (path.endsWith('/init') || path.endsWith('/seed')) {
    return jsonResponse({
      success: false,
      message: 'D1 schema and seed are deployment operations. Run the D1 migration and seed commands before serving traffic.'
    }, 405, request);
  }
  if (path.endsWith('/status')) {
    const database = environment.DB;
    if (!database) return jsonResponse({ success: false, message: 'Cloudflare D1 binding DB is not configured.' }, 503, request);
    requireD1Binding(database);
    const statusRows = await database.prepare(D1_DATABASE_STATUS_QUERY).all<{ name: string; totalRecords: number }>();
    return apiData({
      isConnected: true,
      provider: 'Cloudflare D1',
      databaseName: environment.D1_DATABASE_NAME || null,
      serverTime: new Date().toISOString(),
      tablesCount: statusRows.results.length,
      totalRecords: Number(statusRows.results[0]?.totalRecords || 0)
    }, request);
  }
  if (path.endsWith('/test-connection')) {
    return apiData({ success: Boolean(environment.DB), provider: 'Cloudflare D1' }, request);
  }
  return apiData({
    metrics: getD1RuntimeMetrics(environment.DB),
    cacheSize: getD1ReferenceDataCacheSize(environment.DB)
  }, request);
};
