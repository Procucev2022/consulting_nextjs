import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Logger, LogLevel } from '../../src/utils/logger';

describe('Logger Utility Suite', () => {
  const testLogDir = path.resolve(__dirname, '../temp_test_logs');

  const cleanDir = () => {
    if (fs.existsSync(testLogDir)) {
      try {
        fs.rmSync(testLogDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      } catch {
        // Retry or ignore if Windows file handle delay
      }
    }
  };

  beforeEach(() => {
    cleanDir();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanDir();
  });

  describe('Initialization and Configuration', () => {
    it('initializes with default options and auto-purges if enabled', () => {
      const logger = new Logger({
        logDir: testLogDir,
        enableFilePersistence: true,
        autoPurge: true
      });
      expect(fs.existsSync(testLogDir)).toBe(true);
      expect(logger).toBeDefined();
    });

    it('honors custom options', () => {
      const logger = new Logger({
        serviceName: 'custom-service',
        minLevel: 'warn',
        enableConsole: false,
        enableFilePersistence: false,
        retentionDays: 7,
        autoPurge: false
      });
      expect(logger).toBeDefined();
    });

    it('captures a structured console fallback if mkdirSync fails', () => {
      const spy = vi.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = new Logger({
        logDir: testLogDir,
        enableFilePersistence: true,
        enableConsole: false
      });
      expect(logger).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('logger.ensure-log-directory'));
      expect(logger.searchLogs({ level: 'error' })).toContainEqual(expect.objectContaining({
        message: 'Logger internal operation failed',
        context: expect.objectContaining({ action: 'logger.ensure-log-directory' }),
        error: expect.objectContaining({ message: 'Permission denied' })
      }));
      spy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('formatEntry', () => {
    it('formats basic log entry with defaults', () => {
      const logger = new Logger({ enableFilePersistence: false });
      const entry = logger.formatEntry('info', 'Test message');
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
      expect(entry.timestamp).toBeDefined();
      expect(entry.environment).toBeDefined();
    });

    it('formats context with requestId and durationMs', () => {
      const logger = new Logger({ enableFilePersistence: false });
      const entry = logger.formatEntry('info', 'Context test', {
        requestId: 'req-123',
        durationMs: 45.6,
        user: 'admin'
      });
      expect(entry.requestId).toBe('req-123');
      expect(entry.durationMs).toBe(45.6);
      expect(entry.context?.user).toBe('admin');
    });

    it('formats Error instance properly', () => {
      const logger = new Logger({ enableFilePersistence: false });
      const err = new Error('Boom');
      const entry = logger.formatEntry('error', 'Error occurred', undefined, err);
      expect(entry.error?.name).toBe('Error');
      expect(entry.error?.message).toBe('Boom');
      expect(entry.error?.stack).toBeDefined();
    });

    it('formats non-Error unknown errors properly', () => {
      const logger = new Logger({ enableFilePersistence: false });
      const entry = logger.formatEntry('error', 'Error occurred', undefined, 'String error failure');
      expect(entry.error?.name).toBe('UnknownError');
      expect(entry.error?.message).toBe('String error failure');
    });
  });

  describe('log and level methods', () => {
    it('logs at all levels and writes to console appropriately', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logger = new Logger({
        enableConsole: true,
        enableFilePersistence: false,
        minLevel: 'debug'
      });

      logger.debug('Debug message', { debugDetail: 1 });
      expect(consoleLogSpy).toHaveBeenCalled();

      logger.info('Info message', { infoDetail: 2 });
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);

      logger.warn('Warn message', { warnDetail: 3 });
      expect(consoleWarnSpy).toHaveBeenCalled();

      logger.error('Error message', { errorDetail: 4 }, new Error('Error test'));
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('respects minLevel threshold', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = new Logger({
        enableConsole: true,
        enableFilePersistence: false,
        minLevel: 'error'
      });

      logger.debug('Ignore debug');
      logger.info('Ignore info');
      logger.warn('Ignore warn');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('caps memory recentLogs at max limit', () => {
      const logger = new Logger({
        enableConsole: false,
        enableFilePersistence: false
      });

      for (let i = 0; i < 210; i++) {
        logger.info(`Message ${i}`);
      }

      const results = logger.searchLogs({ limit: 300 });
      expect(results.length).toBeLessThanOrEqual(200);
    });
  });

  describe('File Persistence', () => {
    it('writes logs to app.log, dated log, and error.log when level is error', () => {
      const logger = new Logger({
        logDir: testLogDir,
        minLevel: 'debug',
        enableConsole: false,
        enableFilePersistence: true
      });

      logger.info('App test log');
      logger.error('Error test log', undefined, new Error('Test err'));

      const appLogPath = path.join(testLogDir, 'app.log');
      const errorLogPath = path.join(testLogDir, 'error.log');

      expect(fs.existsSync(appLogPath)).toBe(true);
      expect(fs.existsSync(errorLogPath)).toBe(true);

      const appContent = fs.readFileSync(appLogPath, 'utf8');
      expect(appContent).toContain('App test log');
      expect(appContent).toContain('Error test log');

      const errorContent = fs.readFileSync(errorLogPath, 'utf8');
      expect(errorContent).not.toContain('App test log');
      expect(errorContent).toContain('Error test log');
    });

    it('captures a structured console fallback when file persistence fails', () => {
      const logger = new Logger({
        logDir: testLogDir,
        enableConsole: false,
        enableFilePersistence: true
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const appendSpy = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => {
        throw new Error('Disk full');
      });

      expect(() => {
        logger.info('Safe log', { requestId: 'req-log-write' });
      }).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('logger.persist-log-entry'));
      expect(logger.searchLogs({ level: 'error', keyword: 'Disk full', requestId: 'req-log-write' })).toContainEqual(
        expect.objectContaining({
          requestId: 'req-log-write',
          context: expect.objectContaining({ action: 'logger.persist-log-entry', requestId: 'req-log-write' }),
          error: expect.objectContaining({ message: 'Disk full', stack: expect.any(String) })
        })
      );

      appendSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('keeps the application operation alive if the logger console fallback also fails', () => {
      const logger = new Logger({
        logDir: testLogDir,
        enableConsole: false,
        enableFilePersistence: true
      });
      const appendSpy = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => { throw new Error('Disk full'); });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { throw new Error('Console unavailable'); });

      expect(() => logger.info('Application operation remains safe')).not.toThrow();

      appendSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      expect(logger.searchLogs({ level: 'error', keyword: 'Disk full' })).toHaveLength(1);
    });
  });

  describe('searchLogs', () => {
    it('searches logs with level, keyword, requestId, and date filters', () => {
      const logger = new Logger({
        logDir: testLogDir,
        enableConsole: false,
        enableFilePersistence: true
      });

      logger.info('User logged in', { requestId: 'req-1', user: 'alice' });
      logger.warn('Rate limit approaching', { requestId: 'req-2', user: 'bob' });
      logger.error('Database connection failed', { requestId: 'req-3' }, new Error('PG connection timeout'));

      // Filter by level
      const errorsOnly = logger.searchLogs({ level: 'error' });
      expect(errorsOnly.length).toBe(1);
      expect(errorsOnly[0].message).toBe('Database connection failed');

      // Filter by keyword in message
      const searchLogin = logger.searchLogs({ keyword: 'logged in' });
      expect(searchLogin.length).toBe(1);
      expect(searchLogin[0].requestId).toBe('req-1');

      // Filter by keyword in context
      const searchBob = logger.searchLogs({ keyword: 'bob' });
      expect(searchBob.length).toBe(1);
      expect(searchBob[0].requestId).toBe('req-2');

      // Filter by keyword in error stack
      const searchTimeout = logger.searchLogs({ keyword: 'timeout' });
      expect(searchTimeout.length).toBe(1);

      // Filter by requestId
      const searchReq = logger.searchLogs({ requestId: 'req-3' });
      expect(searchReq.length).toBe(1);

      // Filter by date range
      const future = new Date(Date.now() + 100000).toISOString();
      const past = new Date(Date.now() - 100000).toISOString();
      const withinDate = logger.searchLogs({ startDate: past, endDate: future });
      expect(withinDate.length).toBe(3);

      const beforePast = logger.searchLogs({ endDate: past });
      expect(beforePast.length).toBe(0);

      const afterFuture = logger.searchLogs({ startDate: future });
      expect(afterFuture.length).toBe(0);
    });

    it('ignores corrupted lines in log file', () => {
      fs.mkdirSync(testLogDir, { recursive: true });
      const appLogPath = path.join(testLogDir, 'app.log');
      fs.writeFileSync(
        appLogPath,
        `{"timestamp":"2026-09-06T12:00:00Z","level":"info","message":"Valid 1","service":"s","environment":"e"}\nCORRUPTED_JSON_LINE\n{"timestamp":"2026-09-06T12:01:00Z","level":"info","message":"Valid 2","service":"s","environment":"e"}\n`
      );

      const logger = new Logger({
        logDir: testLogDir,
        enableConsole: false,
        enableFilePersistence: true
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const logs = logger.searchLogs({ level: 'info' });
      expect(logs.length).toBe(2);
      expect(logs[0].message).toBe('Valid 2');
      expect(logs[1].message).toBe('Valid 1');
      expect(logger.searchLogs({ level: 'error' })).toContainEqual(expect.objectContaining({
        context: expect.objectContaining({ action: 'logger.parse-app-log', malformedLineCount: 1 }),
        error: expect.objectContaining({ name: 'SyntaxError' })
      }));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('logger.parse-app-log'));
      consoleErrorSpy.mockRestore();
    });

    it('handles readFileSync error gracefully', () => {
      const logger = new Logger({
        logDir: testLogDir,
        enableConsole: false,
        enableFilePersistence: true
      });
      logger.info('Memory log');

      const readSpy = vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
        throw new Error('EACCES');
      });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const results = logger.searchLogs({ level: 'info' });
      expect(results.length).toBe(1);
      expect(logger.searchLogs({ level: 'error' })).toContainEqual(expect.objectContaining({
        context: expect.objectContaining({ action: 'logger.read-app-log' }),
        error: expect.objectContaining({ message: 'EACCES' })
      }));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('logger.read-app-log'));
      readSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('purgeOldLogs', () => {
    it('returns empty result if log directory does not exist', () => {
      const logger = new Logger({
        logDir: path.join(testLogDir, 'non-existent'),
        enableFilePersistence: false
      });
      const res = logger.purgeOldLogs(14);
      expect(res.purgedFiles).toEqual([]);
      expect(res.bytesFreed).toBe(0);
    });

    it('purges files older than retention days based on filename date and mtime', () => {
      fs.mkdirSync(testLogDir, { recursive: true });

      // Create an expired dated file (e.g. from 2020)
      const oldDatedFile = path.join(testLogDir, 'app-2020-01-01.log');
      fs.writeFileSync(oldDatedFile, 'old content that should be purged');

      // Create a fresh dated file
      const todayStr = new Date().toISOString().split('T')[0];
      const freshDatedFile = path.join(testLogDir, `app-${todayStr}.log`);
      fs.writeFileSync(freshDatedFile, 'fresh content that should be kept');

      const logger = new Logger({
        logDir: testLogDir,
        enableFilePersistence: true,
        autoPurge: false
      });

      const purgeResult = logger.purgeOldLogs(14);
      expect(purgeResult.purgedFiles).toContain('app-2020-01-01.log');
      expect(purgeResult.purgedFiles).not.toContain(`app-${todayStr}.log`);
      expect(purgeResult.bytesFreed).toBeGreaterThan(0);
      expect(fs.existsSync(oldDatedFile)).toBe(false);
      expect(fs.existsSync(freshDatedFile)).toBe(true);
    });

    it('handles stat or unlink exceptions gracefully during purge', () => {
      fs.mkdirSync(testLogDir, { recursive: true });
      fs.writeFileSync(path.join(testLogDir, 'test.log'), 'content');

      const logger = new Logger({
        logDir: testLogDir,
        enableFilePersistence: true,
        autoPurge: false
      });

      const statSpy = vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
        throw new Error('Stat error');
      });

      expect(() => {
        logger.purgeOldLogs(0);
      }).not.toThrow();

      statSpy.mockRestore();
    });
  });

  describe('getLogStats', () => {
    it('returns accurate stats on log directory and retention', () => {
      fs.mkdirSync(testLogDir, { recursive: true });
      fs.writeFileSync(path.join(testLogDir, 'file1.log'), '12345');
      fs.writeFileSync(path.join(testLogDir, 'file2.log'), '67890');

      const logger = new Logger({
        logDir: testLogDir,
        enableFilePersistence: true,
        retentionDays: 30
      });

      const stats = logger.getLogStats();
      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSizeBytes).toBe(10);
      expect(stats.retentionDays).toBe(30);
      expect(stats.logDir).toBe(testLogDir);
    });

    it('returns 0 files when directory does not exist', () => {
      const logger = new Logger({
        logDir: path.join(testLogDir, 'non_existent_folder'),
        enableFilePersistence: false
      });
      const stats = logger.getLogStats();
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSizeBytes).toBe(0);
    });
  });

});
