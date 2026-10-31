import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pcbiCommodityDataLabApi,
  PCBICommodityDataLabApiClient
} from '../../src/utils/pcbiCommodityDataLabApi';
import { authApiClient } from '../../src/utils/authApi';

describe('PCBICommodityDataLabApiClient Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authApiClient, 'getStoredToken').mockReturnValue(null);
    global.fetch = vi.fn();
  });

  it('should initialize with custom and default baseUrl', () => {
    const defaultClient = new PCBICommodityDataLabApiClient();
    expect(defaultClient).toBeDefined();

    const customClient = new PCBICommodityDataLabApiClient('http://localhost:5000');
    expect(customClient).toBeDefined();
  });

  it('includes the authenticated administrator token on protected database requests', async () => {
    vi.mocked(authApiClient.getStoredToken).mockReturnValue('d1-admin-session');
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, metrics: {} }) } as Response);
    await pcbiCommodityDataLabApi.getDashboard();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/pcbi/data-lab/dashboard'), {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer d1-admin-session' }
    });
  });

  it('getDashboard should fetch /api/admin/pcbi/data-lab/dashboard', async () => {
    const mockData = {
      success: true,
      metrics: {
        totalCommodities: 10,
        productionReadyCount: 3,
        partialHistoryCount: 2,
        noHistoryCount: 2,
        missingCount: 1,
        sourceUnverifiedCount: 6,
        methodologyPendingCount: 7,
        specificationMismatchCount: 1,
        frequencyMismatchCount: 1,
        highImpactGapsCount: 2,
        queueByPriority: { p1Critical: 2, p2High: 2, p3Medium: 3, p4Low: 3 }
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiCommodityDataLabApi.getDashboard();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/pcbi/data-lab/dashboard'), { headers: { 'Content-Type': 'application/json' } });
    expect(res).toEqual(mockData);
  });

  it('getDashboard should throw on HTTP failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    await expect(pcbiCommodityDataLabApi.getDashboard()).rejects.toThrow('Failed to fetch Data Lab dashboard: HTTP 500');
  });

  it('getQueue should fetch /api/admin/pcbi/data-lab/queue', async () => {
    const mockData = {
      success: true,
      total: 1,
      queue: [{ commodity: 'Ferro Molybdenum 65%', pcbiId: 'PCBI-FEMO-65-001' }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiCommodityDataLabApi.getQueue();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/pcbi/data-lab/queue'), { headers: { 'Content-Type': 'application/json' } });
    expect(res).toEqual(mockData);
  });

  it('getQueue should throw on HTTP failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(pcbiCommodityDataLabApi.getQueue()).rejects.toThrow('Failed to fetch Commodity Research Queue: HTTP 404');
  });

  it('assignResearcher persists an owner or clears it through the admin D1 route', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as Response);
    await expect(pcbiCommodityDataLabApi.assignResearcher('PCBI-001', 'owner@example.test')).resolves.toEqual({ success: true });
    await expect(pcbiCommodityDataLabApi.assignResearcher('PCBI-001', null)).resolves.toEqual({ success: true });
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/data-lab/assignment'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ pcbiId: 'PCBI-001', assignee: 'owner@example.test' })
    }));
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/data-lab/assignment'), expect.objectContaining({
      method: 'POST', body: JSON.stringify({ pcbiId: 'PCBI-001', assignee: null })
    }));
  });

  it('reports assignment validation and D1 request errors', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ message: 'Invalid assignment' }) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => { throw new Error('invalid response'); } } as unknown as Response);
    await expect(pcbiCommodityDataLabApi.assignResearcher('PCBI-001', 'owner')).rejects.toThrow('Invalid assignment');
    await expect(pcbiCommodityDataLabApi.assignResearcher('PCBI-001', null)).rejects.toThrow('Failed to save the research owner: HTTP 503');
  });

  it('loads persisted sources and promotion history from D1 routes', async () => {
    const sources = { success: true, total: 0, sources: [] };
    const history = { success: true, total: 0, versions: [] };
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => sources } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => history } as Response);
    await expect(pcbiCommodityDataLabApi.getSources()).resolves.toEqual(sources);
    await expect(pcbiCommodityDataLabApi.getVersionHistory()).resolves.toEqual(history);
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/data-lab/sources'), { headers: { 'Content-Type': 'application/json' } });
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/data-lab/version-history'), { headers: { 'Content-Type': 'application/json' } });
  });

  it('reports HTTP failures when loading the source register or promotion history', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response);
    await expect(pcbiCommodityDataLabApi.getSources()).rejects.toThrow('Failed to fetch PCBI evidence sources: HTTP 503');
    await expect(pcbiCommodityDataLabApi.getVersionHistory()).rejects.toThrow('Failed to fetch PCBI catalog promotion history: HTTP 503');
  });

  it('getCommodityWorkspace should fetch workspace with query parameter', async () => {
    const mockData = {
      success: true,
      workspace: { overview: { commodityName: 'Ferro Molybdenum 65%' } }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiCommodityDataLabApi.getCommodityWorkspace('PCBI-FEMO-65-001', 'SOURCE_REGISTER');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/pcbi/data-lab/commodity/PCBI-FEMO-65-001?tab=SOURCE_REGISTER'),
      { headers: { 'Content-Type': 'application/json' } }
    );
    expect(res).toEqual(mockData);
  });

  it('getCommodityWorkspace should throw on HTTP failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(pcbiCommodityDataLabApi.getCommodityWorkspace('UNKNOWN')).rejects.toThrow(
      'Failed to fetch workspace for UNKNOWN: HTTP 404'
    );
  });

  it('detectUploadDomain should post to /api/admin/pcbi/data-lab/detect-domain', async () => {
    const mockData = {
      success: true,
      detection: { detectedDomain: 'CUSTOMER_PURCHASE_HISTORY', isAllowedInTarget: false }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiCommodityDataLabApi.detectUploadDomain('Customer_PO.xlsx', 'line item', 'COMMODITY_DATA_LAB');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/pcbi/data-lab/detect-domain'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'Customer_PO.xlsx',
          fileContentSnippet: 'line item',
          targetArea: 'COMMODITY_DATA_LAB'
        })
      })
    );
    expect(res).toEqual(mockData);
  });

  it('detectUploadDomain should throw on HTTP failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400
    });

    await expect(pcbiCommodityDataLabApi.detectUploadDomain('test.csv')).rejects.toThrow('Failed to detect domain: HTTP 400');
  });

  it('uploadCommoditySource should post to /api/admin/pcbi/data-lab/upload-source', async () => {
    const mockData = {
      success: true,
      source: { sourceId: 'SRC-001' },
      banner: 'COMMODITY DATA UPLOAD — NOT PCBI MASTER',
      message: 'Source staged'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const payload = {
      commodityId: 'COM-MET-FMO',
      pcbiId: 'PCBI-FEMO-65-001',
      sourceName: 'MMR',
      publisher: 'MMR Pub',
      documentName: 'MMR.csv',
      fileType: 'CSV' as const,
      fileBase64: 'ZGF0ZQ=='
    };

    const res = await pcbiCommodityDataLabApi.uploadCommoditySource(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/pcbi/data-lab/upload-source'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
    expect(res).toEqual(mockData);
  });

  it('uploadCommoditySource should throw on HTTP failure with server message', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'CUSTOMER DATA DETECTED' })
    });

    await expect(
      pcbiCommodityDataLabApi.uploadCommoditySource({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        sourceName: 'Test',
        publisher: 'Test Pub',
        documentName: 'Customer_PO.csv',
        fileType: 'CSV',
        fileBase64: 'ZGF0ZQ=='
      })
    ).rejects.toThrow('CUSTOMER DATA DETECTED');
  });

  it('approveCommodityData should post to /api/admin/pcbi/data-lab/approve', async () => {
    const mockData = {
      success: true,
      result: {
        success: true,
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approvalStatus: 'ADMIN_APPROVED',
        catalogVersionCreated: true,
        catalogVersionId: 'V1.7.1',
        message: 'Approved'
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const res = await pcbiCommodityDataLabApi.approveCommodityData({
      commodityId: 'COM-MET-FMO',
      pcbiId: 'PCBI-FEMO-65-001',
      approverName: 'Admin'
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/pcbi/data-lab/approve'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
    expect(res).toEqual(mockData);
  });

  it('approveCommodityData should throw on HTTP failure with server message', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Approval rejected by gate' })
    });

    await expect(
      pcbiCommodityDataLabApi.approveCommodityData({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approverName: 'Admin'
      })
    ).rejects.toThrow('Approval rejected by gate');
  });

  it('handles fallback error message and non-Error rethrow in uploadCommoditySource', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Failed to parse json');
      }
    });

    await expect(
      pcbiCommodityDataLabApi.uploadCommoditySource({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        sourceName: 'Test',
        publisher: 'Test',
        documentName: 'test.csv',
        fileType: 'CSV',
        fileBase64: 'ZGF0ZQ=='
      })
    ).rejects.toThrow('Upload failed with HTTP 500');

    (global.fetch as any).mockRejectedValueOnce('Network connection failed');
    await expect(
      pcbiCommodityDataLabApi.uploadCommoditySource({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        sourceName: 'Test',
        publisher: 'Test',
        documentName: 'test.csv',
        fileType: 'CSV',
        fileBase64: 'ZGF0ZQ=='
      })
    ).rejects.toBe('Network connection failed');
  });

  it('handles fallback error message and non-Error rethrow in approveCommodityData', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Failed to parse json');
      }
    });

    await expect(
      pcbiCommodityDataLabApi.approveCommodityData({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approverName: 'Admin'
      })
    ).rejects.toThrow('Approval failed with HTTP 500');

    (global.fetch as any).mockRejectedValueOnce('Non-error string rejected');
    await expect(
      pcbiCommodityDataLabApi.approveCommodityData({
        commodityId: 'COM-MET-FMO',
        pcbiId: 'PCBI-FEMO-65-001',
        approverName: 'Admin'
      })
    ).rejects.toBe('Non-error string rejected');
  });

  it('handles non-Error rejection in getDashboard, getQueue, and getCommodityWorkspace', async () => {
    (global.fetch as any).mockRejectedValueOnce('Network offline');
    await expect(pcbiCommodityDataLabApi.getDashboard()).rejects.toBe('Network offline');

    (global.fetch as any).mockRejectedValueOnce('Queue offline');
    await expect(pcbiCommodityDataLabApi.getQueue()).rejects.toBe('Queue offline');

    (global.fetch as any).mockRejectedValueOnce('Workspace offline');
    await expect(pcbiCommodityDataLabApi.getCommodityWorkspace('PCBI-001')).rejects.toBe('Workspace offline');

    (global.fetch as any).mockRejectedValueOnce('Detect offline');
    await expect(pcbiCommodityDataLabApi.detectUploadDomain('file.xlsx')).rejects.toBe('Detect offline');
  });
});

