import type { CloudflareD1PreparedStatement } from '../types/cloudflare';
import type { D1AtomicWriteContext } from '../types/d1AtomicWrite';
import type { D1Record, WorkerD1Result } from '../types/d1';
import type { AssessmentDatasetActionContext } from '../types/assessmentDataVersionD1';
import type { AssessmentSnapshotReadContext } from '../types/assessmentDataVersionD1';
import { ASSESSMENT_D1_FALLBACKS, ASSESSMENT_D1_LOG_MESSAGES } from '../constants/assessmentD1';
import logger from '../utils/logger';
import { runD1Statements } from './workerD1Query';

export const decodeAssessmentUploadBase64 = (value: string, expectedBytes: number): Uint8Array | null => {
  const maximumEncodedLength = Math.ceil(expectedBytes / 3) * 4;
  const validCharacters = /^[A-Za-z0-9+/]*={0,2}$/u.test(value);
  if (!validCharacters || value.length % 4 === 1 || value.length > maximumEncodedLength) return null;
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

export const assessmentUploadContentType = (extension: string): string => {
  if (extension === '.csv') return 'text/csv';
  if (extension === '.xls') return 'application/vnd.ms-excel';
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
};

export const safeAssessmentUploadFileName = (fileName: string): string => {
  const normalized = Array.from(fileName, (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || character === '/' || character === '\\' ? '_' : character;
  }).join('');
  return encodeURIComponent(normalized);
};


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
  statements: CloudflareD1PreparedStatement[],
  context?: D1AtomicWriteContext
): Promise<void> => runD1Statements(db, statements, context);

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
