import {
  ASSESSMENT_STATUSES, AUDIT_ACTIONS, DELIVERY_PACKAGE_ITEMS_SPEC, SYSTEM_BUILD_IDENTITY
} from '../constants/assessment';
import {
  ASSESSMENT_D1_MESSAGES as LIFECYCLE_MESSAGES, ASSESSMENT_DELIVERY_PACKAGE_SNAPSHOT_TYPE
} from '../constants/assessmentD1';
import { AES_GCM_CONFIG } from '../constants/crypto';
import { D1_TABLES } from '../constants/d1';
import type { AssessmentAnalysisRun, AssessmentRecord, DeliveryPackageItem, DeliveryPackageResult } from '../types/assessment';
import type { AssessmentLifecycleActionContext, AssessmentRow } from '../types/assessmentDataVersionD1';
import type {
  AssessmentArtifactEncryption, AssessmentStoredDeliveryArtifact
} from '../types/assessmentDeliveryArtifacts';
import type { D1Record, WorkerD1Result } from '../types/d1';
import type { CloudflareR2Bucket } from '../types/cloudflare';
import {
  buildAssessmentArtifactStorageKey, decryptAssessmentArtifact, encryptAssessmentArtifact,
  renderAssessmentDeliveryArtifact
} from './assessmentDeliveryArtifacts';
import {
  assessmentSnapshotWrite, queryFirst, readAssessmentSnapshot, runStatements
} from './assessmentDataVersionD1Helpers';
import { loadAssessmentSnapshots, mapD1AnalysisRun, mapD1Assessment } from './assessmentD1Mappers';
import logger from '../utils/logger';

interface LoadedDeliveryContext {
  assessment: AssessmentRecord;
  run: AssessmentAnalysisRun;
}

type DeliveryContextResult = { ok: true; value: LoadedDeliveryContext } | { ok: false; result: WorkerD1Result };

const resultError = (status: number, message: string): WorkerD1Result => ({
  status, data: { success: false, message }
});

const loadDeliveryContext = async (context: AssessmentLifecycleActionContext): Promise<DeliveryContextResult> => {
  const row = await queryFirst<AssessmentRow>(context.db,
    `SELECT * FROM ${D1_TABLES.assessments} WHERE assessment_id = ?`, [context.assessmentId]);
  if (!row) return { ok: false, result: resultError(404, LIFECYCLE_MESSAGES.missingRecord(context.assessmentId)) };
  const snapshot = await readAssessmentSnapshot(context.db, 'assessment', context.assessmentId,
    context.assessmentId, { requestId: context.requestId, tenantId: context.environment.REQUEST_TENANT_ID });
  const assessment = mapD1Assessment(row, snapshot);
  const allowedStatuses = [ASSESSMENT_STATUSES.APPROVED, ASSESSMENT_STATUSES.DELIVERED] as string[];
  if (!allowedStatuses.includes(assessment.status)) {
    return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.deliveryStatus(assessment.status)) };
  }
  if (!assessment.activeAnalysisRunId) {
    return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.activeRunMissing) };
  }
  const runId = assessment.activeAnalysisRunId;
  const runRow = await queryFirst<D1Record>(context.db,
    `SELECT * FROM ${D1_TABLES.analysisRuns} WHERE assessment_id = ? AND analysis_run_id = ?`,
    [context.assessmentId, runId]);
  if (!runRow) return { ok: false, result: resultError(404, LIFECYCLE_MESSAGES.runNotFound(runId)) };
  const runSnapshots = await loadAssessmentSnapshots(context.db, 'run', context.assessmentId, {
    requestId: context.requestId, tenantId: context.environment.REQUEST_TENANT_ID,
    assessmentId: context.assessmentId
  });
  const run = mapD1AnalysisRun(runRow, runSnapshots.get(runId));
  if (!run.isApproved) return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.unapprovedRun) };
  if (run.isSuperseded) return { ok: false, result: resultError(400, LIFECYCLE_MESSAGES.supersededRun) };
  return { ok: true, value: { assessment, run } };
};

const cleanStoredArtifacts = async (
  bucket: CloudflareR2Bucket, keys: string[], context: AssessmentLifecycleActionContext
): Promise<void> => {
  const results = await Promise.allSettled(keys.map((key) => bucket.delete(key)));
  if (results.some((result) => result.status === 'rejected')) {
    logger.error('Assessment artifact cleanup failed after package generation error', {
      assessmentId: context.assessmentId, storedArtifactCount: keys.length, requestId: context.requestId
    });
  }
};

