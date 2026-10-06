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
  PCBIResolutionAction,
  PCBIExclusionReason,
  ReanalysisReason
} from '../types/analysisOrchestration';
import { apiClient } from './api';

const API_BASE = '/api/orchestration';

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
    const effectiveTenantId = (user as { tenant_id?: string })?.tenant_id || user?.id;
    if (effectiveTenantId) {
      headers['x-tenant-id'] = effectiveTenantId;
    } else if (user?.role === 'ADMIN') {
      headers['x-tenant-id'] = 'DEFAULT_TENANT';
    }
    return headers;
  }

  public async getJobs(options?: { status?: string; search?: string }): Promise<AnalysisJob[]> {
    const params = new URLSearchParams();
    if (options?.status && options.status !== 'ALL') params.append('status', options.status);
    if (options?.search) params.append('search', options.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/jobs${query}`, {
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.success ? json.data : [];
  }

  public async getJobDetails(jobId: string): Promise<AnalysisJobDetailPayload | null> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.success ? json.data : null;
  }

  public async getReadiness(jobId: string): Promise<AnalysisReadinessSummary | null> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/readiness`, {
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.success ? json.data : null;
  }

  public async resolvePCBIGap(
    jobId: string,
    gapId: string,
    payload: {
      action: PCBIResolutionAction;
      targetPcbiSeries?: string;
      exclusionReason?: PCBIExclusionReason;
      exclusionNotes?: string;
      researchNotes?: string;
    }
  ): Promise<{ success: boolean; gap?: PCBIGapCategory; message: string }> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/pcbi-gap/${gapId}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  public getDownloadDatasetUrl(jobId: string, versionId: string): string {
    return `${API_BASE}/jobs/${jobId}/download-dataset/${versionId}`;
  }

  public async uploadCorrectedDataset(
    jobId: string,
    payload: {
      fileName: string;
      fileBase64?: string;
      fileSizeMb?: number;
      reason: ReanalysisReason;
      notes?: string;
    }
  ): Promise<{ success: boolean; newVersion?: DatasetVersion; diff?: DataVersionDiffSummary; message: string }> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/upload-corrected-dataset`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  public async generateReport(
    jobId: string
  ): Promise<{ success: boolean; report?: ReportVersion; message: string }> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/generate-report`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/quality-gate`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/approve-and-submit`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/resend-notification`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/supersede-report`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/record-view`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/acknowledge`, {
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
    const res = await fetch(`${API_BASE}/jobs/${jobId}/request-correction`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  public async getAdminKPIs(): Promise<AdminOrchestrationKPIs | null> {
    const res = await fetch(`${API_BASE}/admin/kpis`, {
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.success ? json.data : null;
  }

  public async getNotifications(): Promise<OrchestrationNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.success ? json.data : [];
  }

  public async getAuditTrail(): Promise<AnalysisAuditEvent[]> {
    const res = await fetch(`${API_BASE}/audit-trail`, {
      headers: this.getHeaders()
    });
    const json = await res.json();
    return json.success ? json.data : [];
  }
}

export const orchestrationApi = new OrchestrationApiClient();
