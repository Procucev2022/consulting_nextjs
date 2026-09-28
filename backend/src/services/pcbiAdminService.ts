/**
 * PCBI Master Admin Service — Version Management & Dataset Ingestion
 */

import type {
  PCBIVersionRecord,
  PCBIImportPayload,
  PCBIImportResult,
  PCBIVersionMetrics
} from '../types/pcbiAdmin';
import logger from '../utils/logger';

export class PCBIAdminService {
  private versions: PCBIVersionRecord[] = [
    {
      id: 'pcbi-ver-001',
      version: 'V1.0',
      upload_id: 'up-init-global-001',
      file_name: 'PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx',
      file_size_mb: 3.54,
      upload_date: '2026-01-01T00:00:00.000Z',
      uploaded_by: 'Sriman Admin',
      effective_date: '2020-04-01T00:00:00.000Z',
      status: 'PUBLISHED',
      metrics: {
        benchmark_count: 290,
        weekly_records_count: 95700,
        constituent_count: 290,
        unspsc_mappings_count: 73,
        a_quality_count: 240,
        b_quality_count: 45,
        c_quality_count: 5,
        total_benchmarkable_pct: 75.8,
        date_start: '2020-04-01',
        date_end: '2026-07-31',
        warnings_count: 0,
        errors_count: 0
      },
      published_at: '2026-01-01T00:00:00.000Z',
      published_by: 'Sriman Admin'
    }
  ];

  public getVersions(): PCBIVersionRecord[] {
    return [...this.versions];
  }

  public getVersion(version: string): PCBIVersionRecord | null {
    const q = (version || '').toLowerCase();
    return this.versions.find((v) => v.version.toLowerCase() === q || v.upload_id.toLowerCase() === q) || null;
  }

  public getActivePublishedVersion(): PCBIVersionRecord | null {
    return this.versions.find((v) => v.status === 'PUBLISHED') || null;
  }

  public async importMaster(payload: PCBIImportPayload): Promise<PCBIImportResult> {
    const uploadId = `up-pcbi-${Date.now()}`;
    const nextVer = payload.version || `V${this.versions.length + 1}.0`;
    const metrics = this.buildMetrics(payload);

    if (metrics.errors_count > 0) {
      throw new Error(`Cannot import PCBI Master: ${metrics.errors_count} blocking errors must be resolved first.`);
    }

    const newRecord = this.buildVersionRecord(payload, nextVer, uploadId, metrics);

    this.versions.unshift(newRecord);

    const importDate = new Date().toISOString();

    logger.info('Imported new PCBI Master version', {
      version: nextVer,
      uploadId,
      fileName: payload.file_name,
      importDate,
      metrics
    });

    return {
      success: true,
      version: nextVer,
      upload_id: uploadId,
      status: newRecord.status,
      import_date: importDate,
      successful_records: payload.validationSummary?.validRecords || 0,
      warning_records: metrics.warnings_count,
      error_records: metrics.errors_count,
      records_excluded: 0,
      pcbi_records: metrics.benchmark_count,
      weekly_index_records: metrics.weekly_records_count,
      constituent_records: metrics.constituent_count,
      source_records: payload.sources?.length ?? 0,
      unspsc_mapping_records: metrics.unspsc_mappings_count,
      validation_report_url: `/api/admin/pcbi/validation-report/${nextVer}`
    };
  }


  private buildDatasetCounts(payload: PCBIImportPayload): {
    benchmark_count: number;
    weekly_records_count: number;
    constituent_count: number;
    unspsc_mappings_count: number;
  } {
    return {
      benchmark_count: payload.benchmarks?.length ?? 0,
      weekly_records_count: payload.weeklyIndices?.length ?? 0,
      constituent_count: payload.constituents?.length ?? 0,
      unspsc_mappings_count: payload.unspscMappings?.length ?? 0
    };
  }

  private buildMetrics(payload: PCBIImportPayload): PCBIVersionMetrics {
    const counts = this.buildDatasetCounts(payload);
    const sum = payload.validationSummary;
    return {
      ...counts,
      a_quality_count: sum?.aQualityCount ?? 0,
      b_quality_count: sum?.bQualityCount ?? 0,
      c_quality_count: sum?.cQualityCount ?? 0,
      total_benchmarkable_pct: sum?.avgBenchmarkability ?? 70,
      date_start: sum?.dateStart ?? '2020-04-01',
      date_end: sum?.dateEnd ?? '2026-07-31',
      warnings_count: sum?.warningCount ?? 0,
      errors_count: sum?.blockingErrorCount ?? 0
    };
  }

  private buildVersionRecord(
    payload: PCBIImportPayload,
    version: string,
    uploadId: string,
    metrics: PCBIVersionMetrics
  ): PCBIVersionRecord {
    return {
      id: `ver-${Date.now()}`,
      version,
      upload_id: uploadId,
      file_name: payload.file_name,
      file_size_mb: payload.file_size_mb,
      upload_date: new Date().toISOString(),
      uploaded_by: payload.uploaded_by || 'Admin',
      effective_date: metrics.date_start ? `${metrics.date_start}T00:00:00.000Z` : new Date().toISOString(),
      status: metrics.errors_count > 0 ? 'DRAFT' : 'VALIDATED',
      metrics,
      validation_report_json: JSON.stringify(payload.validationSummary || {}),
      published_at: null,
      published_by: null
    };
  }

  public async publishVersion(
    version: string,
    publishedBy: string
  ): Promise<{ success: boolean; activeVersion: string; metrics: PCBIVersionMetrics }> {
    const target = this.getVersion(version);
    if (!target) {
      throw new Error(`Version ${version} not found`);
    }

    // Archive existing published versions
    for (const v of this.versions) {
      if (v.status === 'PUBLISHED') {
        v.status = 'ARCHIVED';
      }
    }

    target.status = 'PUBLISHED';
    target.published_at = new Date().toISOString();
    target.published_by = publishedBy;

    logger.info('Published PCBI Master version to production', {
      version: target.version,
      publishedBy,
      publishedAt: target.published_at
    });

    return {
      success: true,
      activeVersion: target.version,
      metrics: target.metrics
    };
  }

  public getValidationReport(version: string): string | null {
    const target = this.getVersion(version);
    return target?.validation_report_json || null;
  }
}

export const pcbiAdminService = new PCBIAdminService();
