import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ingestionApiClient } from '../../src/utils/ingestionApi';

describe('ingestionApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getIngestionData fetches queue and validation records with or without buyerId', async () => {
    const mockData = { queue: [], validationRecords: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    });

    const res1 = await ingestionApiClient.getIngestionData();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion');
    expect(res1).toEqual(mockData);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    });
    const res2 = await ingestionApiClient.getIngestionData('BUYER-100');
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion?buyerId=BUYER-100');
    expect(res2).toEqual(mockData);
  });

  it('addIngestionFile posts valid file and throws on validation failure', async () => {
    const mockRes = [{ doc_id: 'DOC-1' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.addIngestionFile({
      file_name: 'spend.xlsx',
      file_type: 'xlsx'
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockRes);

    await expect(ingestionApiClient.addIngestionFile({
      file_name: '',
      file_type: ''
    })).rejects.toThrow('Invalid file data');
  });

  it('uploadDocumentToObjectStore posts payload to upload-object', async () => {
    const mockRes = { success: true, ingestion: { doc_id: 'DOC-1' }, validationCount: 5 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes
    });

    const res = await ingestionApiClient.uploadDocumentToObjectStore({
      fileName: 'test.csv',
      fileType: 'csv'
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/upload-object', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockRes);
  });

  it('deleteIngestionFile calls DELETE on /api/ingestion/:id', async () => {
    const mockRes = [{ doc_id: 'DOC-2' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.deleteIngestionFile('DOC-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/DOC-1', expect.objectContaining({
      method: 'DELETE'
    }));
    expect(res).toEqual(mockRes);
  });

  it('updateValidationRecord patches record and throws on invalid schema', async () => {
    const mockRes = { record_id: 'REC-1', vendor_name: 'Acme Corp' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.updateValidationRecord('REC-1', {
      vendor_name: 'Acme Corp'
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion', expect.objectContaining({
      method: 'PATCH'
    }));
    expect(res).toEqual(mockRes);

    await expect(ingestionApiClient.updateValidationRecord('', {})).rejects.toThrow('Invalid record update');
  });

  it('applyBlanketRemediation calls POST /api/ingestion/remediate', async () => {
    const mockRes = { updatedCount: 3, records: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.applyBlanketRemediation();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/remediate', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockRes);
  });

  it('resetValidationRecords calls DELETE /api/ingestion', async () => {
    const mockRes = [{ record_id: 'REC-1' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.resetValidationRecords();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion', expect.objectContaining({
      method: 'DELETE'
    }));
    expect(res).toEqual(mockRes);
  });

  it('deleteIngestionDocument handles docId and buyerId query variations', async () => {
    const mockRes = [];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });
    await ingestionApiClient.deleteIngestionDocument('DOC-99', 'BUYER-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/document/DOC-99?buyerId=BUYER-1', expect.objectContaining({
      method: 'DELETE'
    }));

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });
    await ingestionApiClient.deleteIngestionDocument(undefined, 'BUYER-2');
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/document?buyerId=BUYER-2', expect.objectContaining({
      method: 'DELETE'
    }));

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });
    await ingestionApiClient.deleteIngestionDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/document', expect.objectContaining({
      method: 'DELETE'
    }));
  });

  it('resetBlanketData calls POST /api/ingestion/reset', async () => {
    const mockRes = { success: true };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRes
    });

    const res = await ingestionApiClient.resetBlanketData();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/reset', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockRes);
  });
});
