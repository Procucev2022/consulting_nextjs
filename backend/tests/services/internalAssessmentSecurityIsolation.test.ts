import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { assessmentStore } from '../../src/services/assessmentStore';
import { assessmentWorkflowService } from '../../src/services/assessmentWorkflowService';
import { operatingModeService, saasRouteGuard } from '../../src/services/operatingModeService';
import { SYSTEM_BUILD_IDENTITY, APP_OPERATING_MODES, NDA_STATUSES } from '../../src/constants/assessment';

describe('Security & Isolation Negative Test Suite (Tests A through J)', () => {
  let cleanupIso: () => void;

  beforeAll(() => {
    const iso = assessmentStore.useIsolatedTestDir();
    cleanupIso = iso.cleanup;
  });

  afterAll(() => {
    cleanupIso?.();
    assessmentStore.reloadFromDisk();
  });

  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  // Test A: Cross-assessment data leak prevention
  it('Test A: enforces strict isolation between Assessment A and Assessment B', () => {
    const assessmentA = assessmentStore.createAssessment(
      {
        customerName: 'Customer Alpha',
        industry: 'Automotive',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst.a@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const assessmentB = assessmentStore.createAssessment(
      {
        customerName: 'Customer Beta',
        industry: 'Steel',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst.b@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    // Upload data for Assessment A
    const { dataVersion: dvA } = assessmentWorkflowService.uploadDataVersion(
      assessmentA.assessmentId,
      {
        fileName: 'alpha_spend.xlsx',
        fileSize: 1000,
        checksum: 'sha-alpha-123',
        rowCount: 5000
      },
      'analyst.a@procucev.com',
      'ANALYST'
    );

    // Assessment B's data versions must NOT contain Assessment A's data
    const versionsB = assessmentStore.getDataVersions(assessmentB.assessmentId);
    expect(versionsB).toHaveLength(0);

    // Attempting to run analysis on Assessment B using Assessment A's data version must be rejected
    expect(() => {
      assessmentWorkflowService.runAnalysis(
        assessmentB.assessmentId,
        dvA.dataVersionId,
        'analyst.b@procucev.com',
        'ANALYST'
      );
    }).toThrow(new RegExp(`Data version ${dvA.dataVersionId} not found for assessment`));
  });

  // Test B: Unauthorized role rejection
  it('Test B: rejects unauthorized roles attempting analyst actions', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Customer Role Test',
        industry: 'Aerospace',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'spend.xlsx',
        fileSize: 2000,
        checksum: 'sha-role-test',
        rowCount: 10000
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    // Customer role attempting to run analysis
    expect(() => {
      assessmentWorkflowService.runAnalysis(
        created.assessmentId,
        dataVersion.dataVersionId,
        'customer@external.com',
        'CUSTOMER'
      );
    }).toThrow(/Unauthorized role rejection/);

    // Guest/anonymous role attempting to approve
    expect(() => {
      assessmentWorkflowService.approveAssessment(
        created.assessmentId,
        { approvalComment: 'Self-approval attempt' },
        'guest@unknown.com',
        'GUEST'
      );
    }).toThrow(/Unauthorized role rejection/);
  });

  // Test C: FX Master immutability check
  it('Test C: guarantees FX Master checksum and reference catalog immutability at runtime', () => {
    expect(SYSTEM_BUILD_IDENTITY.FX_MASTER_VERSION).toBe('v2.0');
    expect(SYSTEM_BUILD_IDENTITY.FX_MASTER_CHECKSUM).toBe(
      '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f'
    );

    expect(Object.isFrozen(SYSTEM_BUILD_IDENTITY)).toBe(true);
    expect(() => {
      Object.defineProperty(SYSTEM_BUILD_IDENTITY, 'FX_MASTER_CHECKSUM', { value: 'tampered-fx-checksum' });
    }).toThrow();
    expect(SYSTEM_BUILD_IDENTITY.FX_MASTER_CHECKSUM).toBe(
      '7b88719dbd11e89e2ecffb68fe7398166c248ec77998c4fa9e9c6ec4f2c3f40f'
    );
  });

  // Test D: PCBI Master immutability check
  it('Test D: guarantees PCBI Master checksum and baseline catalog immutability at runtime', () => {
    expect(SYSTEM_BUILD_IDENTITY.PCBI_MASTER_VERSION).toBe('v2.0');
    expect(SYSTEM_BUILD_IDENTITY.PCBI_MASTER_CHECKSUM).toBe(
      'df4299ffa183cb21c59d80f66e258604f5c376615d83a7a7d075dd53787e1411'
    );

    expect(Object.isFrozen(SYSTEM_BUILD_IDENTITY)).toBe(true);
    expect(() => {
      Object.defineProperty(SYSTEM_BUILD_IDENTITY, 'PCBI_MASTER_CHECKSUM', { value: 'tampered-pcbi-checksum' });
    }).toThrow();
    expect(SYSTEM_BUILD_IDENTITY.PCBI_MASTER_CHECKSUM).toBe(
      'df4299ffa183cb21c59d80f66e258604f5c376615d83a7a7d075dd53787e1411'
    );
  });

  // Test E: Dataset hash mismatch rejection
  it('Test E: rejects dataset ingestion when calculated hash mismatches expected hash', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Customer Tamper Test',
        industry: 'Chemicals',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(() => {
      assessmentWorkflowService.uploadDataVersion(
        created.assessmentId,
        {
          fileName: 'tampered_spend.xlsx',
          fileSize: 4096,
          checksum: 'calculated-hash-bad123',
          expectedChecksum: 'expected-hash-good456',
          rowCount: 20505
        },
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Dataset hash mismatch rejection/);
  });

  // Test F: Superseded dataset run rejection
  it('Test F: rejects analysis runs targeting a superseded dataset version', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Customer Superseded Test',
        industry: 'Heavy Machinery',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { dataVersion: v1 } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'v1.xlsx',
        fileSize: 1000,
        checksum: 'sha-v1',
        rowCount: 10000
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    // Ingest V2 which supersedes V1
    const { dataVersion: v2 } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'v2.xlsx',
        fileSize: 1000,
        checksum: 'sha-v2',
        rowCount: 10000
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    expect(v1.dataVersionId).not.toBe(v2.dataVersionId);

    // Mark v1 explicitly as superseded
    v1.isSuperseded = true;
    assessmentStore.saveDataVersion(v1);

    expect(() => {
      assessmentWorkflowService.runAnalysis(
        created.assessmentId,
        v1.dataVersionId,
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Superseded dataset run rejection/);
  });

  // Test G: Unapproved delivery packaging denial
  it('Test G: strictly denies delivery package generation for unapproved assessment runs', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Customer Unapproved Test',
        industry: 'Pharma',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'pharma_spend.xlsx',
        fileSize: 5000,
        checksum: 'sha-pharma',
        rowCount: 20505
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    assessmentWorkflowService.runAnalysis(
      created.assessmentId,
      dataVersion.dataVersionId,
      'analyst@procucev.com',
      'ANALYST'
    );

    // Not yet approved -> Must reject package generation
    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        created.assessmentId,
        'analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Assessment must be APPROVED/);
  });

  // Test H: Superseded report generation denial
  it('Test H: strictly denies report generation from superseded analysis runs', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Customer Superseded Run Test',
        industry: 'Energy',
        assessmentPeriodStart: '2023-06-01',
        assessmentPeriodEnd: '2024-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const { dataVersion } = assessmentWorkflowService.uploadDataVersion(
      created.assessmentId,
      {
        fileName: 'energy_spend.xlsx',
        fileSize: 5000,
        checksum: 'sha-energy',
        rowCount: 20505
      },
      'analyst@procucev.com',
      'ANALYST'
    );

    const { analysisRun } = assessmentWorkflowService.runAnalysis(
      created.assessmentId,
      dataVersion.dataVersionId,
      'analyst@procucev.com',
      'ANALYST'
    );

    assessmentWorkflowService.approveAssessment(
      created.assessmentId,
      {
        analysisRunId: analysisRun.analysisRunId,
        approvalComment: 'Initial approval'
      },
      'lead.analyst@procucev.com',
      'ANALYST'
    );

    // Now mark the run as superseded (e.g. by re-run)
    analysisRun.isSuperseded = true;
    assessmentStore.saveAnalysisRun(analysisRun);

    expect(() => {
      assessmentWorkflowService.generateDeliveryPackage(
        created.assessmentId,
        'lead.analyst@procucev.com',
        'ANALYST'
      );
    }).toThrow(/Superseded report generation denial/);
  });

  // Test I: Public SaaS route rejection
  it('Test I: saasRouteGuard rejects public registration and customer self-serve with HTTP 403', () => {
    expect(operatingModeService.isInternalAssessment()).toBe(true);

    let statusCalledWith = 0;
    let jsonCalledWith: unknown = null;
    let nextCalled = false;

    const mockRes = {
      status: (code: number) => {
        statusCalledWith = code;
        return {
          json: (data: unknown) => {
            jsonCalledWith = data;
          }
        };
      }
    };

    saasRouteGuard({}, mockRes, () => {
      nextCalled = true;
    });

    expect(statusCalledWith).toBe(403);
    expect(nextCalled).toBe(false);
    expect((jsonCalledWith as { code: string }).code).toBe('PUBLIC_SAAS_DISABLED');
  });

  // Test J: Operating mode override denial
  it('Test J: strictly denies runtime override to switch to PUBLIC_SAAS mode', () => {
    expect(operatingModeService.getMode()).toBe(APP_OPERATING_MODES.INTERNAL_ASSESSMENT);

    expect(() => {
      operatingModeService.setMode(APP_OPERATING_MODES.PUBLIC_SAAS);
    }).toThrow(/Operating mode override denied/);

    expect(operatingModeService.getMode()).toBe(APP_OPERATING_MODES.INTERNAL_ASSESSMENT);
    expect(operatingModeService.isInternalAssessment()).toBe(true);
    expect(operatingModeService.isPublicSaaS()).toBe(false);
  });
});
