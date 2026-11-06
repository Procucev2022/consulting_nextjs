import { validateAssessmentDatasetSchema } from '../constants/assessmentValidation';
import { ASSESSMENT_D1_MESSAGES } from '../constants/assessmentD1';
import { D1_TABLES } from '../constants/d1';
import type { AssessmentDatasetActionContext, AssessmentValidationSummary } from '../types/assessmentDataVersionD1';
import type { D1Record, WorkerD1Result } from '../types/d1';
import {
  ASSESSMENT_DATA_STATUS_CLARIFICATION,
  ASSESSMENT_DATA_STATUS_VALIDATED,
  ASSESSMENT_SNAPSHOT_TYPE,
  assessmentSnapshotWrite,
  assessmentValidationError,
  queryFirst,
  readAssessmentSnapshot,
  runStatements
} from './assessmentDataVersionD1Helpers';
import type { AssessmentRow } from '../types/assessmentDataVersionD1';
import { mapD1Assessment, mapD1DataVersion } from './assessmentD1Mappers';
import logger from '../utils/logger';

export { uploadAssessmentDataVersion } from './assessmentDataVersionUploadD1';

const buildValidationSummary = (rows: D1Record[]): AssessmentValidationSummary => {
  const sourceRowCount = rows.length;
  const excludedRowCount = rows.filter((row) =>
    `${String(row.issue_flag)} ${String(row.action_status)}`.toLowerCase().includes('exclud')).length;
  const validRowCount = rows.filter((row) =>
    Number(row.resolved) === 1 &&
    !`${String(row.issue_flag)} ${String(row.action_status)}`.toLowerCase().includes('exclud')).length;
  const anomalyRowCount = Math.max(0, sourceRowCount - validRowCount - excludedRowCount);
  return {
    sourceRowCount,
    validRowCount,
    excludedRowCount,
    anomalyRowCount,
    cleanSpendYieldPct: sourceRowCount ? Number((validRowCount / sourceRowCount * 100).toFixed(2)) : 0
  };
};

export const validateAssessmentDataVersion = async (
  context: AssessmentDatasetActionContext
): Promise<WorkerD1Result> => {
  const parsed = validateAssessmentDatasetSchema.safeParse(context.body ?? {});
  if (!parsed.success) {
    return assessmentValidationError('Assessment dataset validation request is invalid', parsed.error.issues);
  }
  const { db, assessmentId } = context;
  const tenantId = context.environment.REQUEST_TENANT_ID;
  if (!tenantId) {
    logger.warn('Assessment dataset validation rejected without tenant scope', {
      assessmentId, requestId: context.requestId
    });
    return {
      status: 403,
      data: { success: false, message: ASSESSMENT_D1_MESSAGES.tenantScopeRequired }
    };
  }
  const assessment = await queryFirst<AssessmentRow>(db,
    `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ? AND tenant_id = ?`, [assessmentId, tenantId]);
  if (!assessment) {
    logger.warn('Assessment dataset validation rejected for an unavailable tenant assessment', {
      assessmentId, tenantId, requestId: context.requestId
    });
    return {
      status: 404,
      data: { success: false, message: ASSESSMENT_D1_MESSAGES.missingRecord(assessmentId) }
    };
  }

  const dataVersion = parsed.data.dataVersionId
    ? await queryFirst<D1Record>(db,
      `SELECT * FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ? AND data_version_id = ?`,
      [assessmentId, parsed.data.dataVersionId])
    : await queryFirst<D1Record>(db,
      `SELECT * FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ? AND is_superseded = 0 ORDER BY version_number DESC LIMIT 1`,
      [assessmentId]);
  if (!dataVersion) return {
    status: 404,
    data: { success: false, message: `No uploaded data version was found for assessment ${assessmentId}. Upload a workbook and retry.` }
  };

  const dataVersionId = String(dataVersion.data_version_id);
  const records = await db.prepare(`SELECT issue_flag, action_status, resolved FROM ${D1_TABLES.validation}
    WHERE record_id LIKE ? AND tenant_id = ? ORDER BY record_id`)
    .bind(`REC-${dataVersionId}-ROW-%`, assessment.tenant_id).all<D1Record>();
  const validationSummary = buildValidationSummary(records.results);
  const nextDataStatus = validationSummary.sourceRowCount
    ? ASSESSMENT_DATA_STATUS_VALIDATED : ASSESSMENT_DATA_STATUS_CLARIFICATION;
  const priorSnapshot = await readAssessmentSnapshot(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId, assessmentId, {
    requestId: context.requestId, tenantId
  });
  const nextSnapshot = {
    ...priorSnapshot,
    assessmentId,
    currentDataVersionId: dataVersionId,
    activeDataVersionId: dataVersionId,
    dataStatus: nextDataStatus,
    sourceRowCount: validationSummary.sourceRowCount,
    validRowCount: validationSummary.validRowCount,
    excludedRowCount: validationSummary.excludedRowCount
  };
  await runStatements(db, [
    db.prepare(`UPDATE ${D1_TABLES.assessments}
      SET data_status = ?, updated_at = CURRENT_TIMESTAMP WHERE assessment_id = ? AND tenant_id = ?`)
      .bind(nextDataStatus, assessmentId, assessment.tenant_id),
    assessmentSnapshotWrite(db, ASSESSMENT_SNAPSHOT_TYPE, assessmentId, nextSnapshot, String(dataVersion.checksum || ''))
  ]);
  logger.info('Assessment dataset validated from D1 records', {
    assessmentId, tenantId: assessment.tenant_id, dataVersionId, ...validationSummary, requestId: context.requestId
  });
  return {
    data: {
      success: true,
      assessment: mapD1Assessment({ ...assessment, data_status: nextDataStatus }, nextSnapshot),
      dataVersion: mapD1DataVersion(dataVersion),
      validationSummary
    }
  };
};
