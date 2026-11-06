import { apiFetch } from './apiFetch';
/**
 * Frontend API Utility for Analysis Orchestration (Prompt 302)
 */

import type {
  AnalysisJob,
  AnalysisJobDetailPayload,
  AnalysisReadinessSummary,
  PCBIGapCategory,
  DataVersionDiffSummary,
  DatasetVersion,
  ReportVersion,
  AdminQualityGateChecklist,
  CustomerReportAcknowledgement,
  CustomerCorrectionRequest,
  AdminOrchestrationKPIs,
  OrchestrationNotification,
  AnalysisAuditEvent,
  CorrectedDatasetUploadPayload
} from '../types/analysisOrchestration';
import type { PCBIGapResolutionRequest } from '../types/validation';
import { pcbiGapResolutionRequestSchema } from '../constants/orchestrationValidation';
import { apiClient } from './api';
import { frontendLogger } from './logger';
import { UI_STRINGS } from '../constants/uiStrings';

const API_BASE = '/api/orchestration';

const isJsonRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJsonResponse = async (
  response: Response,
  path: string,
  operation: string
): Promise<Record<string, unknown>> => {
  const requestId = response.headers?.get('x-request-id') || UI_STRINGS.common.notAvailable;
  const context = { action: 'orchestration.api.response', operation, method: 'GET', path, statusCode: response.status, requestId };
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error: unknown) {
    frontendLogger.error('Orchestration API response body could not be parsed', context, error);
    throw new Error(UI_STRINGS.orchestration.apiInvalidResponse(operation, requestId));
  }

  if (!isJsonRecord(payload)) {
    const error = new TypeError('Orchestration API response must be a JSON object');
    frontendLogger.error('Orchestration API response body had an invalid shape', context, error);
    throw new Error(UI_STRINGS.orchestration.apiInvalidResponse(operation, requestId));
  }

  if (!response.ok || payload.success === false) {
    const detail = typeof payload.message === 'string' && payload.message.trim()
      ? payload.message
      : UI_STRINGS.module4.apiNoDetails;
    const failureContext = { ...context, detail };
    if (response.status >= 500) {
      frontendLogger.error('Orchestration API returned a server failure', failureContext);
    } else {
      frontendLogger.warn('Orchestration API returned an unsuccessful response', failureContext);
    }
  }

  return payload;
};

export class OrchestrationApiClient {
  private getHeaders(): Record<string, string> {
    const token = apiClient.getStoredToken();
    const user = apiClient.getStoredUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (user?.role) headers['x-user-role'] = user.role;
    if (user?.id) headers['x-user-id'] = user.id;
    if (user?.name) headers['x-user-name'] = user.name;
    const effectiveTenantId = (user as { tenant_id?: string })?.tenant_id;
    if (effectiveTenantId) headers['x-tenant-id'] = effectiveTenantId;
    return headers;
  }

  private async getJson(path: string, operation: string): Promise<Record<string, unknown>> {
    const method = 'GET';
    let response: Response;
    try {
      response = await apiFetch(path, { headers: this.getHeaders() });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      frontendLogger.error('Orchestration API request failed before a response was received', {
        action: 'orchestration.api.request', operation, method, path
      }, error);
      throw new Error(UI_STRINGS.orchestration.apiNetworkFailure(operation, reason));
    }
    return parseJsonResponse(response, path, operation);
  }

  public async getJobs(options?: { status?: string; search?: string }): Promise<AnalysisJob[]> {
    const params = new URLSearchParams();
    if (options?.status && options.status !== 'ALL') params.append('status', options.status);
    if (options?.search) params.append('search', options.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const json = await this.getJson(`${API_BASE}/jobs${query}`, UI_STRINGS.orchestration.apiOperations.listJobs);
    return json.success === true && Array.isArray(json.data) ? json.data as AnalysisJob[] : [];
  }

  public async getJobDetails(jobId: string): Promise<AnalysisJobDetailPayload | null> {
    const json = await this.getJson(`${API_BASE}/jobs/${encodeURIComponent(jobId)}`, UI_STRINGS.orchestration.apiOperations.loadJobDetails);
    return json.success === true ? json.data as AnalysisJobDetailPayload : null;
  }

  public async getReadiness(jobId: string): Promise<AnalysisReadinessSummary | null> {
    const json = await this.getJson(`${API_BASE}/jobs/${encodeURIComponent(jobId)}/readiness`, UI_STRINGS.orchestration.apiOperations.loadReadiness);
    return json.success === true ? json.data as AnalysisReadinessSummary : null;
  }

  public async resolvePCBIGap(
    jobId: string,
    gapId: string,
    payload: PCBIGapResolutionRequest
  ): Promise<{ success: boolean; gap?: PCBIGapCategory; message: string }> {
    const validatedPayload = pcbiGapResolutionRequestSchema.parse(payload);
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/pcbi-gap/${gapId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(validatedPayload)
    });
    return res.json();
  }

