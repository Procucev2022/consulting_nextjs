import {
  CLIENT_ERROR_LOCAL_FRONTEND_ORIGINS,
  CLIENT_ERROR_NUMERIC_PATH_PATTERN,
  CLIENT_ERROR_REPORT_MAX_BYTES,
  CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH,
  CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH,
  CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH,
  CLIENT_ERROR_RATE_LIMIT,
  CLIENT_ERROR_RATE_LIMIT_NAMESPACE,
  CLIENT_ERROR_RATE_LIMIT_PERIOD_SECONDS,
  CLIENT_ERROR_TELEMETRY_HTTP_STATUS,
  CLIENT_ERROR_TELEMETRY_MESSAGES,
  CLIENT_ERROR_REPORT_MAX_STACK_LENGTH,
  CLIENT_ERROR_TEXT_PATTERNS,
  CLIENT_ERROR_TIMESTAMP_WHITESPACE_PATTERN,
  CLIENT_ERROR_URL_PATTERN,
  CLIENT_ERROR_UUID_PATH_PATTERN
} from '../constants/clientErrorTelemetry';
import { clientErrorReportSchema } from '../constants/validation';
import type { CloudflareEnvironment } from '../types/cloudflare';
import logger from '../utils/logger';
import { jsonResponse } from '../workerHttp';

