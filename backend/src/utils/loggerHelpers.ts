import fs from 'fs';
import path from 'path';
import type { LogEntry, LogFilter, PurgeResult, LoggerOptions, LogLevel } from '../types';
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_RETENTION_DAYS,
  DEFAULT_MIN_LEVEL
} from '../constants';

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
  return process.env.LOG_PERSISTENCE === 'true' || process.env.NODE_ENV !== 'production';
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

export function purgeOldLogFiles(logDir: string, daysToRetain: number): PurgeResult {
  const result: PurgeResult = {
    purgedFiles: [],
    bytesFreed: 0,
    retentionDays: daysToRetain
  };

  if (!fs.existsSync(logDir)) {
    return result;
  }

  try {
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
      } catch {
        // Ignore single file error
      }
    }
  } catch {
    // Handled gracefully
  }

  return result;
}

export function computeLogStats(
  logDir: string,
  retentionDays: number
): { totalFiles: number; totalSizeBytes: number; retentionDays: number; logDir: string } {
  let totalFiles = 0;
  let totalSizeBytes = 0;

  if (fs.existsSync(logDir)) {
    try {
      const files = fs.readdirSync(logDir);
      for (const file of files) {
        const filePath = path.join(logDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            totalFiles++;
            totalSizeBytes += stats.size;
          }
        } catch {
          // Ignore individual stat failures
        }
      }
    } catch {
      // Handled gracefully
    }
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
  filter: LogFilter = {}
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

  if (enableFilePersistence && fs.existsSync(logDir)) {
    try {
      const appLogPath = path.join(logDir, 'app.log');
      if (fs.existsSync(appLogPath)) {
        const content = fs.readFileSync(appLogPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line) as LogEntry;
            checkAndAdd(entry);
          } catch {
            // Ignore malformed lines
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  for (const entry of recentLogs) {
    checkAndAdd(entry);
  }

  matchedEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limit = filter.limit && filter.limit > 0 ? filter.limit : 100;
  return matchedEntries.slice(0, limit);
}
