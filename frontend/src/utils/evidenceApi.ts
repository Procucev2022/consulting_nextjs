/**
 * Evidence API Client (Prompt 305)
 * Communicates with backend /api/evidence endpoints.
 */

import { apiClient } from './api';
import type {
  EvidenceInventoryResponse,
  EvidenceParityResponse,
  EvidenceWorkbookType
} from '../types/evidenceWorkbook';

const API_BASE = '/api/evidence';

export class EvidenceApiClient {
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
    if (user?.company_name) headers['x-company-name'] = user.company_name;
    headers['x-tenant-id'] = user?.id || 'DEFAULT_TENANT';
    return headers;
  }

  /**
   * Retrieves list of available evidence workbooks for an analysis job
   */
  public async getInventory(jobId: string): Promise<EvidenceInventoryResponse> {
    const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}/inventory`, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  /**
   * Retrieves parity validation summary for an analysis job
   */
  public async getParityValidation(
    jobId: string,
    workbookType?: EvidenceWorkbookType
  ): Promise<EvidenceParityResponse> {
    const query = workbookType ? `?workbookType=${encodeURIComponent(workbookType)}` : '';
    const res = await fetch(`${API_BASE}/jobs/${encodeURIComponent(jobId)}/parity${query}`, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  /**
   * Constructs the declarative download URL for a specific evidence workbook (.xlsx)
   */
  public getWorkbookDownloadUrl(jobId: string, workbookType: EvidenceWorkbookType): string {
    return `${API_BASE}/jobs/${encodeURIComponent(jobId)}/workbooks/${encodeURIComponent(workbookType)}/download`;
  }

  /**
   * Constructs the declarative download URL for the Complete Evidence Package (.zip)
   */
  public getPackageDownloadUrl(jobId: string): string {
    return `${API_BASE}/jobs/${encodeURIComponent(jobId)}/package/download`;
  }

  /**
   * Retrieves per-savings-type evidence inventory for an analysis job (Prompt 306)
   */
  public async getSavingsInventory(
    jobId: string,
    savingsType?: import('../types/evidenceWorkbook').CanonicalSavingsType
  ): Promise<import('../types/evidenceWorkbook').SavingsTypeEvidenceInventoryResponse> {
    const path = savingsType
      ? `${API_BASE}/jobs/${encodeURIComponent(jobId)}/savings/${encodeURIComponent(savingsType)}/inventory`
      : `${API_BASE}/jobs/${encodeURIComponent(jobId)}/savings/inventory`;
    const res = await fetch(path, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  /**
   * Constructs the declarative download URL for an individual savings type evidence workbook (.xlsx)
   */
  public getSavingsTypeDownloadUrl(
    jobId: string,
    savingsType: import('../types/evidenceWorkbook').CanonicalSavingsType
  ): string {
    return `${API_BASE}/jobs/${encodeURIComponent(jobId)}/savings/${encodeURIComponent(savingsType)}/download`;
  }
}

export const evidenceApi = new EvidenceApiClient();
