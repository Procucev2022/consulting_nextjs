import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

import {
  LogLevel,
  LogEntry,
  LogFilter,
  PurgeResult,
  LoggerOptions
} from '../types';
import {
  LEVEL_PRIORITY,
  DEFAULT_SERVICE_NAME,
  DEFAULT_RETENTION_DAYS,
  DEFAULT_MIN_LEVEL
} from '../constants';

export type { LogLevel, LogEntry, LogFilter, PurgeResult, LoggerOptions };
export { LEVEL_PRIORITY };

export class Logger {
  private serviceName: string;
  private logDir: string;
  private minLevel: LogLevel;
  private enableConsole: boolean;
  private enableFilePersistence: boolean;
  private retentionDays: number;
  private recentLogs: LogEntry[] = [];
  private maxMemoryLogs: number = 200;

  constructor(options: LoggerOptions = {}) {
    this.serviceName = options.serviceName || process.env.SERVICE_NAME || 'consulting-backend';
    this.logDir = options.logDir || process.env.LOG_DIR || path.resolve(process.cwd(), 'logs');
    this.minLevel = options.minLevel || (process.env.LOG_LEVEL as LogLevel) || 'debug';
    this.enableConsole = options.enableConsole ?? (process.env.LOG_CONSOLE !== 'false');
    this.enableFilePersistence =
      options.enableFilePersistence ??
      (process.env.LOG_PERSISTENCE === 'true' || process.env.NODE_ENV !== 'production');
    this.retentionDays =
      options.retentionDays ??
      (process.env.LOG_RETENTION_DAYS ? parseInt(process.env.LOG_RETENTION_DAYS, 10) : 14);

    if (this.enableFilePersistence) {
      this.ensureLogDir();
      if (options.autoPurge !== false) {
        this.purgeOldLogs();
      }
    }
  }

