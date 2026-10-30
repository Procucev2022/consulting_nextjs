import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ingestionApiClient } from '../../src/utils/ingestionApi';
import { UI_STRINGS } from '../../src/constants/uiStrings';

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

  it('getCanonicalModule1 fetches canonical model with query params and headers', async () => {
    const mockModel = { totalBaselineSpendInrCr: 613.88 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockModel })
    });

    const res = await ingestionApiClient.getCanonicalModule1('data/spend.xlsx', 'ASS-101');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ingestion/canonical?filePath=data%2Fspend.xlsx&assessmentId=ASS-101',
      { headers: { 'x-assessment-id': 'ASS-101' } }
    );
    expect(res).toEqual(mockModel);
  });

  it('getCanonicalModule1 handles empty parameters and returns null when data is missing', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const res = await ingestionApiClient.getCanonicalModule1();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/canonical', { headers: {} });
    expect(res).toBeNull();
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

  it('deleteIngestionFile calls DELETE on the document-scoped route', async () => {
    const mockRes = [{ doc_id: 'DOC-2' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.deleteIngestionFile('DOC-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/document/DOC-1', expect.objectContaining({
      method: 'DELETE'
    }));
    expect(res).toEqual(mockRes);
  });

  it('surfaces Worker errors when deleting an ingestion file', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ 'x-request-id': 'REQ-404' }),
      json: async () => ({ message: 'The requested document does not exist' })
    });

    await expect(ingestionApiClient.deleteIngestionFile('DOC-MISSING'))
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'delete the ingestion document', 404, 'The requested document does not exist', 'REQ-404'
      ));
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

  it('surfaces a Worker rejection instead of returning an unsaved validation record', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 501,
      headers: new Headers({ 'x-request-id': 'REQ-501' }),
      json: async () => ({ message: 'Validation updates are unavailable' })
    });

    await expect(ingestionApiClient.updateValidationRecord('REC-1', { raw_desc: 'Normalized item' }))
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed('update the validation record', 501, 'Validation updates are unavailable', 'REQ-501'));
  });

  it('uses fallback error detail and request ID when an update response omits both', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({})
    });

    await expect(ingestionApiClient.updateValidationRecord('REC-1', { raw_desc: 'Normalized item' }))
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'update the validation record', 500, UI_STRINGS.module4.apiNoDetails, UI_STRINGS.common.notAvailable
      ));
  });

  it('surfaces a Worker rejection when adding an ingestion row', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ message: 'The document could not be processed' })
    });

    await expect(ingestionApiClient.addIngestionFile({ file_name: 'spend.csv' }))
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed('add the ingestion record', 400, 'The document could not be processed', UI_STRINGS.common.notAvailable));
  });

  it('uses the fallback detail when the Worker omits an add error message', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({})
    });

    await expect(ingestionApiClient.addIngestionFile({ file_name: 'spend.csv' }))
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'add the ingestion record', 500, UI_STRINGS.module4.apiNoDetails, UI_STRINGS.common.notAvailable
      ));
  });

  it('applyBlanketRemediation calls POST /api/ingestion/remediate', async () => {
    const mockRes = { updatedCount: 1, skippedCount: 2, records: [] };
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

  it('uses fallback error detail when D1 currency remediation omits its message', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({})
    });

    await expect(ingestionApiClient.applyBlanketRemediation())
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'recalculate validation currency totals', 500, UI_STRINGS.module4.apiNoDetails, UI_STRINGS.common.notAvailable
      ));
  });

  it('surfaces Worker errors when D1 currency remediation fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers(),
      json: async () => ({ message: 'FX reference data is unavailable' })
    });

    await expect(ingestionApiClient.applyBlanketRemediation())
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'recalculate validation currency totals', 503, 'FX reference data is unavailable', UI_STRINGS.common.notAvailable
      ));
  });

  it('resetValidationRecords deletes only validation rows', async () => {
    const mockRes = [{ record_id: 'REC-1' }];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });

    const res = await ingestionApiClient.resetValidationRecords();
    expect(global.fetch).toHaveBeenCalledWith('/api/ingestion/validation-records', expect.objectContaining({
      method: 'DELETE'
    }));
    expect(res).toEqual(mockRes);
  });

  it('uses fallback error detail when validation reset omits its message', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({})
    });

    await expect(ingestionApiClient.resetValidationRecords())
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'reset validation records', 500, UI_STRINGS.module4.apiNoDetails, UI_STRINGS.common.notAvailable
      ));
  });

  it('surfaces a Worker rejection when resetting validation records', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers(),
      json: async () => ({ message: 'D1 is unavailable' })
    });

    await expect(ingestionApiClient.resetValidationRecords())
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed('reset validation records', 503, 'D1 is unavailable', UI_STRINGS.common.notAvailable));
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

  it('surfaces Worker errors when deleting a document record', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      headers: new Headers({ 'x-request-id': 'REQ-503' }),
      json: async () => ({})
    });

    await expect(ingestionApiClient.deleteIngestionDocument('DOC-1'))
      .rejects.toThrow(UI_STRINGS.module4.apiRequestFailed(
        'delete the ingestion document', 503, UI_STRINGS.module4.apiNoDetails, 'REQ-503'
      ));
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
