import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudflareEnvironment, CloudflareR2Bucket } from '../../src/types/cloudflare';
import { R2_CLEANUP_REASONS } from '../../src/constants';
import {
  createR2CleanupOutboxStatement,
  enqueueR2ObjectCleanup,
  processR2ObjectCleanupOutbox
} from '../../src/services/r2ObjectCleanupOutbox';
import logger from '../../src/utils/logger';
import { createWorkerDatabase, insertRows, runtimeEnvironment, type WorkerDatabaseFixture } from '../helpers/workerCoreFixtures';

let fixture: WorkerDatabaseFixture;

const bucketWithDelete = (deleteObject: CloudflareR2Bucket['delete']): CloudflareR2Bucket => ({
  put: vi.fn(async () => undefined),
  get: vi.fn(async () => null),
  delete: deleteObject
});

const seedJob = async (tenantId: string, objectKey: string): Promise<void> => {
  await enqueueR2ObjectCleanup(fixture.d1, {
    tenantId,
    objectKey,
    reason: R2_CLEANUP_REASONS.ingestionDelete
  }, 'cleanup-test-request');
};

const queueCount = async (): Promise<number> => {
  const row = await fixture.d1.prepare('SELECT COUNT(*) AS total FROM R2ObjectCleanupOutbox').first<{ total: number }>();
  return row?.total ?? 0;
};

beforeEach(() => {
  fixture = createWorkerDatabase();
});

afterEach(() => {
  fixture.close();
  vi.restoreAllMocks();
});