  public getDownloadDatasetUrl(jobId: string, versionId: string): string {
    return `${API_BASE}/jobs/${encodeURIComponent(jobId)}/download-dataset/${encodeURIComponent(versionId)}`;
  }

  public async downloadDataset(jobId: string, versionId: string, fileName: string): Promise<Blob> {
    const url = this.getDownloadDatasetUrl(jobId, versionId);
    let response: Response;
    try {
      response = await apiFetch(url, { headers: this.getHeaders() });
    } catch (error: unknown) {
      frontendLogger.error('Source dataset download request failed', { jobId, versionId, fileName }, error);
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(UI_STRINGS.orchestration.datasetDownloadNetworkFailure(fileName, reason));
    }

    if (!response.ok) {
      let detail = UI_STRINGS.orchestration.datasetDownloadResponseFailure(fileName);
      try {
        const body = await response.json() as { message?: unknown };
        if (typeof body.message === 'string' && body.message.trim()) detail = body.message;
      } catch {
        detail = UI_STRINGS.orchestration.datasetDownloadResponseFailure(fileName);
      }
      const requestId = response.headers.get('x-request-id') || UI_STRINGS.common.notAvailable;
      const message = UI_STRINGS.orchestration.datasetDownloadHttpFailure(fileName, response.status, detail, requestId);
      frontendLogger.error('Source dataset download was rejected', {
        jobId, versionId, fileName, statusCode: response.status, requestId, detail
      });
      throw new Error(message);
    }

    try {
      return await response.blob();
    } catch (error: unknown) {
      frontendLogger.error('Source dataset response body could not be read', { jobId, versionId, fileName }, error);
      throw new Error(UI_STRINGS.orchestration.datasetDownloadResponseFailure(fileName));
    }
  }

  public async uploadCorrectedDataset(
    jobId: string,
    payload: CorrectedDatasetUploadPayload
  ): Promise<{
    success: boolean;
    newVersion?: DatasetVersion;
    diff?: DataVersionDiffSummary;
    analysisStatus?: 'COMPLETED' | 'PENDING' | 'FAILED';
    message: string;
  }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/upload-corrected-dataset`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  public async generateReport(
    jobId: string
  ): Promise<{ success: boolean; report?: ReportVersion; message: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/generate-report`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });
    return res.json();
  }

  public async confirmQualityGate(
    jobId: string,
    checklist: AdminQualityGateChecklist
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/quality-gate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(checklist)
    });
    return res.json();
  }

  public async approveAndSubmitReport(
    jobId: string,
    reportVersionId: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/approve-and-submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reportVersionId })
    });
    return res.json();
  }

  public async resendNotification(
    jobId: string,
    reportVersionId: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/resend-notification`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reportVersionId })
    });
    return res.json();
  }

  public async supersedeReport(
    jobId: string,
    reportVersionId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/supersede-report`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reportVersionId, reason })
    });
    return res.json();
  }

  public async recordCustomerView(
    jobId: string,
    reportVersionId: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/record-view`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reportVersionId })
    });
    return res.json();
  }

  public async acknowledgeReport(
    jobId: string,
    reportVersionId: string,
    notes?: string
  ): Promise<{ success: boolean; acknowledgement?: CustomerReportAcknowledgement; message?: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/acknowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reportVersionId, notes })
    });
    return res.json();
  }

  public async requestCorrection(
    jobId: string,
    payload: { category: string; description: string; supportingFileName?: string }
  ): Promise<{ success: boolean; request?: CustomerCorrectionRequest; message?: string }> {
    const res = await apiFetch(`${API_BASE}/jobs/${jobId}/request-correction`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  public async getAdminKPIs(): Promise<AdminOrchestrationKPIs | null> {
    const json = await this.getJson(`${API_BASE}/admin/kpis`, UI_STRINGS.orchestration.apiOperations.loadAdminKpis);
    return json.success === true ? json.data as AdminOrchestrationKPIs : null;
  }

  public async getNotifications(): Promise<OrchestrationNotification[]> {
    const json = await this.getJson(`${API_BASE}/notifications`, UI_STRINGS.orchestration.apiOperations.loadNotifications);
    return json.success === true && Array.isArray(json.data) ? json.data as OrchestrationNotification[] : [];
  }

  public async getAuditTrail(): Promise<AnalysisAuditEvent[]> {
    const json = await this.getJson(`${API_BASE}/audit-trail`, UI_STRINGS.orchestration.apiOperations.loadAuditTrail);
    return json.success === true && Array.isArray(json.data) ? json.data as AnalysisAuditEvent[] : [];
  }
}

export const orchestrationApi = new OrchestrationApiClient();
