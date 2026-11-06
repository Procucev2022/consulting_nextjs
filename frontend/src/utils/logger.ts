import type { LogLevel, FrontendLogEntry, LogListener } from '../types';
import {
  LEVEL_PRIORITY,
  DEFAULT_SERVICE_NAME,
  DEFAULT_MIN_LEVEL,
  DEFAULT_MAX_HISTORY
} from '../constants';

export type { LogLevel, FrontendLogEntry, LogListener };

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

  private dispatchConsole(level: LogLevel, formatted: string, entry: FrontendLogEntry): void {
    if (level === 'error') {
      console.error(formatted, entry.context || '', entry.error || '');
    } else if (level === 'warn') {
      console.warn(formatted, entry.context || '');
    } else if (level === 'info') {
      console.info(formatted, entry.context || '');
    } else {
      console.debug(formatted, entry.context || '');
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
          const formatted = `[${failure.timestamp}] [ERROR] [${this.service}]: ${failure.message}`;
          try {
            this.dispatchConsole('error', formatted, failure);
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
      const formatted = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.service}]: ${message}`;
      this.dispatchConsole(level, formatted, entry);
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
