import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dbApiClient } from '../../src/utils/dbApi';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('dbApiClient', () => {
  it('loads the live D1 schema and rejects unavailable database responses', async () => {
    const data = [{ entity_name: 'D1Only', ddl: 'CREATE TABLE D1Only (id TEXT)', primary_attributes: 'id', system_usage: 'D1', sample_records: [] }];
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data })));
    await expect(dbApiClient.getDBSchema()).resolves.toEqual(data);
    expectApiFetchCall(fetch, '/api/db/schema');
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 503 }));
    await expect(dbApiClient.getDBSchema()).rejects.toThrow(UI_STRINGS.databaseData.schemaLoadFailed);
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [{ ddl: null }] })));
    await expect(dbApiClient.getDBSchema()).rejects.toThrow(UI_STRINGS.databaseData.invalidData);
  });
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getDBStatus calls GET /api/db/status and returns data', async () => {
    const mockHealth = { status: 'healthy', latencyMs: 12 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockHealth })
    });

    const res = await dbApiClient.getDBStatus();
    expectApiFetchCall(global.fetch, '/api/db/status');
    expect(res).toEqual(mockHealth);
  });

  it('getDBMetrics calls GET /api/db/metrics and returns data', async () => {
    const mockMetrics = { queryCount: 50 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMetrics })
    });

    const res = await dbApiClient.getDBMetrics();
    expectApiFetchCall(global.fetch, '/api/db/metrics');
    expect(res).toEqual(mockMetrics);
  });

  it('getDBTableData calls GET /api/db/tables with query params', async () => {
    const mockTableData = { rows: [], totalCount: 0 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockTableData })
    });

    const res = await dbApiClient.getDBTableData('tenants', 2, 10, 'search-term');
    expectApiFetchCall(global.fetch, '/api/db/tables?table=tenants&page=2&limit=10&search=search-term');
    expect(res).toEqual(mockTableData);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockTableData })
    });
    const resDefault = await dbApiClient.getDBTableData('tenants');
    expectApiFetchCall(global.fetch, '/api/db/tables?table=tenants&page=1&limit=20');
    expect(resDefault).toEqual(mockTableData);
  });

  it('testDBConnection calls POST /api/db/test-connection', async () => {
    const mockResponse = { success: true, message: 'Connected' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const res = await dbApiClient.testDBConnection();
    expectApiFetchCall(global.fetch, '/api/db/test-connection', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockResponse);
  });
});