  private ensureLogDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch {
      // Graceful fallback if filesystem access is restricted
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel];
  }

  public formatEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error | unknown
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: process.env.NODE_ENV || 'development',
      message
    };

    if (context) {
      if (context.requestId) {
        entry.requestId = context.requestId;
      }
      if (typeof context.durationMs === 'number') {
        entry.durationMs = context.durationMs;
      }
      entry.context = context;
    }

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else {
        entry.error = {
          name: 'UnknownError',
          message: String(error)
        };
      }
    }

    return entry;
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.enableFilePersistence) return;

    try {
      this.ensureLogDir();
      const line = JSON.stringify(entry) + '\n';
      const dateStr = entry.timestamp.split('T')[0];

      // Primary combined log
      const appLogPath = path.join(this.logDir, 'app.log');
      fs.appendFileSync(appLogPath, line);

      // Dated partitioned app log
      const datedAppLogPath = path.join(this.logDir, `app-${dateStr}.log`);
      fs.appendFileSync(datedAppLogPath, line);

      // Error log partition
      if (entry.level === 'error') {
        const errorLogPath = path.join(this.logDir, 'error.log');
        fs.appendFileSync(errorLogPath, line);

        const datedErrorLogPath = path.join(this.logDir, `error-${dateStr}.log`);
        fs.appendFileSync(datedErrorLogPath, line);
      }
    } catch {
      // Fail silently to avoid breaking execution
    }
  }

  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error | unknown
  ): LogEntry {
    const entry = this.formatEntry(level, message, context, error);

    // Keep in recent memory buffer
    this.recentLogs.push(entry);
    if (this.recentLogs.length > this.maxMemoryLogs) {
      this.recentLogs.shift();
    }

    if (this.shouldLog(level)) {
      if (this.enableConsole) {
        const output = JSON.stringify(entry);
        if (level === 'error') {
          console.error(output);
        } else if (level === 'warn') {
          console.warn(output);
        } else {
          console.log(output);
        }
      }

      this.writeToFile(entry);
    }

    return entry;
  }

  public debug(message: string, context?: Record<string, any>): LogEntry {
    return this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): LogEntry {
    return this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>, error?: Error | unknown): LogEntry {
    return this.log('warn', message, context, error);
  }

  public error(message: string, context?: Record<string, any>, error?: Error | unknown): LogEntry {
    return this.log('error', message, context, error);
  }

  public searchLogs(filter: LogFilter = {}): LogEntry[] {
    const matchedEntries: LogEntry[] = [];
    const seenTimestamps = new Set<string>();

    const checkAndAdd = (entry: LogEntry) => {
      const uniqueKey = `${entry.timestamp}-${entry.message}-${entry.level}`;
      if (seenTimestamps.has(uniqueKey)) return;

      if (filter.level && entry.level !== filter.level) {
        return;
      }
      if (filter.requestId && entry.requestId !== filter.requestId) {
        return;
      }
      if (filter.startDate && new Date(entry.timestamp) < new Date(filter.startDate)) {
        return;
      }
      if (filter.endDate && new Date(entry.timestamp) > new Date(filter.endDate)) {
        return;
      }
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        const msgMatch = entry.message.toLowerCase().includes(kw);
        const ctxMatch = entry.context ? JSON.stringify(entry.context).toLowerCase().includes(kw) : false;
        const errMatch = entry.error ? JSON.stringify(entry.error).toLowerCase().includes(kw) : false;
        if (!msgMatch && !ctxMatch && !errMatch) {
          return;
        }
      }

      seenTimestamps.add(uniqueKey);
      matchedEntries.push(entry);
    };

    // Read persistent logs from filesystem if available
    if (this.enableFilePersistence && fs.existsSync(this.logDir)) {
      try {
        const appLogPath = path.join(this.logDir, 'app.log');
        if (fs.existsSync(appLogPath)) {
          const content = fs.readFileSync(appLogPath, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const entry = JSON.parse(line) as LogEntry;
              checkAndAdd(entry);
            } catch {
              // Ignore corrupted lines
            }
          }
        }
      } catch {
        // Fallback to in-memory logs
      }
    }

    // Also scan recent memory logs
    for (const entry of this.recentLogs) {
      checkAndAdd(entry);
    }

    // Sort descending by timestamp (newest first)
    matchedEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limit = filter.limit && filter.limit > 0 ? filter.limit : 100;
    return matchedEntries.slice(0, limit);
  }

  public purgeOldLogs(retentionDays?: number): PurgeResult {
    const daysToRetain = retentionDays ?? this.retentionDays;
    const result: PurgeResult = {
      purgedFiles: [],
      bytesFreed: 0,
      retentionDays: daysToRetain
    };

    if (!fs.existsSync(this.logDir)) {
      return result;
    }

    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const cutoffTime = now - daysToRetain * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        try {
          const stats = fs.statSync(filePath);
          let fileTime = stats.mtimeMs;

          // Check if file has dated format like app-YYYY-MM-DD.log or error-YYYY-MM-DD.log
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
          // Continue with next file
        }
      }
    } catch {
      // Handled gracefully
    }

    return result;
  }

  public getLogStats(): { totalFiles: number; totalSizeBytes: number; retentionDays: number; logDir: string } {
    let totalFiles = 0;
    let totalSizeBytes = 0;

    if (fs.existsSync(this.logDir)) {
      try {
        const files = fs.readdirSync(this.logDir);
        for (const file of files) {
          const filePath = path.join(this.logDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              totalFiles++;
              totalSizeBytes += stats.size;
            }
          } catch {
            // Ignore stat failures
          }
        }
      } catch {
        // Handled gracefully
      }
    }

    return {
      totalFiles,
      totalSizeBytes,
      retentionDays: this.retentionDays,
      logDir: this.logDir
    };
  }

  public createRequestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const rawHeader = req.headers['x-request-id'];
      const requestId = (typeof rawHeader === 'string' && rawHeader.trim())
        ? rawHeader
        : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      req.headers['x-request-id'] = requestId;
      res.setHeader('x-request-id', requestId);

      res.on('finish', () => {
        const durationMs = Date.now() - start;
        const statusCode = res.statusCode;
        const method = req.method;
        const path = req.originalUrl || req.url;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';

        const context = {
          requestId,
          method,
          path,
          statusCode,
          durationMs,
          ip,
          userAgent
        };

        const message = `HTTP ${method} ${path} [${statusCode}] ${durationMs}ms`;

        if (statusCode >= 500) {
          this.error(message, context);
        } else if (statusCode >= 400) {
          this.warn(message, context);
        } else {
          this.info(message, context);
        }
      });

      next();
    };
  }
}

export const logger = new Logger();
export const requestLogger = logger.createRequestLogger();
export default logger;
