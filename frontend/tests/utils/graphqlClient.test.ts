import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeGraphQL, fetchDashboardOverview } from '../../src/utils/graphqlClient';
import { DASHBOARD_OVERVIEW_QUERY } from '../../src/constants/graphql';

describe('Frontend GraphQL Client Utility', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should successfully execute a GraphQL query and return data', async () => {
    const mockData = { tenant: { enterprise_name: 'Test Corp' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData })
    } as any);

    const result = await executeGraphQL<typeof mockData>('{ tenant { enterprise_name } }');
    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/graphql'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' })
      })
    );
  });

  it('should support custom endpoint and custom headers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { success: true } })
    } as any);

    const result = await executeGraphQL(
      '{ test }',
      { var1: 'val1' },
      {
        endpoint: 'http://custom-api/graphql',
        headers: { Authorization: 'Bearer token-123' }
      }
    );

    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://custom-api/graphql',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123'
        })
      })
    );
  });

  it('should throw an error on non-ok HTTP responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway'
    } as any);

    await expect(executeGraphQL('{ tenant }')).rejects.toThrow('GraphQL HTTP error: 502 Bad Gateway');
  });

  it('should throw an error when GraphQL response returns execution errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        errors: [{ message: 'Field "foo" not found' }, { message: 'Syntax error' }]
      })
    } as any);

    await expect(executeGraphQL('{ invalid }')).rejects.toThrow(
      'GraphQL query execution failed: Field "foo" not found, Syntax error'
    );
  });

  it('should throw an error when GraphQL response has no data field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    } as any);

    await expect(executeGraphQL('{ tenant }')).rejects.toThrow('GraphQL response contained no data');
  });

  it('should rethrow network or fetch failures', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection dropped'));

    await expect(executeGraphQL('{ tenant }')).rejects.toThrow('Network connection dropped');
  });

  describe('fetchDashboardOverview', () => {
    it('should invoke executeGraphQL with DASHBOARD_OVERVIEW_QUERY and return overview data', async () => {
      const mockOverview = {
        tenant: { enterprise_name: 'Apex Dynamics' },
        categories: [],
        opportunities: [],
        funnelStages: [],
        ingestionQueue: [],
        validationRecords: [],
        queryMetrics: {
          totalQueries: 10,
          slowQueries: 0,
          cacheHitRatio: 90,
          averageDurationMs: 2.5
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { dashboardOverview: mockOverview }
        })
      } as any);

      const overview = await fetchDashboardOverview();
      expect(overview).toEqual(mockOverview);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/graphql'),
        expect.objectContaining({
          body: JSON.stringify({
            query: DASHBOARD_OVERVIEW_QUERY,
            variables: undefined
          })
        })
      );
    });
  });
});
