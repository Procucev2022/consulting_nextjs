/** D1-backed PCBI resolution, corrected dataset uploads, and source dataset downloads. */
import type { DatasetDownloadRow, OrchestrationDatabase, OrchestrationHandler } from './types/orchestrationD1';
import type { CloudflareR2Object } from './types/cloudflare';
import { ORCHESTRATION_EVENT_TYPES, ORCHESTRATION_ENTITY_TYPES } from './constants/orchestration';
import { D1_TABLES } from './constants/d1';
import { ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES } from './constants/assessmentValidation';
import { pcbiGapResolutionSchema, uploadCorrectedDatasetSchema } from './constants/orchestrationValidation';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { uploadAssessmentDataVersion } from './services/assessmentDataVersionD1';
import { runAssessmentAnalysisFromD1 } from './services/assessmentAnalysisD1';
import {
  buildAuditEvent,
  findActivePcbiSeries,
  findJobRow,
  insertAuditStatement,
  listPcbiGapRows,
  listProcurementStats,
  listVersionRows,
  requireAtomicD1Batch,
  runAtomically,
  upsertPcbiGapResolutionStatement
} from './workerD1OrchestrationStore';
import { buildStatsByDocument, mapDatasetVersions, mapPcbiGap } from './workerD1OrchestrationMapper';
import { loadAccessibleJob } from './workerD1OrchestrationAuth';
import { jsonResponse, withCors } from './workerHttp';
import { conflictError, notFoundError, parseWithSchema, readJsonBody, serviceUnavailableError } from './workerD1OrchestrationHttp';
import logger from './utils/logger';

export const resolvePcbiGap: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(pcbiGapResolutionSchema, await readJsonBody(context.request));
  const job = await loadAccessibleJob(context, context.params.jobId);
  if (job.current_version_id === null) {
    throw conflictError(ORCHESTRATION_MESSAGES.readinessPcbiEvidenceUnavailable);
  }
  const rows = await listPcbiGapRows(context.database, job.assessment_id, job.current_version_id, job.tenant_id);
  const gaps = await Promise.all(rows.map((row) => mapPcbiGap(row, job.customer_id)));
  const gapIndex = gaps.findIndex((gap) => gap.gapId === context.params.gapId);
  const source = rows[gapIndex];
  if (!source) throw notFoundError(ORCHESTRATION_MESSAGES.pcbiGapNotFound(context.params.gapId));

  let targetPcbiSeries: string | null = null;
  if (body.action === 'MAP_EXISTING' || body.action === 'ADD_MAP_PCBI') {
    const series = body.targetPcbiSeries ? await findActivePcbiSeries(context.database, body.targetPcbiSeries) : null;
    if (!series) throw notFoundError(ORCHESTRATION_MESSAGES.pcbiSeriesNotFound(body.targetPcbiSeries ?? ''));
    targetPcbiSeries = series.pcbi_id;
  }
  const exclusionReason = body.action === 'MARK_NOT_BENCHMARKABLE'
    ? 'NOT_BENCHMARKABLE'
    : body.action === 'MARK_SERVICE' ? 'SERVICE' : body.exclusionReason ?? null;
  const exclusionNotes = body.exclusionNotes ?? null;
  const resolvedAt = context.runtime.now();
  await runAtomically(context.database, [
    upsertPcbiGapResolutionStatement(context.database, [
      job.assessment_id,
      job.current_version_id,
      source.category_key,
      body.action,
      targetPcbiSeries,
      exclusionReason,
      exclusionNotes,
      body.researchNotes ?? null,
      context.actor.userName,
      resolvedAt
    ]),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.PCBI_GAP_RESOLVED,
      entityType: ORCHESTRATION_ENTITY_TYPES.PCBI_GAP_RESOLUTION,
      entityId: context.params.gapId,
      previousState: source.action ?? 'PENDING',
      newState: body.action,
      metadata: {
        category: source.category_key,
        targetPcbiSeries,
        exclusionReason,
        exclusionNotes,
        researchNotes: body.researchNotes ?? null
      }
    }))
  ], {
    requestId: context.requestId,
    tenantId: job.tenant_id,
    assessmentId: job.assessment_id,
    action: context.url.pathname
  });
  const updatedRows = await listPcbiGapRows(context.database, job.assessment_id, job.current_version_id, job.tenant_id);
  const updatedSource = updatedRows.find((row) => row.category_key === source.category_key);
  if (!updatedSource) throw serviceUnavailableError(ORCHESTRATION_MESSAGES.pcbiGapNotFound(context.params.gapId));
  const gap = await mapPcbiGap(updatedSource, job.customer_id);
  logger.info('PCBI category resolution saved', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    dataVersionId: job.current_version_id,
    gapId: context.params.gapId,
    action: body.action,
    actorId: context.actor.userId
  });
  return jsonResponse({ success: true, gap, message: ORCHESTRATION_MESSAGES.pcbiGapResolved }, 200, context.request);
};

