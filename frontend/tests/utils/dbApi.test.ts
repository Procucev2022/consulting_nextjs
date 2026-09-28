import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dbApiClient } from '../../src/utils/dbApi';

describe('dbApiClient', () => {
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
    expect(global.fetch).toHaveBeenCalledWith('/api/db/status');
    expect(res).toEqual(mockHealth);
  });

  it('getDBMetrics calls GET /api/db/metrics and returns data', async () => {
    const mockMetrics = { queryCount: 50 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMetrics })
    });

    const res = await dbApiClient.getDBMetrics();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/metrics');
    expect(res).toEqual(mockMetrics);
  });

  it('getDBTableData calls GET /api/db/tables with query params', async () => {
    const mockTableData = { rows: [], totalCount: 0 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockTableData })
    });

    const res = await dbApiClient.getDBTableData('tenants', 2, 10, 'search-term');
    expect(global.fetch).toHaveBeenCalledWith('/api/db/tables?table=tenants&page=2&limit=10&search=search-term');
    expect(res).toEqual(mockTableData);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockTableData })
    });
    const resDefault = await dbApiClient.getDBTableData('tenants');
    expect(global.fetch).toHaveBeenCalledWith('/api/db/tables?table=tenants&page=1&limit=20');
    expect(resDefault).toEqual(mockTableData);
  });

  it('testDBConnection calls POST /api/db/test-connection', async () => {
    const mockResponse = { success: true, message: 'Connected' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const res = await dbApiClient.testDBConnection();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/test-connection', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockResponse);
  });
});
