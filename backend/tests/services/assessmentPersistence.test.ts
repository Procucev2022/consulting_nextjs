import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  getAuthoritativeDataDir,
  loadAssessmentStoreFromDisk,
  persistAssessmentStoreToDisk
} from '../../src/services/assessmentPersistence';
import type { PersistedStoreData } from '../../src/types/assessment';

describe('assessmentPersistence', () => {
  const originalEnv = { ...process.env };
  const testDir = path.resolve(__dirname, '../../scratch/test-persistence');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('getAuthoritativeDataDir', () => {
    it('returns AICEV_DATA_DIR when defined', () => {
      process.env.AICEV_DATA_DIR = '/custom/data/path';
      expect(getAuthoritativeDataDir()).toBe('/custom/data/path');
    });

    it('returns AppData path when AICEV_DATA_DIR is undefined but APPDATA is defined', () => {
      delete process.env.AICEV_DATA_DIR;
      process.env.APPDATA = 'C:\\MockAppData';
      expect(getAuthoritativeDataDir()).toBe(path.join('C:\\MockAppData', 'aiCEV', 'data'));
    });

    it('returns default fallback path when both are undefined', () => {
      delete process.env.AICEV_DATA_DIR;
      delete process.env.APPDATA;
      const expected = path.resolve(__dirname, '../../src/services/../../../data');
      expect(getAuthoritativeDataDir()).toBe(expected);
    });
  });

  describe('loadAssessmentStoreFromDisk', () => {
    it('returns null if neither primary nor backup exists', () => {
      const result = loadAssessmentStoreFromDisk(testDir);
      expect(result).toBeNull();
    });

    it('loads from primary file when it exists', () => {
      const mockData: PersistedStoreData = {
        version: 1,
        updatedAt: '2026-10-11T00:00:00.000Z',
        nextSequence: 3,
        assessments: [
          {
            assessmentId: 'AIC-2026-0001',
            customerName: 'Test Customer',
            ndaStatus: 'SIGNED',
            dataStatus: 'VALIDATED',
            assignedAnalyst: 'analyst@procucev.com',
            status: 'APPROVED',
            createdAt: '2026-10-11T00:00:00.000Z',
            updatedAt: '2026-10-11T00:00:00.000Z'
          } as any
        ],
        dataVersions: {},
        analysisRuns: {},
        auditLogs: {}
      };
      fs.writeFileSync(path.join(testDir, 'assessments.json'), JSON.stringify(mockData), 'utf8');

      const loaded = loadAssessmentStoreFromDisk(testDir);
      expect(loaded).toBeDefined();
      expect(loaded?.assessments.length).toBe(1);
      expect(loaded?.nextSequence).toBe(3);
    });

    it('loads from backup file when primary is missing', () => {
      const mockData = {
        version: 1,
        assessments: [
          { assessmentId: 'AIC-2026-0002', customerName: 'Backup Loaded Co' }
        ]
      };
      fs.writeFileSync(path.join(testDir, 'assessments.json.bak'), JSON.stringify(mockData), 'utf8');

      const loaded = loadAssessmentStoreFromDisk(testDir);
      expect(loaded).toBeDefined();
      expect(loaded?.assessments[0]?.assessmentId).toBe('AIC-2026-0002');
      expect(loaded?.nextSequence).toBe(2);
    });

    it('returns null and logs warning when file content has invalid structure', () => {
      fs.writeFileSync(path.join(testDir, 'assessments.json'), JSON.stringify({ invalid: 'structure' }), 'utf8');
      const loaded = loadAssessmentStoreFromDisk(testDir);
      expect(loaded).toBeNull();
    });

    it('returns null and logs error when file contains corrupt unparseable JSON', () => {
      fs.writeFileSync(path.join(testDir, 'assessments.json'), '{corrupt json', 'utf8');
      const loaded = loadAssessmentStoreFromDisk(testDir);
      expect(loaded).toBeNull();
    });
  });

  describe('persistAssessmentStoreToDisk', () => {
    const validData: PersistedStoreData = {
      version: 1,
      updatedAt: '2026-10-11T00:00:00.000Z',
      nextSequence: 5,
      assessments: [
        {
          assessmentId: 'AIC-2026-0001',
          customerName: 'Persistent Customer',
          ndaStatus: 'SIGNED',
          dataStatus: 'VALIDATED',
          assignedAnalyst: 'analyst@procucev.com',
          status: 'APPROVED',
          createdAt: '2026-10-11T00:00:00.000Z',
          updatedAt: '2026-10-11T00:00:00.000Z'
        } as any
      ],
      dataVersions: {},
      analysisRuns: {},
      auditLogs: {}
    };

    it('writes data atomically and renames temp file to assessments.json', () => {
      persistAssessmentStoreToDisk(testDir, validData);

      const targetPath = path.join(testDir, 'assessments.json');
      expect(fs.existsSync(targetPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      expect(content.assessments.length).toBe(1);
      expect(content.nextSequence).toBe(5);
    });

    it('creates .bak backup copy when target file already exists', () => {
      // First save
      persistAssessmentStoreToDisk(testDir, validData);

      // Second save with modified data
      const updatedData: PersistedStoreData = {
        ...validData,
        nextSequence: 6
      };
      persistAssessmentStoreToDisk(testDir, updatedData);

      const targetPath = path.join(testDir, 'assessments.json');
      const backupPath = path.join(testDir, 'assessments.json.bak');

      expect(fs.existsSync(targetPath)).toBe(true);
      expect(fs.existsSync(backupPath)).toBe(true);

      const backupContent = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      expect(backupContent.nextSequence).toBe(5);

      const currentContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      expect(currentContent.nextSequence).toBe(6);
    });

    it('handles backup copy failure gracefully without throwing and still updates target', () => {
      // First save
      persistAssessmentStoreToDisk(testDir, validData);

      // Mock copyFileSync to fail
      vi.spyOn(fs, 'copyFileSync').mockImplementationOnce(() => {
        throw new Error('EPERM: disk locked');
      });

      const updatedData: PersistedStoreData = {
        ...validData,
        nextSequence: 7
      };
      persistAssessmentStoreToDisk(testDir, updatedData);

      const targetPath = path.join(testDir, 'assessments.json');
      const currentContent = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      expect(currentContent.nextSequence).toBe(7);
    });

    it('throws critical error when writing fails', () => {
      vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => {
        persistAssessmentStoreToDisk(testDir, validData);
      }).toThrow('CRITICAL_PERSISTENCE_FAILURE: Could not write assessment store to disk: EACCES: permission denied');
    });
  });
});
