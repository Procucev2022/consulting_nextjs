/**
 * Evidence route handlers. Every handler runs the same pipeline in this order:
 * database binding, Bearer authentication, input validation (400), job lookup, scope check
 * (403/404), then the D1 snapshot. Unavailable workbooks return 409 with the reason.
 */

import logger from './utils/logger';
import { EVIDENCE_ERROR_CATEGORIES, EVIDENCE_HTTP_STATUS, EVIDENCE_MESSAGES } from './constants/evidenceMessages';
import {
  EVIDENCE_PACKAGE_MIME_TYPE,
  EVIDENCE_WORKBOOK_MIME_TYPE
} from './constants/evidenceWorkbook';
import {
  evidenceJobParamsSchema,
  evidenceParityQuerySchema,
  evidenceSavingsParamsSchema,
  evidenceWorkbookParamsSchema
} from './constants/evidenceValidation';
import {
  authenticateEvidenceUser,
  authorizeEvidenceJobAccess,
  requireEvidenceDatabase
} from './services/evidenceAccessService';
import { loadJobAccessRecord, loadTenantId } from './services/evidenceD1Repository';
import { EvidenceRequestError } from './services/evidenceRequestError';
import {
  buildEvidenceInventory,
  buildSavingsInventory,
  savingsUnavailableReason
} from './services/evidenceInventoryService';
import { buildParitySummary } from './services/evidenceParityService';
import { attachLedgerDetail, loadEvidenceSnapshot } from './services/evidenceSnapshotService';
import {
  buildEvidencePackage,
  buildWorkbookFile,
  requiresLedgerDetail
} from './services/evidenceWorkbookBuilder';
import type {
  EvidenceInventoryResponse,
  EvidenceJobParams,
  EvidenceParityRequest,
  EvidenceParityResponse,
  EvidenceRouteInput,
  EvidenceSavingsParams,
  EvidenceWorkbookParams,
  PreparedEvidenceRequest,
  SavingsTypeEvidenceInventoryResponse,
  SavingsTypeEvidenceInventoryItem
} from './types/evidenceWorkbook';
import { evidenceFileResponse, evidenceJsonResponse } from './workerD1EvidenceResponses';

interface ZodFailure {
  success: false;
  error: { issues: readonly unknown[] };
}

interface ZodSuccess<T> {
  success: true;
  data: T;
}

const parseOrThrow = <T>(result: ZodSuccess<T> | ZodFailure): T => {
  if (!result.success) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.BAD_REQUEST,
      EVIDENCE_ERROR_CATEGORIES.VALIDATION,
      EVIDENCE_MESSAGES.validationFailed,
      result.error.issues
    );
  }
  return result.data;
};

const parseJobParams = (input: EvidenceRouteInput): EvidenceJobParams =>
  parseOrThrow(evidenceJobParamsSchema.safeParse(input.rawParams));

const parseWorkbookParams = (input: EvidenceRouteInput): EvidenceWorkbookParams =>
  parseOrThrow(evidenceWorkbookParamsSchema.safeParse(input.rawParams));

const parseSavingsParams = (input: EvidenceRouteInput): EvidenceSavingsParams =>
  parseOrThrow(evidenceSavingsParamsSchema.safeParse(input.rawParams));

const parseParityRequest = (input: EvidenceRouteInput): EvidenceParityRequest => {
  const { jobId } = parseJobParams(input);
  const query = parseOrThrow(evidenceParityQuerySchema.safeParse(Object.fromEntries(input.searchParams)));
  return { jobId, workbookType: query.workbookType ?? null };
};

const prepareEvidenceRequest = async <T extends { jobId: string }>(
  input: EvidenceRouteInput,
  parse: (routeInput: EvidenceRouteInput) => T
): Promise<PreparedEvidenceRequest<T>> => {
  const database = requireEvidenceDatabase(input.environment);
  const user = await authenticateEvidenceUser(input.request, input.environment, database, input.requestId);
  const tenantId = input.environment.REQUEST_TENANT_ID;
  if (!tenantId) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.FORBIDDEN,
      EVIDENCE_ERROR_CATEGORIES.AUTH,
      EVIDENCE_MESSAGES.tenantAssignmentRequired
    );
  }
  if (!(await loadTenantId(database, tenantId, input.requestId))) {
    throw new EvidenceRequestError(
      EVIDENCE_HTTP_STATUS.SERVICE_UNAVAILABLE,
      EVIDENCE_ERROR_CATEGORIES.SERVER,
      EVIDENCE_MESSAGES.tenantMissing
    );
  }
  const params = parse(input);
  const job = await loadJobAccessRecord(database, params.jobId, tenantId, input.requestId);
  const authorizedJob = authorizeEvidenceJobAccess(user, job, params.jobId, tenantId);
  const snapshot = await loadEvidenceSnapshot(database, authorizedJob, { requestId: input.requestId });
  return { params, user, snapshot, database };
};

