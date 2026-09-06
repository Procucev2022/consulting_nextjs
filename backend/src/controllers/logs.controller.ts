import { Request, Response } from 'express';
import logger, { LogLevel } from '../utils/logger';

export const searchLogsHandler = (req: Request, res: Response) => {
  try {
    const { level, keyword, startDate, endDate, requestId, limit } = req.query;

    const filter = {
      level: level ? (String(level).toLowerCase() as LogLevel) : undefined,
      keyword: keyword ? String(keyword) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      requestId: requestId ? String(requestId) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 100
    };

    const logs = logger.searchLogs(filter);

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error: any) {
    logger.error('Failed to search logs', { query: req.query }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to search logs',
      error: error.message
    });
  }
};

export const purgeLogsHandler = (req: Request, res: Response) => {
  try {
    const retentionDays =
      typeof req.body?.retentionDays === 'number'
        ? req.body.retentionDays
        : req.query.retentionDays
        ? parseInt(String(req.query.retentionDays), 10)
        : undefined;

    const result = logger.purgeOldLogs(retentionDays);

    logger.info('Compliance log purge executed', {
      retentionDays: result.retentionDays,
      purgedCount: result.purgedFiles.length,
      bytesFreed: result.bytesFreed
    });

    res.json({
      success: true,
      message: `Purge completed: ${result.purgedFiles.length} files removed, ${result.bytesFreed} bytes freed.`,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to purge logs', { body: req.body }, error);
    res.status(500).json({
      success: false,
      message: 'Failed to purge logs',
      error: error.message
    });
  }
};

export const getLogStatsHandler = (_req: Request, res: Response) => {
  try {
    const stats = logger.getLogStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Failed to retrieve log stats', {}, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve log stats',
      error: error.message
    });
  }
};
