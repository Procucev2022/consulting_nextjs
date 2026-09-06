import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  searchLogsHandler,
  purgeLogsHandler,
  getLogStatsHandler
} from '../../src/controllers/logs.controller';
import logger from '../../src/utils/logger';

describe('Logs Controller Unit Tests', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      query: {},
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    vi.clearAllMocks();
  });

  describe('searchLogsHandler', () => {
    it('successfully returns searched logs with parsed query parameters', () => {
      req.query = {
        level: 'info',
        keyword: 'test',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        requestId: 'req-123',
        limit: '25'
      };

      const mockLogs = [
        { timestamp: '2026-09-06T00:00:00Z', level: 'info', message: 'test' }
      ];
      vi.spyOn(logger, 'searchLogs').mockReturnValueOnce(mockLogs as any);

      searchLogsHandler(req, res);

      expect(logger.searchLogs).toHaveBeenCalledWith({
        level: 'info',
        keyword: 'test',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        requestId: 'req-123',
        limit: 25
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockLogs
      });
    });

    it('handles search errors and returns 500 status', () => {
      vi.spyOn(logger, 'searchLogs').mockImplementationOnce(() => {
        throw new Error('Database search crash');
      });

      searchLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to search logs',
        error: 'Database search crash'
      });
    });
  });

  describe('purgeLogsHandler', () => {
    it('successfully purges logs with body retentionDays', () => {
      req.body = { retentionDays: 7 };
      vi.spyOn(logger, 'purgeOldLogs').mockReturnValueOnce({
        purgedFiles: ['app-2020.log'],
        bytesFreed: 1024,
        retentionDays: 7
      });

      purgeLogsHandler(req, res);

      expect(logger.purgeOldLogs).toHaveBeenCalledWith(7);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('1 files removed')
        })
      );
    });

    it('purges logs with query retentionDays if body is not provided', () => {
      req.query = { retentionDays: '30' };
      vi.spyOn(logger, 'purgeOldLogs').mockReturnValueOnce({
        purgedFiles: [],
        bytesFreed: 0,
        retentionDays: 30
      });

      purgeLogsHandler(req, res);

      expect(logger.purgeOldLogs).toHaveBeenCalledWith(30);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it('handles purge errors and returns 500 status', () => {
      vi.spyOn(logger, 'purgeOldLogs').mockImplementationOnce(() => {
        throw new Error('Unlink permission denied');
      });

      purgeLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to purge logs',
        error: 'Unlink permission denied'
      });
    });
  });

  describe('getLogStatsHandler', () => {
    it('returns storage stats', () => {
      const mockStats = {
        totalFiles: 5,
        totalSizeBytes: 2048,
        retentionDays: 14,
        logDir: '/logs'
      };
      vi.spyOn(logger, 'getLogStats').mockReturnValueOnce(mockStats);

      getLogStatsHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('handles stats errors and returns 500 status', () => {
      vi.spyOn(logger, 'getLogStats').mockImplementationOnce(() => {
        throw new Error('Stats failure');
      });

      getLogStatsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to retrieve log stats',
        error: 'Stats failure'
      });
    });
  });
});