export const serveInventory = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params, snapshot } = await prepareEvidenceRequest(input, parseJobParams);
  const body: EvidenceInventoryResponse = {
    success: true,
    jobId: params.jobId,
    tenantId: snapshot.tenantId,
    items: buildEvidenceInventory(snapshot)
  };
  return evidenceJsonResponse(input.request, body, EVIDENCE_HTTP_STATUS.OK, input.requestId);
};

export const serveParity = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params, snapshot } = await prepareEvidenceRequest(input, parseParityRequest);
  const body: EvidenceParityResponse = {
    success: true,
    parity: buildParitySummary(snapshot, params.workbookType, snapshot.generatedAt)
  };
  return evidenceJsonResponse(input.request, body, EVIDENCE_HTTP_STATUS.OK, input.requestId);
};

export const serveWorkbookDownload = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params, user, snapshot, database } = await prepareEvidenceRequest(input, parseWorkbookParams);
  const ready = requiresLedgerDetail(params.workbookType, snapshot)
    ? await attachLedgerDetail(database, snapshot, input.requestId)
    : snapshot;
  const file = buildWorkbookFile(params.workbookType, ready, {
    generatedAt: snapshot.generatedAt,
    generatedBy: user.email
  });
  logger.info('Evidence workbook generated', {
    requestId: input.requestId,
    jobId: params.jobId,
    workbookType: params.workbookType,
    sheetCount: file.sheetCount,
    fileSizeBytes: file.bytes.byteLength,
    userId: user.userId,
    role: user.role
  });
  return evidenceFileResponse(
    input.request,
    { bytes: file.bytes, contentType: EVIDENCE_WORKBOOK_MIME_TYPE, filename: file.filename },
    input.requestId
  );
};

export const servePackageDownload = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params, user, snapshot, database } = await prepareEvidenceRequest(input, parseJobParams);
  const ready = snapshot.ledger.rowCount > 0 ? await attachLedgerDetail(database, snapshot, input.requestId) : snapshot;
  const file = buildEvidencePackage(ready, { generatedAt: snapshot.generatedAt, generatedBy: user.email });
  logger.info('Evidence package generated', {
    requestId: input.requestId,
    jobId: params.jobId,
    includedWorkbooks: file.includedCount,
    excludedWorkbooks: file.excludedCount,
    fileSizeBytes: file.bytes.byteLength,
    userId: user.userId,
    role: user.role
  });
  return evidenceFileResponse(
    input.request,
    { bytes: file.bytes, contentType: EVIDENCE_PACKAGE_MIME_TYPE, filename: file.filename },
    input.requestId
  );
};

const respondSavingsInventory = (
  input: EvidenceRouteInput,
  jobId: string,
  tenantId: string,
  items: SavingsTypeEvidenceInventoryItem[]
): Response => {
  const body: SavingsTypeEvidenceInventoryResponse = { success: true, jobId, tenantId, items };
  return evidenceJsonResponse(input.request, body, EVIDENCE_HTTP_STATUS.OK, input.requestId);
};

export const serveSavingsInventory = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params, snapshot } = await prepareEvidenceRequest(input, parseJobParams);
  return respondSavingsInventory(input, params.jobId, snapshot.tenantId, buildSavingsInventory());
};

export const serveSavingsTypeInventory = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params, snapshot } = await prepareEvidenceRequest(input, parseSavingsParams);
  return respondSavingsInventory(input, params.jobId, snapshot.tenantId, buildSavingsInventory(params.savingsType));
};

export const serveSavingsDownload = async (input: EvidenceRouteInput): Promise<Response> => {
  const { params } = await prepareEvidenceRequest(input, parseSavingsParams);
  const reason = savingsUnavailableReason(params.savingsType);
  throw new EvidenceRequestError(
    EVIDENCE_HTTP_STATUS.CONFLICT,
    EVIDENCE_ERROR_CATEGORIES.CONFLICT,
    EVIDENCE_MESSAGES.workbookUnavailable(params.jobId, reason)
  );
};
