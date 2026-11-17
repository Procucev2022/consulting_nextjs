import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FrontendLogger, frontendLogger } from '../../src/utils/logger';
import { LOG_RECORD_UNSERIALIZABLE_CONTEXT } from '../../src/constants/logger';

// Each console call receives one JSON record. The last call on the spy is the record under test.
const recordOf = (spy: { mock: { calls: unknown[][] } }): Record<string, unknown> => {
  const lastCall = spy.mock.calls[spy.mock.calls.length - 1];
  return JSON.parse(String(lastCall[0])) as Record<string, unknown>;
};

describe('Frontend Logger Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization and Basic Logging', () => {
    it('creates logger instance with default parameters', () => {
      expect(frontendLogger).toBeDefined();
      expect(frontendLogger.getHistory()).toBeDefined();
    });

    it('logs at all levels and dispatches one JSON record to the matching console method', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logger = new FrontendLogger('test-app', 'debug');

      logger.debug('Debug test', { key: 'val' });
      expect(debugSpy).toHaveBeenCalledTimes(1);
      expect(recordOf(debugSpy)).toMatchObject({
        level: 'debug', service: 'test-app', message: 'Debug test', context: { key: 'val' }
      });

      logger.info('Info test');
      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(recordOf(infoSpy)).toMatchObject({ level: 'info', service: 'test-app', message: 'Info test' });
      expect(recordOf(infoSpy)).not.toHaveProperty('context');

      logger.warn('Warn test', { alert: true });
      expect(recordOf(warnSpy)).toMatchObject({ level: 'warn', message: 'Warn test', context: { alert: true } });

      const err = new Error('Client error');
      logger.error('Error test', { code: 500 }, err);
      expect(recordOf(errorSpy)).toMatchObject({
        level: 'error',
        message: 'Error test',
        context: { code: 500 },
        error: { name: 'Error', message: 'Client error', stack: expect.any(String) }
      });

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

    it('promotes a non-empty string request ID to the top level and omits it otherwise', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const logger = new FrontendLogger('test-app', 'debug');

      const tagged = logger.info('Request finished', { requestId: 'req-42', statusCode: 200 });

      expect(tagged.requestId).toBe('req-42');
      expect(recordOf(infoSpy)).toMatchObject({
        requestId: 'req-42', context: { requestId: 'req-42', statusCode: 200 }
      });
      expect(logger.info('Empty ID', { requestId: '' }).requestId).toBeUndefined();
      expect(logger.info('Numeric ID', { requestId: 42 }).requestId).toBeUndefined();
      expect(logger.info('No context').requestId).toBeUndefined();
      infoSpy.mockRestore();
    });

    it('still writes the record when the context cannot be serialized', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logger = new FrontendLogger('test-app', 'debug');
      const circular: Record<string, unknown> = { requestId: 'req-9' };
      circular.self = circular;

      logger.warn('Cyclic context', circular);

      expect(recordOf(warnSpy)).toMatchObject({
        level: 'warn',
        service: 'test-app',
        message: 'Cyclic context',
        requestId: 'req-9',
        context: LOG_RECORD_UNSERIALIZABLE_CONTEXT
      });
      warnSpy.mockRestore();
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

    it('logs listener exceptions and continues notifying the remaining listeners', () => {
      const logger = new FrontendLogger('test-app', 'debug');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const faultyListener = vi.fn(() => {
        throw new Error('Listener failed');
      });
      const healthyListener = vi.fn();

      logger.addListener(faultyListener);
      logger.addListener(healthyListener);
      expect(() => {
        logger.info('Safe event');
      }).not.toThrow();

      expect(healthyListener).toHaveBeenCalledTimes(1);
      expect(logger.getHistory()).toContainEqual(expect.objectContaining({
        level: 'error',
        message: 'Frontend logger listener failed',
        context: { action: 'logger.listener.notify' },
        error: expect.objectContaining({ name: 'Error', message: 'Listener failed', stack: expect.any(String) })
      }));
      expect(recordOf(consoleErrorSpy)).toMatchObject({
        level: 'error',
        message: 'Frontend logger listener failed',
        context: { action: 'logger.listener.notify' },
        error: { message: 'Listener failed' }
      });
      consoleErrorSpy.mockRestore();
    });

    it('keeps logger flow alive if the console fallback also throws', () => {
      const logger = new FrontendLogger('test-app', 'debug');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        throw new Error('Console unavailable');
      });
      const faultyListener = vi.fn(() => { throw new Error('Listener failed'); });
      const healthyListener = vi.fn();
      logger.addListener(faultyListener);
      logger.addListener(healthyListener);

      expect(() => logger.info('Safe event')).not.toThrow();
      expect(healthyListener).toHaveBeenCalledTimes(1);
      expect(logger.getHistory()).toContainEqual(expect.objectContaining({
        message: 'Frontend logger listener failed',
        error: expect.objectContaining({ message: 'Listener failed' })
      }));
      consoleErrorSpy.mockRestore();
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
