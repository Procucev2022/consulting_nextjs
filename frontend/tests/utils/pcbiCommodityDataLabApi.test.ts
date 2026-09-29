import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pcbiCommodityDataLabApi,
  PCBICommodityDataLabApiClient
} from '../../src/utils/pcbiCommodityDataLabApi';

describe('PCBICommodityDataLabApiClient Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('should initialize with custom and default baseUrl', () => {
    const defaultClient = new PCBICommodityDataLabApiClient();
    expect(defaultClient).toBeDefined();

    const customClient = new PCBICommodityDataLabApiClient('http://localhost:5000');
    expect(customClient).toBeDefined();
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
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/pcbi/data-lab/dashboard'));
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
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/pcbi/data-lab/queue'));
    expect(res).toEqual(mockData);
  });

  it('getQueue should throw on HTTP failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    await expect(pcbiCommodityDataLabApi.getQueue()).rejects.toThrow('Failed to fetch Commodity Research Queue: HTTP 404');
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
      expect.stringContaining('/api/admin/pcbi/data-lab/commodity/PCBI-FEMO-65-001?tab=SOURCE_REGISTER')
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
      fileType: 'CSV' as const
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
        fileType: 'CSV'
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
        fileType: 'CSV'
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
        fileType: 'CSV'
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

