import { apiFetch } from './apiFetch';
/**
 * Frontend PCBI Commodity Data Lab API Client
 */

import { BACKEND_API_BASE_URL } from '../constants';
import frontendLogger from './logger';
import { authApiClient } from './authApi';
import type {
  CommodityResearchQueueRow,
  CommoditySourceEvidenceObject,
  CommodityWorkspaceDetail,
  CommodityWorkspaceTabKey,
  PCBIDomainValidationResult,
  PCBIResearchDashboardMetrics,
  PCBICommodityPromotionHistory
} from '../types/pcbiCommodityDataLab';
import type { PCBIResearchWorkflowUpdate } from '../types/pcbiCommodityDataLab';

export class PCBICommodityDataLabApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = authApiClient.getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  public async getDashboard(): Promise<{ success: boolean; metrics: PCBIResearchDashboardMetrics }> {
    try {
      frontendLogger.info('Calling API: getCommodityDataLabDashboard');
      const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/dashboard`, { headers: this.getHeaders() });
      if (!res.ok) {
        throw new Error(`Failed to fetch Data Lab dashboard: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error fetching Data Lab dashboard', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async getQueue(): Promise<{ success: boolean; total: number; queue: CommodityResearchQueueRow[] }> {
    try {
      frontendLogger.info('Calling API: getCommodityResearchQueue');
      const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/queue`, { headers: this.getHeaders() });
      if (!res.ok) {
        throw new Error(`Failed to fetch Commodity Research Queue: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error fetching Commodity Research Queue', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async assignResearcher(pcbiId: string, update: PCBIResearchWorkflowUpdate): Promise<{ success: boolean }> {
    const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/assignment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ pcbiId, ...update })
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.message || `Failed to save the research owner: HTTP ${res.status}`);
    }
    return await res.json();
  }

  public async getSources(): Promise<{ success: boolean; total: number; sources: CommoditySourceEvidenceObject[] }> {
    const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/sources`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch PCBI evidence sources: HTTP ${res.status}`);
    return await res.json();
  }

  public async getVersionHistory(): Promise<{
    success: boolean;
    total: number;
    versions: PCBICommodityPromotionHistory[];
  }> {
    const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/version-history`, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`Failed to fetch PCBI catalog promotion history: HTTP ${res.status}`);
    }
    return await res.json();
  }

  public async getCommodityWorkspace(
    pcbiId: string,
    tab: CommodityWorkspaceTabKey = 'OVERVIEW'
  ): Promise<{ success: boolean; workspace: CommodityWorkspaceDetail }> {
    try {
      frontendLogger.info('Calling API: getCommodityWorkspaceDetail', { pcbiId, tab });
      const res = await apiFetch(
        `${this.baseUrl}/api/admin/pcbi/data-lab/commodity/${encodeURIComponent(pcbiId)}?tab=${tab}`,
        { headers: this.getHeaders() }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch workspace for ${pcbiId}: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error fetching Commodity Workspace', {
        pcbiId,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async detectUploadDomain(
    fileName: string,
    fileContentSnippet = '',
    targetArea: 'PCBI_MASTER' | 'COMMODITY_DATA_LAB' | 'MODULE_1_INGESTION' = 'COMMODITY_DATA_LAB'
  ): Promise<{ success: boolean; detection: PCBIDomainValidationResult }> {
    try {
      frontendLogger.info('Calling API: detectUploadDomain', { fileName, targetArea });
      const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/detect-domain`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ fileName, fileContentSnippet, targetArea })
      });
      if (!res.ok) {
        throw new Error(`Failed to detect domain: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error detecting upload domain', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async uploadCommoditySource(payload: {
    commodityId: string;
    pcbiId: string;
    seriesId?: string;
    sourceName: string;
    publisher: string;
    url?: string;
    documentName: string;
    fileBase64: string;
    publicationDate?: string;
    fileType: 'XLSX' | 'XLS' | 'CSV' | 'PDF' | 'JSON' | 'TXT';
    checksum?: string;
    geography?: string;
    gradeSpecification?: string;
    unit?: string;
    currency?: string;
    frequency?: string;
    deliveryBasis?: string;
    historicalCoverage?: string;
  }): Promise<{
    success: boolean;
    source: CommoditySourceEvidenceObject;
    banner: string;
    message: string;
  }> {
    try {
      frontendLogger.info('Calling API: uploadCommoditySource', {
        commodityId: payload.commodityId,
        pcbiId: payload.pcbiId,
        documentName: payload.documentName
      });
      const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/upload-source`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || `Upload failed with HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error uploading commodity source', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async approveCommodityData(payload: {
    commodityId: string;
    pcbiId: string;
    approverName: string;
    comments?: string;
  }): Promise<{
    success: boolean;
    result: {
      success: boolean;
      commodityId: string;
      pcbiId: string;
      approvalStatus: string;
      catalogVersionCreated: boolean;
      catalogVersionId: string;
      message: string;
    };
  }> {
    try {
      frontendLogger.info('Calling API: approveCommodityData', {
        commodityId: payload.commodityId,
        pcbiId: payload.pcbiId
      });
      const res = await apiFetch(`${this.baseUrl}/api/admin/pcbi/data-lab/approve`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || `Approval failed with HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error approving commodity data', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
}

export const pcbiCommodityDataLabApi = new PCBICommodityDataLabApiClient();
