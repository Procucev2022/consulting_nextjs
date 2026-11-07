export const R2_CLEANUP_LIMITS = {
  scheduledBatchSize: 50,
  errorSummaryMaxLength: 500
} as const;
export const R2_CLEANUP_RETRY = {
  baseDelaySeconds: 60,
  maximumDelaySeconds: 3600,
  maximumExponent: 6
} as const;

export const R2_CLEANUP_REASONS = {
  uploadStaging: 'UPLOAD_STAGING',
  ingestionDelete: 'INGESTION_DELETE',
  ingestionReset: 'INGESTION_RESET'
} as const;

export const R2_CLEANUP_ACTIONS = {
  enqueue: 'r2.cleanup.enqueue',
  process: 'r2.cleanup.process',
  cron: 'r2.cleanup.cron'
} as const;

export const R2_CLEANUP_LOG_MESSAGES = {
  bindingUnavailable: 'R2 cleanup queue is pending because the object store binding is unavailable',
  queueReadFailed: 'Failed to read the R2 object cleanup queue',
  objectDeleteFailed: 'Failed to delete an R2 object from the cleanup queue',
  queueUpdateFailed: 'Failed to record an R2 cleanup attempt',
  queueFinalizeFailed: 'R2 object deletion succeeded but its cleanup queue entry could not be finalized',
  batchCompleted: 'Processed a batch of R2 object cleanup jobs',
  cronStarted: 'Started scheduled R2 object cleanup'
} as const;

export const R2_CLEANUP_SQL = {
  enqueue: `INSERT INTO R2ObjectCleanupOutbox (cleanup_id, tenant_id, object_key, reason)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tenant_id, object_key) DO NOTHING`,
  enqueueForIngestionDelete: `INSERT INTO R2ObjectCleanupOutbox (cleanup_id, tenant_id, object_key, reason)
    SELECT lower(hex(randomblob(16))), ObjectMetadata.tenant_id, ObjectMetadata.object_key, ?
    FROM ObjectMetadata WHERE ObjectMetadata.tenant_id = ? AND EXISTS (
      SELECT 1 FROM RawDocumentIngestion AS document
      WHERE document.tenant_id = ? AND (? IS NULL OR document.doc_id = ?)
        AND substr(ObjectMetadata.object_key, 1, length(document.doc_id) + 1) = document.doc_id || '_'
    ) ON CONFLICT(tenant_id, object_key) DO NOTHING`,
  enqueueForTenantReset: `INSERT INTO R2ObjectCleanupOutbox (cleanup_id, tenant_id, object_key, reason)
    SELECT lower(hex(randomblob(16))), tenant_id, object_key, ? FROM ObjectMetadata WHERE tenant_id = ?
    ON CONFLICT(tenant_id, object_key) DO NOTHING`,
  selectAll: `SELECT cleanup_id, tenant_id, object_key, reason, attempt_count
    FROM R2ObjectCleanupOutbox WHERE next_attempt_at <= CURRENT_TIMESTAMP
    ORDER BY next_attempt_at, created_at, cleanup_id LIMIT ?`,
  selectTenant: `SELECT cleanup_id, tenant_id, object_key, reason, attempt_count
    FROM R2ObjectCleanupOutbox WHERE tenant_id = ? AND next_attempt_at <= CURRENT_TIMESTAMP
    ORDER BY next_attempt_at, created_at, cleanup_id LIMIT ?`,
  selectObject: `SELECT cleanup_id, tenant_id, object_key, reason, attempt_count
    FROM R2ObjectCleanupOutbox
    WHERE tenant_id = ? AND object_key = ? AND next_attempt_at <= CURRENT_TIMESTAMP LIMIT 1`,
  recordFailure: `UPDATE R2ObjectCleanupOutbox
    SET attempt_count = attempt_count + 1, last_error = ?, next_attempt_at = datetime('now', '+' || ? || ' seconds'),
      updated_at = CURRENT_TIMESTAMP WHERE cleanup_id = ? AND tenant_id = ?`,
  deleteMetadata: 'DELETE FROM ObjectMetadata WHERE tenant_id = ? AND object_key = ?',
  deleteJob: 'DELETE FROM R2ObjectCleanupOutbox WHERE cleanup_id = ? AND tenant_id = ?',
  deleteJobByObject: 'DELETE FROM R2ObjectCleanupOutbox WHERE tenant_id = ? AND object_key = ?'
} as const;
