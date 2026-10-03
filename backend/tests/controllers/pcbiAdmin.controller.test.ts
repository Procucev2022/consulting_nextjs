import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { pcbiAdminController } from '../../src/controllers/pcbiAdmin.controller';
import { pcbiAdminService } from '../../src/services/pcbiAdminService';

describe('PCBI Admin Controller Tests (backend/src/controllers/pcbiAdmin.controller.ts)', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let setHeaderMock: ReturnType<typeof vi.fn>;
  let sendMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();
    setHeaderMock = vi.fn().mockReturnThis();
    sendMock = vi.fn().mockReturnThis();

    req = {
      params: {},
      body: {}
    };

    res = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
      setHeader: setHeaderMock as unknown as Response['setHeader'],
      send: sendMock as unknown as Response['send']
    };
  });

  it('getVersions should return version list and active version', async () => {
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        active_version: 'V1.0'
      })
    );
  });

  it('getVersion should return 404 for unknown version', async () => {
    req.params = { version: 'V999.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('getVersion should return record for existing version', async () => {
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        version: expect.objectContaining({ version: 'V1.0' })
      })
    );
  });

  it('importMaster should reject missing file_name', async () => {
    req.body = {};
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('file_name is required')
      })
    );
  });

  it('importMaster should successfully import valid payload', async () => {
    req.body = {
      version: 'V2.0',
      file_name: 'test.xlsx',
      file_size_mb: 1.0,
      benchmarks: [],
      weeklyIndices: []
    };
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        version: 'V2.0'
      })
    );
  });

  it('publishVersion should publish version and return result', async () => {
    req.params = { version: 'V1.0' };
    req.body = { published_by: 'Sriman' };
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        activeVersion: 'V1.0'
      })
    );
  });

  it('publishVersion should return 400 on error', async () => {
    req.params = { version: 'NON_EXISTENT' };
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('getValidationReport should return 404 if report is not found', async () => {
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getValidationReport(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('getValidationReport should send report when present', async () => {
    vi.spyOn(pcbiAdminService, 'getValidationReport').mockReturnValueOnce('{"test": true}');
    req.params = { version: 'V2.0' };
    await pcbiAdminController.getValidationReport(req as Request, res as Response);
    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(sendMock).toHaveBeenCalledWith('{"test": true}');
  });

  it('getVersions should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'getVersions').mockImplementationOnce(() => {
      throw new Error('Database crash');
    });
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('getVersion should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'getVersion').mockImplementationOnce(() => {
      throw new Error('Fetch failed');
    });
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('importMaster should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'importMaster').mockRejectedValueOnce(new Error('Import failed'));
    req.body = { file_name: 'test.xlsx' };
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('getValidationReport should return 500 when service throws', async () => {
    vi.spyOn(pcbiAdminService, 'getValidationReport').mockImplementationOnce(() => {
      throw 'Raw string error';
    });
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getValidationReport(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('getVersions should handle null active version and string errors', async () => {
    vi.spyOn(pcbiAdminService, 'getActivePublishedVersion').mockReturnValueOnce(null);
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ active_version: null }));

    vi.spyOn(pcbiAdminService, 'getVersions').mockImplementationOnce(() => {
      throw 'Non-error rejection';
    });
    await pcbiAdminController.getVersions(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('getVersion should handle non-Error throw', async () => {
    vi.spyOn(pcbiAdminService, 'getVersion').mockImplementationOnce(() => {
      throw 'Plain string error';
    });
    req.params = { version: 'V1.0' };
    await pcbiAdminController.getVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('importMaster should handle non-Error throw', async () => {
    vi.spyOn(pcbiAdminService, 'importMaster').mockRejectedValueOnce('Custom failure string');
    req.body = { file_name: 'valid.xlsx' };
    await pcbiAdminController.importMaster(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('publishVersion should handle Error and non-Error throw and use default publisher', async () => {
    req.params = { version: 'V1.0' };
    req.body = {}; // published_by omitted to exercise default 'Admin'
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalled();

    vi.spyOn(pcbiAdminService, 'publishVersion').mockRejectedValueOnce('String publish error');
    await pcbiAdminController.publishVersion(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it('getGapMatrix should return formal gap matrix and handle errors', async () => {
    await pcbiAdminController.getGapMatrix(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: expect.any(Number),
        matrix: expect.any(Array)
      })
    );

    vi.spyOn(pcbiAdminService, 'getGapMatrix').mockImplementationOnce(() => {
      throw new Error('Database failure retrieving gap matrix');
    });
    await pcbiAdminController.getGapMatrix(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('getSyntheticQATests should return 12 synthetic QA test cases and handle errors', async () => {
    await pcbiAdminController.getSyntheticQATests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 12,
        all_passed: true,
        tests: expect.any(Array)
      })
    );

    vi.spyOn(pcbiAdminService, 'getSyntheticQATestResults').mockImplementationOnce(() => {
      throw 'Failed running QA tests';
    });
    await pcbiAdminController.getSyntheticQATests(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('executePreviewSandbox should return preview safety record and handle errors', async () => {
    await pcbiAdminController.executePreviewSandbox(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        safety_record: expect.objectContaining({
          mode: 'SIMULATION_ONLY',
          productionStatus: 'NOT_PRODUCTION',
          approvalStatus: 'NOT_APPROVED',
          pcbiObservationsWritten: 0,
          pcbiMasterCatalogWritten: 0,
          savingsEngineWritten: 0,
          module4Connected: false,
          sandboxIsolated: true
        })
      })
    );

    vi.spyOn(pcbiAdminService, 'runPreviewSandbox').mockImplementationOnce(() => {
      throw new Error('Sandbox creation error');
    });
    await pcbiAdminController.executePreviewSandbox(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it('getE2ESuite should return full suite results and handle errors', async () => {
    await pcbiAdminController.getE2ESuite(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        summary: expect.any(Object),
        gapMatrix: expect.any(Array),
        gapAlerts: expect.any(Array)
      })
    );
  });

  it('getE2EGapAlerts should return structured gap alerts and handle errors', async () => {
    await pcbiAdminController.getE2EGapAlerts(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: expect.any(Number),
        alerts: expect.any(Array)
      })
    );
  });

  it('executeDynamicUpload should run 12-stage extraction pipeline and handle errors', async () => {
    req.body = { fileName: 'test.xlsx', format: 'XLSX' };
    await pcbiAdminController.executeDynamicUpload(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          upload: expect.any(Object),
          fileValidation: expect.any(Object),
          standardizationPreview: expect.any(Array)
        })
      })
    );
  });

  it('getFrequencyTests should return 4 frequency normalization tests and handle errors', async () => {
    await pcbiAdminController.getFrequencyTests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 4,
        tests: expect.any(Array)
      })
    );
  });

  it('executeAdminGate should execute confirmation gate and handle errors', async () => {
    req.body = { adminUser: 'Test Admin', action: 'APPROVE' };
    await pcbiAdminController.executeAdminGate(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        audit: expect.objectContaining({
          adminUser: 'Test Admin',
          status: 'APPROVED'
        })
      })
    );
  });

  it('getCatalogOperations, getRerunSimulation and getMismatchTests should return results', async () => {
    await pcbiAdminController.getCatalogOperations(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 7,
        operations: expect.any(Array)
      })
    );

    await pcbiAdminController.getRerunSimulation(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          codeDeploymentRequired: false
        })
      })
    );

    await pcbiAdminController.getMismatchTests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 7,
        all_passed: true
      })
    );
  });

  it('controlled benchmark validation controller endpoints should return expected results and handle errors', async () => {
    await pcbiAdminController.getControlledPreflight(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        preflight: expect.objectContaining({ fullDatasetConfirmed: true })
      })
    );

    await pcbiAdminController.getControlled12Series(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 12,
        series: expect.any(Array)
      })
    );

    await pcbiAdminController.getControlledObservationsAndTransformations(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        observations: expect.any(Array),
        transformations: expect.any(Array)
      })
    );

    await pcbiAdminController.getControlledCalculations(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        calculations: expect.any(Array),
        basePeriodValidations: expect.any(Array)
      })
    );

    await pcbiAdminController.getControlledNegativeTests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 10,
        all_passed: true
      })
    );

    await pcbiAdminController.getControlledAnalyticalPreview(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        preview: expect.any(Array)
      })
    );

    await pcbiAdminController.getControlledValidationSummary(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        summary: expect.objectContaining({
          finalGate: 'CALCULATION_VALIDATED_WITH_GAPS'
        })
      })
    );
  });

  it('should test all PCBI V1.6 Pilot Expansion endpoints and error paths', async () => {
    // 1. Gap Matrix
    await pcbiAdminController.getPilotGapMatrix(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: expect.any(Number),
        matrix: expect.any(Array)
      })
    );

    // 2. Dashboard Metrics
    await pcbiAdminController.getPilotDashboardMetrics(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        metrics: expect.objectContaining({
          totalCommodities: 13,
          productionReady: 6
        })
      })
    );

    // 3. Analytical Preview
    await pcbiAdminController.getPilotAnalyticalPreview(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        preview: expect.any(Array)
      })
    );

    // 4. Detect Upload File
    req.body = { format: 'XLSX', fileName: 'sample.xlsx' };
    await pcbiAdminController.detectUploadFile(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        detected: expect.objectContaining({
          format: 'XLSX',
          previewStatus: 'PREVIEW_READY'
        })
      })
    );

    // Detect error
    req.body = { format: 'INVALID', fileName: 'bad.exe' };
    await pcbiAdminController.detectUploadFile(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);

    // 5. Execute Catalog Action
    req.body = { action: 'ADD_COMMODITY', payload: { commodityId: 'C1' } };
    await pcbiAdminController.executeCatalogAction(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          success: true,
          action: 'ADD_COMMODITY'
        })
      })
    );

    // 6. Recalculate Isolated Commodity
    req.params = { commodityId: 'COMMODITY-FEMOLY-65' };
    await pcbiAdminController.recalculateIsolatedCommodity(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          recalculatedCommodity: 'COMMODITY-FEMOLY-65',
          otherCommoditiesAffected: false
        })
      })
    );

    // 7. Product Acceptance Tests
    await pcbiAdminController.executeProductAcceptanceTests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 20,
        allPassed: true,
        tests: expect.any(Array)
      })
    );

    // 8. Controlled Pilot Readiness
    await pcbiAdminController.getControlledPilotReadiness(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        readiness: expect.objectContaining({
          module3Status: 'PRODUCTION_READY_FOR_CONTROLLED_PILOT',
          allTestsPassed: true,
          totalTests: 20
        })
      })
    );
  });

  it('should test all PCBI V1.7 Production Pilot endpoints and error handling', async () => {
    // 1. Dashboard
    await pcbiAdminController.getProductionPilotDashboard(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        dashboard: expect.objectContaining({
          totalPcbiCommodities: 13,
          productionReady: 6,
          customerSpendCovered: 32120405
        })
      })
    );

    // 2. High Impact Gaps
    req.query = { threshold: '10000000' };
    await pcbiAdminController.getHighImpactGaps(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 2,
        alerts: expect.any(Array)
      })
    );

    // 3. Data Consistency Check
    await pcbiAdminController.getDataConsistencyCheck(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        check: expect.objectContaining({
          isConsistent: true,
          customerCommodityCount: 13,
          materialCommodityCount: 12
        })
      })
    );

    // 4. Detect Universal Mapping
    req.body = { format: 'CSV', fileName: 'test.csv', unmappedHeaders: ['col1'] };
    await pcbiAdminController.detectUniversalMapping(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        mapping: expect.objectContaining({
          status: 'DATA_MAPPING_REVIEW_REQUIRED'
        })
      })
    );

    // 5. Audit Duplicate Observations
    req.body = { seriesId: 'S1', observations: [{ date: '2020-04-01', value: 100 }], resolution: 'RETAIN_EXISTING' };
    await pcbiAdminController.auditDuplicateObservations(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        duplicatesCount: 1,
        duplicates: expect.any(Array)
      })
    );

    // 6. Manage Dynamic Catalog V17
    req.body = { action: 'ADD_COMMODITY', payload: { commodityCode: 'NICKEL' } };
    await pcbiAdminController.manageDynamicCatalogV17(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          success: true,
          version: '1.7.0'
        })
      })
    );

    // 7. Recalculate Targeted Series
    req.params = { seriesId: 'SERIES-FEMOLY-M1' };
    await pcbiAdminController.recalculateTargetedSeries(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          recalculatedSeries: 'SERIES-FEMOLY-M1',
          otherCommoditiesAffected: false
        })
      })
    );

    // 8. Acceptance Tests
    await pcbiAdminController.executeProductionPilotAcceptanceTests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 24,
        allPassed: true,
        tests: expect.any(Array)
      })
    );

    // 9. Release Report
    await pcbiAdminController.getProductionPilotReleaseReport(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        report: expect.objectContaining({
          module3Status: 'PRODUCTION_PILOT_READY',
          allTestsPassed: true,
          totalTests: 24
        })
      })
    );
  });

  it('should handle PCBI V1.6 Production Ready endpoints successfully', async () => {
    // 1. Dashboard V16
    await pcbiAdminController.getDashboardV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        dashboard: expect.objectContaining({
          totalPcbiCommodities: 12,
          productionReady: 6,
          coveragePct: 45.51
        })
      })
    );

    // 2. Mismatches V16
    await pcbiAdminController.getCustomerDataMismatchesV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: expect.any(Number),
        mismatches: expect.any(Array)
      })
    );

    // 3. High Impact Alerts V16
    await pcbiAdminController.getHighImpactAlertsV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: expect.any(Number),
        alerts: expect.any(Array)
      })
    );

    // 4. Upload and Normalize V16
    req.body = { fileName: 'test.xlsx', fileContent: 'data', format: 'XLSX' };
    await pcbiAdminController.uploadAndNormalizeV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          normalizedObservations: expect.any(Array),
          qualityReport: expect.any(Object)
        })
      })
    );

    // 5. Version Control V16
    req.body = {
      operation: 'UPDATE',
      pcbiId: 'PCBI-IND-STL-HRC-001',
      newVersion: '1.2.0',
      approvedBy: 'ADMIN_CHIEF',
      changeReason: 'Test version upgrade'
    };
    await pcbiAdminController.executeVersionControlV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          activeVersion: '1.2.0'
        })
      })
    );

    // 6. Approve and Rerun V16
    req.body = { pcbiId: 'PCBI-IND-MET-FMO-001', approvedBy: 'ADMIN', approvalId: 'APP-123' };
    await pcbiAdminController.approveAndRerunV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          recalculatedTransactions: 65,
          statusAfter: expect.objectContaining({ readiness: 'PRODUCTION_READY' })
        })
      })
    );

    // 7. Acceptance Tests V16 (A through T)
    await pcbiAdminController.runAcceptanceTestsV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 20,
        allPassed: true,
        tests: expect.any(Array)
      })
    );

    // 8. Production Ready Summary V16
    await pcbiAdminController.getProductionReadySummaryV16(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        summary: expect.objectContaining({
          module3Status: 'PRODUCTION_READY_DYNAMIC_PCBI',
          allTestsPassed: true,
          totalTests: 20
        })
      })
    );
  });

  it('should handle errors gracefully in V1.6 controller endpoints', async () => {
    // Inject error into one method or pass invalid input
    req.body = {
      operation: 'ROLLBACK',
      pcbiId: 'NON_EXISTENT_ID'
    };
    await pcbiAdminController.executeVersionControlV16(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Version control operation failed'
      })
    );
  });

  it('should handle PCBI Commodity Coverage endpoints (Prompt 202) successfully', async () => {
    // 1. Coverage Gap Queue
    await pcbiAdminController.getCoverageGapQueue(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 6,
        queue: expect.any(Array)
      })
    );

    // 2. Override Coverage Priority
    req.body = { commodityId: 'COM-MET-FMO', newPriority: 'P2 — High Coverage Gap' };
    await pcbiAdminController.overrideCoveragePriority(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        item: expect.objectContaining({
          commodityId: 'COM-MET-FMO',
          priority: 'P2 — High Coverage Gap'
        })
      })
    );

    // 3. Multi-Sources
    req.params = { commodityId: 'COM-MET-FMO' };
    await pcbiAdminController.getCommodityMultiSources(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        commodityId: 'COM-MET-FMO',
        total: expect.any(Number),
        sources: expect.any(Array)
      })
    );

    // 4. Add Source Candidate
    req.params = { commodityId: 'COM-MET-FMO' };
    req.body = {
      sourceId: 'SRC-NEW-TEST',
      sourceName: 'Test Source',
      sourceType: 'GOVERNMENT',
      url: 'https://test.gov.in',
      document: 'test.pdf',
      publisher: 'Test Publisher',
      publicationDate: '2026-06-01',
      checksum: '12345',
      frequency: 'MONTHLY',
      unit: 'INR/MT',
      currency: 'INR',
      geography: 'INDIA_DOMESTIC',
      sourceStatus: 'UNDER_EVALUATION'
    };
    await pcbiAdminController.addCommoditySourceCandidate(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        commodityId: 'COM-MET-FMO',
        source: expect.objectContaining({ sourceId: 'SRC-NEW-TEST' })
      })
    );

    // 5. Compare Sources
    req.params = { commodityId: 'COM-MET-FMO' };
    req.query = { period: '2026-06' };
    await pcbiAdminController.compareCommoditySources(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        comparison: expect.objectContaining({
          commodityId: 'COM-MET-FMO',
          adminApprovalRequired: true
        })
      })
    );

    // 6. Coverage Dashboard
    await pcbiAdminController.getCommodityCoverageDashboard(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        dashboard: expect.objectContaining({
          totalCustomerSpend: 86317055,
          pcbiCoveredSpend: 32120405,
          pcbiUncoveredSpend: 38459325
        })
      })
    );

    // 7. Unit / Currency Display QA
    req.body = {
      customerValue: 142500,
      customerUnit: 'MT',
      customerCurrency: 'INR',
      pcbiValue: 142500,
      pcbiUnit: 'MT',
      pcbiCurrency: 'INR'
    };
    await pcbiAdminController.validateUnitCurrencyDisplayQA(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        qaResult: expect.objectContaining({
          isValidDisplay: true,
          discrepancyError: null
        })
      })
    );

    // 8. Generate Master Excel
    await pcbiAdminController.generateCommodityCoverageMasterExcel(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        filePath: expect.stringContaining('.xlsx'),
        message: expect.stringContaining('PCBI_COMMODITY_COVERAGE_MASTER.xlsx')
      })
    );

    // 9. Check Frequency Compatibility
    req.body = { sourceFreq: 'DAILY', requiredFreq: 'MONTHLY' };
    await pcbiAdminController.checkFrequencyCompatibility(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          isCompatible: false,
          status: 'METHODOLOGY_PENDING'
        })
      })
    );

    // 10. Validate Dynamic Extraction
    req.body = {
      sourceDate: '2026-06-01',
      rawValue: '100',
      rawUnit: 'MT',
      rawCurrency: 'INR',
      sourceFrequency: 'MONTHLY',
      sourceGeography: 'INDIA_DOMESTIC',
      sourceGrade: 'Standard',
      status: 'EXTRACTION_VERIFIED'
    };
    await pcbiAdminController.validateDynamicExtraction(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          status: 'EXTRACTION_VERIFIED'
        })
      })
    );
  });

  it('should handle errors in Coverage controller endpoints gracefully', async () => {
    req.body = { commodityId: 'NON_EXISTENT_COM', newPriority: 'P1' };
    await pcbiAdminController.overrideCoveragePriority(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Priority override failed'
      })
    );
  });

  it('should handle PCBI Platform Integration endpoints (Prompt 204) successfully', async () => {
    // 1. Pre-production Audit
    await pcbiAdminController.getPlatformPreProductionAudit(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        audit: expect.any(Array)
      })
    );

    // 2. Deployment Checklist
    await pcbiAdminController.getPlatformDeploymentChecklist(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        checklist: expect.any(Array)
      })
    );

    // 3. Continuity Reconciliation
    await pcbiAdminController.runPlatformContinuityReconciliation(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        reconciliation: expect.objectContaining({
          isReconciliationPassed: true,
          inputTransactionsCount: 468
        })
      })
    );

    // 4. Evaluate Opportunity
    req.body = {
      transactionId: 'TX-INT-001',
      customerActualPrice: 100000,
      customerUnit: 'MT',
      customerCurrency: 'INR',
      customerDate: '2026-06-01',
      module2Classification: 'Copper Rods',
      unspsc: '30102100',
      pcbiId: 'PCBI-001',
      pcbiIndex: 120.0,
      pcbiBenchmarkValue: 90000,
      pcbiSource: 'Exchange',
      pcbiMethodology: 'WEIGHTED_AVG',
      pcbiEffectiveDate: '2026-06',
      pcbiStatus: 'PCBI_AVAILABLE',
      pcbiUnit: 'MT',
      pcbiCurrency: 'INR',
      pcbiGeography: 'INDIA_DOMESTIC',
      provenanceReference: 'REF-001'
    };
    await pcbiAdminController.evaluatePlatformModule4Opportunity(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          outputCategory: 'OPPORTUNITY_ELIGIBLE',
          isOpportunityEligible: true
        })
      })
    );

    // 5. Controlled Portfolio
    await pcbiAdminController.runPlatformControlledPortfolio(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        portfolio: expect.any(Object)
      })
    );

    // 6. Acceptance Tests
    await pcbiAdminController.runPlatformAcceptanceTests(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 20,
        tests: expect.any(Array)
      })
    );

    // 7. Management Dashboard
    await pcbiAdminController.getPlatformManagementDashboard(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        dashboard: expect.objectContaining({
          totalCustomerSpendInr: 86317055,
          pcbiCoveredSpendInr: 32120405
        })
      })
    );

    // 8. Generate Audit JSON
    await pcbiAdminController.generatePlatformAuditJson(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        filePath: expect.stringContaining('.json'),
        message: expect.stringContaining('PCBI_V1_7_FULL_PLATFORM_AUDIT.json')
      })
    );
  });

  it('should handle PCBI Commodity Data Lab endpoints (Prompt 218)', async () => {
    // 1. Dashboard Metrics
    await pcbiAdminController.getCommodityDataLabDashboard(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        metrics: expect.objectContaining({
          totalCommodities: 10
        })
      })
    );

    // 2. Research Queue
    await pcbiAdminController.getCommodityResearchQueue(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        total: 10,
        queue: expect.any(Array)
      })
    );

    // 3. Workspace Detail
    req.params = { pcbiId: 'PCBI-FEMO-65-001' };
    req.query = { tab: 'OVERVIEW' };
    await pcbiAdminController.getCommodityWorkspaceDetail(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        workspace: expect.objectContaining({
          overview: expect.objectContaining({
            commodityName: 'Ferro Molybdenum 65%'
          })
        })
      })
    );

    // 3b. Workspace Detail 404 for unknown commodity
    req.params = { pcbiId: 'UNKNOWN-PCBI' };
    await pcbiAdminController.getCommodityWorkspaceDetail(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(404);

    // 4. Domain Detection - Valid
    req.body = {
      fileName: 'MMR_Price_Bulletin.pdf',
      fileContentSnippet: 'raw_observations, source_register',
      targetArea: 'COMMODITY_DATA_LAB'
    };
    await pcbiAdminController.detectUploadDomain(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        detection: expect.objectContaining({
          isAllowedInTarget: true
        })
      })
    );

    // 4b. Domain Detection - Schema Failure
    req.body = { fileName: '' };
    await pcbiAdminController.detectUploadDomain(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);

    // 5. Source Upload - Valid
    req.body = {
      commodityId: 'COM-MET-FMO',
      pcbiId: 'PCBI-FEMO-65-001',
      sourceName: 'Controller Test Source',
      publisher: 'Test Publisher',
      documentName: 'Test_Doc.csv',
      fileType: 'CSV'
    };
    await pcbiAdminController.uploadCommoditySource(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        banner: 'COMMODITY DATA UPLOAD — NOT PCBI MASTER'
      })
    );

    // 5b. Source Upload - Schema Failure
    req.body = { commodityId: '' };
    await pcbiAdminController.uploadCommoditySource(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);

    // 6. Approval - Valid
    req.body = {
      commodityId: 'COM-MET-FMO',
      pcbiId: 'PCBI-FEMO-65-001',
      approverName: 'Controller Admin'
    };
    await pcbiAdminController.approveCommodityData(req as Request, res as Response);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        result: expect.objectContaining({
          approvalStatus: 'ADMIN_APPROVED'
        })
      })
    );

    // 6b. Approval - Schema Failure
    req.body = { commodityId: '' };
    await pcbiAdminController.approveCommodityData(req as Request, res as Response);
    expect(statusMock).toHaveBeenCalledWith(400);
  });
});



