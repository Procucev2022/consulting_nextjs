import fs from 'fs';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

import type {
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
import {
  resolveLoggerConfig,
  purgeOldLogFiles,
  computeLogStats,
  searchAndFilterLogs
} from './loggerHelpers';

export type { LogLevel, LogEntry, LogFilter, PurgeResult, LoggerOptions };
export { LEVEL_PRIORITY, DEFAULT_SERVICE_NAME, DEFAULT_RETENTION_DAYS, DEFAULT_MIN_LEVEL };

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
    const config = resolveLoggerConfig(options);
    this.serviceName = config.serviceName;
    this.logDir = config.logDir;
    this.minLevel = config.minLevel;
    this.enableConsole = config.enableConsole;
    this.enableFilePersistence = config.enableFilePersistence;
    this.retentionDays = config.retentionDays;

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
      // Graceful fallback
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel];
  }

  public formatEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
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
      if (context.requestId && typeof context.requestId === 'string') {
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

      fs.appendFileSync(path.join(this.logDir, 'app.log'), line);
      fs.appendFileSync(path.join(this.logDir, `app-${dateStr}.log`), line);

      if (entry.level === 'error') {
        fs.appendFileSync(path.join(this.logDir, 'error.log'), line);
        fs.appendFileSync(path.join(this.logDir, `error-${dateStr}.log`), line);
      }
    } catch {
      // Fail silently to avoid breaking execution
    }
  }

  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | unknown
  ): LogEntry {
    const entry = this.formatEntry(level, message, context, error);

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

  public debug(message: string, context?: Record<string, unknown>): LogEntry {
    return this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): LogEntry {
    return this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>, error?: Error | unknown): LogEntry {
    return this.log('warn', message, context, error);
  }

  public error(message: string, context?: Record<string, unknown>, error?: Error | unknown): LogEntry {
    return this.log('error', message, context, error);
  }

  public searchLogs(filter: LogFilter = {}): LogEntry[] {
    return searchAndFilterLogs(this.recentLogs, this.logDir, this.enableFilePersistence, filter);
  }

  public purgeOldLogs(retentionDays?: number): PurgeResult {
    const daysToRetain = retentionDays ?? this.retentionDays;
    return purgeOldLogFiles(this.logDir, daysToRetain);
  }

  public getLogStats(): { totalFiles: number; totalSizeBytes: number; retentionDays: number; logDir: string } {
    return computeLogStats(this.logDir, this.retentionDays);
  }

  public createRequestLogger(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
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
        const reqPath = req.originalUrl || req.url;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';

        const context = {
          requestId,
          method,
          path: reqPath,
          statusCode,
          durationMs,
          ip,
          userAgent
        };

        const message = `HTTP ${method} ${reqPath} [${statusCode}] ${durationMs}ms`;

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
