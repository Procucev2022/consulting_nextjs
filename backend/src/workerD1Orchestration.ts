/**
 * Analysis Orchestration API entry point for the Cloudflare Worker (/api/orchestration/*).
 * Matches the route, requires a database binding, authenticates the caller, checks the route's role,
 * validates path parameters, then dispatches to the handler. Every failure becomes a JSON error body.
 */
import type { CloudflareEnvironment } from './types/cloudflare';
import type {
  OrchestrationDatabase,
  OrchestrationHandler,
  OrchestrationRouteMatch,
  OrchestrationRouteName,
  OrchestrationRuntime
} from './types/orchestrationD1';
import { ORCHESTRATION_PATH_PREFIX, ORCHESTRATION_REQUEST_ID_HEADER } from './constants/orchestration';
import { ORCHESTRATION_ROUTES } from './constants/orchestrationRoutes';
import { ORCHESTRATION_MESSAGES } from './constants/orchestrationMessages';
import { assertRouteAccess, authenticateOrchestrationActor } from './workerD1OrchestrationAuth';
import { generateReport, recordQualityGate, supersedeReport } from './workerD1OrchestrationAdminWrite';
import { approveAndSubmitReport, resendNotification } from './workerD1OrchestrationAdminSubmit';
import {
  acknowledgeReport,
  recordCustomerView,
  requestCorrection
} from './workerD1OrchestrationCustomerWrite';
import {
  getAdminKpis,
  getAuditTrail,
  getJob,
  getNotifications,
  getReadiness,
  listJobs
} from './workerD1OrchestrationRead';
import { downloadDataset, resolvePcbiGap, uploadCorrectedDataset } from './workerD1OrchestrationPending';
import {
  createOrchestrationRuntime,
  errorToResponse,
  logRequestSummary,
  methodNotAllowedError,
  notFoundError,
  parsePathParams,
  resolveRequestId,
  serviceUnavailableError
} from './workerD1OrchestrationHttp';

/** One handler per route name. The Record type makes a missing route a compile error. */
const HANDLERS: Readonly<Record<OrchestrationRouteName, OrchestrationHandler>> = {
  LIST_JOBS: listJobs,
  GET_JOB: getJob,
  GET_READINESS: getReadiness,
  RESOLVE_PCBI_GAP: resolvePcbiGap,
  DOWNLOAD_DATASET: downloadDataset,
  UPLOAD_CORRECTED_DATASET: uploadCorrectedDataset,
  GENERATE_REPORT: generateReport,
  QUALITY_GATE: recordQualityGate,
  APPROVE_AND_SUBMIT: approveAndSubmitReport,
  RESEND_NOTIFICATION: resendNotification,
  SUPERSEDE_REPORT: supersedeReport,
  RECORD_VIEW: recordCustomerView,
  ACKNOWLEDGE: acknowledgeReport,
  REQUEST_CORRECTION: requestCorrection,
  ADMIN_KPIS: getAdminKpis,
  NOTIFICATIONS: getNotifications,
  AUDIT_TRAIL: getAuditTrail
};

const isOrchestrationPath = (pathname: string): boolean =>
  pathname === ORCHESTRATION_PATH_PREFIX || pathname.startsWith(`${ORCHESTRATION_PATH_PREFIX}/`);

const pathSegments = (pathname: string): string[] =>
  pathname.slice(ORCHESTRATION_PATH_PREFIX.length).split('/').filter((segment) => segment.length > 0);

/** Returns the parameter values when the request segments fit the template, otherwise null. */
const matchSegments = (template: readonly string[], actual: readonly string[]): Record<string, string> | null => {
  if (template.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (const [index, expected] of template.entries()) {
    if (expected.startsWith(':')) {
      params[expected.slice(1)] = actual[index];
    } else if (expected !== actual[index]) {
      return null;
    }
  }
  return params;
};

export const matchOrchestrationRoute = (method: string, pathname: string): OrchestrationRouteMatch => {
  if (!isOrchestrationPath(pathname)) return { kind: 'NOT_FOUND' };
  const segments = pathSegments(pathname);
  let pathMatched = false;
  for (const spec of ORCHESTRATION_ROUTES) {
    const params = matchSegments(spec.segments, segments);
    if (params !== null) {
      pathMatched = true;
      if (spec.method === method) return { kind: 'FOUND', spec, params };
    }
  }
  return pathMatched ? { kind: 'METHOD_NOT_ALLOWED' } : { kind: 'NOT_FOUND' };
};

const requireDatabase = (environment: CloudflareEnvironment): OrchestrationDatabase => {
  if (!environment.DB) throw serviceUnavailableError(ORCHESTRATION_MESSAGES.databaseNotConfigured);
  return environment.DB;
};

const executeRoute = async (
  match: OrchestrationRouteMatch,
  request: Request,
  environment: CloudflareEnvironment,
  url: URL,
  runtime: OrchestrationRuntime,
  requestId: string
): Promise<Response> => {
  if (match.kind === 'NOT_FOUND') throw notFoundError(ORCHESTRATION_MESSAGES.routeNotFound);
  if (match.kind === 'METHOD_NOT_ALLOWED') throw methodNotAllowedError();
  const database = requireDatabase(environment);
  const actor = await authenticateOrchestrationActor(request, environment, database);
  assertRouteAccess(actor, match.spec.access);
  const params = parsePathParams(match.params);
  return HANDLERS[match.spec.name]({
    request,
    url,
    database,
    objects: environment.OBJECTS,
    bucketName: environment.R2_BUCKET,
    actor,
    params,
    runtime,
    requestId
  });
};

/**
 * Handles one Analysis Orchestration request. Success and failure both return JSON and carry the
 * X-Request-Id header. Failures are logged by errorToResponse, and successes by logRequestSummary.
 */
export const handleOrchestrationRequest = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL,
  runtime: OrchestrationRuntime
): Promise<Response> => {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request, runtime);
  const match = matchOrchestrationRoute(request.method, url.pathname);
  const action = match.kind === 'FOUND' ? match.spec.name : match.kind;
  let response: Response;
  try {
    response = await executeRoute(match, request, environment, url, runtime, requestId);
    logRequestSummary({
      requestId,
      action,
      method: request.method,
      path: url.pathname,
      statusCode: response.status,
      durationMs: Date.now() - startedAt
    });
  } catch (error: unknown) {
    response = errorToResponse(error, requestId, request);
  }
  response.headers.set(ORCHESTRATION_REQUEST_ID_HEADER, requestId);
  return response;
};

/**
 * Worker dispatch entry. Returns null for paths outside /api/orchestration so the caller can continue routing.
 */
export const handleOrchestrationRoute = async (
  request: Request,
  environment: CloudflareEnvironment,
  url: URL
): Promise<Response | null> => {
  if (!isOrchestrationPath(url.pathname)) return null;
  return handleOrchestrationRequest(request, environment, url, createOrchestrationRuntime());
};