export const sanitizeClientErrorText = (value: string, maxLength: number): string => {
  let result = value.replace(CLIENT_ERROR_TIMESTAMP_WHITESPACE_PATTERN, ' ');
  for (const { pattern, replacement } of CLIENT_ERROR_TEXT_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(CLIENT_ERROR_URL_PATTERN, (rawUrl) => {
    try {
      const url = new URL(rawUrl);
      const route = url.pathname
        .replace(CLIENT_ERROR_UUID_PATH_PATTERN, '/[id]')
        .replace(CLIENT_ERROR_NUMERIC_PATH_PATTERN, '/[id]');
      return `${url.origin}${route}`;
    } catch {
      return '[REDACTED_URL]';
    }
  });
  return result.slice(0, maxLength);
};

const allowedFrontendOrigins = (environment: CloudflareEnvironment): Set<string> => {
  const configured = [environment.FRONTEND_URL, environment.NEXT_PUBLIC_APP_URL]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .flatMap((value) => {
      try { return [new URL(value).origin]; } catch { return []; }
    });
  return new Set([...configured, ...CLIENT_ERROR_LOCAL_FRONTEND_ORIGINS]);
};

const readLimitedBody = async (request: Request): Promise<{ text?: string; tooLarge?: boolean }> => {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > CLIENT_ERROR_REPORT_MAX_BYTES) {
    return { tooLarge: true };
  }
  const reader = request.body?.getReader();
  if (!reader) return { text: '' };
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  let finished = false;
  while (!finished) {
    const result = await reader.read();
    finished = result.done;
    if (result.done) continue;
    byteLength += result.value.byteLength;
    if (byteLength > CLIENT_ERROR_REPORT_MAX_BYTES) {
      await reader.cancel();
      return { tooLarge: true };
    }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { text: new TextDecoder().decode(bytes) };
};

export const handleClientErrorTelemetry = async (
  request: Request, environment: CloudflareEnvironment
): Promise<Response> => {
  const requestFailure = validateTelemetryRequest(request, environment);
  if (requestFailure) return requestFailure;

  const rateLimitFailure = await enforceTelemetryRateLimit(request, environment);
  if (rateLimitFailure) return rateLimitFailure;

  const body = await readLimitedBody(request);
  if (body.tooLarge) return jsonResponse({
    success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.bodyTooLarge(CLIENT_ERROR_REPORT_MAX_BYTES)
  }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.PAYLOAD_TOO_LARGE, request);
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body.text || '');
  } catch {
    return jsonResponse(
      { success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.invalidJson },
      CLIENT_ERROR_TELEMETRY_HTTP_STATUS.BAD_REQUEST,
      request
    );
  }
  const parsed = clientErrorReportSchema.safeParse(parsedBody);
  if (!parsed.success) return jsonResponse({
    success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.invalidFields, errors: parsed.error.issues
  }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.BAD_REQUEST, request);

  const report = parsed.data;
  const safeRoute = sanitizeClientErrorText(report.route.split(/[?#]/, 1)[0]
    .replace(CLIENT_ERROR_UUID_PATH_PATTERN, '/[id]')
    .replace(CLIENT_ERROR_NUMERIC_PATH_PATTERN, '/[id]'), CLIENT_ERROR_REPORT_MAX_ROUTE_LENGTH) || '/';
  const error = new Error(sanitizeClientErrorText(report.message, CLIENT_ERROR_REPORT_MAX_MESSAGE_LENGTH));
  error.name = sanitizeClientErrorText(report.errorName, CLIENT_ERROR_REPORT_MAX_ERROR_NAME_LENGTH);
  error.stack = report.stack ? sanitizeClientErrorText(report.stack, CLIENT_ERROR_REPORT_MAX_STACK_LENGTH) : undefined;
  const logContext = {
    requestId: request.headers.get('x-request-id') || undefined,
    clientRequestId: report.clientRequestId,
    source: report.source,
    route: safeRoute,
    occurredAt: report.occurredAt
  };
  if (report.level === 'error') logger.error('Browser reported an application error', logContext, error);
  else logger.warn('Browser reported a recovered application exception', logContext, error);
  return jsonResponse({ success: true }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.ACCEPTED, request);
};

const enforceTelemetryRateLimit = async (
  request: Request, environment: CloudflareEnvironment
): Promise<Response | undefined> => {
  const requestId = request.headers.get('x-request-id') || undefined;
  const context = { requestId, method: request.method, path: new URL(request.url).pathname };
  const rateLimiter = environment.CLIENT_ERROR_RATE_LIMITER;
  if (!rateLimiter || typeof rateLimiter.limit !== 'function') {
    logger.error('Client error telemetry rate limiter is not configured', {
      ...context, statusCode: CLIENT_ERROR_TELEMETRY_HTTP_STATUS.RATE_LIMIT_UNAVAILABLE
    });
    return jsonResponse({
      success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.rateLimiterUnavailable
    }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.RATE_LIMIT_UNAVAILABLE, request);
  }

  const clientAddress = request.headers.get('cf-connecting-ip') || 'unknown';
  try {
    const decision = await rateLimiter.limit({
      key: `${CLIENT_ERROR_RATE_LIMIT_NAMESPACE}:${clientAddress}`
    });
    if (decision.success) return undefined;

    logger.warn('Client error telemetry rate limit exceeded', {
      ...context,
      statusCode: CLIENT_ERROR_TELEMETRY_HTTP_STATUS.RATE_LIMITED,
      limit: CLIENT_ERROR_RATE_LIMIT,
      periodSeconds: CLIENT_ERROR_RATE_LIMIT_PERIOD_SECONDS
    });
    const response = jsonResponse({
      success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.rateLimited
    }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.RATE_LIMITED, request);
    const headers = new Headers(response.headers);
    headers.set('Retry-After', String(CLIENT_ERROR_RATE_LIMIT_PERIOD_SECONDS));
    return new Response(response.body, { status: response.status, headers });
  } catch (error: unknown) {
    logger.error('Client error telemetry rate limiter failed', {
      ...context, statusCode: CLIENT_ERROR_TELEMETRY_HTTP_STATUS.RATE_LIMIT_UNAVAILABLE
    }, error);
    return jsonResponse({
      success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.rateLimiterUnavailable
    }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.RATE_LIMIT_UNAVAILABLE, request);
  }
};

const validateTelemetryRequest = (
  request: Request, environment: CloudflareEnvironment
): Response | undefined => {
  if (request.method !== 'POST') return jsonResponse({
    success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.postRequired
  }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.METHOD_NOT_ALLOWED, request);

  const origin = request.headers.get('origin');
  if (origin && !allowedFrontendOrigins(environment).has(origin)) return jsonResponse({
    success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.originRejected
  }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.FORBIDDEN, request);

  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return jsonResponse({
    success: false, message: CLIENT_ERROR_TELEMETRY_MESSAGES.jsonRequired
  }, CLIENT_ERROR_TELEMETRY_HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE, request);
  return undefined;
};
