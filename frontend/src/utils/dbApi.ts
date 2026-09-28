import type { DBHealthData, DBTableData, DBTestConnectionResponse } from '../types/dbView';
import frontendLogger from './logger';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const dbApiClient = {
  async getDBStatus(): Promise<DBHealthData> {
    frontendLogger.debug('Fetching database status & health telemetry');
    const res = await fetch(`${API_BASE}/api/db/status`);
    const json = await res.json();
    return json.data;
  },

  async getDBMetrics(): Promise<Record<string, unknown>> {
    frontendLogger.debug('Fetching database optimization metrics');
    const res = await fetch(`${API_BASE}/api/db/metrics`);
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
    const res = await fetch(`${API_BASE}/api/db/tables?${query.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async testDBConnection(): Promise<DBTestConnectionResponse> {
    frontendLogger.info('Testing live database round-trip ping');
    const res = await fetch(`${API_BASE}/api/db/test-connection`, { method: 'POST' });
    return await res.json();
  }
};