describe('R2 object cleanup outbox', () => {
  it('builds an idempotent tenant-scoped enqueue statement', async () => {
    const first = createR2CleanupOutboxStatement(fixture.d1, {
      tenantId: 'TNT-1', objectKey: 'tenant/TNT-1/one.csv', reason: R2_CLEANUP_REASONS.uploadStaging
    });
    const second = createR2CleanupOutboxStatement(fixture.d1, {
      tenantId: 'TNT-1', objectKey: 'tenant/TNT-1/one.csv', reason: R2_CLEANUP_REASONS.uploadStaging
    });
    await first.run();
    await second.run();

    expect(await queueCount()).toBe(1);
    await expect(fixture.d1.prepare('SELECT tenant_id, object_key, reason, attempt_count FROM R2ObjectCleanupOutbox').first())
      .resolves.toEqual({ tenant_id: 'TNT-1', object_key: 'tenant/TNT-1/one.csv', reason: 'UPLOAD_STAGING', attempt_count: 0 });
  });

  it('deletes objects and clears metadata and queue rows in one D1 batch', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/one.csv');
    insertRows(fixture.db,
      'INSERT INTO ObjectMetadata (object_key, tenant_id, filename, content_type, size_bytes, sha256, bucket) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [['tenant/TNT-1/one.csv', 'TNT-1', 'one.csv', 'text/csv', 5, 'hash', 'bucket']]);
    const deleteObject = vi.fn(async () => undefined);

    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({ DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject) }), {
      requestId: 'cleanup-success-request'
    })).resolves.toEqual({ selected: 1, deleted: 1, failed: 0, skipped: false });

    expect(deleteObject).toHaveBeenCalledWith('tenant/TNT-1/one.csv');
    expect(await queueCount()).toBe(0);
    await expect(fixture.d1.prepare('SELECT COUNT(*) AS total FROM ObjectMetadata').first()).resolves.toEqual({ total: 0 });
  });

  it('records a bounded, redacted retry after the object store rejects a delete', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/retry.csv');
    const warning = vi.spyOn(logger, 'warn');
    const deleteObject = vi.fn(async () => { throw new Error('Bearer abc token=xyz https://storage.test/path?sig=secret'); });

    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({ DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject) }), {
      requestId: 'cleanup-retry-request', tenantId: 'TNT-1'
    })).resolves.toEqual({ selected: 1, deleted: 0, failed: 1, skipped: false });

    const job = await fixture.d1.prepare('SELECT attempt_count, last_error, next_attempt_at FROM R2ObjectCleanupOutbox')
      .first<{ attempt_count: number; last_error: string; next_attempt_at: string }>();
    expect(job?.attempt_count).toBe(1);
    expect(job?.last_error).toContain('Bearer [redacted]');
    expect(job?.last_error).toContain('token=[redacted]');
    expect(job?.last_error).toContain('[redacted-url]');
    expect(job?.last_error).not.toContain('secret');
    expect(Date.parse(`${job?.next_attempt_at.replace(' ', 'T')}Z`)).toBeGreaterThan(Date.now());
    expect(warning).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      action: expect.any(String), requestId: 'cleanup-retry-request', tenantId: 'TNT-1',
      cleanupId: expect.any(String), objectKey: 'tenant/TNT-1/retry.csv', attemptCount: 1, retryDelaySeconds: 60
    }), expect.any(Error));
  });

  it('records non-Error object-store failures without losing the job', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/non-error.csv');
    const deleteObject = vi.fn(async () => { throw 'store unavailable'; });

    await processR2ObjectCleanupOutbox(runtimeEnvironment({ DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject) }));

    await expect(fixture.d1.prepare('SELECT last_error FROM R2ObjectCleanupOutbox').first())
      .resolves.toEqual({ last_error: 'Error: store unavailable' });
  });

  it('leaves queued jobs and emits a warning when R2 is not bound', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/no-binding.csv');
    const warning = vi.spyOn(logger, 'warn');

    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({ DB: fixture.d1 }), {
      requestId: 'cleanup-no-r2-request', tenantId: 'TNT-1'
    })).resolves.toEqual({ selected: 0, deleted: 0, failed: 0, skipped: true });

    expect(warning).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      requestId: 'cleanup-no-r2-request', tenantId: 'TNT-1', limit: 50
    }));
    expect(await queueCount()).toBe(1);
  });

  it('caps scheduled work at the configured batch size', async () => {
    const rows = Array.from({ length: 52 }, (_, index) => [
      `cleanup-${index}`, 'TNT-1', `tenant/TNT-1/${index}.csv`, 'INGESTION_DELETE'
    ]);
    insertRows(fixture.db,
      'INSERT INTO R2ObjectCleanupOutbox (cleanup_id, tenant_id, object_key, reason) VALUES (?, ?, ?, ?)', rows);
    const deleteObject = vi.fn(async () => undefined);

    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({ DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject) }), {
      limit: 1000
    })).resolves.toEqual({ selected: 50, deleted: 50, failed: 0, skipped: false });

    expect(deleteObject).toHaveBeenCalledTimes(50);
    expect(await queueCount()).toBe(2);
  });

  it('scopes inline cleanup to its tenant and supports a zero-work limit', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/scoped.csv');
    await seedJob('TNT-9', 'tenant/TNT-9/scoped.csv');
    const deleteObject = vi.fn(async () => undefined);
    const environment = runtimeEnvironment({ DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject) });

    await expect(processR2ObjectCleanupOutbox(environment, { tenantId: 'TNT-1', limit: 1 }))
      .resolves.toEqual({ selected: 1, deleted: 1, failed: 0, skipped: false });
    await expect(processR2ObjectCleanupOutbox(environment, { limit: 0 }))
      .resolves.toEqual({ selected: 0, deleted: 0, failed: 0, skipped: true });

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(await queueCount()).toBe(1);
    await expect(fixture.d1.prepare('SELECT tenant_id FROM R2ObjectCleanupOutbox').first()).resolves.toEqual({ tenant_id: 'TNT-9' });
  });

  it('selects an exact upload compensation object and applies the capped retry delay', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/older.csv');
    await seedJob('TNT-1', 'tenant/TNT-1/upload.csv');
    await fixture.d1.prepare('UPDATE R2ObjectCleanupOutbox SET attempt_count = 12 WHERE object_key = ?')
      .bind('tenant/TNT-1/upload.csv').run();
    const warning = vi.spyOn(logger, 'warn');
    const deleteObject = vi.fn(async () => { throw new Error('R2 unavailable'); });

    await processR2ObjectCleanupOutbox(runtimeEnvironment({ DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject) }), {
      tenantId: 'TNT-1', objectKey: 'tenant/TNT-1/upload.csv', limit: 1
    });

    expect(deleteObject).toHaveBeenCalledExactlyOnceWith('tenant/TNT-1/upload.csv');
    expect(warning).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ retryDelaySeconds: 3600 }), expect.any(Error));
    await expect(fixture.d1.prepare('SELECT attempt_count FROM R2ObjectCleanupOutbox WHERE object_key = ?')
      .bind('tenant/TNT-1/upload.csv').first()).resolves.toEqual({ attempt_count: 13 });
    expect(await queueCount()).toBe(2);
  });

  it('retains jobs when the queue query fails', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/query-failure.csv');
    const error = vi.spyOn(logger, 'error');
    const brokenDatabase = {
      ...fixture.d1,
      prepare: (query: string) => {
        if (query.includes('FROM R2ObjectCleanupOutbox')) throw new Error('D1 read failure');
        return fixture.d1.prepare(query);
      }
    };
    const deleteObject = vi.fn(async () => undefined);

    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({
      DB: brokenDatabase, OBJECTS: bucketWithDelete(deleteObject)
    }))).resolves.toEqual({ selected: 0, deleted: 0, failed: 1, skipped: false });

    expect(error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: expect.any(String) }), expect.any(Error));
    expect(deleteObject).not.toHaveBeenCalled();
    expect(await queueCount()).toBe(1);
  });

  it('reports every retained job as retryable if the atomic D1 finalize batch fails', async () => {
    await seedJob('TNT-1', 'tenant/TNT-1/finalize-success.csv');
    await seedJob('TNT-1', 'tenant/TNT-1/finalize-r2-failure.csv');
    const error = vi.spyOn(logger, 'error');
    const finalizeError = new Error('D1 batch unavailable');
    const brokenDatabase = { ...fixture.d1, batch: async () => { throw finalizeError; } };
    const deleteObject = vi.fn(async (objectKey: string | string[]) => {
      if (objectKey === 'tenant/TNT-1/finalize-r2-failure.csv') throw new Error('R2 delete unavailable');
    });

    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({
      DB: brokenDatabase, OBJECTS: bucketWithDelete(deleteObject)
    }))).resolves.toEqual({ selected: 2, deleted: 0, failed: 2, skipped: false });

    expect(error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      action: expect.any(String), objectCount: 1, r2DeletesSucceeded: 1, r2DeletesFailed: 1,
      documentCount: 2, pendingQueueJobs: 2
    }), finalizeError);
    expect(deleteObject).toHaveBeenCalledTimes(2);
    expect(await queueCount()).toBe(2);
  });

  it('reports a missing D1 binding and returns without touching R2', async () => {
    const error = vi.spyOn(logger, 'error');
    const deleteObject = vi.fn(async () => undefined);
    const environment: CloudflareEnvironment = { OBJECTS: bucketWithDelete(deleteObject) };

    await expect(processR2ObjectCleanupOutbox(environment)).resolves.toEqual({
      selected: 0, deleted: 0, failed: 1, skipped: true
    });

    expect(error).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ action: expect.any(String) }), expect.any(Error));
    expect(deleteObject).not.toHaveBeenCalled();
  });

  it('uses the default batch size when the supplied limit is not finite', async () => {
    const deleteObject = vi.fn(async () => undefined);
    await expect(processR2ObjectCleanupOutbox(runtimeEnvironment({
      DB: fixture.d1, OBJECTS: bucketWithDelete(deleteObject)
    }), { limit: Number.NaN })).resolves.toEqual({ selected: 0, deleted: 0, failed: 0, skipped: false });
  });
});
