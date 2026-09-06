/**
 * Logger Types and Interfaces Module (Frontend)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface FrontendLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export type LogListener = (entry: FrontendLogEntry) => void;
