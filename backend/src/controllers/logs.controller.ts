import type { Request, Response } from 'express';
import type { LogLevel } from '../utils/logger';
import logger from '../utils/logger';

export const searchLogsHandler = (req: Request, res: Response): Response | void => {
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

    return res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error: unknown) {
    const errObj = error as { message: string };
    logger.error('Failed to search logs', { query: req.query }, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search logs',
      error: errObj.message
    });
  }
};

export const purgeLogsHandler = (req: Request, res: Response): Response | void => {
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

    return res.json({
      success: true,
      message: `Purge completed: ${result.purgedFiles.length} files removed, ${result.bytesFreed} bytes freed.`,
      data: result
    });
  } catch (error: unknown) {
    const errObj = error as { message: string };
    logger.error('Failed to purge logs', { body: req.body }, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to purge logs',
      error: errObj.message
    });
  }
};

export const getLogStatsHandler = (_req: Request, res: Response): Response | void => {
  try {
    const stats = logger.getLogStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: unknown) {
    const errObj = error as { message: string };
    logger.error('Failed to retrieve log stats', {}, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve log stats',
      error: errObj.message
    });
  }
};
