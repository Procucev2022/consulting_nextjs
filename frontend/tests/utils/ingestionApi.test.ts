import { expectApiFetchCall } from './apiFetchAssertions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ingestionApiClient } from '../../src/utils/ingestionApi';
import frontendLogger from '../../src/utils/logger';
import { UI_STRINGS } from '../../src/constants/uiStrings';

describe('ingestionApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getIngestionData fetches queue and validation records with or without tenantId', async () => {
    const mockData = { queue: [], validationRecords: [] };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockData })
    });

    const res1 = await ingestionApiClient.getIngestionData();
    expectApiFetchCall(global.fetch, '/api/ingestion');
    expect(res1).toEqual(mockData);

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockData })
    });
    const res2 = await ingestionApiClient.getIngestionData('TENANT-100');
    expectApiFetchCall(global.fetch, '/api/ingestion?tenantId=TENANT-100');
    expect(res2).toEqual(mockData);
  });

  it('encodes tenant-scoped keyset cursors when loading the next validation page', async () => {
    const mockData = { queue: [], validationRecords: [], pagination: {}, summary: {} };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockData })
    });

    const res = await ingestionApiClient.getIngestionData('TENANT-100', {
      validationCursor: { createdAt: '2026-04-01 00:00:00', recordId: 'REC/101' }
    });

    expectApiFetchCall(global.fetch,
      '/api/ingestion?tenantId=TENANT-100&validationAfterCreatedAt=2026-04-01+00%3A00%3A00&validationAfterRecordId=REC%2F101');
    expect(res).toEqual(mockData);
  });

  it('encodes a directly selected document identifier into the tenant-scoped ingestion request', async () => {
    const mockData = { queue: [], validationRecords: [], pagination: {}, summary: {} };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      json: async () => ({ success: true, data: mockData })
    });

    await ingestionApiClient.getIngestionData('TENANT-100', { queueDocumentId: 'DOC/OLD-1' });

    expectApiFetchCall(global.fetch, '/api/ingestion?tenantId=TENANT-100&queueDocumentId=DOC%2FOLD-1');
  });

  it('logs and exposes correlated ingestion queue failures', async () => {
    const log = vi.spyOn(frontendLogger, 'error');
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ 'x-request-id': 'REQ-INGESTION-403' }),
      json: async () => ({ message: 'Tenant assignment pending' })
    });

    await expect(ingestionApiClient.getIngestionData('TENANT-100')).rejects.toThrow(
      UI_STRINGS.module4.apiRequestFailed(
        UI_STRINGS.module4.apiOperations.ingestion, 403, 'Tenant assignment pending', 'REQ-INGESTION-403'
      )
    );
    expect(log).toHaveBeenCalledWith('Tenant ingestion queue request failed', expect.objectContaining({
      tenantId: 'TENANT-100', status: 403, requestId: 'REQ-INGESTION-403'
    }));
  });

  it('getCanonicalModule1 fetches canonical model with query params and headers', async () => {
    const mockModel = { totalBaselineSpendInrCr: 613.88 };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockModel })
    });

    const res = await ingestionApiClient.getCanonicalModule1('data/spend.xlsx', 'ASS-101');
    expectApiFetchCall(global.fetch, '/api/ingestion/canonical?filePath=data%2Fspend.xlsx&assessmentId=ASS-101', { headers: { 'x-assessment-id': 'ASS-101' } });
    expect(res).toEqual(mockModel);
  });

  it('getCanonicalModule1 handles empty parameters and returns null when data is missing', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const res = await ingestionApiClient.getCanonicalModule1();
    expectApiFetchCall(global.fetch, '/api/ingestion/canonical', { headers: {} });
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
    expectApiFetchCall(global.fetch, '/api/ingestion', expect.objectContaining({
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
    expectApiFetchCall(global.fetch, '/api/ingestion/upload-object', expect.objectContaining({
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
    expectApiFetchCall(global.fetch, '/api/ingestion/document/DOC-1', expect.objectContaining({
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
    expectApiFetchCall(global.fetch, '/api/ingestion', expect.objectContaining({
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
    expectApiFetchCall(global.fetch, '/api/ingestion/remediate', expect.objectContaining({
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
    expectApiFetchCall(global.fetch, '/api/ingestion/validation-records', expect.objectContaining({
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

  it('deleteIngestionDocument handles document and tenant query variations', async () => {
    const mockRes = [];
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });
    await ingestionApiClient.deleteIngestionDocument('DOC-99', 'TENANT-1');
    expectApiFetchCall(global.fetch, '/api/ingestion/document/DOC-99?tenantId=TENANT-1', expect.objectContaining({
      method: 'DELETE'
    }));

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });
    await ingestionApiClient.deleteIngestionDocument(undefined, 'TENANT-2');
    expectApiFetchCall(global.fetch, '/api/ingestion/document?tenantId=TENANT-2', expect.objectContaining({
      method: 'DELETE'
    }));

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockRes })
    });
    await ingestionApiClient.deleteIngestionDocument();
    expectApiFetchCall(global.fetch, '/api/ingestion/document', expect.objectContaining({
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
    expectApiFetchCall(global.fetch, '/api/ingestion/reset', expect.objectContaining({
      method: 'POST'
    }));
    expect(res).toEqual(mockRes);
  });
});
