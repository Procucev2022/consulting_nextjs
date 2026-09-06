/**
 * Logger Types and Interfaces Definition Module (Backend)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  environment: string;
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  durationMs?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

export interface LogFilter {
  level?: LogLevel;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  requestId?: string;
  limit?: number;
}

export interface PurgeResult {
  purgedFiles: string[];
  bytesFreed: number;
  retentionDays: number;
}

export interface LoggerOptions {
  serviceName?: string;
  logDir?: string;
  minLevel?: LogLevel;
  enableConsole?: boolean;
  enableFilePersistence?: boolean;
  retentionDays?: number;
  autoPurge?: boolean;
}
