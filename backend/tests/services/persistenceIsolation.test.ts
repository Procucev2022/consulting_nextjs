import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { assessmentStore, AssessmentStore } from '../../src/services/assessmentStore';
import {
  getDevelopmentDataDir,
  getDesktopRuntimeDataDir,
  isProtectedLiveStore,
  sanitizePersistencePath,
  getPersistenceEnvironment,
  persistAssessmentStoreToDisk,
  loadAssessmentStoreFromDisk
} from '../../src/services/assessmentPersistence';
import {
  PERSISTENCE_ENVIRONMENTS,
  NDA_STATUSES,
  DATA_STATUSES,
  ASSESSMENT_STATUSES
} from '../../src/constants/assessment';

function computeFileSha256(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

describe('Persistence and Test Isolation Foundation (Prompt 385)', () => {
  let devStorePath: string;
  let devStoreHashBefore: string | null;
  let appDataStorePath: string | null = null;
  let appDataStoreHashBefore: string | null = null;
  let globalIsoCleanup: () => void;

  beforeAll(() => {
    devStorePath = path.join(getDevelopmentDataDir(), 'assessments.json');
    devStoreHashBefore = computeFileSha256(devStorePath);

    const appDataDir = getDesktopRuntimeDataDir();
    if (appDataDir) {
      appDataStorePath = path.join(appDataDir, 'assessments.json');
      appDataStoreHashBefore = computeFileSha256(appDataStorePath);
    }

    const iso = assessmentStore.useIsolatedTestDir();
    globalIsoCleanup = iso.cleanup;
  });

  afterAll(() => {
    globalIsoCleanup?.();

    if (devStorePath && devStoreHashBefore) {
      const devStoreHashAfter = computeFileSha256(devStorePath);
      expect(devStoreHashAfter).toBe(devStoreHashBefore);
    }

    if (appDataStorePath && appDataStoreHashBefore) {
      const appDataStoreHashAfter = computeFileSha256(appDataStorePath);
      expect(appDataStoreHashAfter).toBe(appDataStoreHashBefore);
    }
  });

  it('Requirement 1: A test reset affects only its temporary store', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      expect(assessmentStore.getDataDir()).toBe(iso.testDir);

      assessmentStore.resetToDefaultSeed();

      const seed = assessmentStore.getById('AIC-2026-0001');
      expect(seed).toBeDefined();
      expect(seed?.customerName).toContain('Varroc');

      const tempFile = path.join(iso.testDir, 'assessments.json');
      expect(fs.existsSync(tempFile)).toBe(true);

      const raw = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
      expect(Array.isArray(raw.assessments)).toBe(true);
      expect(raw.assessments.some((a: { assessmentId: string }) => a.assessmentId === 'AIC-2026-0001')).toBe(true);
    } finally {
      iso.cleanup();
    }
  });

  it('Requirement 2: Existing development-store records are unchanged by tests', () => {
    expect(devStoreHashBefore).not.toBeNull();

    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();

      assessmentStore.createAssessment(
        {
          customerName: 'Temporary Test Tenant',
          industry: 'Industrial',
          assessmentPeriodStart: '2024-01-01',
          assessmentPeriodEnd: '2024-12-31',
          assignedAnalyst: 'analyst@procucev.com',
          ndaStatus: NDA_STATUSES.NOT_REQUIRED
        },
        'test@procucev.com',
        'INTERNAL_ADMIN'
      );

      const currentDevHash = computeFileSha256(devStorePath);
      expect(currentDevHash).toBe(devStoreHashBefore);

      const devRaw = JSON.parse(fs.readFileSync(devStorePath, 'utf8'));
      const devAssessments = devRaw.assessments as Array<{ customerName: string; assessmentId: string }>;
      const hasAssessment = devAssessments.some(
        (a) => a.customerName === 'Borosil Ltd' || a.customerName === 'ABC Textile Ltd'
      );
      expect(hasAssessment).toBe(true);
    } finally {
      iso.cleanup();
    }
  });

  it('Requirement 3: Existing APPDATA-store records are unchanged by tests', () => {
    if (!appDataStorePath || !appDataStoreHashBefore) {
      return;
    }

    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();

      assessmentStore.createCustomer(
        { customerName: 'Transient Tenant Corp', industry: 'Logistics' },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );

      const currentAppDataHash = computeFileSha256(appDataStorePath);
      expect(currentAppDataHash).toBe(appDataStoreHashBefore);

      const appDataRaw = JSON.parse(fs.readFileSync(appDataStorePath, 'utf8'));
      const appDataAssessments = appDataRaw.assessments as Array<{ assessmentId: string }>;
      const hasAssessment = appDataAssessments.some(
        (a) => a.assessmentId === 'AIC-2026-0001' || a.assessmentId === 'AIC-2026-0002'
      );
      expect(hasAssessment).toBe(true);
    } finally {
      iso.cleanup();
    }
  });

  it('Requirement 4: Missing or invalid test-directory configuration fails safely', () => {
    expect(() => {
      assessmentStore.useIsolatedTestDir('Z:\\invalid_nonexistent_drive_12345\\impossible_dir');
    }).toThrow('FAILED_TO_ESTABLISH_ISOLATED_TEST_DIR');

    expect(() => {
      persistAssessmentStoreToDisk(getDevelopmentDataDir(), {
        version: 1,
        updatedAt: new Date().toISOString(),
        nextSequence: 2,
        assessments: [],
        dataVersions: {},
        analysisRuns: {},
        auditLogs: {}
      });
    }).toThrow('CRITICAL_TEST_ISOLATION_BREACH');

    const appDataDir = getDesktopRuntimeDataDir();
    if (appDataDir) {
      expect(() => {
        persistAssessmentStoreToDisk(appDataDir, {
          version: 1,
          updatedAt: new Date().toISOString(),
          nextSequence: 2,
          assessments: [],
          dataVersions: {},
          analysisRuns: {},
          auditLogs: {}
        });
      }).toThrow('CRITICAL_TEST_ISOLATION_BREACH');
    }

    const nonExistentDir = path.join(__dirname, 'completely_missing_dir_xyz_987');
    expect(loadAssessmentStoreFromDisk(nonExistentDir)).toBeNull();
  });

  it('Requirement 5: Seeded test fixtures work inside the temporary test store', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();

      const vgt = assessmentStore.getById('AIC-2026-0001');
      expect(vgt).toBeDefined();
      expect(vgt?.totalSpendCr).toBe(4073.8307);
      expect(vgt?.potentialSavingsCr).toBe(378.4);
      expect(vgt?.savingsPct).toBe(9.29);

      const versions = assessmentStore.getDataVersions('AIC-2026-0001');
      expect(versions.length).toBeGreaterThanOrEqual(1);
      expect(versions[0].dataVersionId).toBe('DV-001');

      const runs = assessmentStore.getAnalysisRuns('AIC-2026-0001');
      expect(runs.length).toBeGreaterThanOrEqual(1);
      expect(runs[0].analysisRunId).toBe('RUN-001');
      expect(runs[0].reviewGates.length).toBe(8);
      expect(runs[0].allGatesPassed).toBe(true);
    } finally {
      iso.cleanup();
    }
  });

  it('Requirement 6: Restarting the store using the same isolated directory preserves the expected records', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();

      const created = assessmentStore.createAssessment(
        {
          customerName: 'Persistent Lifecycle Test Corp',
          industry: 'Industrial Automation',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'lead@procucev.com',
          ndaStatus: NDA_STATUSES.SIGNED
        },
        'analyst@procucev.com',
        'INTERNAL_ADMIN'
      );
      expect(created.assessmentId).toBeDefined();

      const reloaded = assessmentStore.reloadFromDisk();
      expect(reloaded).toBe(true);

      const restored = assessmentStore.getAssessmentById(created.assessmentId);
      expect(restored).toBeDefined();
      expect(restored?.customerName).toBe('Persistent Lifecycle Test Corp');
      expect(restored?.industry).toBe('Industrial Automation');
      expect(restored?.status).toBe('DATA_PENDING');
    } finally {
      iso.cleanup();
    }
  });

  it('Requirement 7: Two independent test stores do not leak data into each other', () => {
    const isoA = assessmentStore.useIsolatedTestDir();
    let clientAId = '';
    try {
      assessmentStore.resetToDefaultSeed();
      const createdA = assessmentStore.createAssessment(
        {
          customerName: 'Client Alpha Isolated',
          industry: 'Aerospace',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'alpha@procucev.com',
          ndaStatus: NDA_STATUSES.SIGNED
        },
        'alpha@procucev.com',
        'INTERNAL_ADMIN'
      );
      clientAId = createdA.assessmentId;

      const isoB = assessmentStore.useIsolatedTestDir();
      try {
        expect(assessmentStore.getAssessmentById(clientAId)).toBeUndefined();
        const clientAlphaInB = assessmentStore
          .getAssessments()
          .find((a) => a.customerName === 'Client Alpha Isolated');
        expect(clientAlphaInB).toBeUndefined();

        const createdB = assessmentStore.createAssessment(
          {
            customerName: 'Client Beta Isolated',
            industry: 'Biotech',
            assessmentPeriodStart: '2023-01-01',
            assessmentPeriodEnd: '2023-12-31',
            assignedAnalyst: 'beta@procucev.com',
            ndaStatus: NDA_STATUSES.SIGNED
          },
          'beta@procucev.com',
          'INTERNAL_ADMIN'
        );

        expect(assessmentStore.getAssessmentById(createdB.assessmentId)).toBeDefined();

        const rawB = JSON.parse(fs.readFileSync(path.join(isoB.testDir, 'assessments.json'), 'utf8'));
        expect(rawB.assessments.some((a: { customerName: string }) => a.customerName === 'Client Alpha Isolated')).toBe(
          false
        );
      } finally {
        isoB.cleanup();
      }

      assessmentStore.setCustomDataDir(isoA.testDir);
      const rawA = JSON.parse(fs.readFileSync(path.join(isoA.testDir, 'assessments.json'), 'utf8'));
      expect(rawA.assessments.some((a: { customerName: string }) => a.customerName === 'Client Beta Isolated')).toBe(
        false
      );
    } finally {
      isoA.cleanup();
    }
  });

  it('Requirement 8: Tests do not rely on customer-specific assessment IDs unless explicitly testing a named fixture', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();

      const namedFixture = assessmentStore.getById('AIC-2026-0001');
      expect(namedFixture).toBeDefined();
      expect(namedFixture?.assessmentId).toBe('AIC-2026-0001');

      const dynamic1 = assessmentStore.createAssessment(
        {
          customerName: 'Dynamic Entity One',
          industry: 'Retail',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'test@procucev.com',
          ndaStatus: NDA_STATUSES.NOT_REQUIRED
        },
        'test@procucev.com',
        'INTERNAL_ADMIN'
      );
      expect(dynamic1.assessmentId).toMatch(/^AIC-\d{4}-\d{4}$/);

      const dynamic2 = assessmentStore.createAssessment(
        {
          customerName: 'Dynamic Entity Two',
          industry: 'Healthcare',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'test@procucev.com',
          ndaStatus: NDA_STATUSES.NOT_REQUIRED
        },
        'test@procucev.com',
        'INTERNAL_ADMIN'
      );
      expect(dynamic2.assessmentId).toMatch(/^AIC-\d{4}-\d{4}$/);
      expect(dynamic1.assessmentId).not.toBe(dynamic2.assessmentId);

      const fetched1 = assessmentStore.getAssessmentById(dynamic1.assessmentId);
      const fetched2 = assessmentStore.getAssessmentById(dynamic2.assessmentId);
      expect(fetched1?.customerName).toBe('Dynamic Entity One');
      expect(fetched2?.customerName).toBe('Dynamic Entity Two');
    } finally {
      iso.cleanup();
    }
  });

  it('Verifies path sanitization and environment detection helpers', () => {
    expect(sanitizePersistencePath('')).toBe('');

    const devDir = getDevelopmentDataDir();
    const sanitizedDev = sanitizePersistencePath(devDir);
    expect(sanitizedDev).toContain('<WORKSPACE>');

    const appDataDir = getDesktopRuntimeDataDir();
    if (appDataDir) {
      const sanitizedAppData = sanitizePersistencePath(appDataDir);
      expect(sanitizedAppData).toContain('<APPDATA>');
    }

    expect(isProtectedLiveStore(devDir)).toBe(true);
    if (appDataDir) {
      expect(isProtectedLiveStore(appDataDir)).toBe(true);
    }
    expect(isProtectedLiveStore('C:\\some\\isolated\\temp\\dir')).toBe(false);

    expect(getPersistenceEnvironment('C:\\isolated\\dir', true)).toBe(PERSISTENCE_ENVIRONMENTS.TEST);
  });

  it('covers renameSync failure fallback to copyFileSync and unlinkSync in persistence', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
        throw new Error('EXDEV: cross-device link not permitted');
      });

      expect(() => {
        persistAssessmentStoreToDisk(iso.testDir, {
          version: 1,
          updatedAt: new Date().toISOString(),
          nextSequence: 2,
          assessments: [],
          dataVersions: {},
          analysisRuns: {},
          auditLogs: {}
        });
      }).not.toThrow();

      renameSpy.mockRestore();

      const renameSpy2 = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
        throw new Error('EXDEV: cross-device link not permitted');
      });
      const copySpy = vi.spyOn(fs, 'copyFileSync').mockImplementation((src) => {
        if (String(src).includes('.tmp')) {
          throw new Error('Copy failed');
        }
      });

      expect(() => {
        persistAssessmentStoreToDisk(iso.testDir, {
          version: 1,
          updatedAt: new Date().toISOString(),
          nextSequence: 2,
          assessments: [],
          dataVersions: {},
          analysisRuns: {},
          auditLogs: {}
        });
      }).toThrow('CRITICAL_PERSISTENCE_FAILURE');

      renameSpy2.mockRestore();
      copySpy.mockRestore();
    } finally {
      iso.cleanup();
    }
  });

  it('handles readFileSync failures gracefully in loadAssessmentStoreFromDisk', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      const primary = path.join(iso.testDir, 'assessments.json');
      fs.writeFileSync(primary, 'valid content', 'utf8');

      const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
        throw new Error('Disk read fault');
      });

      const loaded = loadAssessmentStoreFromDisk(iso.testDir);
      expect(loaded).toBeNull();

      readSpy.mockRestore();
    } finally {
      iso.cleanup();
    }
  });

  it('covers sanitizePersistencePath fallbacks for non-matching paths and user home', () => {
    const origUser = process.env.USERPROFILE;
    try {
      process.env.USERPROFILE = 'C:\\FakeUser';
      const userPath = 'C:\\FakeUser\\some\\doc.json';
      expect(sanitizePersistencePath(userPath)).toBe('<USER_HOME>/some/doc.json');

      const unrelated = 'D:\\other\\drive\\file.json';
      expect(sanitizePersistencePath(unrelated)).toBe('D:/other/drive/file.json');
    } finally {
      process.env.USERPROFILE = origUser;
    }
  });

  it('covers getPersistenceEnvironment for development and desktop runtime when not in test mode', () => {
    const origVitest = process.env.VITEST;
    const origNodeEnv = process.env.NODE_ENV;
    try {
      delete process.env.VITEST;
      process.env.NODE_ENV = 'production';

      const devDir = getDevelopmentDataDir();
      expect(getPersistenceEnvironment(devDir, false)).toBe(PERSISTENCE_ENVIRONMENTS.DEVELOPMENT);

      const appData = getDesktopRuntimeDataDir();
      if (appData) {
        expect(getPersistenceEnvironment(appData, false)).toBe(PERSISTENCE_ENVIRONMENTS.DESKTOP_RUNTIME);
      }

      expect(getPersistenceEnvironment('C:\\custom\\data', false)).toBe(PERSISTENCE_ENVIRONMENTS.DEFAULT);
    } finally {
      process.env.VITEST = origVitest;
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  it('covers AssessmentStore status transitions and customer linking branches', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();

      assessmentStore.createCustomer(
        { customerName: 'Existing Company Ltd', industry: 'Logistics' },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
      const matched = assessmentStore.createAssessment(
        {
          customerName: 'Existing Company Ltd',
          industry: 'Logistics',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'test@procucev.com',
          ndaStatus: NDA_STATUSES.NOT_REQUIRED
        },
        'test@procucev.com',
        'INTERNAL_ADMIN'
      );
      expect(matched.customerId).toBeDefined();

      const createdRecord = assessmentStore.createAssessment(
        {
          customerName: 'Fresh Intake Co',
          industry: 'Textiles',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'test@procucev.com',
          ndaStatus: NDA_STATUSES.NOT_REQUIRED
        },
        'test@procucev.com',
        'INTERNAL_ADMIN'
      );
      createdRecord.status = ASSESSMENT_STATUSES.CREATED;
      assessmentStore.saveAssessment(createdRecord);

      const updatedNda = assessmentStore.updateNdaStatus(
        createdRecord.assessmentId,
        { ndaStatus: NDA_STATUSES.SIGNED, notes: 'Signed by CFO' },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
      expect(updatedNda?.status).toBe(ASSESSMENT_STATUSES.DATA_PENDING);

      const updatedData = assessmentStore.updateDataStatus(
        createdRecord.assessmentId,
        { dataStatus: DATA_STATUSES.RECEIVED, notes: 'Spend file arrived' },
        'admin@procucev.com',
        'INTERNAL_ADMIN'
      );
      expect(updatedData?.status).toBe(ASSESSMENT_STATUSES.DATA_RECEIVED);

      expect(assessmentStore.getAssessments('NON_EXISTENT_FILTER').length).toBe(0);
      expect(assessmentStore.getCustomers('ACTIVE').length).toBeGreaterThan(0);
      expect(assessmentStore.getCustomers('ARCHIVED').length).toBe(0);

      const cust = assessmentStore.getCustomers()[0];
      expect(assessmentStore.getCustomerById(cust.id || '')).toBeDefined();
      expect(assessmentStore.getCustomerById('NON_EXISTENT_CUST')).toBeUndefined();

      expect(
        assessmentStore.updateCustomer(
          'NON_EXISTENT_CUST',
          { customerName: 'Nope' },
          'admin@procucev.com',
          'INTERNAL_ADMIN'
        )
      ).toBeNull();

      assessmentStore.clearAllDevelopmentData();
      expect(assessmentStore.getAll().length).toBe(0);
      expect(assessmentStore.getCustomers().length).toBe(0);
    } finally {
      iso.cleanup();
    }
  });

  it('covers loadFromDisk auto-linking of assessments missing customerId', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      const primary = path.join(iso.testDir, 'assessments.json');
      const seedData = {
        version: 1,
        updatedAt: new Date().toISOString(),
        nextSequence: 5,
        nextCustomerSequence: 5,
        customers: [
          {
            customerId: 'CUST-2026-0001',
            id: 'CUST-2026-0001',
            customerName: 'Matched Legacy Corp',
            industry: 'Automotive',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        assessments: [
          {
            assessmentId: 'AIC-2026-0001',
            customerName: 'Matched Legacy Corp',
            industry: 'Automotive',
            assessmentPeriodStart: '2023-01-01',
            assessmentPeriodEnd: '2023-12-31',
            assignedAnalyst: 'test@procucev.com',
            ndaStatus: 'SIGNED',
            dataStatus: 'VALIDATED',
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            assessmentId: 'AIC-2026-0002',
            customerName: 'Unmatched Legacy Corp',
            industry: 'Packaging',
            assessmentPeriodStart: '2023-01-01',
            assessmentPeriodEnd: '2023-12-31',
            assignedAnalyst: 'test@procucev.com',
            ndaStatus: 'SIGNED',
            dataStatus: 'VALIDATED',
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        dataVersions: {},
        analysisRuns: {},
        auditLogs: {}
      };
      fs.writeFileSync(primary, JSON.stringify(seedData), 'utf8');

      const reloaded = assessmentStore.reloadFromDisk();
      expect(reloaded).toBe(true);

      const a1 = assessmentStore.getAssessmentById('AIC-2026-0001');
      expect(a1?.customerId).toBe('CUST-2026-0001');

      const a2 = assessmentStore.getAssessmentById('AIC-2026-0002');
      expect(a2?.customerId).toBeDefined();
      expect(a2?.customerId).toMatch(/^CUST-\d{4}-\d{4}$/);
    } finally {
      iso.cleanup();
    }
  });

  it('covers resetToDefaultSeed throwing CRITICAL_TEST_ISOLATION_BREACH on protected store', () => {
    const origCustom = assessmentStore.getDataDir();
    assessmentStore.setCustomDataDir(getDevelopmentDataDir());
    try {
      expect(() => {
        assessmentStore.resetToDefaultSeed();
      }).toThrow('CRITICAL_TEST_ISOLATION_BREACH');
    } finally {
      assessmentStore.setCustomDataDir(origCustom);
    }
  });

  it('covers reloadFromDisk seeding when AICEV_SEED_TEST_DATA is true and AIC-2026-0001 is missing', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    const origSeedEnv = process.env.AICEV_SEED_TEST_DATA;
    try {
      process.env.AICEV_SEED_TEST_DATA = 'true';
      const primary = path.join(iso.testDir, 'assessments.json');
      fs.writeFileSync(
        primary,
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          nextSequence: 2,
          assessments: [],
          dataVersions: {},
          analysisRuns: {},
          auditLogs: {}
        }),
        'utf8'
      );

      const reloaded = assessmentStore.reloadFromDisk();
      expect(reloaded).toBe(true);
      expect(assessmentStore.getById('AIC-2026-0001')).toBeDefined();
    } finally {
      process.env.AICEV_SEED_TEST_DATA = origSeedEnv;
      iso.cleanup();
    }
  });

  it('covers isProtectedLiveStore when APPDATA is unset and useIsolatedTestDir cleanup warnings', () => {
    const origAppData = process.env.APPDATA;
    try {
      delete process.env.APPDATA;
      expect(isProtectedLiveStore('')).toBe(false);
      expect(isProtectedLiveStore(getDevelopmentDataDir())).toBe(true);
      expect(isProtectedLiveStore('C:\\some\\random\\dir')).toBe(false);
    } finally {
      process.env.APPDATA = origAppData;
    }

    const iso = assessmentStore.useIsolatedTestDir();
    const rmSpy = vi.spyOn(fs, 'rmSync').mockImplementationOnce(() => {
      throw new Error('Lock error on cleanup');
    });
    expect(() => iso.cleanup()).not.toThrow();
    rmSpy.mockRestore();
  });

  it('covers loadFromDisk when customers property is missing or not an array', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      const primary = path.join(iso.testDir, 'assessments.json');
      fs.writeFileSync(
        primary,
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          nextSequence: 2,
          assessments: [],
          dataVersions: {},
          analysisRuns: {},
          auditLogs: {}
        }),
        'utf8'
      );

      const loaded = assessmentStore.loadFromDisk();
      expect(loaded).toBe(true);
      expect(assessmentStore.getCustomers().length).toBe(0);
    } finally {
      iso.cleanup();
    }
  });

  it('covers normalizePersistedStore defaults when optional metadata fields are missing or invalid', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      const primary = path.join(iso.testDir, 'assessments.json');
      fs.writeFileSync(
        primary,
        JSON.stringify({
          assessments: [],
          dataVersions: ['not-an-object'],
          analysisRuns: 'not-an-object',
          auditLogs: 123
        }),
        'utf8'
      );

      const loaded = loadAssessmentStoreFromDisk(iso.testDir);
      expect(loaded).toBeDefined();
      expect(loaded?.version).toBe(1);
      expect(loaded?.nextSequence).toBe(2);
      expect(loaded?.nextCustomerSequence).toBe(2);
      expect(loaded?.dataVersions).toEqual({});
      expect(loaded?.analysisRuns).toEqual({});
      expect(loaded?.auditLogs).toEqual({});
    } finally {
      iso.cleanup();
    }
  });

  it('covers useIsolatedTestDir with an explicit directory path', () => {
    const customTestDir = path.join(os.tmpdir(), 'aicev-explicit-test-' + Date.now());
    const iso = assessmentStore.useIsolatedTestDir(customTestDir);
    try {
      expect(iso.testDir).toBe(customTestDir);
      expect(assessmentStore.getDataDir()).toBe(customTestDir);
    } finally {
      iso.cleanup();
      if (fs.existsSync(customTestDir)) {
        fs.rmSync(customTestDir, { recursive: true, force: true });
      }
    }
  });

  it('covers assessmentStore NDA and Data status non-transition branches', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      assessmentStore.resetToDefaultSeed();
      const rec = assessmentStore.createAssessment(
        {
          customerName: 'Branch Assessment Client',
          industry: 'Industrial',
          assessmentPeriodStart: '2023-01-01',
          assessmentPeriodEnd: '2023-12-31',
          assignedAnalyst: 'test@procucev.com',
          ndaStatus: NDA_STATUSES.NOT_REQUIRED
        },
        'test@procucev.com',
        'INTERNAL_ADMIN'
      );

      rec.status = ASSESSMENT_STATUSES.APPROVED;
      assessmentStore.saveAssessment(rec);

      const resNda = assessmentStore.updateNdaStatus(
        rec.assessmentId,
        { ndaStatus: NDA_STATUSES.SIGNED },
        'a@p.com',
        'INTERNAL_ADMIN'
      );
      expect(resNda?.status).toBe(ASSESSMENT_STATUSES.APPROVED);

      const resData = assessmentStore.updateDataStatus(
        rec.assessmentId,
        { dataStatus: DATA_STATUSES.RECEIVED },
        'a@p.com',
        'INTERNAL_ADMIN'
      );
      expect(resData?.status).toBe(ASSESSMENT_STATUSES.APPROVED);

      const resData2 = assessmentStore.updateDataStatus(
        rec.assessmentId,
        { dataStatus: DATA_STATUSES.VALIDATED },
        'a@p.com',
        'INTERNAL_ADMIN'
      );
      expect(resData2?.dataStatus).toBe(DATA_STATUSES.VALIDATED);
    } finally {
      iso.cleanup();
    }
  });

  it('covers empty map fallback branches for data versions, analysis runs, and audit logs', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    try {
      const ghostId = 'AIC-9999-9999';
      expect(assessmentStore.getDataVersions(ghostId)).toEqual([]);
      expect(assessmentStore.getAnalysisRuns(ghostId)).toEqual([]);
      expect(assessmentStore.getAuditLogs(ghostId)).toEqual([]);

      assessmentStore.addDataVersion({
        dataVersionId: 'DV-GHOST-1',
        assessmentId: ghostId,
        versionNumber: 1,
        fileName: 'ghost.xlsx',
        fileSize: 100,
        checksum: 'ghost-hash',
        filePath: 'datasets/ghost.xlsx',
        uploadedBy: 'ghost@procucev.com',
        uploadedAt: new Date().toISOString(),
        recordCount: 1,
        isSuperseded: false
      });
      expect(assessmentStore.getDataVersions(ghostId).length).toBe(1);

      assessmentStore.addAnalysisRun({
        analysisRunId: 'RUN-GHOST-1',
        assessmentId: ghostId,
        dataVersionId: 'DV-GHOST-1',
        status: 'COMPLETED',
        totalSpendCr: 10,
        validatedSpendCr: 10,
        reviewGates: [],
        allGatesPassed: true,
        isApproved: false,
        isSuperseded: false,
        createdAt: new Date().toISOString()
      });
      expect(assessmentStore.getAnalysisRuns(ghostId).length).toBe(1);

      const ghostId2 = 'AIC-8888-8888';
      assessmentStore.saveDataVersion({
        dataVersionId: 'DV-GHOST-2',
        assessmentId: ghostId2,
        versionNumber: 1,
        fileName: 'ghost2.xlsx',
        fileSize: 100,
        checksum: 'ghost2-hash',
        filePath: 'datasets/ghost2.xlsx',
        uploadedBy: 'ghost@procucev.com',
        uploadedAt: new Date().toISOString(),
        recordCount: 1,
        isSuperseded: false
      });
      expect(assessmentStore.getDataVersions(ghostId2).length).toBe(1);

      assessmentStore.saveAnalysisRun({
        analysisRunId: 'RUN-GHOST-2',
        assessmentId: ghostId2,
        dataVersionId: 'DV-GHOST-2',
        status: 'COMPLETED',
        totalSpendCr: 20,
        validatedSpendCr: 20,
        reviewGates: [],
        allGatesPassed: true,
        isApproved: false,
        isSuperseded: false,
        createdAt: new Date().toISOString()
      });
      expect(assessmentStore.getAnalysisRuns(ghostId2).length).toBe(1);
    } finally {
      iso.cleanup();
    }
  });
});




