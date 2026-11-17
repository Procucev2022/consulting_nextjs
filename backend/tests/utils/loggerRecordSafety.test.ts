import { describe, it, expect, vi, afterEach } from 'vitest';
import { Logger } from '../../src/utils/logger';
import { LOG_SERIALIZATION } from '../../src/constants/logger';

describe('Logger record safety', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes a record for a circular context without throwing into the caller', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = new Logger({ enableConsole: true, enableFilePersistence: false, autoPurge: false });
    const context: Record<string, unknown> = { tenantId: 'TNT-1' };
    context.self = context;

    expect(() => logger.error('Circular context captured', context)).not.toThrow();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`"self":"${LOG_SERIALIZATION.circularMarker}"`)
    );
  });

  it('keeps BigInt context values findable by keyword search', () => {
    const logger = new Logger({ enableConsole: false, enableFilePersistence: false, autoPurge: false });

    logger.info('Persisted row count', { rows: 12345n });

    expect(logger.searchLogs({ keyword: '12345' })).toHaveLength(1);
  });
});
