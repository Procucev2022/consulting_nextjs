import fs from 'fs';
import path from 'path';
import type {
  LogLevel,
  LogEntry,
  LogFilter,
  PurgeResult,
  LoggerOptions,
  LoggerDiagnosticReporter
} from '../types';
import {
  LEVEL_PRIORITY,
  DEFAULT_SERVICE_NAME,
  DEFAULT_RETENTION_DAYS,
  DEFAULT_MIN_LEVEL,
  DEFAULT_MAX_MEMORY_LOGS
} from '../constants/logger';
import {
  resolveLoggerConfig,
  purgeOldLogFiles,
  computeLogStats,
  searchAndFilterLogs
} from './loggerHelpers';

export type { LogLevel, LogEntry, LogFilter, PurgeResult, LoggerOptions, LoggerDiagnosticReporter };
export { LEVEL_PRIORITY, DEFAULT_SERVICE_NAME, DEFAULT_RETENTION_DAYS, DEFAULT_MIN_LEVEL };

export class Logger {
  private serviceName: string;
  private logDir: string;
  private minLevel: LogLevel;
  private enableConsole: boolean;
  private enableFilePersistence: boolean;
  private retentionDays: number;
  private recentLogs: LogEntry[] = [];
  private maxMemoryLogs: number = DEFAULT_MAX_MEMORY_LOGS;

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

  private addRecentLog(entry: LogEntry): void {
    this.recentLogs.push(entry);
    if (this.recentLogs.length > this.maxMemoryLogs) this.recentLogs.shift();
  }

  private reportInternalFailure(action: string, error: unknown, context?: Record<string, unknown>): void {
    const entry = this.formatEntry('error', 'Logger internal operation failed', {
      ...context,
      action,
      logDir: this.logDir
    }, error);
    this.addRecentLog(entry);
    try {
      console.error(JSON.stringify(entry));
    } catch {
      // The original application operation must continue if even the logging fallback is unavailable.
    }
  }

  private ensureLogDir(context?: Record<string, unknown>): boolean {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      return true;
    } catch (error: unknown) {
      this.reportInternalFailure('logger.ensure-log-directory', error, context);
      return false;
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
      if (!this.ensureLogDir(entry.context)) return;
      const line = JSON.stringify(entry) + '\n';
      const dateStr = entry.timestamp.split('T')[0];

      fs.appendFileSync(path.join(this.logDir, 'app.log'), line);
      fs.appendFileSync(path.join(this.logDir, `app-${dateStr}.log`), line);

      if (entry.level === 'error') {
        fs.appendFileSync(path.join(this.logDir, 'error.log'), line);
        fs.appendFileSync(path.join(this.logDir, `error-${dateStr}.log`), line);
      }
    } catch (error: unknown) {
      this.reportInternalFailure('logger.persist-log-entry', error, entry.context);
    }
  }

  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | unknown
  ): LogEntry {
    const entry = this.formatEntry(level, message, context, error);

    this.addRecentLog(entry);

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
    return searchAndFilterLogs(
      this.recentLogs,
      this.logDir,
      this.enableFilePersistence,
      filter,
      this.reportInternalFailure.bind(this)
    );
  }

  public purgeOldLogs(retentionDays?: number): PurgeResult {
    const daysToRetain = retentionDays ?? this.retentionDays;
    return purgeOldLogFiles(this.logDir, daysToRetain, this.reportInternalFailure.bind(this));
  }

  public getLogStats(): { totalFiles: number; totalSizeBytes: number; retentionDays: number; logDir: string } {
    return computeLogStats(this.logDir, this.retentionDays, this.reportInternalFailure.bind(this));
  }

}

export const logger = new Logger();
export default logger;
