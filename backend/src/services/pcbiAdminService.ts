/**
 * PCBI Master Admin Service — Version Management & Dataset Ingestion
 */

import type {
  PCBIVersionRecord,
  PCBIImportPayload,
  PCBIImportResult,
  PCBIVersionMetrics,
  PCBISyntheticTestCase,
  PCBIPreviewSafetyRecord
} from '../types/pcbiAdmin';
import logger from '../utils/logger';
import { pcbiGapGovernanceService } from './pcbiGapGovernanceService';

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

  public getGapMatrix(): import('../types/pcbiAdmin').PCBIGapMatrixRow[] {
    const defaultRequirements: Array<Partial<import('../types/pcbiAdmin').PCBIGapMatrixRow>> = [
      {
        material: 'Hot Rolled Steel Coils IS 2062 E250',
        module2Commodity: 'Structural Steel',
        unspsc: '30263601',
        spend: 52000000,
        transactions: 142,
        pcbiId: 'PCBI-STEEL-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'COMPLETE',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'APPROVED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2020-04-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Caustic Soda Lye 48% Bulk',
        module2Commodity: 'Industrial Chemicals',
        unspsc: '12352100',
        spend: 18500000,
        transactions: 48,
        pcbiId: 'PCBI-CHEM-CAUSTIC-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'PARTIAL_HISTORY',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2023-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Refined Copper Cathode Grade A',
        module2Commodity: 'Non-Ferrous Metals',
        unspsc: '30101800',
        spend: 41200000,
        transactions: 64,
        pcbiId: 'PCBI-COPPER-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'COMPLETE',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'APPROVED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2020-04-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'High Density Polyethylene Granules Grade 5502',
        module2Commodity: 'Polymer & Resins',
        unspsc: '13102005',
        spend: 30268750,
        transactions: 52,
        pcbiId: 'PCBI-POLY-HDPE-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'PARTIAL_HISTORY',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Alumina Refractory Brick High Temp',
        module2Commodity: 'Refractories',
        unspsc: '30111500',
        spend: 14500000,
        transactions: 22,
        pcbiId: 'PCBI-REFRAC-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'FREQUENCY_MISMATCH',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'MONTHLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Fuel Oil Light Diesel Oil (LDO)',
        module2Commodity: 'Fuel & Energy',
        unspsc: '15101505',
        spend: 11200000,
        transactions: 18,
        pcbiId: 'PCBI-FUEL-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'COMPLETE',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MISMATCH'
      },
      {
        material: 'SS 304 Turnings (Scrap)',
        module2Commodity: 'Stainless Steel',
        unspsc: '30263605',
        spend: 12400000,
        transactions: 28,
        pcbiId: 'PCBI-STEEL-SS304-PRIME',
        definitionStatus: 'DEFINED',
        dataStatus: 'SPECIFICATION_MISMATCH',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MISMATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Ferro Molybdenum 65%',
        module2Commodity: 'Ferro Alloys',
        unspsc: '30264000',
        spend: 16800000,
        transactions: 19,
        pcbiId: 'PCBI-ALLOY-FERROMOLY-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'SOURCE_UNVERIFIED',
        sourceStatus: 'UNDER_VALIDATION',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'MONTHLY',
        specificationMatch: 'UNDER_REVIEW',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Centrifugal Slurry Pump Mechanical Seals & Titanium Impeller',
        module2Commodity: 'Centrifugal Pumps',
        unspsc: '40151500',
        spend: 8900000,
        transactions: 11,
        pcbiId: null,
        definitionStatus: 'MISSING',
        dataStatus: 'NO_HISTORY',
        sourceStatus: 'CANDIDATE',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2023-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: null,
        historicalEndAvailable: null,
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: null,
        specificationMatch: 'UNDER_REVIEW',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Deep Groove Ball Bearing 6205-2RS',
        module2Commodity: 'Mechanical Components',
        unspsc: '31171504',
        spend: 21500000,
        transactions: 85,
        pcbiId: 'PCBI-BRG-COMP-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'PARTIAL_HISTORY',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-04-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Mobil DTE 25 Hydraulic Oil ISO VG 46',
        module2Commodity: 'Industrial Lubricants',
        unspsc: '15121500',
        spend: 7800000,
        transactions: 24,
        pcbiId: 'PCBI-LUB-OIL-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'SOURCE_UNVERIFIED',
        sourceStatus: 'CANDIDATE',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2023-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Double-Wall Heavy Duty Corrugated Pallet Boxes',
        module2Commodity: 'Packaging Materials',
        unspsc: '24112400',
        spend: 13400000,
        transactions: 62,
        pcbiId: 'PCBI-PKG-BOX-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'FREQUENCY_MISMATCH',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2022-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'MONTHLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Variable Frequency Drive 75kW Inverter System',
        module2Commodity: 'Electrical Switchgear',
        unspsc: '39122000',
        spend: 15600000,
        transactions: 14,
        pcbiId: 'PCBI-ELEC-VFD-001',
        definitionStatus: 'UNDER_REVIEW',
        dataStatus: 'SPECIFICATION_MISMATCH',
        sourceStatus: 'CANDIDATE',
        methodologyStatus: 'METHODOLOGY_PENDING',
        historicalStartRequired: '2023-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2023-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'UNDER_REVIEW',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH',
        actionRequired: 'Hard Block: Module 3 classification conflict with Module 2 authority.',
        readinessStatus: 'CLASSIFICATION_CONFLICT'
      },
      {
        material: 'Titanium Dioxide Rutile Pigment R-902+',
        module2Commodity: 'Chemicals & Pigments',
        unspsc: '12171500',
        spend: 9600000,
        transactions: 17,
        pcbiId: 'PCBI-CHEM-TIO2-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'PARTIAL_HISTORY',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2022-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2024-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Annual Facility HVAC & Cleanroom Calibration Services',
        module2Commodity: 'Industrial Services',
        unspsc: '72101500',
        spend: 6400000,
        transactions: 6,
        pcbiId: null,
        definitionStatus: 'NOT_BENCHMARKABLE',
        dataStatus: 'NO_HISTORY',
        sourceStatus: 'REJECTED',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2023-01-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: null,
        historicalEndAvailable: null,
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: null,
        specificationMatch: 'UNDER_REVIEW',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      },
      {
        material: 'Stainless Steel Seamless Pipes SS316L (Sch 40)',
        module2Commodity: 'Piping & Tubing',
        unspsc: '40141600',
        spend: 17800000,
        transactions: 33,
        pcbiId: 'PCBI-STEEL-PIPE-001',
        definitionStatus: 'DEFINED',
        dataStatus: 'PARTIAL_HISTORY',
        sourceStatus: 'VALIDATED',
        methodologyStatus: 'NONE_REQUIRED',
        historicalStartRequired: '2020-04-01',
        historicalEndRequired: '2026-06-30',
        historicalStartAvailable: '2023-01-01',
        historicalEndAvailable: '2026-06-30',
        frequencyRequired: 'WEEKLY',
        frequencyAvailable: 'WEEKLY',
        specificationMatch: 'MATCH',
        geographyMatch: 'MATCH',
        unitMatch: 'MATCH'
      }
    ];

    return pcbiGapGovernanceService.generateGapMatrix(defaultRequirements);
  }

  public getSyntheticQATestResults(): PCBISyntheticTestCase[] {
    return pcbiGapGovernanceService.runSyntheticTestCases();
  }

  public runPreviewSandbox(): PCBIPreviewSafetyRecord {
    return pcbiGapGovernanceService.executePreviewSandbox();
  }
}

export const pcbiAdminService = new PCBIAdminService();

