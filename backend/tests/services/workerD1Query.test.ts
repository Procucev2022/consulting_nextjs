import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryD1Rows, requireWorkerDb } from '../../src/services/workerD1Query';
import logger from '../../src/utils/logger';
import type { CloudflareD1Database } from '../../src/types/cloudflare';

vi.mock('../../src/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('audited Worker D1 dataset reads', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  const db = (all = vi.fn().mockResolvedValue({ results: [{ value: 7 }] })): CloudflareD1Database => ({
    prepare: vi.fn().mockReturnValue({ all, bind: vi.fn().mockReturnThis() })
  });

  it('requires the runtime binding', () => {
    const binding = db();
    expect(requireWorkerDb(binding)).toBe(binding);
    expect(() => requireWorkerDb()).toThrow('Cloudflare D1 binding DB is not configured');
  });

  it('reads bound values and logs query timing, rows, model and request correlation', async () => {
    const binding = db();
    expect(await queryD1Rows(binding, 'SELECT value FROM Dataset WHERE id = ?', ['one'], 'req-1'))
      .toEqual([{ value: 7 }]);
    expect(binding.prepare('').bind).toHaveBeenCalledWith('one');
    expect(logger.debug).toHaveBeenCalledWith('D1 dataset query completed', expect.objectContaining({
      operation: 'SELECT', model: 'Dataset', cacheStatus: 'miss', affectedRows: 1, requestId: 'req-1'
    }));
  });

  it('handles empty results and slow queries without logging parameter values', async () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(0).mockReturnValueOnce(101);
    expect(await queryD1Rows(db(vi.fn().mockResolvedValue({})), 'SELECT 1')).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith('Slow D1 dataset query', expect.objectContaining({
      durationMs: 101, affectedRows: 0, model: undefined
    }));
  });

  it('propagates failures and records the error with request correlation', async () => {
    const error = new Error('Database unavailable');
    await expect(queryD1Rows(db(vi.fn().mockRejectedValue(error)), 'SELECT * FROM Dataset', [], 'req-2'))
      .rejects.toBe(error);
    expect(logger.error).toHaveBeenCalledWith('D1 dataset query failed', expect.objectContaining({ requestId: 'req-2' }), error);
  });
});
