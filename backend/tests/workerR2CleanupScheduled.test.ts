import { afterEach, describe, expect, it, vi } from 'vitest';

const { cleanupProcessor } = vi.hoisted(() => ({ cleanupProcessor: vi.fn() }));

vi.mock('../src/services/r2ObjectCleanupOutbox', () => ({
  processR2ObjectCleanupOutbox: cleanupProcessor
}));

import { scheduled } from '../src/worker';
import { R2_CLEANUP_ACTIONS, R2_CLEANUP_LOG_MESSAGES } from '../src/constants';
import logger from '../src/utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
  cleanupProcessor.mockReset();
});

describe('scheduled R2 cleanup handler', () => {
  it('awaits bounded cleanup work with a generated correlation id', async () => {
    cleanupProcessor.mockResolvedValue({ selected: 0, deleted: 0, failed: 0, skipped: false });
    const info = vi.spyOn(logger, 'info');

    await scheduled({ cron: '*/15 * * * *', scheduledTime: 1794012345000 }, { DB: undefined });

    expect(cleanupProcessor).toHaveBeenCalledWith({ DB: undefined }, { requestId: expect.any(String) });
    expect(info).toHaveBeenCalledWith(R2_CLEANUP_LOG_MESSAGES.cronStarted, expect.objectContaining({
      action: R2_CLEANUP_ACTIONS.cron, cron: '*/15 * * * *', scheduledTime: 1794012345000,
      requestId: expect.any(String)
    }));
  });

  it('captures unexpected queue processor rejections', async () => {
    const failure = new Error('Unexpected queue processor failure');
    cleanupProcessor.mockRejectedValue(failure);
    const error = vi.spyOn(logger, 'error');

    await expect(scheduled({ cron: '*/15 * * * *', scheduledTime: 1794012345000 }, {}))
      .rejects.toBe(failure);

    expect(error).toHaveBeenCalledWith(R2_CLEANUP_LOG_MESSAGES.queueReadFailed, expect.objectContaining({
      action: R2_CLEANUP_ACTIONS.cron,
      cron: '*/15 * * * *',
      scheduledTime: 1794012345000,
      requestId: expect.any(String)
    }), expect.any(Error));
  });
});
