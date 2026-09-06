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

export class FrontendLogger {
  private service: string;
  private minLevel: LogLevel;
  private listeners: LogListener[] = [];
  private history: FrontendLogEntry[] = [];
  private maxHistory: number = 100;

  private static LEVEL_WEIGHT: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(service: string = 'consulting-frontend', minLevel: LogLevel = 'debug') {
    this.service = service;
    this.minLevel = minLevel;
  }

  public addListener(listener: LogListener): () => void {
    this.listeners.push(listener);
    return () => {
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

  public log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error | unknown): FrontendLogEntry {
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

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (this.shouldLog(level)) {
      const formatted = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.service}]: ${message}`;
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

    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch {
        // Prevent listener failures from breaking application flow
      }
    }

    return entry;
  }

  public debug(message: string, context?: Record<string, any>): FrontendLogEntry {
    return this.log('debug', message, context);
  }

  public info(message: string, context?: Record<string, any>): FrontendLogEntry {
    return this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>, error?: Error | unknown): FrontendLogEntry {
    return this.log('warn', message, context, error);
  }

  public error(message: string, context?: Record<string, any>, error?: Error | unknown): FrontendLogEntry {
    return this.log('error', message, context, error);
  }
}

export const frontendLogger = new FrontendLogger();
export default frontendLogger;
