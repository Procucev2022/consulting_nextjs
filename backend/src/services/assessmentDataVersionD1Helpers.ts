import type { CloudflareD1PreparedStatement } from '../types/cloudflare';
import type { D1Record, WorkerD1Result } from '../types/d1';
import type { AssessmentDatasetActionContext } from '../types/assessmentDataVersionD1';
import type { AssessmentSnapshotReadContext } from '../types/assessmentDataVersionD1';
import { ASSESSMENT_D1_FALLBACKS, ASSESSMENT_D1_LOG_MESSAGES } from '../constants/assessmentD1';
import logger from '../utils/logger';

export const ASSESSMENT_SNAPSHOT_TYPE = 'assessment';
export const ASSESSMENT_VERSION_SNAPSHOT_TYPE = 'version';
export const ASSESSMENT_DATA_STATUS_RECEIVED = 'RECEIVED';
export const ASSESSMENT_DATA_STATUS_VALIDATED = 'VALIDATED';
export const ASSESSMENT_DATA_STATUS_CLARIFICATION = 'REQUIRES_CLARIFICATION';

interface StoredSnapshotRow {
  payload_json: string;
}

export const queryFirst = async <T>(
  db: AssessmentDatasetActionContext['db'],
  sql: string,
  values: unknown[]
): Promise<T | null> => db.prepare(sql).bind(...values).first<T>();

export const runStatements = async (
  db: AssessmentDatasetActionContext['db'],
  statements: CloudflareD1PreparedStatement[]
): Promise<void> => {
  if (db.batch) {
    await db.batch(statements);
    return;
  }
  for (const statement of statements) await statement.run();
};

export const readAssessmentSnapshot = async (
  db: AssessmentDatasetActionContext['db'],
  entryType: string,
  assessmentId: string,
  entryId: string = assessmentId,
  context?: AssessmentSnapshotReadContext
): Promise<D1Record> => {
  const row = await queryFirst<StoredSnapshotRow>(db,
    'SELECT payload_json FROM AssessmentStoreEntry WHERE entry_type = ? AND assessment_id = ? AND entry_id = ?',
    [entryType, assessmentId, entryId]);
  if (!row) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.payload_json);
  } catch (error) {
    logger.warn(ASSESSMENT_D1_LOG_MESSAGES.invalidSnapshotFallback, {
      action: 'assessment.snapshot.read', assessmentId, entryType, entryId,
      tenantId: context?.tenantId, requestId: context?.requestId,
      fallback: ASSESSMENT_D1_FALLBACKS.EMPTY_SNAPSHOT_OBJECT
    }, error);
    return {};
  }
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed as D1Record;
  logger.warn(ASSESSMENT_D1_LOG_MESSAGES.invalidSnapshotFallback, {
    action: 'assessment.snapshot.read', assessmentId, entryType, entryId,
    tenantId: context?.tenantId, requestId: context?.requestId,
    fallback: ASSESSMENT_D1_FALLBACKS.EMPTY_SNAPSHOT_OBJECT
  }, new TypeError('Stored assessment snapshot must be a JSON object'));
  return {};
};

export const assessmentSnapshotWrite = (
  db: AssessmentDatasetActionContext['db'],
  entryType: string,
  assessmentId: string,
  snapshot: D1Record,
  checksum: string,
  entryId = assessmentId
): CloudflareD1PreparedStatement => db.prepare(`
  INSERT INTO AssessmentStoreEntry (entry_type, assessment_id, entry_id, payload_json, source_checksum)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(entry_type, assessment_id, entry_id) DO UPDATE SET
    payload_json = excluded.payload_json, source_checksum = excluded.source_checksum
`).bind(entryType, assessmentId, entryId, JSON.stringify(snapshot), checksum);

export const assessmentValidationError = (message: string, errors?: unknown): WorkerD1Result => ({
  status: 400,
  data: { success: false, message, ...(errors === undefined ? {} : { errors }) }
});
