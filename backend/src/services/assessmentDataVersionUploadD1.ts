import {
  ASSESSMENT_DATA_VERSION_ALLOWED_EXTENSIONS,
  ASSESSMENT_DATA_VERSION_MAX_BYTES,
  uploadDataVersionSchema
} from '../constants/assessmentValidation';
import { ASSESSMENT_D1_MESSAGES } from '../constants/assessmentD1';
import { D1_TABLES } from '../constants/d1';
import { INGESTION_WORKBOOK_MESSAGES } from '../constants/ingestionWorkbook';
import type { AssessmentDatasetActionContext, AssessmentUploadPayload } from '../types/assessmentDataVersionD1';
import type { D1Record, WorkerD1Result } from '../types/d1';
import {
  ASSESSMENT_DATA_STATUS_RECEIVED,
  ASSESSMENT_SNAPSHOT_TYPE,
  ASSESSMENT_VERSION_SNAPSHOT_TYPE,
  assessmentSnapshotWrite,
  assessmentValidationError,
  queryFirst,
  readAssessmentSnapshot,
  runStatements
} from './assessmentDataVersionD1Helpers';
import type { AssessmentRow } from '../types/assessmentDataVersionD1';
import { importIngestionWorkbook } from './ingestionWorkbookImporter';
import { mapD1Assessment, mapD1DataVersion } from './assessmentD1Mappers';
import logger from '../utils/logger';
import { clearScopedModule2Cache } from './workerD1Module2Cache';

interface UploadFileDetails {
  bytes: Uint8Array;
  extension: string;
  checksum: string;
}

interface PreparedUpload {
  payload: AssessmentUploadPayload;
  assessment: AssessmentRow;
  file: UploadFileDetails;
  previousSnapshot: D1Record;
  previousDataStatus: string;
  versionNumber: number;
  dataVersionId: string;
  objectKey: string;
}

type PreparedResult = { ok: true; value: PreparedUpload } | { ok: false; result: WorkerD1Result };
type FileResult = { ok: true; value: UploadFileDetails } | { ok: false; result: WorkerD1Result };

const decodeBase64 = (value: string, expectedBytes: number): Uint8Array | null => {
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

const sha256Hex = async (bytes: Uint8Array): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
};

const contentTypeFor = (extension: string): string => {
  if (extension === '.csv') return 'text/csv';
  if (extension === '.xls') return 'application/vnd.ms-excel';
  return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
};

const safeFileName = (fileName: string): string => {
  const normalized = Array.from(fileName, (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || character === '/' || character === '\\' ? '_' : character;
  }).join('');
  return encodeURIComponent(normalized);
};

const parseUploadPayload = (context: AssessmentDatasetActionContext):
  | { ok: true; value: AssessmentUploadPayload }
  | { ok: false; result: WorkerD1Result } => {
  const parsed = uploadDataVersionSchema.safeParse(context.body);
  if (!parsed.success) {
    return { ok: false, result: assessmentValidationError('Assessment upload validation failed', parsed.error.issues) };
  }
  if (!parsed.data.fileBase64) {
    return { ok: false, result: assessmentValidationError('The upload is missing its workbook content. Select the file again and retry.') };
  }
  return { ok: true, value: parsed.data as AssessmentUploadPayload };
};

const validateUploadFile = async (payload: AssessmentUploadPayload): Promise<FileResult> => {
  if (payload.fileSize > ASSESSMENT_DATA_VERSION_MAX_BYTES) {
    return { ok: false, result: assessmentValidationError('The workbook exceeds the 100 MB upload limit. Split the file and retry.') };
  }
  const bytes = decodeBase64(payload.fileBase64, payload.fileSize);
  if (!bytes) {
    return { ok: false, result: assessmentValidationError('The workbook content is not valid Base64. Select the file again and retry.') };
  }
  if (bytes.byteLength !== payload.fileSize) {
    return { ok: false, result: assessmentValidationError('The uploaded byte count does not match the selected file size. Select the file again and retry.') };
  }
  const extension = payload.fileName.slice(payload.fileName.lastIndexOf('.')).toLowerCase();
  const allowedExtensions = ASSESSMENT_DATA_VERSION_ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExtensions.includes(extension)) {
    return { ok: false, result: assessmentValidationError(INGESTION_WORKBOOK_MESSAGES.unsupportedType) };
  }
  const checksum = await sha256Hex(bytes);
  const expectedChecksum = payload.expectedChecksum?.toLowerCase();
  if (checksum !== payload.checksum.toLowerCase() || (expectedChecksum && checksum !== expectedChecksum)) {
    return { ok: false, result: assessmentValidationError('The uploaded workbook checksum does not match its contents. Select the file again and retry.') };
  }
  return { ok: true, value: { bytes, extension, checksum } };
};