const renderAndStoreArtifacts = async (
  context: AssessmentLifecycleActionContext,
  bucket: CloudflareR2Bucket,
  assessment: AssessmentRecord,
  run: AssessmentAnalysisRun,
  generatedAt: string,
  sourceRows: D1Record[],
  validationRows: D1Record[],
  reviewGates: D1Record[]
): Promise<{ items: DeliveryPackageItem[]; storedKeys: string[] } | { error: WorkerD1Result }> => {
  const items: DeliveryPackageItem[] = [];
  const storedKeys: string[] = [];
  const packageId = globalThis.crypto.randomUUID();
  try {
    for (const spec of DELIVERY_PACKAGE_ITEMS_SPEC) {
      const plannedItem: DeliveryPackageItem = {
        ...spec,
        artifactStatus: 'NOT_GENERATED',
        analysisRunId: run.analysisRunId,
        dataVersionId: run.dataVersionId,
        generatedAt,
        fileName: `${context.assessmentId}${spec.fileSuffix}`
      };
      const rendered = await renderAssessmentDeliveryArtifact({
        item: plannedItem, assessment: assessment as unknown as D1Record, run, sourceRows, validationRows, reviewGates
      });
      const encrypted = await encryptAssessmentArtifact(rendered.bytes, context.environment.APP_ENCRYPTION_KEY || '');
      const storageKey = buildAssessmentArtifactStorageKey(
        context.assessmentId, run.analysisRunId, plannedItem, packageId
      );
      await bucket.put(storageKey, encrypted.bytes, { httpMetadata: { contentType: 'application/octet-stream' } });
      storedKeys.push(storageKey);
      items.push({
        ...plannedItem, artifactStatus: 'GENERATED', storageKey, contentType: rendered.contentType,
        encryptionIv: encrypted.iv
      });
    }
    return { items, storedKeys };
  } catch (error) {
    await cleanStoredArtifacts(bucket, storedKeys, context);
    logger.error('Assessment delivery artifact generation failed', {
      assessmentId: context.assessmentId, analysisRunId: run.analysisRunId, requestId: context.requestId
    }, error);
    return { error: resultError(503, error instanceof Error ? error.message : LIFECYCLE_MESSAGES.artifactUnavailable) };
  }
};

const buildDeliveryManifest = async (
  context: AssessmentLifecycleActionContext,
  value: LoadedDeliveryContext,
  version: D1Record,
  generatedAt: string,
  items: DeliveryPackageItem[]
): Promise<DeliveryPackageResult> => {
  const { assessment, run } = value;
  const fxMaster = await queryFirst<D1Record>(context.db, `
    SELECT sha256_checksum FROM ${D1_TABLES.fxVersions}
    WHERE validation_status = 'VALIDATED' ORDER BY created_date DESC LIMIT 1
  `, []);
  const checksums: Record<string, string> = { sourceDataset: String(version.checksum) };
  if (typeof fxMaster?.sha256_checksum === 'string' && fxMaster.sha256_checksum.length > 0) {
    checksums.fxMaster = fxMaster.sha256_checksum;
  }
  return {
    assessmentId: context.assessmentId,
    analysisRunId: run.analysisRunId,
    dataVersionId: run.dataVersionId,
    customerName: assessment.customerName,
    assessmentPeriod: [assessment.assessmentPeriodStart, assessment.assessmentPeriodEnd].filter(Boolean).join(' – '),
    packageTitle: `Delivery Package — ${assessment.customerName} (${context.assessmentId})`,
    generatedAt,
    approvedBy: assessment.approvedBy || context.actorEmail,
    approvedAt: assessment.approvedAt || generatedAt,
    releaseVersion: SYSTEM_BUILD_IDENTITY.APP_VERSION,
    checksums,
    items
  };
};

