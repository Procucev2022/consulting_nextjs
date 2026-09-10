import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  resolveLoggerConfig,
  purgeOldLogFiles,
  computeLogStats,
  searchAndFilterLogs
} from '../../src/utils/loggerHelpers';
import type { LogEntry } from '../../src/types';

describe('Logger Helpers Suite', () => {
  const testDir = path.resolve(__dirname, '../temp_helpers_logs');

  const cleanDir = (): void => {
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch {
        // Fallback for Windows file locking race condition
      }
    }
  };

  beforeEach(() => {
    cleanDir();
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    cleanDir();
  });

  describe('resolveLoggerConfig', () => {
    it('uses defaults when no options provided', () => {
      const config = resolveLoggerConfig();
      expect(config.serviceName).toBeDefined();
      expect(config.minLevel).toBe('debug');
      expect(config.retentionDays).toBe(14);
    });

    it('uses provided options when supplied', () => {
      const config = resolveLoggerConfig({
        serviceName: 'custom-svc',
        logDir: testDir,
        minLevel: 'error',
        enableConsole: false,
        enableFilePersistence: false,
        retentionDays: 30
      });
      expect(config.serviceName).toBe('custom-svc');
      expect(config.logDir).toBe(testDir);
      expect(config.minLevel).toBe('error');
      expect(config.enableConsole).toBe(false);
      expect(config.enableFilePersistence).toBe(false);
      expect(config.retentionDays).toBe(30);
    });
  });

  describe('purgeOldLogFiles', () => {
    it('returns empty result if directory does not exist', () => {
      const result = purgeOldLogFiles(path.join(testDir, 'non-existent'), 14);
      expect(result.purgedFiles).toEqual([]);
      expect(result.bytesFreed).toBe(0);
    });

    it('purges files older than retention days', () => {
      const oldFile = path.join(testDir, 'app-2020-01-01.log');
      fs.writeFileSync(oldFile, 'old log content', 'utf8');

      const recentFile = path.join(testDir, 'app.log');
      fs.writeFileSync(recentFile, 'recent log content', 'utf8');

      const result = purgeOldLogFiles(testDir, 1);
      expect(result.purgedFiles).toContain('app-2020-01-01.log');
      expect(result.bytesFreed).toBeGreaterThan(0);
      expect(fs.existsSync(oldFile)).toBe(false);
      expect(fs.existsSync(recentFile)).toBe(true);
    });

    it('handles stat or unlink errors gracefully', () => {
      const file = path.join(testDir, 'app-2020-01-01.log');
      fs.writeFileSync(file, 'log content', 'utf8');

      const statSpy = vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
        throw new Error('EACCES');
      });

      const result = purgeOldLogFiles(testDir, 1);
      expect(result.retentionDays).toBe(1);
      statSpy.mockRestore();
    });
  });

  describe('computeLogStats', () => {
    it('returns stats for existing directory', () => {
      fs.writeFileSync(path.join(testDir, 'app.log'), 'test log data', 'utf8');
      const stats = computeLogStats(testDir, 14);
      expect(stats.totalFiles).toBe(1);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
      expect(stats.retentionDays).toBe(14);
    });

    it('returns zeroes when directory does not exist', () => {
      const stats = computeLogStats(path.join(testDir, 'non_existent'), 14);
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSizeBytes).toBe(0);
    });
  });

  describe('searchAndFilterLogs', () => {
    const sampleEntries: LogEntry[] = [
      {
        timestamp: '2026-09-01T10:00:00.000Z',
        level: 'info',
        service: 'test',
        environment: 'test',
        message: 'Application started'
      },
      {
        timestamp: '2026-09-02T10:00:00.000Z',
        level: 'error',
        service: 'test',
        environment: 'test',
        message: 'Database connection failed',
        requestId: 'req-123',
        context: { detail: 'timeout' },
        error: { name: 'Error', message: 'timeout' }
      }
    ];

    it('filters by level, requestId, dates, and keyword', () => {
      const byLevel = searchAndFilterLogs(sampleEntries, testDir, false, { level: 'error' });
      expect(byLevel.length).toBe(1);
      expect(byLevel[0].level).toBe('error');

      const byReq = searchAndFilterLogs(sampleEntries, testDir, false, { requestId: 'req-123' });
      expect(byReq.length).toBe(1);

      const byStart = searchAndFilterLogs(sampleEntries, testDir, false, { startDate: '2026-09-02T00:00:00.000Z' });
      expect(byStart.length).toBe(1);

      const byEnd = searchAndFilterLogs(sampleEntries, testDir, false, { endDate: '2026-09-01T23:59:59.000Z' });
      expect(byEnd.length).toBe(1);

      const byKeyword = searchAndFilterLogs(sampleEntries, testDir, false, { keyword: 'database' });
      expect(byKeyword.length).toBe(1);

      const byKeywordContext = searchAndFilterLogs(sampleEntries, testDir, false, { keyword: 'timeout' });
      expect(byKeywordContext.length).toBe(1);

      const byNoMatch = searchAndFilterLogs(sampleEntries, testDir, false, { keyword: 'nonexistent' });
      expect(byNoMatch.length).toBe(0);
    });

    it('reads and deduplicates logs from file persistence', () => {
      const appLogPath = path.join(testDir, 'app.log');
      fs.writeFileSync(appLogPath, JSON.stringify(sampleEntries[0]) + '\n\ninvalid-json\n', 'utf8');

      const results = searchAndFilterLogs(sampleEntries, testDir, true, { limit: 10 });
      expect(results.length).toBe(2);
    });
  });
});
