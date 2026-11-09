import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryD1Rows, requireD1AtomicBatch, requireWorkerDb, runD1Statements } from '../../src/services/workerD1Query';
import { SLOW_QUERY_ROWS_READ_THRESHOLD } from '../../src/constants/db';
import { D1_LOG_MESSAGES, D1_ROUTE_MESSAGES } from '../../src/constants/d1';
import logger from '../../src/utils/logger';
import type { CloudflareD1Database, CloudflareD1PreparedStatement } from '../../src/types/cloudflare';

vi.mock('../../src/utils/logger', () => ({ default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

describe('audited Worker D1 dataset reads', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  const db = (all = vi.fn().mockResolvedValue({
    results: [{ value: 7 }], meta: { rows_read: 12, rows_written: 0, duration: 1 }
  })): CloudflareD1Database => ({
    prepare: vi.fn().mockReturnValue({ all, bind: vi.fn().mockReturnThis() })
  });

  it('requires the runtime binding', () => {
    const binding = db();
    expect(requireWorkerDb(binding)).toBe(binding);
    expect(() => requireWorkerDb()).toThrow('Cloudflare D1 binding DB is not configured');
  });

  it('batches D1 mutations together when the binding supports atomic batches', async () => {
    const first = { run: vi.fn().mockResolvedValue(undefined) } as unknown as CloudflareD1PreparedStatement;
    const second = { run: vi.fn().mockResolvedValue(undefined) } as unknown as CloudflareD1PreparedStatement;
    const batch = vi.fn().mockResolvedValue([]);
    const binding = { prepare: vi.fn(), batch } as unknown as CloudflareD1Database;

    await runD1Statements(binding, [first, second]);

    expect(batch).toHaveBeenCalledWith([first, second]);
    expect(first.run).not.toHaveBeenCalled();
    expect(second.run).not.toHaveBeenCalled();
  });

  it('logs and rethrows multi-statement batch failures without replaying statements individually', async () => {
    const first = { run: vi.fn() } as unknown as CloudflareD1PreparedStatement;
    const second = { run: vi.fn() } as unknown as CloudflareD1PreparedStatement;
    const failure = new Error('D1 batch rolled back');
    const batch = vi.fn().mockRejectedValue(failure);
    const binding = { prepare: vi.fn(), batch } as unknown as CloudflareD1Database;

    await expect(runD1Statements(binding, [first, second], {
      operation: 'assessment.atomic_batch_failure', requestId: 'req-atomic-batch-failure'
    })).rejects.toBe(failure);

    expect(batch).toHaveBeenCalledOnce();
    expect(batch).toHaveBeenCalledWith([first, second]);
    expect(first.run).not.toHaveBeenCalled();
    expect(second.run).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(D1_LOG_MESSAGES.atomicWriteFailed, expect.objectContaining({
      operation: 'assessment.atomic_batch_failure', statementCount: 2,
      requestId: 'req-atomic-batch-failure'
    }), failure);
  });

  it('rejects multi-statement writes before any mutation when the binding has no batch API', async () => {
    const first = { run: vi.fn() } as unknown as CloudflareD1PreparedStatement;
    const second = { run: vi.fn() } as unknown as CloudflareD1PreparedStatement;
    const binding = { prepare: vi.fn() } as unknown as CloudflareD1Database;

    await expect(runD1Statements(binding, [first, second], {
      operation: 'assessment.review_gate.update', requestId: 'req-no-batch', tenantId: 'TNT-1', assessmentId: 'AIC-1'
    })).rejects.toThrow('Cloudflare D1 transactional batch support is unavailable');

    expect(first.run).not.toHaveBeenCalled();
    expect(second.run).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('rejected before any statements ran'),
      expect.objectContaining({
        operation: 'assessment.review_gate.update', action: 'assessment.review_gate.update',
        statementCount: 2, requestId: 'req-no-batch', tenantId: 'TNT-1', assessmentId: 'AIC-1', fallback: 'none'
      }), expect.any(Error));
  });

  it('uses action and default operation labels when an atomic batch is unavailable', () => {
    const binding = { prepare: vi.fn() } as unknown as CloudflareD1Database;
    expect(() => requireD1AtomicBatch(binding, { action: 'assessment.action_fallback' }))
      .toThrow(D1_ROUTE_MESSAGES.atomicBatchUnavailable);
    expect(logger.error).toHaveBeenCalledWith(D1_LOG_MESSAGES.atomicBatchUnavailable,
      expect.objectContaining({ operation: 'assessment.action_fallback', action: 'assessment.action_fallback' }),
      expect.any(Error));

    expect(() => requireD1AtomicBatch(binding, {})).toThrow(D1_ROUTE_MESSAGES.atomicBatchUnavailable);
    expect(logger.error).toHaveBeenCalledWith(D1_LOG_MESSAGES.atomicBatchUnavailable,
      expect.objectContaining({ operation: 'd1.write.batch_unavailable', action: 'd1.write.batch_unavailable' }),
      expect.any(Error));
  });

  it('runs a standalone D1 statement atomically and treats an empty write set as a no-op without batch support', async () => {
    const single = { run: vi.fn().mockResolvedValue(undefined) } as unknown as CloudflareD1PreparedStatement;
    const binding = { prepare: vi.fn() } as unknown as CloudflareD1Database;
    await runD1Statements(binding, [single], { operation: 'assessment.single_write' });
    await runD1Statements(binding, [single], { action: 'assessment.action_fallback' });
    await runD1Statements(binding, [single], {});
    await runD1Statements(binding, [], { operation: 'assessment.empty_write' });
    expect(single.run).toHaveBeenCalledTimes(3);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('does not resolve a standalone write before its D1 run promise settles', async () => {
    let finishRun!: () => void;
    const runResult = new Promise<void>((resolve) => { finishRun = resolve; });
    const statement = { run: vi.fn(() => runResult) } as unknown as CloudflareD1PreparedStatement;
    const binding = { prepare: vi.fn() } as unknown as CloudflareD1Database;
    let operationSettled = false;

    const operation = runD1Statements(binding, [statement]).then(() => { operationSettled = true; });
    await Promise.resolve();
    expect(operationSettled).toBe(false);
    expect(statement.run).toHaveBeenCalledOnce();

    finishRun();
    await operation;
    expect(operationSettled).toBe(true);
  });

  it('logs and rethrows a single-statement fallback failure', async () => {
    const failure = new Error('D1 single write failed');
    const statement = { run: vi.fn().mockRejectedValue(failure) } as unknown as CloudflareD1PreparedStatement;
    const binding = { prepare: vi.fn() } as unknown as CloudflareD1Database;

    await expect(runD1Statements(binding, [statement], { action: 'assessment.single_failure', requestId: 'req-single-failure' }))
      .rejects.toBe(failure);

    expect(logger.error).toHaveBeenCalledWith(D1_LOG_MESSAGES.atomicWriteFailed, expect.objectContaining({
      operation: 'assessment.single_failure', action: 'assessment.single_failure', statementCount: 1,
      requestId: 'req-single-failure'
    }), failure);
  });

  it('logs and rethrows a transactional D1 batch failure with operation context', async () => {
    const first = { run: vi.fn() } as unknown as CloudflareD1PreparedStatement;
    const failure = new Error('D1 batch failed');
    const batch = vi.fn().mockRejectedValue(failure);
    const binding = { prepare: vi.fn(), batch } as unknown as CloudflareD1Database;
    await expect(runD1Statements(binding, [first], { operation: 'assessment.batch_failure', requestId: 'req-batch-failure' }))
      .rejects.toBe(failure);
    expect(logger.error).toHaveBeenCalledWith('D1 transactional write batch failed', expect.objectContaining({
      operation: 'assessment.batch_failure', action: 'assessment.batch_failure', statementCount: 1,
      requestId: 'req-batch-failure'
    }), failure);
  });

  it('reads bound values and logs query timing, rows, model and request correlation', async () => {
    const binding = db();
    expect(await queryD1Rows(binding, 'SELECT value FROM Dataset WHERE id = ?', ['one'], 'req-1'))
      .toEqual([{ value: 7 }]);
    expect(binding.prepare('').bind).toHaveBeenCalledWith('one');
    expect(logger.debug).toHaveBeenCalledWith('D1 dataset query completed', expect.objectContaining({
      operation: 'SELECT', model: 'Dataset', cacheStatus: 'miss', affectedRows: 1,
      requestId: 'req-1', rowsRead: 12, rowsWritten: 0, databaseDurationMs: 1
    }));
  });

  it('warns when D1 scans many rows even when the query completes quickly', async () => {
    const binding = db(vi.fn().mockResolvedValue({
      results: [{ value: 7 }],
      meta: { rows_read: SLOW_QUERY_ROWS_READ_THRESHOLD + 1, rows_written: 0, duration: 1 }
    }));

    await queryD1Rows(binding, 'SELECT value FROM Dataset');

    expect(logger.warn).toHaveBeenCalledWith('Slow D1 dataset query', expect.objectContaining({
      rowsRead: SLOW_QUERY_ROWS_READ_THRESHOLD + 1,
      databaseDurationMs: 1,
      durationMs: expect.any(Number)
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
