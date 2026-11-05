import { apiFetch } from './apiFetch';
import type { DBHealthData, DBTableData, DBTestConnectionResponse, DatabaseSchemaEntity } from '../types/dbView';
import frontendLogger from './logger';
import { UI_STRINGS } from '../constants/uiStrings';
import { databaseSchemaResponseSchema } from '../constants/validation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const dbApiClient = {
  async getDBSchema(): Promise<DatabaseSchemaEntity[]> {
    const res = await apiFetch(`${API_BASE}/api/db/schema`);
    if (!res.ok) throw new Error(UI_STRINGS.databaseData.schemaLoadFailed);
    const json = await res.json();
    const parsed = databaseSchemaResponseSchema.safeParse(json);
    if (!parsed.success) throw new Error(UI_STRINGS.databaseData.invalidData);
    return parsed.data.data;
  },
  async getDBStatus(): Promise<DBHealthData> {
    frontendLogger.debug('Fetching database status & health telemetry');
    const res = await apiFetch(`${API_BASE}/api/db/status`);
    const json = await res.json();
    return json.data;
  },

  async getDBMetrics(): Promise<Record<string, unknown>> {
    frontendLogger.debug('Fetching database optimization metrics');
    const res = await apiFetch(`${API_BASE}/api/db/metrics`);
    const json = await res.json();
    return json.data;
  },

  async getDBTableData(table: string, page = 1, limit = 20, search = ''): Promise<DBTableData> {
    frontendLogger.debug('Fetching database table data', { table, page, limit, search });
    const query = new URLSearchParams({
      table,
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {})
    });
    const res = await apiFetch(`${API_BASE}/api/db/tables?${query.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async testDBConnection(): Promise<DBTestConnectionResponse> {
    frontendLogger.info('Testing live database round-trip ping');
    const res = await apiFetch(`${API_BASE}/api/db/test-connection`, { method: 'POST' });
    return await res.json();
  }
};
