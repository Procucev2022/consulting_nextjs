import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrontendLogger, frontendLogger } from '../../src/utils/logger';

describe('Frontend Logger Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Basic Logging', () => {
    it('creates logger instance with default parameters', () => {
      expect(frontendLogger).toBeDefined();
      expect(frontendLogger.getHistory()).toBeDefined();
    });

    it('logs at all levels and dispatches to appropriate console methods', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logger = new FrontendLogger('test-app', 'debug');

      logger.debug('Debug test', { key: 'val' });
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] [test-app]: Debug test'),
        { key: 'val' }
      );

      logger.info('Info test');
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] [test-app]: Info test'),
        ''
      );

      logger.warn('Warn test', { alert: true });
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] [test-app]: Warn test'),
        { alert: true }
      );

      const err = new Error('Client error');
      logger.error('Error test', { code: 500 }, err);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] [test-app]: Error test'),
        { code: 500 },
        expect.objectContaining({ name: 'Error', message: 'Client error' })
      );

      debugSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('formats non-Error unknown errors correctly', () => {
      const logger = new FrontendLogger('test-app', 'debug');
      const entry = logger.error('Failure', undefined, 'Custom string rejection');
      expect(entry.error?.name).toBe('UnknownError');
      expect(entry.error?.message).toBe('Custom string rejection');
    });

    it('filters messages below minLevel', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const logger = new FrontendLogger('test-app', 'warn');

      logger.debug('Ignore debug');
      logger.info('Ignore info');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();

      infoSpy.mockRestore();
      debugSpy.mockRestore();
    });
  });

  describe('Listeners and History', () => {
    it('notifies registered listeners and allows unsubscribing', () => {
      const logger = new FrontendLogger('test-app', 'debug');
      const listener = vi.fn();

      const unsubscribe = logger.addListener(listener);
      logger.info('Event 1');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      logger.info('Event 2');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('recovers gracefully if a listener throws', () => {
      const logger = new FrontendLogger('test-app', 'debug');
      const faultyListener = vi.fn(() => {
        throw new Error('Listener failed');
      });

      logger.addListener(faultyListener);
      expect(() => {
        logger.info('Safe event');
      }).not.toThrow();
    });

    it('manages history buffer and limits entries to maxHistory', () => {
      const logger = new FrontendLogger('test-app', 'debug');
      logger.clearHistory();
      expect(logger.getHistory().length).toBe(0);

      for (let i = 0; i < 110; i++) {
        logger.info(`Message ${i}`);
      }

      const history = logger.getHistory();
      expect(history.length).toBe(100);
      expect(history[history.length - 1].message).toBe('Message 109');
    });
  });
});
