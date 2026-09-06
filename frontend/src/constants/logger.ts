/**
 * Logger Constants Module (Frontend)
 */

import { LogLevel } from '../types';

export const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const;

export const DEFAULT_SERVICE_NAME = 'consulting-frontend';
export const DEFAULT_MIN_LEVEL: LogLevel = 'debug';
export const DEFAULT_MAX_HISTORY = 100;
