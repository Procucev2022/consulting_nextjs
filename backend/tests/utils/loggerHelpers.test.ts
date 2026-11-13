import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  resolveLoggerConfig,
  purgeOldLogFiles,
  computeLogStats,
  searchAndFilterLogs
} from '../../src/utils/loggerHelpers';
import type { LogEntry, LoggerDiagnosticReporter } from '../../src/types';

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
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanDir();
  });

  describe('resolveLoggerConfig', () => {
    it('uses defaults when no options provided', () => {
      const origLevel = process.env.LOG_LEVEL;
      const origRetention = process.env.LOG_RETENTION_DAYS;
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_RETENTION_DAYS;
      const config = resolveLoggerConfig();
      expect(config.serviceName).toBeDefined();
      expect(config.minLevel).toBe('debug');
      expect(config.retentionDays).toBe(14);
      if (origLevel) process.env.LOG_LEVEL = origLevel;
      if (origRetention) process.env.LOG_RETENTION_DAYS = origRetention;
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

    it('honors explicit false file persistence even outside production', () => {
      const previousNodeEnv = process.env.NODE_ENV;
      const previousPersistence = process.env.LOG_PERSISTENCE;
      try {
        process.env.NODE_ENV = 'development';
        process.env.LOG_PERSISTENCE = 'false';

        const config = resolveLoggerConfig();

        expect(config.enableFilePersistence).toBe(false);
      } finally {
        if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousNodeEnv;
        if (previousPersistence === undefined) delete process.env.LOG_PERSISTENCE;
        else process.env.LOG_PERSISTENCE = previousPersistence;
      }
    });

    it('disables file persistence inside Cloudflare Worker runtime', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'userAgent');
      try {
        Object.defineProperty(globalThis.navigator, 'userAgent', {
          value: 'Cloudflare-Workers',
          configurable: true
        });
        const config = resolveLoggerConfig();
        expect(config.enableFilePersistence).toBe(false);
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(globalThis.navigator, 'userAgent', originalDescriptor);
        }
      }
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
      const reportFailure = vi.fn<LoggerDiagnosticReporter>();

      const result = purgeOldLogFiles(testDir, 1, reportFailure);
      expect(result.retentionDays).toBe(1);
      expect(reportFailure).toHaveBeenCalledWith('logger.purge-file', expect.any(Error), { fileName: 'app-2020-01-01.log' });
      statSpy.mockRestore();
    });

    it('reports directory enumeration errors while preserving the cleanup result', () => {
      const enumerationError = new Error('Directory unavailable');
      vi.spyOn(fs, 'readdirSync').mockImplementationOnce(() => { throw enumerationError; });
      const reportFailure = vi.fn<LoggerDiagnosticReporter>();

      const result = purgeOldLogFiles(testDir, 14, reportFailure);

      expect(result).toMatchObject({ purgedFiles: [], bytesFreed: 0, retentionDays: 14 });
      expect(reportFailure).toHaveBeenCalledWith('logger.purge-directory', enumerationError);
    });

    it('emits a structured fallback diagnostic when no logger callback was provided', () => {
      const enumerationError = new Error('Directory unavailable');
      const readSpy = vi.spyOn(fs, 'readdirSync').mockImplementationOnce(() => { throw enumerationError; });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      purgeOldLogFiles(testDir, 14);

      const entry = JSON.parse(String(consoleErrorSpy.mock.calls[0]?.[0])) as Record<string, unknown>;
      expect(entry).toMatchObject({
        level: 'error',
        service: 'consulting-backend',
        message: 'Logger helper operation failed',
        context: { action: 'logger.purge-directory' },
        error: { name: 'Error', message: 'Directory unavailable', stack: expect.any(String) }
      });
      readSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('keeps purge behavior non-throwing if the helper console fallback fails', () => {
      const readSpy = vi.spyOn(fs, 'readdirSync').mockImplementationOnce(() => { throw new Error('Directory unavailable'); });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { throw new Error('Console unavailable'); });

      expect(() => purgeOldLogFiles(testDir, 14)).not.toThrow();

      readSpy.mockRestore();
      consoleErrorSpy.mockRestore();
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

    it('reports stat failures and returns the available file count', () => {
      fs.writeFileSync(path.join(testDir, 'app.log'), 'test log data', 'utf8');
      const statError = new Error('Metadata unavailable');
      vi.spyOn(fs, 'statSync').mockImplementationOnce(() => { throw statError; });
      const reportFailure = vi.fn<LoggerDiagnosticReporter>();

      const stats = computeLogStats(testDir, 14, reportFailure);

      expect(stats.totalFiles).toBe(0);
      expect(reportFailure).toHaveBeenCalledWith('logger.stat-file', statError, { fileName: 'app.log' });
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
      const reportFailure = vi.fn<LoggerDiagnosticReporter>();

      const results = searchAndFilterLogs(sampleEntries, testDir, true, { limit: 10 }, reportFailure);
      expect(results.length).toBe(2);
      expect(reportFailure).toHaveBeenCalledWith('logger.parse-app-log', expect.any(Error), {
        fileName: 'app.log', malformedLineCount: 1
      });
    });

    it('reports unreadable log files and keeps in-memory results available', () => {
      fs.writeFileSync(path.join(testDir, 'app.log'), 'valid log entry', 'utf8');
      const readError = new Error('File temporarily unavailable');
      vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => { throw readError; });
      const reportFailure = vi.fn<LoggerDiagnosticReporter>();

      const results = searchAndFilterLogs(sampleEntries, testDir, true, {}, reportFailure);

      expect(results).toEqual([...sampleEntries].reverse());
      expect(reportFailure).toHaveBeenCalledWith('logger.read-app-log', readError, { fileName: 'app.log' });
    });
  });
});