const prepareUpload = async (context: AssessmentDatasetActionContext,
  payload: AssessmentUploadPayload, file: UploadFileDetails): Promise<PreparedResult> => {
  const { db, assessmentId } = context;
  const tenantId = context.environment.REQUEST_TENANT_ID;
  const assessment = await queryFirst<AssessmentRow>(db,
    `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]);
  if (!assessment) {
    logger.warn('Assessment workbook upload rejected for an unavailable tenant assessment', {
      assessmentId, tenantId, requestId: context.requestId
    });
    return { ok: false, result: {
      status: 404, data: { success: false, message: ASSESSMENT_D1_MESSAGES.missingRecord(assessmentId) }
    } };
  }
  const previousSnapshot = await readAssessmentSnapshot(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId, assessmentId, {
    requestId: context.requestId, tenantId
  });
  const previousDataStatus = String(assessment.data_status || 'NOT_RECEIVED');
  const versionRow = await queryFirst<{ max_version: number | string | null }>(db,
    `SELECT COALESCE(MAX(version_number), 0) AS max_version FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ?`,
    [assessmentId]);
  const versionNumber = Number(versionRow?.max_version || 0) + 1;
  const dataVersionId = `DV-${globalThis.crypto.randomUUID()}`;
  const objectKey = `assessments/${encodeURIComponent(assessmentId)}/${dataVersionId}/${safeFileName(payload.fileName)}`;
  return {
    ok: true,
    value: { payload, assessment, file, previousSnapshot, previousDataStatus, versionNumber, dataVersionId, objectKey }
  };
};

const persistUpload = async (context: AssessmentDatasetActionContext,
  prepared: PreparedUpload): Promise<WorkerD1Result> => {
  const { db, environment, assessmentId } = context;
  const { payload, assessment, file, versionNumber, dataVersionId, objectKey } = prepared;
  const contentType = contentTypeFor(file.extension);
  const imported = await importIngestionWorkbook({
    db, bytes: file.bytes, fileName: payload.fileName, fileType: file.extension.slice(1), docId: dataVersionId,
    tenantId: assessment.tenant_id, assessmentId
  });
  const nextSnapshot = {
    ...prepared.previousSnapshot,
    assessmentId,
    currentDataVersionId: dataVersionId,
    activeDataVersionId: dataVersionId,
    dataStatus: ASSESSMENT_DATA_STATUS_RECEIVED,
    sourceRowCount: imported.importedCount
  };
  const statements = [
    db.prepare(`INSERT INTO ${D1_TABLES.dataVersions} (
      data_version_id, assessment_id, version_number, file_name, file_size, checksum, file_path,
      uploaded_by, record_count, notes, is_superseded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`).bind(
      dataVersionId, assessmentId, versionNumber, payload.fileName, file.bytes.byteLength, file.checksum,
      objectKey,
      context.uploadedBy || String(assessment.assessment_owner),
      imported.importedCount,
      payload.notes ?? null
    ),
    db.prepare(`INSERT OR REPLACE INTO ObjectMetadata (
      object_key, tenant_id, assessment_id, filename, content_type, size_bytes, sha256, bucket, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`).bind(
      objectKey, assessment.tenant_id, assessmentId, payload.fileName, contentType, file.bytes.byteLength,
      file.checksum, environment.R2_BUCKET || ''
    ),
    db.prepare(`UPDATE ${D1_TABLES.assessments}
      SET data_status = ?, data_received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE assessment_id = ? AND tenant_id = ?`).bind(ASSESSMENT_DATA_STATUS_RECEIVED, assessmentId, assessment.tenant_id),
    assessmentSnapshotWrite(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId, nextSnapshot, file.checksum),
    assessmentSnapshotWrite(db, ASSESSMENT_VERSION_SNAPSHOT_TYPE, assessmentId, {
      dataVersionId, assessmentId, versionNumber, fileName: payload.fileName, fileSize: file.bytes.byteLength,
      checksum: file.checksum, filePath: objectKey,
      uploadedBy: context.uploadedBy || String(assessment.assessment_owner),
      recordCount: imported.importedCount, isSuperseded: false
    }, file.checksum, dataVersionId),
    db.prepare(`UPDATE ${D1_TABLES.dataVersions} SET is_superseded = 1
      WHERE assessment_id = ? AND data_version_id != ?`).bind(assessmentId, dataVersionId)
  ];
  await runStatements(db, statements);
  return buildUploadResponse(context, prepared, nextSnapshot, imported);
};

const buildUploadResponse = async (context: AssessmentDatasetActionContext, prepared: PreparedUpload,
  nextSnapshot: D1Record, imported: Awaited<ReturnType<typeof importIngestionWorkbook>>): Promise<WorkerD1Result> => {
  const { db, assessmentId, requestId } = context;
  const { payload, assessment, file, versionNumber, dataVersionId, objectKey } = prepared;
  const updated = await queryFirst<AssessmentRow>(db,
    `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`,
    [assessmentId, assessment.tenant_id]);
  const responseDataVersion = await queryFirst<D1Record>(db,
    `SELECT * FROM ${D1_TABLES.dataVersions} WHERE data_version_id = ?`, [dataVersionId]);
  logger.info('Assessment workbook imported into D1', {
    assessmentId, tenantId: assessment.tenant_id, dataVersionId, importedCount: imported.importedCount,
    validationCount: imported.validationCount, requestId
  });
  return {
    status: 201,
    data: {
      success: true,
      assessment: updated ? mapD1Assessment(updated, nextSnapshot) : mapD1Assessment(assessment, nextSnapshot),
      dataVersion: responseDataVersion ? mapD1DataVersion(responseDataVersion) : {
        dataVersionId, assessmentId, versionNumber, fileName: payload.fileName,
        fileSize: file.bytes.byteLength, checksum: file.checksum, filePath: objectKey,
        recordCount: imported.importedCount
      },
      importedCount: imported.importedCount,
      validationCount: imported.validationCount,
      totalInrCrores: imported.totalInrCrores,
      detectedCurrencies: imported.detectedCurrencies
    }
  };
};

const cleanupFailedUpload = async (
  context: AssessmentDatasetActionContext,
  prepared: PreparedUpload,
  objectStored: boolean
): Promise<void> => {
  const { db, environment, assessmentId } = context;
  const { assessment, dataVersionId, objectKey, previousDataStatus, previousSnapshot } = prepared;
  try {
    await runStatements(db, [
      db.prepare('DELETE FROM ProcurementTransaction WHERE source_document_id = ? AND assessment_id = ? AND tenant_id = ?')
        .bind(dataVersionId, assessmentId, assessment.tenant_id),
      db.prepare('DELETE FROM ValidationPreCheckRecord WHERE record_id LIKE ? AND tenant_id = ?')
        .bind(`REC-${dataVersionId}-ROW-%`, assessment.tenant_id),
      db.prepare(`DELETE FROM ${D1_TABLES.dataVersions} WHERE data_version_id = ? AND assessment_id = ?`)
        .bind(dataVersionId, assessmentId),
      db.prepare('DELETE FROM ObjectMetadata WHERE object_key = ? AND assessment_id = ? AND tenant_id = ?')
        .bind(objectKey, assessmentId, assessment.tenant_id),
      db.prepare('DELETE FROM AssessmentStoreEntry WHERE entry_type = ? AND assessment_id = ? AND entry_id = ?')
        .bind(ASSESSMENT_VERSION_SNAPSHOT_TYPE, assessmentId, dataVersionId),
      db.prepare(`UPDATE ${D1_TABLES.assessments} SET data_status = ? WHERE assessment_id = ? AND tenant_id = ?`)
        .bind(previousDataStatus, assessmentId, assessment.tenant_id),
      Object.keys(previousSnapshot).length > 0
        ? assessmentSnapshotWrite(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId, previousSnapshot, 'rollback')
        : db.prepare('DELETE FROM AssessmentStoreEntry WHERE entry_type = ? AND assessment_id = ? AND entry_id = ?')
          .bind(ASSESSMENT_SNAPSHOT_TYPE, assessmentId, assessmentId)
    ]);
  } catch (error) {
    logger.error('Failed to roll back an assessment data version', {
      assessmentId, tenantId: assessment.tenant_id, dataVersionId, requestId: context.requestId
    }, error);
  }
  clearScopedModule2Cache(db, assessment.tenant_id, assessmentId);
  if (!objectStored) return;
  try {
    await environment.OBJECTS?.delete(objectKey);
  } catch (error) {
    logger.error('Failed to remove assessment upload object after D1 rollback', {
      assessmentId, tenantId: assessment.tenant_id, dataVersionId, requestId: context.requestId
    }, error);
  }
};

export const uploadAssessmentDataVersion = async (
  context: AssessmentDatasetActionContext
): Promise<WorkerD1Result> => {
  const tenantId = context.environment.REQUEST_TENANT_ID;
  if (!tenantId) {
    logger.warn('Assessment workbook upload rejected without tenant scope', {
      assessmentId: context.assessmentId, requestId: context.requestId
    });
    return {
      status: 403,
      data: { success: false, message: ASSESSMENT_D1_MESSAGES.tenantScopeRequired }
    };
  }
  const parsed = parseUploadPayload(context);
  if (!parsed.ok) return parsed.result;
  if (!context.environment.OBJECTS) {
    return {
      status: 503,
      data: { success: false, message: 'The R2 upload binding is unavailable. Configure the OBJECTS binding and retry.' }
    };
  }
  const file = await validateUploadFile(parsed.value);
  if (!file.ok) return file.result;
  const prepared = await prepareUpload(context, parsed.value, file.value);
  if (!prepared.ok) return prepared.result;
  let objectStored = false;
  try {
    await context.environment.OBJECTS.put(prepared.value.objectKey, prepared.value.file.bytes, {
      httpMetadata: { contentType: contentTypeFor(prepared.value.file.extension) }
    });
    objectStored = true;
    return await persistUpload(context, prepared.value);
  } catch (error) {
    await cleanupFailedUpload(context, prepared.value, objectStored);
    logger.error('Assessment workbook upload failed', {
      assessmentId: context.assessmentId,
      tenantId,
      dataVersionId: prepared.value.dataVersionId,
      requestId: context.requestId
    }, error);
    if (error instanceof Error && /workbook|Only XLSX|row import limit/u.test(error.message)) {
      return assessmentValidationError(error.message);
    }
    throw error;
  }
};
