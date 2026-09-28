import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pcbiAdminApi } from '../../src/utils/pcbiAdminApi';

describe('PCBI Admin API Client (frontend/src/utils/pcbiAdminApi.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getVersions should fetch and return versions list', async () => {
    const mockData = {
      success: true,
      total: 1,
      active_version: 'V1.0',
      versions: [{ version: 'V1.0', status: 'PUBLISHED' }]
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiAdminApi.getVersions();
    expect(res.success).toBe(true);
    expect(res.versions).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/pcbi/versions'));
  });

  it('getVersions should throw on fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(pcbiAdminApi.getVersions()).rejects.toThrow('Failed to fetch PCBI versions');
  });

  it('getVersion should return specific version details', async () => {
    const mockData = {
      success: true,
      version: { version: 'V1.0', status: 'PUBLISHED' }
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiAdminApi.getVersion('V1.0');
    expect(res.version.version).toBe('V1.0');
  });

  it('getVersion should throw on 404', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(pcbiAdminApi.getVersion('V99')).rejects.toThrow('Failed to fetch version V99');
  });

  it('importMaster should post payload and return import result', async () => {
    const mockResult = {
      success: true,
      version: 'V2.0',
      upload_id: 'up-123',
      successful_records: 100
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResult
    });

    const payload = {
      version: 'V2.0',
      file_name: 'test.xlsx',
      file_size_mb: 2.0,
      uploaded_by: 'Admin',
      worksheets: [],
      mappings: {},
      benchmarks: [],
      weeklyIndices: [],
      constituents: [],
      sources: [],
      unspscMappings: [],
      validationSummary: {
        totalRecords: 100,
        validRecords: 100,
        warningRecords: 0,
        errorRecords: 0,
        blockingErrorCount: 0,
        warningCount: 0,
        aQualityCount: 80,
        bQualityCount: 20,
        cQualityCount: 0,
        avgBenchmarkability: 75,
        dateStart: '2020-04-01',
        dateEnd: '2026-07-31',
        issues: []
      }
    };

    const res = await pcbiAdminApi.importMaster(payload);
    expect(res.success).toBe(true);
    expect(res.version).toBe('V2.0');
  });

  it('importMaster should throw on server failure with error message', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid payload' })
    });

    await expect(
      pcbiAdminApi.importMaster({
        version: 'V2.0',
        file_name: '',
        file_size_mb: 0,
        uploaded_by: '',
        worksheets: [],
        mappings: {},
        benchmarks: [],
        weeklyIndices: [],
        constituents: [],
        sources: [],
        unspscMappings: [],
        validationSummary: {
          totalRecords: 0,
          validRecords: 0,
          warningRecords: 0,
          errorRecords: 0,
          blockingErrorCount: 0,
          warningCount: 0,
          aQualityCount: 0,
          bQualityCount: 0,
          cQualityCount: 0,
          avgBenchmarkability: 70,
          dateStart: null,
          dateEnd: null,
          issues: []
        }
      })
    ).rejects.toThrow('Invalid payload');
  });

  it('publishVersion should send post request and return activation metrics', async () => {
    const mockPublish = {
      success: true,
      activeVersion: 'V2.0',
      metrics: { benchmark_count: 290 }
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockPublish
    });

    const res = await pcbiAdminApi.publishVersion('V2.0', 'Sriman Admin');
    expect(res.success).toBe(true);
    expect(res.activeVersion).toBe('V2.0');
  });

  it('publishVersion should throw on server failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Cannot publish' })
    });

    await expect(pcbiAdminApi.publishVersion('V99', 'Admin')).rejects.toThrow('Cannot publish');
  });

  it('should support custom baseUrl in constructor and fallback error strings', async () => {
    const { PCBIAdminApiClient } = await import('../../src/utils/pcbiAdminApi');
    const customClient = new PCBIAdminApiClient('http://custom-host:8080');

    // Test import error with non-JSON response body
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('Malformed JSON');
      }
    });

    const dummyPayload = {
      version: 'V2.0',
      file_name: 'test.xlsx',
      file_size_mb: 1,
      uploaded_by: 'Admin',
      worksheets: [],
      mappings: {},
      benchmarks: [],
      weeklyIndices: [],
      constituents: [],
      sources: [],
      unspscMappings: [],
      validationSummary: {
        totalRecords: 0,
        validRecords: 0,
        warningRecords: 0,
        errorRecords: 0,
        blockingErrorCount: 0,
        warningCount: 0,
        aQualityCount: 0,
        bQualityCount: 0,
        cQualityCount: 0,
        avgBenchmarkability: 0,
        dateStart: '',
        dateEnd: '',
        issues: []
      }
    };

    await expect(customClient.importMaster(dummyPayload)).rejects.toThrow('Import failed with HTTP 502');

    // Test publish error with non-JSON response body
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Internal Server Error');
      }
    });

    await expect(customClient.publishVersion('V1.0', 'Admin')).rejects.toThrow('Publish failed with HTTP 500');

    // Test non-Error exception logging
    global.fetch = vi.fn().mockRejectedValueOnce('Network down');
    await expect(customClient.getVersions()).rejects.toBe('Network down');

    global.fetch = vi.fn().mockRejectedValueOnce('Network down');
    await expect(customClient.getVersion('V1')).rejects.toBe('Network down');

    global.fetch = vi.fn().mockRejectedValueOnce('Network down');
    await expect(customClient.importMaster(dummyPayload)).rejects.toBe('Network down');

    global.fetch = vi.fn().mockRejectedValueOnce('Network down');
    await expect(customClient.publishVersion('V1', 'Admin')).rejects.toBe('Network down');
  });
});

