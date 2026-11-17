import type { LogLevel, FrontendLogEntry, LogListener } from '../types';
import {
  LEVEL_PRIORITY,
  DEFAULT_SERVICE_NAME,
  DEFAULT_MIN_LEVEL,
  DEFAULT_MAX_HISTORY,
  LOG_RECORD_UNSERIALIZABLE_CONTEXT
} from '../constants';

export type { LogLevel, FrontendLogEntry, LogListener };

// One JSON object per console call, so log collectors can parse each record.
const serializeLogEntry = (entry: FrontendLogEntry): string => {
  try {
    return JSON.stringify(entry);
  } catch {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      service: entry.service,
      message: entry.message,
      requestId: entry.requestId,
      context: LOG_RECORD_UNSERIALIZABLE_CONTEXT
    });
  }
};

export class FrontendLogger {
  private service: string;
  private minLevel: LogLevel;
  private listeners: LogListener[] = [];
  private history: FrontendLogEntry[] = [];
  private maxHistory: number = DEFAULT_MAX_HISTORY;

  private static LEVEL_WEIGHT: Record<LogLevel, number> = LEVEL_PRIORITY;

  constructor(service: string = DEFAULT_SERVICE_NAME, minLevel: LogLevel = DEFAULT_MIN_LEVEL) {
    this.service = service;
    this.minLevel = minLevel;
  }

  public addListener(listener: LogListener): () => void {
    this.listeners.push(listener);
    return (): void => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getHistory(): FrontendLogEntry[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  private shouldLog(level: LogLevel): boolean {
    return FrontendLogger.LEVEL_WEIGHT[level] >= FrontendLogger.LEVEL_WEIGHT[this.minLevel];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | unknown
  ): FrontendLogEntry {
    const entry: FrontendLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message
    };

    if (context) {
      entry.context = context;
    }

    const requestId = context?.requestId;
    if (typeof requestId === 'string' && requestId.length > 0) {
      entry.requestId = requestId;
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

  private dispatchConsole(level: LogLevel, entry: FrontendLogEntry): void {
    const record = serializeLogEntry(entry);
    if (level === 'error') {
      console.error(record);
    } else if (level === 'warn') {
      console.warn(record);
    } else if (level === 'info') {
      console.info(record);
    } else {
      console.debug(record);
    }
  }

  private notifyListeners(entry: FrontendLogEntry): void {
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (error: unknown) {
        const failure = this.createLogEntry('error', 'Frontend logger listener failed', {
          action: 'logger.listener.notify'
        }, error);
        this.history.push(failure);
        if (this.history.length > this.maxHistory) this.history.shift();
        if (this.shouldLog('error')) {
          try {
            this.dispatchConsole('error', failure);
          } catch {
            // The diagnostic remains in memory if the browser console itself is unavailable.
          }
        }
      }
    }
  }

  public log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error | unknown
  ): FrontendLogEntry {
    const entry = this.createLogEntry(level, message, context, error);

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (this.shouldLog(level)) {
      this.dispatchConsole(level, entry);
    }

    this.notifyListeners(entry);

    return entry;
  }

  public debug(message: string, context?: Record<string, unknown>): FrontendLogEntry {
    return this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, unknown>): FrontendLogEntry {
    return this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>, error?: Error | unknown): FrontendLogEntry {
    return this.log('warn', message, context, error);
  }

  public error(message: string, context?: Record<string, unknown>, error?: Error | unknown): FrontendLogEntry {
    return this.log('error', message, context, error);
  }
}

export const frontendLogger = new FrontendLogger();
export const logger = frontendLogger;
export default frontendLogger;
