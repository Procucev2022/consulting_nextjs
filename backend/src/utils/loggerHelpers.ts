import fs from 'fs';
import path from 'path';
import type { LogEntry, LogFilter, PurgeResult, LoggerOptions, LogLevel, LoggerDiagnosticReporter } from '../types';
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_RETENTION_DAYS,
  DEFAULT_MIN_LEVEL
} from '../constants/logger';

export interface ResolvedLoggerConfig {
  serviceName: string;
  logDir: string;
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFilePersistence: boolean;
  retentionDays: number;
}

const resolveMinLogLevel = (level?: LogLevel): LogLevel => {
  if (level) return level;
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return (envLevel && validLevels.includes(envLevel)) ? envLevel : DEFAULT_MIN_LEVEL;
};

const resolveFilePersistence = (enable?: boolean): boolean => {
  if (enable !== undefined) return enable;
  const configuredPersistence = process.env.LOG_PERSISTENCE?.trim().toLowerCase();
  if (configuredPersistence === 'true') return true;
  if (configuredPersistence === 'false') return false;
  const globalObj = globalThis as unknown as { navigator?: { userAgent?: string } };
  if (globalObj.navigator?.userAgent === 'Cloudflare-Workers') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
};

const reportHelperFailure: LoggerDiagnosticReporter = (action, error, context = {}): void => {
  const serializedError = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { name: 'UnknownError', message: String(error) };
  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    service: DEFAULT_SERVICE_NAME,
    message: 'Logger helper operation failed',
    context: { ...context, action },
    error: serializedError
  };
  try {
    console.error(JSON.stringify(entry));
  } catch {
    // Keep log inspection and cleanup fallbacks from interrupting application work.
  }
};

export function resolveLoggerConfig(options: LoggerOptions = {}): ResolvedLoggerConfig {
  const serviceName = options.serviceName || process.env.SERVICE_NAME || DEFAULT_SERVICE_NAME;
  const logDir = options.logDir || process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
  const minLevel = resolveMinLogLevel(options.minLevel);
  const enableConsole = options.enableConsole ?? (process.env.LOG_CONSOLE !== 'false');
  const enableFilePersistence = resolveFilePersistence(options.enableFilePersistence);
  const retentionDays = options.retentionDays ?? (
    process.env.LOG_RETENTION_DAYS ? parseInt(process.env.LOG_RETENTION_DAYS, 10) : DEFAULT_RETENTION_DAYS
  );

  return {
    serviceName,
    logDir,
    minLevel,
    enableConsole,
    enableFilePersistence,
    retentionDays
  };
}

export function purgeOldLogFiles(
  logDir: string,
  daysToRetain: number,
  reportFailure: LoggerDiagnosticReporter = reportHelperFailure
): PurgeResult {
  const result: PurgeResult = {
    purgedFiles: [],
    bytesFreed: 0,
    retentionDays: daysToRetain
  };

  try {
    if (!fs.existsSync(logDir)) return result;
    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const cutoffTime = now - daysToRetain * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(logDir, file);
      try {
        const stats = fs.statSync(filePath);
        let fileTime = stats.mtimeMs;

        const match = file.match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
          const parsedDate = Date.parse(match[0]);
          if (!isNaN(parsedDate)) {
            fileTime = parsedDate;
          }
        }

        if (fileTime < cutoffTime) {
          const fileSize = stats.size;
          fs.unlinkSync(filePath);
          result.purgedFiles.push(file);
          result.bytesFreed += fileSize;
        }
      } catch (error: unknown) {
        reportFailure('logger.purge-file', error, { fileName: file });
      }
    }
  } catch (error: unknown) {
    reportFailure('logger.purge-directory', error);
  }

  return result;
}

export function computeLogStats(
  logDir: string,
  retentionDays: number,
  reportFailure: LoggerDiagnosticReporter = reportHelperFailure
): { totalFiles: number; totalSizeBytes: number; retentionDays: number; logDir: string } {
  let totalFiles = 0;
  let totalSizeBytes = 0;

  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        const filePath = path.join(logDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            totalFiles++;
            totalSizeBytes += stats.size;
          }
        } catch (error: unknown) {
          reportFailure('logger.stat-file', error, { fileName: file });
        }
      }
    }
  } catch (error: unknown) {
    reportFailure('logger.read-directory-stats', error);
  }

  return {
    totalFiles,
    totalSizeBytes,
    retentionDays,
    logDir
  };
}

function matchesKeyword(entry: LogEntry, keyword?: string): boolean {
  if (!keyword) return true;
  const kw = keyword.toLowerCase();
  const msgMatch = entry.message.toLowerCase().includes(kw);
  const ctxMatch = entry.context ? JSON.stringify(entry.context).toLowerCase().includes(kw) : false;
  const errMatch = entry.error ? JSON.stringify(entry.error).toLowerCase().includes(kw) : false;
  return msgMatch || ctxMatch || errMatch;
}

function matchesFilter(entry: LogEntry, filter: LogFilter): boolean {
  if (filter.level && entry.level !== filter.level) return false;
  if (filter.requestId && entry.requestId !== filter.requestId) return false;
  if (filter.startDate && new Date(entry.timestamp) < new Date(filter.startDate)) return false;
  if (filter.endDate && new Date(entry.timestamp) > new Date(filter.endDate)) return false;
  return matchesKeyword(entry, filter.keyword);
}

export function searchAndFilterLogs(
  recentLogs: LogEntry[],
  logDir: string,
  enableFilePersistence: boolean,
  filter: LogFilter = {},
  reportFailure: LoggerDiagnosticReporter = reportHelperFailure
): LogEntry[] {
  const matchedEntries: LogEntry[] = [];
  const seenTimestamps = new Set<string>();

  const checkAndAdd = (entry: LogEntry): void => {
    const uniqueKey = `${entry.timestamp}-${entry.message}-${entry.level}`;
    if (seenTimestamps.has(uniqueKey)) return;
    if (!matchesFilter(entry, filter)) return;
    seenTimestamps.add(uniqueKey);
    matchedEntries.push(entry);
  };

  if (enableFilePersistence) {
    try {
      if (fs.existsSync(logDir)) {
        const appLogPath = path.join(logDir, 'app.log');
        if (fs.existsSync(appLogPath)) {
          const content = fs.readFileSync(appLogPath, 'utf8');
          const lines = content.split('\n');
          let malformedLineCount = 0;
          let firstMalformedLineError: unknown;
          lines.forEach((line) => {
            if (!line.trim()) return;
            try {
              const entry = JSON.parse(line) as LogEntry;
              checkAndAdd(entry);
            } catch (error: unknown) {
              malformedLineCount++;
              firstMalformedLineError ??= error;
            }
          });
          if (malformedLineCount > 0) {
            reportFailure('logger.parse-app-log', firstMalformedLineError, {
              fileName: 'app.log', malformedLineCount
            });
          }
        }
      }
    } catch (error: unknown) {
      reportFailure('logger.read-app-log', error, { fileName: 'app.log' });
    }
  }

  for (const entry of recentLogs) {
    try {
      checkAndAdd(entry);
    } catch (error: unknown) {
      reportFailure('logger.filter-memory-entry', error, { timestamp: entry.timestamp });
    }
  }

  matchedEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 100;
  return matchedEntries.slice(0, limit);
}
