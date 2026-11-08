import {
  R2_CLEANUP_ACTIONS,
  R2_CLEANUP_LIMITS,
  R2_CLEANUP_LOG_MESSAGES,
  R2_CLEANUP_RETRY,
  R2_CLEANUP_SQL
} from '../constants';
import type {
  CloudflareD1Database,
  CloudflareD1PreparedStatement,
  CloudflareEnvironment
} from '../types/cloudflare';
import type {
  R2ObjectCleanupAggregate,
  R2ObjectCleanupInput,
  R2ObjectCleanupJobOutcome,
  R2ObjectCleanupJob,
  R2ObjectCleanupOptions,
  R2ObjectCleanupResult
} from '../types/r2Cleanup';
import logger from '../utils/logger';
import { runD1Statements } from './workerD1Query';

const summarizeCleanupError = (error: unknown): string => {
  const name = error instanceof Error ? error.name : 'Error';
  const message = error instanceof Error ? error.message : String(error);
  const redacted = message
    .replace(/(bearer\s+)[^\s,;]+/giu, '$1[redacted]')
    .replace(/\b(token|password|secret|authorization)\s*[:=]\s*[^&\s,;]+/giu, '$1=[redacted]')
    .replace(/https?:\/\/[^\s?#]+(?:\?[^\s#]*)?/giu, '[redacted-url]');
  return `${name}: ${redacted}`.slice(0, R2_CLEANUP_LIMITS.errorSummaryMaxLength);
};
const getRetryDelaySeconds = (attemptCount: number): number => {
  const exponent = Math.min(R2_CLEANUP_RETRY.maximumExponent, Math.max(0, Math.floor(attemptCount)));
  return Math.min(R2_CLEANUP_RETRY.maximumDelaySeconds, R2_CLEANUP_RETRY.baseDelaySeconds * 2 ** exponent);
};

export const createR2CleanupOutboxStatement = (
  database: CloudflareD1Database,
  input: R2ObjectCleanupInput
): CloudflareD1PreparedStatement => database.prepare(R2_CLEANUP_SQL.enqueue).bind(
  crypto.randomUUID(),
  input.tenantId,
  input.objectKey,
  input.reason
);

export const enqueueR2ObjectCleanup = async (
  database: CloudflareD1Database,
  input: R2ObjectCleanupInput,
  requestId?: string
): Promise<void> => {
  await runD1Statements(database, [createR2CleanupOutboxStatement(database, input)], {
    action: R2_CLEANUP_ACTIONS.enqueue,
    operation: R2_CLEANUP_ACTIONS.enqueue,
    requestId,
    tenantId: input.tenantId,
    objectKey: input.objectKey,
    reason: input.reason
  });
};

const buildCleanupResult = (
  selected: number,
  deleted: number,
  failed: number,
  skipped = false
): R2ObjectCleanupResult => ({ selected, deleted, failed, skipped });

const selectCleanupJobs = async (
  database: CloudflareD1Database,
  options: R2ObjectCleanupOptions,
  limit: number
): Promise<R2ObjectCleanupJob[] | null> => {
  let query: string = R2_CLEANUP_SQL.selectAll;
  let values: unknown[] = [limit];
  if (options.tenantId) {
    query = R2_CLEANUP_SQL.selectTenant;
    values = [options.tenantId, limit];
  }
  if (options.tenantId && options.objectKey) {
    query = R2_CLEANUP_SQL.selectObject;
    values = [options.tenantId, options.objectKey];
  }
  try {
    const pending = await database.prepare(query).bind(...values).all<R2ObjectCleanupJob>();
    return pending.results || [];
  } catch (error: unknown) {
    logger.error(R2_CLEANUP_LOG_MESSAGES.queueReadFailed, {
      action: R2_CLEANUP_ACTIONS.process,
      requestId: options.requestId,
      tenantId: options.tenantId,
      limit
    }, error);
    return null;
  }
};

const attemptCleanupJob = async (
  database: CloudflareD1Database,
  objectStore: NonNullable<CloudflareEnvironment['OBJECTS']>,
  job: R2ObjectCleanupJob,
  requestId?: string
): Promise<R2ObjectCleanupJobOutcome> => {
  const context = {
    action: R2_CLEANUP_ACTIONS.process,
    requestId,
    tenantId: job.tenant_id,
    cleanupId: job.cleanup_id,
    objectKey: job.object_key,
    reason: job.reason
  };
  try {
    await objectStore.delete(job.object_key);
    return {
      statements: [
        database.prepare(R2_CLEANUP_SQL.deleteMetadata).bind(job.tenant_id, job.object_key),
        database.prepare(R2_CLEANUP_SQL.deleteJob).bind(job.cleanup_id, job.tenant_id)
      ],
      deleted: 1,
      failed: 0
    };
  } catch (error: unknown) {
    const retryDelaySeconds = getRetryDelaySeconds(job.attempt_count);
    logger.warn(R2_CLEANUP_LOG_MESSAGES.objectDeleteFailed, {
      ...context,
      attemptCount: job.attempt_count + 1,
      retryDelaySeconds
    }, error);
    return {
      statements: [database.prepare(R2_CLEANUP_SQL.recordFailure).bind(
        summarizeCleanupError(error), retryDelaySeconds, job.cleanup_id, job.tenant_id
      )],
      deleted: 0,
      failed: 1
    };
  }
};

const attemptCleanupJobs = async (
  database: CloudflareD1Database,
  objectStore: NonNullable<CloudflareEnvironment['OBJECTS']>,
  jobs: R2ObjectCleanupJob[],
  requestId?: string
): Promise<R2ObjectCleanupAggregate> => {
  const aggregate: R2ObjectCleanupAggregate = { statements: [], deleted: 0, failed: 0 };
  for (const job of jobs) {
    const outcome = await attemptCleanupJob(database, objectStore, job, requestId);
    aggregate.statements.push(...outcome.statements);
    aggregate.deleted += outcome.deleted;
    aggregate.failed += outcome.failed;
  }
  return aggregate;
};

const finalizeCleanupAttempts = async (
  database: CloudflareD1Database,
  options: R2ObjectCleanupOptions,
  jobCount: number,
  aggregate: R2ObjectCleanupAggregate
): Promise<R2ObjectCleanupAggregate> => {
  if (!aggregate.statements.length) return aggregate;
  try {
    await runD1Statements(database, aggregate.statements, {
      action: R2_CLEANUP_ACTIONS.process,
      operation: R2_CLEANUP_ACTIONS.process,
      requestId: options.requestId,
      tenantId: options.tenantId,
      objectCount: aggregate.deleted,
      documentCount: jobCount,
      statementCount: aggregate.statements.length
    });
    return aggregate;
  } catch (error: unknown) {
    const message = aggregate.deleted > 0
      ? R2_CLEANUP_LOG_MESSAGES.queueFinalizeFailed
      : R2_CLEANUP_LOG_MESSAGES.queueUpdateFailed;
    logger.error(message, {
      action: R2_CLEANUP_ACTIONS.process,
      requestId: options.requestId,
      tenantId: options.tenantId,
      objectCount: aggregate.deleted,
      r2DeletesSucceeded: aggregate.deleted,
      r2DeletesFailed: aggregate.failed,
      documentCount: jobCount,
      pendingQueueJobs: jobCount,
      statementCount: aggregate.statements.length
    }, error);
    // The atomic D1 batch leaves every queue row pending, so no selected job is complete.
    // Preserve the per-object outcome counts in the error log and report every job as retryable.
    return { statements: aggregate.statements, deleted: 0, failed: jobCount };
  }
};

const logCleanupBatchResult = (
  jobs: R2ObjectCleanupJob[],
  options: R2ObjectCleanupOptions,
  aggregate: R2ObjectCleanupAggregate
): void => {
  if (!jobs.length) return;
  logger.info(R2_CLEANUP_LOG_MESSAGES.batchCompleted, {
    action: R2_CLEANUP_ACTIONS.process,
    requestId: options.requestId,
    tenantId: options.tenantId,
    selected: jobs.length,
    deleted: aggregate.deleted,
    failed: aggregate.failed,
    remainingEstimate: Math.max(0, jobs.length - aggregate.deleted)
  });
};

export const processR2ObjectCleanupOutbox = async (
  environment: CloudflareEnvironment,
  options: R2ObjectCleanupOptions = {}
): Promise<R2ObjectCleanupResult> => {
  const database = environment.DB;
  if (!database) {
    logger.error(R2_CLEANUP_LOG_MESSAGES.queueReadFailed, {
      action: R2_CLEANUP_ACTIONS.process,
      requestId: options.requestId,
      tenantId: options.tenantId
    }, new Error('Cloudflare D1 binding DB is unavailable'));
    return buildCleanupResult(0, 0, 1, true);
  }

  const objectStore = environment.OBJECTS;
  if (!objectStore) {
    logger.warn(R2_CLEANUP_LOG_MESSAGES.bindingUnavailable, {
      action: R2_CLEANUP_ACTIONS.process,
      requestId: options.requestId,
      tenantId: options.tenantId,
      limit: options.limit ?? R2_CLEANUP_LIMITS.scheduledBatchSize
    });
    return buildCleanupResult(0, 0, 0, true);
  }

  const configuredLimit = Number.isFinite(options.limit)
    ? Math.floor(options.limit as number)
    : R2_CLEANUP_LIMITS.scheduledBatchSize;
  const limit = Math.min(R2_CLEANUP_LIMITS.scheduledBatchSize, Math.max(0, configuredLimit));
  if (limit === 0) return buildCleanupResult(0, 0, 0, true);

  const jobs = await selectCleanupJobs(database, options, limit);
  if (jobs === null) {
    // A failed queue read is different from a successful query with no jobs; never touch R2 on read failure.
    return buildCleanupResult(0, 0, 1);
  }
  const attempts = await attemptCleanupJobs(database, objectStore, jobs, options.requestId);
  const finalized = await finalizeCleanupAttempts(database, options, jobs.length, attempts);
  logCleanupBatchResult(jobs, options, finalized);
  return buildCleanupResult(jobs.length, finalized.deleted, finalized.failed);
};