export const generateAssessmentDeliveryPackage = async (
  context: AssessmentLifecycleActionContext
): Promise<WorkerD1Result> => {
  if (!['INTERNAL_ADMIN', 'ANALYST'].includes(context.actorRole)) {
    return resultError(403, LIFECYCLE_MESSAGES.permissionDenied);
  }
  const loaded = await loadDeliveryContext(context);
  if (!loaded.ok) return loaded.result;
  const bucket = context.environment.OBJECTS;
  if (!bucket) return resultError(503, LIFECYCLE_MESSAGES.artifactR2Unavailable);
  const { assessment, run } = loaded.value;
  const version = await queryFirst<D1Record>(context.db,
    `SELECT * FROM ${D1_TABLES.dataVersions} WHERE assessment_id = ? AND data_version_id = ?`,
    [context.assessmentId, run.dataVersionId]);
  if (!version) return resultError(404, LIFECYCLE_MESSAGES.dataVersionMissing(run.dataVersionId));
  const [transactions, validation, gateRows] = await Promise.all([
    context.db.prepare(`SELECT * FROM ${D1_TABLES.transactions} WHERE assessment_id = ? AND source_document_id = ? ORDER BY source_row_number ASC`)
      .bind(context.assessmentId, run.dataVersionId).all<D1Record>(),
    context.db.prepare(`SELECT * FROM ${D1_TABLES.validation} WHERE record_id LIKE ? ORDER BY record_id`)
      .bind(`REC-${run.dataVersionId}-ROW-%`).all<D1Record>(),
    context.db.prepare(`SELECT gate_key, status, evidence_reference, review_note, reviewed_by, reviewed_at FROM ${D1_TABLES.assessmentReviewGates} WHERE assessment_id = ? ORDER BY gate_key`)
      .bind(context.assessmentId).all<D1Record>()
  ]);
  const generatedAt = new Date().toISOString();
  const stored = await renderAndStoreArtifacts(
    context, bucket, assessment, run, generatedAt, transactions.results || [],
    validation.results || [], gateRows.results || []
  );
  if ('error' in stored) return stored.error;
  try {
    const deliveryPackage = await buildDeliveryManifest(context, loaded.value, version, generatedAt, stored.items);
    await runStatements(context.db, [
      assessmentSnapshotWrite(context.db, ASSESSMENT_DELIVERY_PACKAGE_SNAPSHOT_TYPE, context.assessmentId,
        deliveryPackage as unknown as D1Record, String(version.checksum), run.analysisRunId),
      context.db.prepare(`
        INSERT INTO ${D1_TABLES.auditLogs} (id, assessment_id, actor_email, actor_role, action, details_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(`AUD-${globalThis.crypto.randomUUID()}`, context.assessmentId, context.actorEmail, context.actorRole,
        AUDIT_ACTIONS.DELIVERY_PACKAGE_GENERATED,
        JSON.stringify({ itemsCount: stored.items.length, analysisRunId: run.analysisRunId }))
    ]);
    logger.info('Generated encrypted assessment delivery artifacts from D1', {
      assessmentId: context.assessmentId, analysisRunId: run.analysisRunId,
      itemsCount: stored.items.length, requestId: context.requestId
    });
    return { data: deliveryPackage };
  } catch (error) {
    await cleanStoredArtifacts(bucket, stored.storedKeys, context);
    logger.error('Assessment delivery manifest could not be persisted in D1', {
      assessmentId: context.assessmentId, analysisRunId: run.analysisRunId, requestId: context.requestId
    }, error);
    return resultError(503, LIFECYCLE_MESSAGES.artifactUnavailable);
  }
};

export const downloadAssessmentDeliveryArtifact = async (
  context: AssessmentLifecycleActionContext,
  artifactId: string
): Promise<WorkerD1Result> => {
  const loaded = await loadDeliveryContext(context);
  if (!loaded.ok) return loaded.result;
  const { run } = loaded.value;
  const manifest = await readAssessmentSnapshot(
    context.db, ASSESSMENT_DELIVERY_PACKAGE_SNAPSHOT_TYPE, context.assessmentId, run.analysisRunId,
    { requestId: context.requestId, tenantId: context.environment.REQUEST_TENANT_ID }
  );
  const items = Array.isArray(manifest.items) ? manifest.items as DeliveryPackageItem[] : [];
  const item = items.find((candidate) => candidate.id === artifactId && candidate.analysisRunId === run.analysisRunId);
  if (!item?.storageKey || !item.encryptionIv || !item.contentType || item.artifactStatus !== 'GENERATED') {
    return resultError(404, LIFECYCLE_MESSAGES.artifactNotFound);
  }
  const bucket = context.environment.OBJECTS;
  if (!bucket) return resultError(503, LIFECYCLE_MESSAGES.artifactR2Unavailable);
  const object = await bucket.get(item.storageKey);
  if (!object) return resultError(404, LIFECYCLE_MESSAGES.artifactNotFound);
  return makeDownloadResult(context, item as AssessmentStoredDeliveryArtifact, object.body);
};

const makeDownloadResult = async (
  context: AssessmentLifecycleActionContext,
  item: AssessmentStoredDeliveryArtifact,
  body: ReadableStream
): Promise<WorkerD1Result> => {
  try {
    const ciphertext = new Uint8Array(await new Response(body).arrayBuffer());
    const encryption: AssessmentArtifactEncryption = {
      algorithm: AES_GCM_CONFIG.IDENTIFIER, iv: item.encryptionIv, bytes: ciphertext
    };
    const bytes = await decryptAssessmentArtifact(ciphertext, encryption, context.environment.APP_ENCRYPTION_KEY || '');
    const filename = item.fileName.replace(/["\r\n]/gu, '_');
    const headers = new Headers({
      'Content-Type': item.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store, max-age=0'
    });
    if (context.requestId) headers.set('x-request-id', context.requestId);
    return { data: null, response: new Response(bytes, { status: 200, headers }) };
  } catch (error) {
    const status = error instanceof Error && error.message.includes('APP_ENCRYPTION_KEY') ? 503 : 500;
    logger.error('Assessment artifact download could not verify or decrypt the stored file', {
      assessmentId: context.assessmentId, artifactId: item.id, requestId: context.requestId, statusCode: status
    }, error);
    return resultError(status, error instanceof Error ? error.message : LIFECYCLE_MESSAGES.artifactUnavailable);
  }
};
