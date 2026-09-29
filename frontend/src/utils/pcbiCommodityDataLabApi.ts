/**
 * Frontend PCBI Commodity Data Lab API Client
 */

import { BACKEND_API_BASE_URL } from '../constants';
import frontendLogger from './logger';
import type {
  CommodityResearchQueueRow,
  CommoditySourceEvidenceObject,
  CommodityWorkspaceDetail,
  CommodityWorkspaceTabKey,
  PCBIDomainValidationResult,
  PCBIResearchDashboardMetrics
} from '../types/pcbiCommodityDataLab';

export class PCBICommodityDataLabApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async getDashboard(): Promise<{ success: boolean; metrics: PCBIResearchDashboardMetrics }> {
    try {
      frontendLogger.info('Calling API: getCommodityDataLabDashboard');
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/data-lab/dashboard`);
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
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/data-lab/queue`);
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

  public async getCommodityWorkspace(
    pcbiId: string,
    tab: CommodityWorkspaceTabKey = 'OVERVIEW'
  ): Promise<{ success: boolean; workspace: CommodityWorkspaceDetail }> {
    try {
      frontendLogger.info('Calling API: getCommodityWorkspaceDetail', { pcbiId, tab });
      const res = await fetch(
        `${this.baseUrl}/api/admin/pcbi/data-lab/commodity/${encodeURIComponent(pcbiId)}?tab=${tab}`
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
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/data-lab/detect-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/data-lab/upload-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/data-lab/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
