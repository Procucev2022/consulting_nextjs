import { ASSESSMENT_DATA_VERSION_ROLLBACK_SQL } from '../constants/assessmentD1';
import { D1_TABLES } from '../constants/d1';
import type {
  AssessmentDatasetActionContext,
  PreparedAssessmentDataVersionUpload
} from '../types/assessmentDataVersionD1';
import {
  ASSESSMENT_SNAPSHOT_TYPE,
  ASSESSMENT_VERSION_SNAPSHOT_TYPE,
  runStatements
} from './assessmentDataVersionD1Helpers';
import { clearScopedModule2Cache } from './workerD1Module2Cache';
import logger from '../utils/logger';

export const cleanupFailedAssessmentDataVersionUpload = async (
  context: AssessmentDatasetActionContext,
  prepared: PreparedAssessmentDataVersionUpload,
  objectStored: boolean
): Promise<void> => {
  const { db, environment, assessmentId } = context;
  const { assessment, dataVersionId, objectKey, previousDataStatus, previousSnapshot } = prepared;
  try {
    await runStatements(db, [
      db.prepare(`DELETE FROM ${D1_TABLES.transactions} WHERE source_document_id = ? AND assessment_id = ? AND tenant_id = ?`)
        .bind(dataVersionId, assessmentId, assessment.tenant_id),
      db.prepare('DELETE FROM ValidationPreCheckRecord WHERE record_id LIKE ? AND tenant_id = ?')
        .bind(`REC-${dataVersionId}-ROW-%`, assessment.tenant_id),
      db.prepare(`DELETE FROM ${D1_TABLES.dataVersions} WHERE data_version_id = ? AND assessment_id = ?`)
        .bind(dataVersionId, assessmentId),
      db.prepare('DELETE FROM ObjectMetadata WHERE object_key = ? AND assessment_id = ? AND tenant_id = ?')
        .bind(objectKey, assessmentId, assessment.tenant_id),
      db.prepare('DELETE FROM AssessmentStoreEntry WHERE entry_type = ? AND assessment_id = ? AND entry_id = ?')
        .bind(ASSESSMENT_VERSION_SNAPSHOT_TYPE, assessmentId, dataVersionId),
      db.prepare(ASSESSMENT_DATA_VERSION_ROLLBACK_SQL.restoreStatus).bind(
        previousDataStatus, assessmentId, assessment.tenant_id, ASSESSMENT_SNAPSHOT_TYPE,
        assessmentId, assessmentId, dataVersionId
      ),
      Object.keys(previousSnapshot).length > 0
        ? db.prepare(ASSESSMENT_DATA_VERSION_ROLLBACK_SQL.restoreSnapshot).bind(
          JSON.stringify(previousSnapshot), 'rollback', ASSESSMENT_SNAPSHOT_TYPE,
          assessmentId, assessmentId, dataVersionId
        )
        : db.prepare(ASSESSMENT_DATA_VERSION_ROLLBACK_SQL.deleteSnapshot).bind(
          ASSESSMENT_SNAPSHOT_TYPE, assessmentId, assessmentId, dataVersionId
        )
    ], {
      operation: 'assessment.data_version.upload.rollback',
      tenantId: assessment.tenant_id,
      assessmentId,
      documentId: dataVersionId,
      requestId: context.requestId
    });
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
