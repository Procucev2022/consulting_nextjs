/**
 * PCBI Master Admin API Client Utility
 */

import { BACKEND_API_BASE_URL } from '../constants';
import frontendLogger from './logger';
import type {
  PCBIVersionRecord,
  PCBIImportPayload,
  PCBIImportResult,
  PCBIVersionMetrics
} from '../types/pcbiAdmin';

export class PCBIAdminApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async getVersions(): Promise<{
    success: boolean;
    total: number;
    active_version: string | null;
    versions: PCBIVersionRecord[];
  }> {
    try {
      frontendLogger.info('Fetching PCBI Master versions list');
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/versions`);
      if (!res.ok) {
        throw new Error(`Failed to fetch PCBI versions: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error fetching PCBI versions', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async getVersion(version: string): Promise<{ success: boolean; version: PCBIVersionRecord }> {
    try {
      frontendLogger.info('Fetching PCBI Master version details', { version });
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/versions/${encodeURIComponent(version)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch version ${version}: HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error fetching PCBI version', {
        version,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async importMaster(payload: PCBIImportPayload): Promise<PCBIImportResult> {
    try {
      frontendLogger.info('Submitting validated PCBI Master import payload', {
        fileName: payload.file_name,
        version: payload.version,
        recordsCount: payload.validationSummary?.totalRecords
      });

      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || `Import failed with HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error importing PCBI Master', {
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }

  public async publishVersion(
    version: string,
    publishedBy: string
  ): Promise<{ success: boolean; activeVersion: string; metrics: PCBIVersionMetrics }> {
    try {
      frontendLogger.info('Publishing PCBI Master version to production', { version, publishedBy });
      const res = await fetch(`${this.baseUrl}/api/admin/pcbi/publish/${encodeURIComponent(version)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published_by: publishedBy })
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || `Publish failed with HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: unknown) {
      frontendLogger.error('Error publishing PCBI version', {
        version,
        error: err instanceof Error ? err.message : String(err)
      });
      throw err;
    }
  }
}

export const pcbiAdminApi = new PCBIAdminApiClient();
