import type {
  IngestionUploadPayload,
  IngestionUploadResponse,
  RawDocumentIngestion,
  ValidationPreCheckRecord,
  Module1CanonicalViewModel
} from '../types';
import frontendLogger from './logger';
import { validateInput } from './validation';
import { UI_STRINGS } from '../constants/uiStrings';
import {
  apiAddIngestionFilePayloadSchema,
  apiUpdateValidationRecordPayloadSchema
} from '../constants/validation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export const ingestionApiClient = {
  async getCanonicalModule1(filePath?: string, assessmentId?: string): Promise<Module1CanonicalViewModel | null> {
    frontendLogger.debug('Fetching authoritative Module 1 canonical view model', { filePath, assessmentId });
    const params = new URLSearchParams();
    if (filePath) params.set('filePath', filePath);
    if (assessmentId) params.set('assessmentId', assessmentId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const headers: Record<string, string> = {};
    if (assessmentId) {
      headers['x-assessment-id'] = assessmentId;
    }
    const res = await fetch(`${API_BASE}/api/ingestion/canonical${query}`, { headers });
    const json = await res.json();
    return json.data ?? null;
  },

  async getIngestionData(buyerId?: string): Promise<{
    queue: RawDocumentIngestion[];
    validationRecords: ValidationPreCheckRecord[];
  }> {
    frontendLogger.debug('Fetching ingestion queue and validation records', { buyerId });
    const query = buyerId ? `?buyerId=${encodeURIComponent(buyerId)}` : '';
    const res = await fetch(`${API_BASE}/api/ingestion${query}`);
    const json = await res.json();
    return json.data;
  },

  async addIngestionFile(fileData: Partial<RawDocumentIngestion>): Promise<RawDocumentIngestion[]> {
    frontendLogger.info('Submitting ingestion file', { fileName: fileData.file_name });
    const validation = validateInput(apiAddIngestionFilePayloadSchema, fileData);
    if (!validation.success) {
      throw new Error(`Invalid file data: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.apiNoDetails;
      const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      throw new Error(UI_STRINGS.module4.apiRequestFailed('add the ingestion record', res.status, detail, requestId));
    }
    return json.data;
  },

  async uploadDocumentToObjectStore(payload: IngestionUploadPayload): Promise<IngestionUploadResponse> {
    frontendLogger.info('Uploading document to server object store', { fileName: payload.fileName });
    const res = await fetch(`${API_BASE}/api/ingestion/upload-object`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async deleteIngestionFile(docId: string): Promise<RawDocumentIngestion[]> {
    frontendLogger.info('Deleting ingestion file', { docId });
    const res = await fetch(`${API_BASE}/api/ingestion/document/${encodeURIComponent(docId)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.apiNoDetails;
      const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      throw new Error(UI_STRINGS.module4.apiRequestFailed('delete the ingestion document', res.status, detail, requestId));
    }
    return json.data;
  },

  async updateValidationRecord(
    recordId: string,
    updates: Partial<ValidationPreCheckRecord>
  ): Promise<ValidationPreCheckRecord> {
    frontendLogger.info('Updating validation pre-check record', { record_id: recordId, updates });
    const validation = validateInput(apiUpdateValidationRecordPayloadSchema, {
      record_id: recordId,
      ...updates
    });
    if (!validation.success) {
      throw new Error(`Invalid record update: ${JSON.stringify(validation.errors)}`);
    }

    const res = await fetch(`${API_BASE}/api/ingestion`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data)
    });
    const json = await res.json();
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.apiNoDetails;
      const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      throw new Error(UI_STRINGS.module4.apiRequestFailed('update the validation record', res.status, detail, requestId));
    }
    return json.data;
  },

  async applyBlanketRemediation(): Promise<{
    updatedCount: number;
    skippedCount: number;
    records: ValidationPreCheckRecord[];
  }> {
    frontendLogger.info('Applying D1-backed currency corrections to eligible validation records');
    const res = await fetch(`${API_BASE}/api/ingestion/remediate`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.apiNoDetails;
      const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      throw new Error(UI_STRINGS.module4.apiRequestFailed('recalculate validation currency totals', res.status, detail, requestId));
    }
    return json.data;
  },

  async resetValidationRecords(): Promise<ValidationPreCheckRecord[]> {
    frontendLogger.warn('Resetting validation records to baseline');
    const res = await fetch(`${API_BASE}/api/ingestion/validation-records`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.apiNoDetails;
      const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      throw new Error(UI_STRINGS.module4.apiRequestFailed('reset validation records', res.status, detail, requestId));
    }
    return json.data;
  },

  async deleteIngestionDocument(docId?: string, buyerId?: string): Promise<RawDocumentIngestion[]> {
    frontendLogger.info('Deleting ingestion document', { docId, buyerId });
    let endpoint = docId
      ? `${API_BASE}/api/ingestion/document/${encodeURIComponent(docId)}`
      : `${API_BASE}/api/ingestion/document`;
    if (buyerId) {
      endpoint += `?buyerId=${encodeURIComponent(buyerId)}`;
    }
    const res = await fetch(endpoint, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok) {
      const detail = typeof json?.message === 'string' ? json.message : UI_STRINGS.module4.apiNoDetails;
      const requestId = res.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      throw new Error(UI_STRINGS.module4.apiRequestFailed('delete the ingestion document', res.status, detail, requestId));
    }
    return json.data;
  },

  async resetBlanketData(): Promise<Record<string, unknown>> {
    frontendLogger.warn('Executing blanket ERP dataset reset');
    const res = await fetch(`${API_BASE}/api/ingestion/reset`, { method: 'POST' });
    return await res.json();
  }
};
