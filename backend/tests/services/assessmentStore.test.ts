import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { assessmentStore, AssessmentStore } from '../../src/services/assessmentStore';
import {
  getAuthoritativeDataDir,
  persistAssessmentStoreToDisk,
  loadAssessmentStoreFromDisk
} from '../../src/services/assessmentPersistence';
import { NDA_STATUSES, AUDIT_ACTIONS } from '../../src/constants/assessment';

describe('AssessmentStore', () => {
  let cleanupIso: () => void;

  beforeAll(() => {
    const iso = assessmentStore.useIsolatedTestDir();
    cleanupIso = iso.cleanup;
  });

  afterAll(() => {
    cleanupIso?.();
    AssessmentStore.resetInstance();
  });

  beforeEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  afterEach(() => {
    assessmentStore.resetToDefaultSeed();
  });

  it('initializes with seed assessment AIC-2026-0001', () => {
    const all = assessmentStore.getAll();
    expect(all.length).toBeGreaterThanOrEqual(1);
    const seed = assessmentStore.getById('AIC-2026-0001');
    expect(seed).toBeDefined();
    expect(seed?.customerName).toContain('Varroc');
    expect(seed?.totalSpendCr).toBe(4073.8307);
  });

  it('generates sequential IDs in format AIC-YYYY-XXXX', () => {
    const created1 = assessmentStore.createAssessment(
      {
        customerName: 'Customer A',
        industry: 'Automotive',
        assessmentPeriodStart: '2022-04-01',
        assessmentPeriodEnd: '2023-03-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.NOT_REQUESTED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(created1.assessmentId).toBe('AIC-2026-0002');

    const created2 = assessmentStore.createAssessment(
      {
        customerName: 'Customer B',
        industry: 'Manufacturing',
        assessmentPeriodStart: '2023-01-01',
        assessmentPeriodEnd: '2023-12-31',
        assignedAnalyst: 'lead@procucev.com',
        ndaStatus: NDA_STATUSES.SENT
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(created2.assessmentId).toBe('AIC-2026-0003');
  });

  it('updates assessment fields safely', () => {
    const updated = assessmentStore.update('AIC-2026-0001', {
      ndaStatus: 'SIGNED',
      dataStatus: 'VALIDATED'
    });
    expect(updated?.ndaStatus).toBe('SIGNED');
    expect(updated?.dataStatus).toBe('VALIDATED');
  });

  it('returns null when updating non-existent assessment', () => {
    const res = assessmentStore.update('AIC-9999-9999', { status: 'IN_PROGRESS' });
    expect(res).toBeNull();
  });

  it('manages data versions correctly', () => {
    assessmentStore.addDataVersion({
      dataVersionId: 'DV-002',
      assessmentId: 'AIC-2026-0001',
      versionNumber: 2,
      fileName: 'spend.xlsx',
      fileSize: 1024,
      checksum: 'abc123hash',
      filePath: 'datasets/spend.xlsx',
      uploadedBy: 'analyst@procucev.com',
      uploadedAt: new Date().toISOString(),
      recordCount: 20505,
      notes: 'Initial test',
      isSuperseded: false
    });

    const list = assessmentStore.getDataVersions('AIC-2026-0001');
    expect(list.length).toBe(2);
    expect(list[1].dataVersionId).toBe('DV-002');
  });

  it('manages analysis runs correctly', () => {
    assessmentStore.addAnalysisRun({
      analysisRunId: 'RUN-002',
      assessmentId: 'AIC-2026-0001',
      dataVersionId: 'DV-001',
      status: 'COMPLETED',
      totalSpendCr: 4073.8307,
      validatedSpendCr: 4073.8307,
      potentialSavingsCr: 173.12,
      savingsPct: 4.25,
      reviewGates: [],
      allGatesPassed: true,
      isApproved: false,
      isSuperseded: false,
      createdAt: new Date().toISOString()
    });

    const runs = assessmentStore.getAnalysisRuns('AIC-2026-0001');
    expect(runs.length).toBe(2);
    expect(runs[1].analysisRunId).toBe('RUN-002');
  });

  it('records audit log entries', () => {
    assessmentStore.recordAudit(
      'AIC-2026-0001',
      'admin@procucev.com',
      'INTERNAL_ADMIN',
      AUDIT_ACTIONS.NDA_STATUS_CHANGED,
      { from: 'SENT', to: 'SIGNED' }
    );

    const logs = assessmentStore.getAuditLogs('AIC-2026-0001');
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const entry = logs.find((l) => l.action === AUDIT_ACTIONS.NDA_STATUS_CHANGED);
    expect(entry).toBeDefined();
    expect(entry?.actorEmail).toBe('admin@procucev.com');
  });

  it('persists records to disk and reloads them on simulated restart', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Persistent Customer Ltd',
        industry: 'Chemicals',
        assessmentPeriodStart: '2023-01-01',
        assessmentPeriodEnd: '2023-12-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    // Simulate restart by reloading from disk
    const reloaded = assessmentStore.reloadFromDisk();
    expect(reloaded).toBe(true);

    const retrieved = assessmentStore.getAssessmentById(created.assessmentId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.customerName).toBe('Persistent Customer Ltd');
    expect(retrieved?.industry).toBe('Chemicals');
    expect(retrieved?.status).toBe('DATA_PENDING');
  });

  it('recovers from backup file when primary file is missing', () => {
    const dataDir = assessmentStore.getDataDir();
    const primaryFile = path.join(dataDir, 'assessments.json');
    const backupFile = path.join(dataDir, 'assessments.json.bak');

    // Create an assessment to ensure backup is populated
    assessmentStore.createAssessment(
      {
        customerName: 'Backup Test Co',
        industry: 'Energy',
        assessmentPeriodStart: '2023-01-01',
        assessmentPeriodEnd: '2023-12-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(fs.existsSync(backupFile)).toBe(true);

    // Delete primary file
    fs.unlinkSync(primaryFile);
    expect(fs.existsSync(primaryFile)).toBe(false);

    // Reload from disk should fallback to backup
    const reloaded = assessmentStore.reloadFromDisk();
    expect(reloaded).toBe(true);

    const all = assessmentStore.getAll();
    const found = all.find((a) => a.customerName === 'Backup Test Co');
    expect(found).toBeDefined();
  });

  it('handles invalid or corrupted file gracefully', () => {
    const dataDir = assessmentStore.getDataDir();
    const primaryFile = path.join(dataDir, 'assessments.json');

    // Corrupt primary file
    fs.writeFileSync(primaryFile, '{ invalid json', 'utf8');

    // Load should handle gracefully
    const reloaded = assessmentStore.loadFromDisk();
    expect(reloaded).toBe(false);
  });

  it('filters assessments by status correctly', () => {
    const listAll = assessmentStore.getAssessments('ALL');
    expect(listAll.length).toBeGreaterThanOrEqual(1);

    const listApproved = assessmentStore.getAssessments('APPROVED');
    expect(listApproved.some((a) => a.assessmentId === 'AIC-2026-0001')).toBe(true);

    const listClosed = assessmentStore.getAssessments('CLOSED');
    expect(listClosed.length).toBe(0);
  });

  it('updates and saves assessments, data versions, and analysis runs', () => {
    const vgt = assessmentStore.getAssessmentById('AIC-2026-0001')!;
    vgt.notes = 'Updated test notes';
    assessmentStore.saveAssessment(vgt);
    expect(assessmentStore.getAssessmentById('AIC-2026-0001')?.notes).toBe('Updated test notes');

    // Update existing data version
    const version = assessmentStore.getDataVersions('AIC-2026-0001')[0];
    version.notes = 'Updated DV notes';
    assessmentStore.saveDataVersion(version);
    expect(assessmentStore.getDataVersions('AIC-2026-0001')[0].notes).toBe('Updated DV notes');

    // Save brand new data version via saveDataVersion
    assessmentStore.saveDataVersion({
      dataVersionId: 'DV-999',
      assessmentId: 'AIC-2026-0001',
      versionNumber: 99,
      fileName: 'new.xlsx',
      fileSize: 100,
      checksum: 'sha999',
      filePath: 'datasets/new.xlsx',
      uploadedBy: 'admin@procucev.com',
      uploadedAt: new Date().toISOString(),
      recordCount: 10,
      isSuperseded: false
    });
    expect(assessmentStore.getDataVersions('AIC-2026-0001').some((v) => v.dataVersionId === 'DV-999')).toBe(true);

    // Update existing analysis run
    const run = assessmentStore.getAnalysisRuns('AIC-2026-0001')[0];
    run.potentialSavingsCr = 999.9;
    assessmentStore.saveAnalysisRun(run);
    expect(assessmentStore.getAnalysisRuns('AIC-2026-0001')[0].potentialSavingsCr).toBe(999.9);

    // Save brand new analysis run via saveAnalysisRun
    assessmentStore.saveAnalysisRun({
      analysisRunId: 'RUN-999',
      assessmentId: 'AIC-2026-0001',
      dataVersionId: 'DV-001',
      status: 'COMPLETED',
      totalSpendCr: 100,
      validatedSpendCr: 100,
      reviewGates: [],
      allGatesPassed: true,
      isApproved: false,
      isSuperseded: false,
      createdAt: new Date().toISOString()
    });
    expect(assessmentStore.getAnalysisRuns('AIC-2026-0001').some((r) => r.analysisRunId === 'RUN-999')).toBe(true);
  });

  it('updates data status and transitions assessment state', () => {
    const created = assessmentStore.createAssessment(
      {
        customerName: 'Status Transition Co',
        industry: 'Logistics',
        assessmentPeriodStart: '2023-01-01',
        assessmentPeriodEnd: '2023-12-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED
      },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );

    const updated = assessmentStore.updateDataStatus(
      created.assessmentId,
      { dataStatus: 'RECEIVED', notes: 'Data received via secure transfer' },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(updated?.dataStatus).toBe('RECEIVED');
    expect(updated?.status).toBe('DATA_RECEIVED');
    expect(updated?.dataReceivedAt).toBeDefined();

    const notFound = assessmentStore.updateDataStatus(
      'AIC-0000-0000',
      { dataStatus: 'RECEIVED' },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(notFound).toBeUndefined();

    const notFoundNda = assessmentStore.updateNdaStatus(
      'AIC-0000-0000',
      { ndaStatus: NDA_STATUSES.SIGNED },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(notFoundNda).toBeUndefined();
  });

  it('resolves authoritative directory across environment variables', () => {
    const origEnv = process.env.AICEV_DATA_DIR;
    const origAppData = process.env.APPDATA;

    try {
      process.env.AICEV_DATA_DIR = 'C:\\custom\\test\\dir';
      expect(getAuthoritativeDataDir()).toBe('C:\\custom\\test\\dir');

      delete process.env.AICEV_DATA_DIR;
      process.env.APPDATA = 'C:\\custom\\appdata';
      expect(getAuthoritativeDataDir()).toContain('C:\\custom\\appdata');

      delete process.env.APPDATA;
      expect(getAuthoritativeDataDir()).toContain('data');
    } finally {
      process.env.AICEV_DATA_DIR = origEnv;
      process.env.APPDATA = origAppData;
    }
  });

  it('handles invalid structure where assessments is not an array', () => {
    const dataDir = assessmentStore.getDataDir();
    const primaryFile = path.join(dataDir, 'assessments.json');

    fs.writeFileSync(primaryFile, JSON.stringify({ version: 1, assessments: 'not-array' }), 'utf8');
    const reloaded = assessmentStore.loadFromDisk();
    expect(reloaded).toBe(false);
  });

  it('throws critical error when persistence fails', () => {
    const spy = vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(() => {
      persistAssessmentStoreToDisk(assessmentStore.getDataDir(), {
        version: 1,
        updatedAt: new Date().toISOString(),
        nextSequence: 2,
        assessments: [],
        dataVersions: {},
        analysisRuns: {},
        auditLogs: {}
      });
    }).toThrow('CRITICAL_PERSISTENCE_FAILURE');

    spy.mockRestore();
  });

  it('continues persisting even if backup copy encounters warning', () => {
    const spy = vi.spyOn(fs, 'copyFileSync').mockImplementationOnce(() => {
      throw new Error('Backup copy warning');
    });

    expect(() => {
      persistAssessmentStoreToDisk(assessmentStore.getDataDir(), {
        version: 1,
        updatedAt: new Date().toISOString(),
        nextSequence: 2,
        assessments: [],
        dataVersions: {},
        analysisRuns: {},
        auditLogs: {}
      });
    }).not.toThrow();

    spy.mockRestore();
  });

  it('returns null when loading from directory with no persistence files', () => {
    const emptyDir = path.join(__dirname, 'empty_test_dir_none');
    expect(loadAssessmentStoreFromDisk(emptyDir)).toBeNull();
  });

  it('manages customers (create, get, update) and assigns sequential customer IDs', () => {
    const cust1 = assessmentStore.createCustomer(
      { customerName: 'Zenith Steel Corp', industry: 'Metals & Mining' },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(cust1.id).toMatch(/^CUST-\d{4}-\d{4}$/);
    expect(cust1.customerName).toBe('Zenith Steel Corp');

    const fetched = assessmentStore.getCustomerById(cust1.id);
    expect(fetched).toBeDefined();
    expect(fetched?.customerName).toBe('Zenith Steel Corp');

    const updated = assessmentStore.updateCustomer(
      cust1.id,
      { customerName: 'Zenith Global Steel Ltd', region: 'GLOBAL' },
      'admin@procucev.com',
      'INTERNAL_ADMIN'
    );
    expect(updated?.customerName).toBe('Zenith Global Steel Ltd');
    expect(updated?.region).toBe('GLOBAL');

    const allCustomers = assessmentStore.getCustomers();
    expect(allCustomers.length).toBeGreaterThanOrEqual(1);
    expect(allCustomers.some((c) => c.id === cust1.id)).toBe(true);
  });

  it('reports persistence info accurately', () => {
    const info = assessmentStore.getPersistenceInfo();
    expect(info).toBeDefined();
    expect(info.isTestIsolated).toBe(true);
    expect(typeof info.sanitizedPath).toBe('string');
    expect(typeof info.assessmentCount).toBe('number');
  });

  it('handles isolated test dir creation and cleanup safely', () => {
    const iso = assessmentStore.useIsolatedTestDir();
    expect(fs.existsSync(iso.testDir)).toBe(true);
    expect(assessmentStore.getDataDir()).toBe(iso.testDir);
    iso.cleanup();
    expect(fs.existsSync(iso.testDir)).toBe(false);
  });

  it('covers resetInstance and initialization with seed test data enabled', () => {
    const origSeed = process.env.AICEV_SEED_TEST_DATA;
    const origDataDir = process.env.AICEV_DATA_DIR;
    const tempDir = path.join(os.tmpdir(), 'aicev-seed-test-' + Date.now());
    fs.mkdirSync(tempDir, { recursive: true });
    try {
      process.env.AICEV_SEED_TEST_DATA = 'true';
      process.env.AICEV_DATA_DIR = tempDir;
      AssessmentStore.resetInstance();
      const instance = AssessmentStore.getInstance();
      expect(instance.getById('AIC-2026-0001')).toBeDefined();
    } finally {
      process.env.AICEV_SEED_TEST_DATA = origSeed;
      process.env.AICEV_DATA_DIR = origDataDir;
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      AssessmentStore.resetInstance();
      AssessmentStore.getInstance();
    }
  });

  it('covers createCustomer and updateCustomer optional attributes', () => {
    const cust = assessmentStore.createCustomer({
      customerName: 'OptCo',
      industry: 'Tech',
      businessUnit: 'Cloud',
      region: 'APAC',
      baseCurrency: 'USD',
      contactEmail: 'contact@opt.com',
      contactPerson: 'Alice',
      notes: 'Test notes'
    });
    expect(cust.businessUnit).toBe('Cloud');
    expect(cust.contactEmail).toBe('contact@opt.com');

    const updated = assessmentStore.updateCustomer(cust.id || '', {
      businessUnit: 'SaaS',
      region: 'EMEA',
      baseCurrency: 'EUR',
      contactEmail: 'alice2@opt.com',
      contactPerson: 'Bob',
      status: 'ARCHIVED',
      notes: 'Archived notes'
    });
    expect(updated?.businessUnit).toBe('SaaS');
    expect(updated?.status).toBe('ARCHIVED');

    const updatedEmpty = assessmentStore.updateCustomer(cust.id || '', {
      businessUnit: '   ',
      region: '   ',
      baseCurrency: '   ',
      contactEmail: '   ',
      contactPerson: '   ',
      notes: '   '
    });
    expect(updatedEmpty?.businessUnit).toBeUndefined();
    expect(updatedEmpty?.contactEmail).toBeUndefined();

    assessmentStore.recordAudit('AIC-GHOST-AUDIT', 'admin@procucev.com', 'INTERNAL_ADMIN', AUDIT_ACTIONS.ASSESSMENT_CREATED);
    expect(assessmentStore.getAuditLogs('AIC-GHOST-AUDIT').length).toBe(1);
  });

  it('covers createAssessment optional attributes and initialNotes', () => {
    const a = assessmentStore.createAssessment(
      {
        customerName: 'Optional Assessment Client',
        industry: 'Healthcare',
        businessUnit: 'Pharma',
        assessmentOwner: 'dr.smith@procucev.com',
        currency: 'USD',
        assessmentPeriodStart: '2023-01-01',
        assessmentPeriodEnd: '2023-12-31',
        assignedAnalyst: 'analyst@procucev.com',
        ndaStatus: NDA_STATUSES.SIGNED,
        dataReceivedDate: '2023-02-01',
        initialNotes: 'Some initial notes',
        isTestData: true
      },
      'dr.smith@procucev.com',
      'INTERNAL_ADMIN'
    );

    expect(a.businessUnit).toBe('Pharma');
    expect(a.currency).toBe('USD');
    expect(a.status).toBe('DATA_PENDING');
    expect(a.isTestData).toBe(true);
    expect(a.dataReceivedAt).toBe('2023-02-01');
    expect(a.notes).toBe('Some initial notes');
  });
});

