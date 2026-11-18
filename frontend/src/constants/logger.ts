/**
 * Logger Constants Module (Frontend)
 */

import type { LogLevel } from '../types';

export const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const;

export const DEFAULT_SERVICE_NAME = 'consulting-frontend';
export const DEFAULT_MIN_LEVEL: LogLevel = 'debug';
export const DEFAULT_MAX_HISTORY = 100;

// Replaces log context that cannot be serialized, such as a circular object, so the record is still written.
export const LOG_RECORD_UNSERIALIZABLE_CONTEXT = { serializationFailed: true } as const;
