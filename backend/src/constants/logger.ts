/**
 * Logger Constants Module (Backend)
 */

import type { LogLevel } from '../types';

export const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const;

export const DEFAULT_SERVICE_NAME = 'consulting-backend';
export const DEFAULT_LOG_DIR_NAME = 'logs';
export const DEFAULT_MIN_LEVEL: LogLevel = 'debug';
export const DEFAULT_RETENTION_DAYS = 14;
export const DEFAULT_MAX_MEMORY_LOGS = 200;
export const DEFAULT_PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
