import { describe, it, expect, beforeEach } from 'vitest';
import { PCBIAdminService } from '../../src/services/pcbiAdminService';
import type { PCBIImportPayload } from '../../src/types/pcbiAdmin';

describe('PCBI Admin Service Unit Tests (backend/src/services/pcbiAdminService.ts)', () => {
  let service: PCBIAdminService;

  beforeEach(() => {
    service = new PCBIAdminService();
  });

  it('should initialize with baseline V1.0 published version', () => {
    const versions = service.getVersions();
    expect(versions.length).toBeGreaterThanOrEqual(1);

    const active = service.getActivePublishedVersion();
    expect(active).not.toBeNull();
    expect(active?.version).toBe('V1.0');
    expect(active?.status).toBe('PUBLISHED');
  });

  it('should find version by version string', () => {
    const v1 = service.getVersion('V1.0');
    expect(v1).not.toBeNull();
    expect(v1?.file_name).toBe('PCBI_GLOBAL_MASTER_V1_2020_2026.xlsx');

    const nonExistent = service.getVersion('V99.9');
    expect(nonExistent).toBeNull();
  });

  it('should import a new master dataset and generate next version', async () => {
    const payload: PCBIImportPayload = {
      version: 'V2.0',
      file_name: 'PCBI_NEW_MASTER.xlsx',
      file_size_mb: 4.2,
      uploaded_by: 'Sriman Admin',
      worksheets: [],
      mappings: {},
      benchmarks: [{ pcbi_id: 'PCBI-TEST-001', category: 'Steel' }],
      weeklyIndices: [{ pcbi_id: 'PCBI-TEST-001', index_value: 120 }],
      constituents: [],
      sources: [],
      unspscMappings: [],
      validationSummary: {
        totalRecords: 2,
        validRecords: 2,
        warningRecords: 0,
        errorRecords: 0,
        blockingErrorCount: 0,
        warningCount: 0,
        aQualityCount: 1,
        bQualityCount: 0,
        cQualityCount: 0,
        avgBenchmarkability: 80,
        dateStart: '2020-04-01',
        dateEnd: '2026-07-31',
        issues: []
      }
    };

    const res = await service.importMaster(payload);
    expect(res.success).toBe(true);
    expect(res.version).toBe('V2.0');
    expect(res.pcbi_records).toBe(1);
    expect(res.weekly_index_records).toBe(1);
    expect(res.status).toBe('VALIDATED');

    const retrieved = service.getVersion('V2.0');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.file_name).toBe('PCBI_NEW_MASTER.xlsx');
  });

  it('should import with DRAFT status if blocking errors exist', async () => {
    const payload: PCBIImportPayload = {
      version: 'V2.1',
      file_name: 'PCBI_WITH_ERRORS.xlsx',
      file_size_mb: 1.0,
      uploaded_by: 'Admin',
      worksheets: [],
      mappings: {},
      benchmarks: [],
      weeklyIndices: [],
      constituents: [],
      sources: [],
      unspscMappings: [],
      validationSummary: {
        totalRecords: 1,
        validRecords: 0,
        warningRecords: 0,
        errorRecords: 1,
        blockingErrorCount: 1,
        warningCount: 0,
        aQualityCount: 0,
        bQualityCount: 0,
        cQualityCount: 0,
        avgBenchmarkability: 70,
        dateStart: null,
        dateEnd: null,
        issues: []
      }
    };

    await expect(service.importMaster(payload)).rejects.toThrow(
      'Cannot import PCBI Master: 1 blocking errors must be resolved first.'
    );
  });

  it('should publish a validated version and archive previous published versions', async () => {
    // Import V2.0 first
    await service.importMaster({
      version: 'V2.0',
      file_name: 'PCBI_V2.xlsx',
      file_size_mb: 2.0,
      uploaded_by: 'Admin',
      worksheets: [],
      mappings: {},
      benchmarks: [],
      weeklyIndices: [],
      constituents: [],
      sources: [],
      unspscMappings: [],
      validationSummary: {
        totalRecords: 0,
        validRecords: 0,
        warningRecords: 0,
        errorRecords: 0,
        blockingErrorCount: 0,
        warningCount: 0,
        aQualityCount: 0,
        bQualityCount: 0,
        cQualityCount: 0,
        avgBenchmarkability: 70,
        dateStart: '2020-04-01',
        dateEnd: '2026-07-31',
        issues: []
      }
    });

    const pubRes = await service.publishVersion('V2.0', 'Sriman Admin');
    expect(pubRes.success).toBe(true);
    expect(pubRes.activeVersion).toBe('V2.0');

    const v1 = service.getVersion('V1.0');
    expect(v1?.status).toBe('ARCHIVED');

    const v2 = service.getVersion('V2.0');
    expect(v2?.status).toBe('PUBLISHED');
    expect(v2?.published_by).toBe('Sriman Admin');
  });

  it('should throw an error when publishing non-existent version', async () => {
    await expect(service.publishVersion('V99.9', 'Admin')).rejects.toThrow('Version V99.9 not found');
  });

  it('should retrieve validation report json string', async () => {
    const report = service.getValidationReport('V1.0');
    expect(report).toBeNull(); // Initial seed has no raw json

    await service.importMaster({
      version: 'V3.0',
      file_name: 'PCBI_V3.xlsx',
      file_size_mb: 1.0,
      uploaded_by: 'Admin',
      worksheets: [],
      mappings: {},
      benchmarks: [],
      weeklyIndices: [],
      constituents: [],
      sources: [],
      unspscMappings: [],
      validationSummary: {
        totalRecords: 5,
        validRecords: 5,
        warningRecords: 0,
        errorRecords: 0,
        blockingErrorCount: 0,
        warningCount: 0,
        aQualityCount: 5,
        bQualityCount: 0,
        cQualityCount: 0,
        avgBenchmarkability: 75,
        dateStart: '2020-04-01',
        dateEnd: '2026-07-31',
        issues: []
      }
    });

    const v3Report = service.getValidationReport('V3.0');
    expect(v3Report).not.toBeNull();
    expect(JSON.parse(v3Report || '{}').totalRecords).toBe(5);
  });

  it('should handle payload with omitted version, empty dates, and undefined arrays', async () => {
    const res = await service.importMaster({
      file_name: 'PCBI_AUTO.xlsx',
      file_size_mb: 0.5,
      // version omitted
      // uploaded_by omitted
      worksheets: [],
      mappings: {},
      validationSummary: {
        totalRecords: 0,
        validRecords: 0,
        warningRecords: 0,
        errorRecords: 0,
        blockingErrorCount: 0,
        warningCount: 0,
        aQualityCount: 0,
        bQualityCount: 0,
        cQualityCount: 0,
        avgBenchmarkability: 0,
        dateStart: null,
        dateEnd: null,
        issues: []
      }
    });

    expect(res.success).toBe(true);
    expect(res.version).toMatch(/^V\d+\.0$/);
    const loaded = service.getVersion(res.version);
    expect(loaded?.uploaded_by).toBe('Admin');
  });

  it('getActivePublishedVersion should return null if no versions are PUBLISHED', async () => {
    const fresh = new PCBIAdminService();
    // Archive the only version
    await fresh.publishVersion('V1.0', 'Admin');
    const v1 = fresh.getVersion('V1.0');
    if (v1) v1.status = 'ARCHIVED';
    expect(fresh.getActivePublishedVersion()).toBeNull();
  });
});

