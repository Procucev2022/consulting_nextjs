/** Analysis orchestration handlers that are still pending plus the R2-backed source dataset download. */
import type { DatasetDownloadRow, OrchestrationDatabase, OrchestrationHandler } from './types/orchestrationD1';
import type { CloudflareR2Object } from './types/cloudflare';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { loadAccessibleJob } from './workerD1OrchestrationAuth';
import { notFoundError, notImplementedError, serviceUnavailableError } from './workerD1OrchestrationHttp';
import { withCors } from './workerHttp';

export const resolvePcbiGap: OrchestrationHandler = async () => {
  throw notImplementedError(ORCHESTRATION_MESSAGES.pcbiGapNotImplemented);
};

export const uploadCorrectedDataset: OrchestrationHandler = async () => {
  throw notImplementedError(ORCHESTRATION_MESSAGES.uploadCorrectedNotImplemented);
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
  const job = await loadAccessibleJob(context.database, context.actor, context.params.jobId);
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
