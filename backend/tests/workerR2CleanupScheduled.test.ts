import { afterEach, describe, expect, it, vi } from 'vitest';

const { cleanupProcessor } = vi.hoisted(() => ({ cleanupProcessor: vi.fn() }));

vi.mock('../src/services/r2ObjectCleanupOutbox', () => ({
  processR2ObjectCleanupOutbox: cleanupProcessor
}));

import { scheduled } from '../src/worker';
import type { CloudflareExecutionContext } from '../src/types/cloudflare';
import { R2_CLEANUP_ACTIONS, R2_CLEANUP_LOG_MESSAGES } from '../src/constants';
import logger from '../src/utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
  cleanupProcessor.mockReset();
});

describe('scheduled R2 cleanup handler', () => {
  it('runs bounded cleanup work through waitUntil with a generated correlation id', async () => {
    cleanupProcessor.mockResolvedValue({ selected: 0, deleted: 0, failed: 0, skipped: false });
    const waitUntil = vi.fn((promise: Promise<unknown>) => promise);
    const context: CloudflareExecutionContext = { waitUntil, passThroughOnException: vi.fn() };
    const info = vi.spyOn(logger, 'info');

    scheduled({ cron: '*/15 * * * *', scheduledTime: 1794012345000 }, { DB: undefined }, context);
    await waitUntil.mock.calls[0][0];

    expect(cleanupProcessor).toHaveBeenCalledWith({ DB: undefined }, { requestId: expect.any(String) });
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith(R2_CLEANUP_LOG_MESSAGES.cronStarted, expect.objectContaining({
      action: R2_CLEANUP_ACTIONS.cron, cron: '*/15 * * * *', scheduledTime: 1794012345000,
      requestId: expect.any(String)
    }));
  });

  it('captures unexpected queue processor rejections', async () => {
    cleanupProcessor.mockRejectedValue(new Error('Unexpected queue processor failure'));
    const waitUntil = vi.fn((promise: Promise<unknown>) => promise);
    const context: CloudflareExecutionContext = { waitUntil, passThroughOnException: vi.fn() };
    const error = vi.spyOn(logger, 'error');

    scheduled({ cron: '*/15 * * * *', scheduledTime: 1794012345000 }, {}, context);
    await expect(waitUntil.mock.calls[0][0]).rejects.toThrow('Unexpected queue processor failure');

    expect(error).toHaveBeenCalledWith(R2_CLEANUP_LOG_MESSAGES.queueReadFailed, expect.objectContaining({
      action: R2_CLEANUP_ACTIONS.cron,
      cron: '*/15 * * * *',
      scheduledTime: 1794012345000,
      requestId: expect.any(String)
    }), expect.any(Error));
  });
});