export const uploadCorrectedDataset: OrchestrationHandler = async (context) => {
  const body = parseWithSchema(
    uploadCorrectedDatasetSchema,
    await readJsonBody(context.request, ASSESSMENT_DATA_VERSION_JSON_MAX_BYTES)
  );
  const job = await loadAccessibleJob(context, context.params.jobId);
  if (!context.objects) throw serviceUnavailableError(ORCHESTRATION_MESSAGES.datasetStorageNotConfigured);
  requireAtomicD1Batch(context.database, {
    requestId: context.requestId,
    tenantId: job.tenant_id,
    assessmentId: job.assessment_id,
    action: context.url.pathname
  }, 2);

  const upload = await uploadAssessmentDataVersion({
    db: context.database,
    environment: {
      DB: context.database, OBJECTS: context.objects, R2_BUCKET: context.bucketName,
      REQUEST_TENANT_ID: job.tenant_id
    },
    assessmentId: job.assessment_id,
    body: {
      fileName: body.fileName,
      fileSize: body.fileSize,
      checksum: body.checksum,
      expectedChecksum: body.expectedChecksum,
      fileBase64: body.fileBase64,
      notes: body.notes
    },
    requestId: context.requestId,
    uploadedBy: context.actor.userName
  });
  if (upload.status !== undefined && upload.status >= 400) {
    return jsonResponse(upload.data as Record<string, unknown>, upload.status, context.request);
  }

  const uploadData = upload.data as Record<string, unknown>;
  const dataVersion = uploadData.dataVersion as Record<string, unknown> | undefined;
  const dataVersionId = typeof dataVersion?.dataVersionId === 'string' ? dataVersion.dataVersionId : '';
  if (!dataVersionId) {
    logger.error('Corrected dataset upload returned no data version ID', {
      requestId: context.requestId,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId
    });
    throw serviceUnavailableError(ORCHESTRATION_MESSAGES.correctedDatasetVersionMissing);
  }

  const timestamp = context.runtime.now();
  await runAtomically(context.database, [
    context.database.prepare(`INSERT INTO ${D1_TABLES.datasetCorrections} (
      data_version_id, assessment_id, parent_version_id, correction_reason, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(dataVersionId, job.assessment_id, job.current_version_id, body.reason, context.actor.userName, timestamp),
    insertAuditStatement(context.database, buildAuditEvent(context.runtime, {
      tenantId: job.tenant_id,
      assessmentId: job.assessment_id,
      actorId: context.actor.userId,
      actorRole: 'ADMIN',
      eventType: ORCHESTRATION_EVENT_TYPES.DATASET_CORRECTED,
      entityType: ORCHESTRATION_ENTITY_TYPES.DATASET_VERSION,
      entityId: dataVersionId,
      previousState: job.current_version_id,
      newState: dataVersionId,
      metadata: { fileName: body.fileName, checksum: body.checksum, reason: body.reason, notes: body.notes ?? null }
    }))
  ], {
    requestId: context.requestId,
    tenantId: job.tenant_id,
    assessmentId: job.assessment_id,
    action: context.url.pathname
  });

  let reanalysisStatus: 'COMPLETED' | 'PENDING' | 'FAILED' = 'COMPLETED';
  let reanalysisMessage = '';
  try {
    const analysis = await runAssessmentAnalysisFromD1({
      db: context.database,
      environment: {
        DB: context.database, OBJECTS: context.objects, R2_BUCKET: context.bucketName,
        REQUEST_TENANT_ID: job.tenant_id
      },
      assessmentId: job.assessment_id,
      body: { dataVersionId },
      requestId: context.requestId,
      uploadedBy: context.actor.userName
    }, 'module1');
    if (analysis.status !== undefined && analysis.status >= 400) {
      reanalysisStatus = analysis.status === 409 ? 'PENDING' : 'FAILED';
      reanalysisMessage = String((analysis.data as Record<string, unknown>).message || ORCHESTRATION_MESSAGES.analysisCouldNotRun);
    }
  } catch (error) {
    reanalysisStatus = 'FAILED';
    reanalysisMessage = ORCHESTRATION_MESSAGES.analysisCouldNotRun;
    logger.error('Corrected dataset was uploaded but Module 1 reanalysis failed', {
      requestId: context.requestId,
      assessmentId: job.assessment_id,
      dataVersionId,
      actorId: context.actor.userId
    }, error);
  }

  const [updatedJob, versions, stats] = await Promise.all([
    findJobRow(context.database, job.assessment_id, job.tenant_id),
    listVersionRows(context.database, job.assessment_id, job.tenant_id),
    listProcurementStats(context.database, job.assessment_id, job.tenant_id)
  ]);
  const currentJob = updatedJob ?? job;
  const latestRunSucceeded = currentJob.run_version_id === dataVersionId;
  const mappedVersion = mapDatasetVersions(versions, {
    assessmentId: job.assessment_id,
    customerId: job.customer_id,
    latestRunVersionId: latestRunSucceeded ? dataVersionId : currentJob.run_version_id,
    latestRunGatesPassed: currentJob.run_gates_passed === 1,
    statsByDocument: buildStatsByDocument(stats)
  }).find((version) => version.versionId === dataVersionId);
  const responseBody: Record<string, unknown> = {
    success: true,
    newVersion: mappedVersion,
    analysisStatus: reanalysisStatus,
    message: reanalysisStatus === 'COMPLETED'
      ? ORCHESTRATION_MESSAGES.correctedDatasetSaved(dataVersionId)
      : ORCHESTRATION_MESSAGES.correctedDatasetSavedAnalysisPending(dataVersionId, reanalysisMessage)
  };
  logger.info('Corrected dataset version created through analysis orchestration', {
    requestId: context.requestId,
    assessmentId: job.assessment_id,
    dataVersionId,
    parentVersionId: job.current_version_id,
    correctionReason: body.reason,
    analysisStatus: reanalysisStatus,
    actorId: context.actor.userId
  });
  return jsonResponse(responseBody, reanalysisStatus === 'COMPLETED' ? 200 : 202, context.request);
};

const findDatasetDownloadRow = async (
  database: OrchestrationDatabase,
  assessmentId: string,
  versionId: string
): Promise<DatasetDownloadRow | null> => database.prepare(`
  SELECT dv.data_version_id, dv.assessment_id, dv.file_name, dv.file_path,
    om.object_key, om.filename AS object_filename, om.content_type,
    om.size_bytes, om.status AS object_status
  FROM AssessmentDataVersion AS dv
  LEFT JOIN ObjectMetadata AS om
    ON om.object_key = dv.file_path AND om.assessment_id = dv.assessment_id
  WHERE dv.assessment_id = ? AND dv.data_version_id = ?
  LIMIT 1
`).bind(assessmentId, versionId).first<DatasetDownloadRow>();

const resolveDownloadFilename = (row: DatasetDownloadRow): string => {
  const filename = row.object_filename || row.file_name;
  return encodeURIComponent(filename)
    .replaceAll("'", '%27')
    .replaceAll('(', '%28')
    .replaceAll(')', '%29')
    .replaceAll('*', '%2A');
};

const createDatasetResponse = (
  object: CloudflareR2Object,
  row: DatasetDownloadRow,
  request: Request
): Response => {
  const headers = new Headers({
    'Content-Type': row.content_type || object.httpMetadata?.contentType || 'application/octet-stream',
    'Content-Disposition': `attachment; filename*=UTF-8''${resolveDownloadFilename(row)}`,
    'Cache-Control': 'private, no-store'
  });
  if (typeof row.size_bytes === 'number' && row.size_bytes > 0) {
    headers.set('Content-Length', String(row.size_bytes));
  }
  if (object.httpEtag) headers.set('ETag', object.httpEtag);
  return withCors(new Response(object.body, { status: 200, headers }), request);
};

export const downloadDataset: OrchestrationHandler = async (context) => {
  const job = await loadAccessibleJob(context, context.params.jobId);
  const versionId = context.params.versionId;
  const row = await findDatasetDownloadRow(context.database, job.assessment_id, versionId);
  if (!row) throw notFoundError(ORCHESTRATION_MESSAGES.datasetVersionNotFound(versionId));
  if (
    !context.objects || !row.file_path || !row.object_key ||
    row.object_key !== row.file_path || row.object_status !== 'AVAILABLE'
  ) {
    if (!context.objects) throw serviceUnavailableError(ORCHESTRATION_MESSAGES.datasetStorageNotConfigured);
    throw notFoundError(ORCHESTRATION_MESSAGES.datasetFileUnavailable(versionId));
  }
  const object = await context.objects.get(row.object_key);
  if (!object) throw notFoundError(ORCHESTRATION_MESSAGES.datasetFileUnavailable(versionId));
  return createDatasetResponse(object, row, context.request);
};
